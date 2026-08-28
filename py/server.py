"""
Retro YTM - local sidecar.

Wraps ytmusicapi so the Electron UI can read your YouTube Music library,
playlists and search results. Playback itself happens in the Electron app via
the YouTube IFrame player - this process never touches audio.

Auth: normally the Electron app grabs your signed-in session cookie and POSTs
it to /auth/cookie. Falls back to pasting raw request headers (/auth). Either
way the result is written to py/browser.json (git-ignored, contains cookies).
"""

import json
import os
import re
import shutil
import sys
import traceback

import requests
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS

try:
    from ytmusicapi import YTMusic, setup as ytm_setup
    from ytmusicapi.helpers import (
        initialize_headers,
        get_authorization,
        sapisid_from_cookie,
    )
except Exception:  # pragma: no cover
    print("ytmusicapi is not installed. Run:  npm run setup", file=sys.stderr)
    raise

HERE = os.path.dirname(os.path.abspath(__file__))
FROZEN = getattr(sys, "frozen", False)
# renderer/: bundled next to the exe when frozen (PyInstaller --add-data),
# else the sibling of py/ in the source tree.
if FROZEN:
    RENDERER = os.path.join(getattr(sys, "_MEIPASS", HERE), "renderer")
else:
    RENDERER = os.path.join(os.path.dirname(HERE), "renderer")
# auth cookie store: the packaged app passes RETRO_AUTH_FILE pointing at its
# per-user userData dir (writable, survives updates); dev keeps py/browser.json.
AUTH_FILE = os.environ.get("RETRO_AUTH_FILE") or os.path.join(HERE, "browser.json")
PORT = int(os.environ.get("RETRO_YTM_PORT", "8765"))

app = Flask(__name__, static_folder=RENDERER, static_url_path="")
CORS(app)


@app.get("/")
def index():
    return send_from_directory(RENDERER, "index.html")

yt = None  # YTMusic instance once authed


def load_client():
    global yt
    if os.path.exists(AUTH_FILE):
        try:
            yt = YTMusic(AUTH_FILE)
        except Exception as exc:
            print(f"[auth] failed to load {AUTH_FILE}: {exc}", file=sys.stderr)
            yt = None
    return yt


load_client()


# --------------------------------------------------------------------------- #
# shaping helpers
# --------------------------------------------------------------------------- #
def _album_name(value):
    if isinstance(value, dict):
        return value.get("name")
    return value


def track(t):
    return {
        "videoId": t.get("videoId"),
        "title": t.get("title"),
        "artists": ", ".join(
            a["name"] for a in (t.get("artists") or []) if a.get("name")
        ),
        # channel id of the primary artist (when ytmusicapi provides it) — lets
        # the stats window map "most-played" back to a real artist page
        "artistId": next(
            (a.get("id") for a in (t.get("artists") or []) if a.get("id")), None
        ),
        "album": _album_name(t.get("album")),
        "duration": t.get("duration"),
        "durationSeconds": t.get("duration_seconds") or t.get("lengthSeconds"),
        "thumbnail": (t.get("thumbnails") or [{}])[-1].get("url"),
        "isAvailable": t.get("isAvailable", True),
        # per-playlist-item id — only present when a playlist's tracks are
        # fetched; needed to remove/reorder that item. None everywhere else.
        "setVideoId": t.get("setVideoId"),
    }


def require_auth():
    return yt is not None


def err(msg, code=400):
    return jsonify({"error": msg}), code


# --------------------------------------------------------------------------- #
# YouTube *video* (non-music) search via InnerTube
# --------------------------------------------------------------------------- #
# ytmusicapi only speaks to music.youtube.com. For general YouTube videos we
# hit the same internal API the youtube.com web client uses. No API key setup,
# no quota. The web client sends an "InnerTube API key" with each call — that
# value is public (it's right in youtube.com's page source, and yt-dlp uses it),
# not a credential, but rather than keep a token-shaped literal in the source we
# scrape the current one from the homepage on first use and cache it.
_INNERTUBE_KEY = None
_INNERTUBE_CLIENT_VERSION = "2.20241201.01.00"


def _innertube_key(ua):
    """Public InnerTube web-client key, scraped from youtube.com and cached.
    Returns None if the scrape fails — the search POST is then tried keyless,
    which usually still works with a valid client `context`."""
    global _INNERTUBE_KEY
    if _INNERTUBE_KEY:
        return _INNERTUBE_KEY
    try:
        html = requests.get(
            "https://www.youtube.com/",
            headers={"User-Agent": ua},
            timeout=12,
        ).text
        m = re.search(r'"INNERTUBE_API_KEY":\s*"([\w-]+)"', html)
        if m:
            _INNERTUBE_KEY = m.group(1)
    except Exception:
        traceback.print_exc()
    return _INNERTUBE_KEY
_DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)


def _innertube_search(query):
    """POST to youtubei/v1/search and return the raw JSON payload."""
    ua = _DEFAULT_UA
    cookie = None
    if os.path.exists(AUTH_FILE):
        try:
            with open(AUTH_FILE) as fh:
                saved = json.load(fh)
            cookie = saved.get("cookie") or None
            ua = saved.get("user-agent") or ua
        except Exception:
            pass

    headers = {
        "Content-Type": "application/json",
        "User-Agent": ua,
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": _INNERTUBE_CLIENT_VERSION,
    }
    if cookie:
        headers["Cookie"] = cookie

    body = {
        "context": {
            "client": {
                "clientName": "WEB",
                "clientVersion": _INNERTUBE_CLIENT_VERSION,
                "hl": "en",
                "gl": "US",
            }
        },
        "query": query,
    }
    params = {"prettyPrint": "false"}
    key = _innertube_key(ua)
    if key:
        params["key"] = key
    resp = requests.post(
        "https://www.youtube.com/youtubei/v1/search",
        params=params,
        headers=headers,
        json=body,
        timeout=12,
    )
    resp.raise_for_status()
    return resp.json()


def _runs_text(node):
    if not isinstance(node, dict):
        return None
    if "simpleText" in node:
        return node["simpleText"]
    runs = node.get("runs")
    if isinstance(runs, list):
        return "".join(r.get("text", "") for r in runs)
    return None


def _hms_to_secs(text):
    if not text:
        return None
    parts = text.strip().split(":")
    if not parts or not all(p.isdigit() for p in parts):
        return None
    secs = 0
    for p in parts:
        secs = secs * 60 + int(p)
    return secs


def _video_from_renderer(vr):
    vid = vr.get("videoId")
    length = _runs_text(vr.get("lengthText"))
    is_live = False

    for badge in vr.get("badges", []):
        style = badge.get("metadataBadgeRenderer", {}).get("style", "")
        if "LIVE" in style.upper():
            is_live = True
    for ov in vr.get("thumbnailOverlays", []):
        r = ov.get("thumbnailOverlayTimeStatusRenderer")
        if not r:
            continue
        if str(r.get("style", "")).upper() == "LIVE":
            is_live = True
        elif not length:
            length = _runs_text(r.get("text"))

    return {
        "videoId": vid,
        "title": _runs_text(vr.get("title")),
        "channel": _runs_text(vr.get("ownerText"))
        or _runs_text(vr.get("longBylineText")),
        "duration": None if is_live else length,
        "durationSeconds": None if is_live else _hms_to_secs(length),
        "thumbnail": f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg",
        "views": _runs_text(vr.get("viewCountText"))
        or _runs_text(vr.get("shortViewCountText")),
        "published": _runs_text(vr.get("publishedTimeText")),
        "live": is_live,
    }


def _collect_videos(node, out, seen):
    """Recursively pull every videoRenderer out of an InnerTube payload.

    Walking the whole tree (rather than a fixed contents[...] path) keeps this
    working when YouTube reshuffles the response layout.
    """
    if isinstance(node, dict):
        vr = node.get("videoRenderer")
        if isinstance(vr, dict) and vr.get("videoId") and vr["videoId"] not in seen:
            seen.add(vr["videoId"])
            out.append(_video_from_renderer(vr))
        for value in node.values():
            _collect_videos(value, out, seen)
    elif isinstance(node, list):
        for value in node:
            _collect_videos(value, out, seen)


# --------------------------------------------------------------------------- #
# routes
# --------------------------------------------------------------------------- #
@app.get("/health")
def health():
    return {"ok": True, "authed": yt is not None}


def _finalize_auth():
    """Reload the client from AUTH_FILE and confirm it can make an authed call."""
    load_client()
    if yt is None:
        return err("auth saved but client would not initialise")
    try:
        yt.get_library_playlists(limit=1)
    except Exception as exc:
        traceback.print_exc()
        return err(f"auth check failed - try connecting again ({exc})", 401)
    return {"ok": True}


@app.post("/auth/cookie")
def auth_cookie():
    """Preferred path: the Electron app passes the signed-in session cookie."""
    body = request.get_json(silent=True) or {}
    cookie = (body.get("cookie") or "").strip()
    ua = (body.get("userAgent") or "").strip()
    if "__Secure-3PAPISID" not in cookie:
        return err("sign-in did not complete (no __Secure-3PAPISID in session)")

    try:
        sapisid = sapisid_from_cookie(cookie)
    except Exception as exc:
        return err(f"could not read SAPISID from cookie: {exc}")

    headers = dict(initialize_headers())
    headers["cookie"] = cookie
    headers["x-goog-authuser"] = "0"
    # regenerated per-request by ytmusicapi; just needs to be present + valid-shaped
    headers["authorization"] = get_authorization(sapisid + " " + headers["origin"])
    if ua:
        headers["user-agent"] = ua

    with open(AUTH_FILE, "w") as fh:
        json.dump(headers, fh, ensure_ascii=True, indent=4, sort_keys=True)
    return _finalize_auth()


@app.post("/auth")
def auth():
    """Fallback path: user pastes raw request headers from a browser."""
    body = request.get_json(silent=True) or {}
    headers_raw = (body.get("headers") or "").strip()
    if not headers_raw:
        return err("no headers provided")
    try:
        ytm_setup(filepath=AUTH_FILE, headers_raw=headers_raw)
    except Exception as exc:
        traceback.print_exc()
        return err(f"setup failed: {exc}")
    return _finalize_auth()


@app.get("/search")
def search():
    if not require_auth():
        return err("not authenticated", 401)
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    try:
        res = yt.search(q, filter="songs", limit=30)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    return jsonify([track(r) for r in res if r.get("videoId")])


@app.get("/search-artists")
def search_artists():
    """Artist name search — used by the ARTIST MIX panel to add artists.
    Row: {channelId, name, subscribers, thumbnail}."""
    if not require_auth():
        return err("not authenticated", 401)
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"artists": []})
    try:
        res = yt.search(q, filter="artists", limit=10)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    out, seen = [], set()
    for r in res or []:
        cid = _channel_id(r.get("browseId") or "")
        if not cid.startswith("UC") or cid in seen:
            continue
        seen.add(cid)
        out.append(
            {
                "channelId": cid,
                "name": r.get("artist") or r.get("title") or "?",
                "subscribers": r.get("subscribers"),
                "thumbnail": (r.get("thumbnails") or [{}])[-1].get("url"),
            }
        )
    return jsonify({"artists": out})


@app.get("/video-search")
def video_search():
    """General YouTube video search (not music). Works without auth."""
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    try:
        data = _innertube_search(q)
    except Exception as exc:
        traceback.print_exc()
        return err(f"video search failed: {exc}", 502)
    videos, seen = [], set()
    _collect_videos(data, videos, seen)
    return jsonify(videos[:40])


@app.get("/playlists")
def playlists():
    if not require_auth():
        return err("not authenticated", 401)
    try:
        raw = yt.get_library_playlists(limit=200)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    out, seen = [], set()
    for p in raw:
        pid = p.get("playlistId")
        if not pid or pid in seen or pid == "LM":
            continue  # LM is added below; dedupe repeats
        seen.add(pid)
        out.append(
            {
                "playlistId": pid,
                "title": p.get("title"),
                "count": p.get("count"),
                "thumbnail": (p.get("thumbnails") or [{}])[-1].get("url"),
            }
        )
    # "Liked Music" (well-known id LM) — recent ytmusicapi returns it in the
    # library list too, so pin exactly one copy at the top.
    lm = next((p for p in raw if p.get("playlistId") == "LM"), None)
    out.insert(
        0,
        {
            "playlistId": "LM",
            "title": "Liked Music",
            "count": (lm or {}).get("count"),
            "thumbnail": None,
        },
    )
    return jsonify(out)


@app.get("/playlist/<pid>")
def playlist(pid):
    if not require_auth():
        return err("not authenticated", 401)
    try:
        if pid == "LM":
            data = yt.get_liked_songs(limit=1000)
        else:
            data = yt.get_playlist(pid, limit=1000)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    tracks = [track(t) for t in data.get("tracks", []) if t.get("videoId")]
    # `owned` tells the UI whether to show edit controls (rename/delete/remove/
    # reorder). LM is never "owned" in that sense — its edits go through /rate.
    owned = bool(data.get("owned")) and pid != "LM"
    return jsonify(
        {
            "title": data.get("title"),
            "trackCount": len(tracks),
            "tracks": tracks,
            "owned": owned,
            "isLM": pid == "LM",
        }
    )


@app.get("/library-songs")
def library_songs():
    if not require_auth():
        return err("not authenticated", 401)
    try:
        raw = yt.get_library_songs(limit=500)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    return jsonify([track(t) for t in raw if t.get("videoId")])


@app.get("/related/<video_id>")
def related(video_id):
    """A style-locked radio station seeded from one track (used for autoplay).

    `radio=True` asks YouTube for an actual radio mix tuned to the seed song,
    which stays much closer stylistically than the default "up next" queue.
    Falls back to the plain queue if the radio call comes back empty.
    """
    if not require_auth():
        return err("not authenticated", 401)
    if video_id in ("undefined", "null", "") or len(video_id) < 10:
        return err("bad video id")
    tracks = []
    try:
        tracks = yt.get_watch_playlist(
            videoId=video_id, radio=True, limit=40
        ).get("tracks", [])
    except Exception:
        traceback.print_exc()
    if not tracks:
        try:
            tracks = yt.get_watch_playlist(videoId=video_id, limit=25).get(
                "tracks", []
            )
        except Exception as exc:
            traceback.print_exc()
            return err(str(exc), 502)
    return jsonify([track(t) for t in tracks if t.get("videoId")])


@app.get("/home")
def home():
    """YouTube Music's own personalised home feed for the signed-in account.

    Recommendations based on listening history, computed server-side by YT
    (quick picks, listen-again, mixes, ...). We keep only the sections that
    carry playable single tracks (a `videoId`); playlist/album/mix tiles are
    dropped for now. Grouped by section so the renderer can list them.
    """
    if not require_auth():
        return err("not authenticated", 401)
    try:
        raw = yt.get_home(limit=8)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    sections = []
    for sec in raw or []:
        rows = [
            track(it)
            for it in (sec.get("contents") or [])
            if isinstance(it, dict) and it.get("videoId")
        ]
        if rows:
            sections.append({"title": sec.get("title") or "For you", "tracks": rows})
    return jsonify({"sections": sections})


def _channel_id(browse_id):
    """Library browseIds come back as 'MPLA<UC…>'; get_artist() wants the UC id."""
    b = browse_id or ""
    return b[4:] if b.startswith("MPLA") else b


def _my_artist_ids():
    """Channel ids for artists in the library + follows (deduped, order kept)."""
    ids = []
    for getter in (yt.get_library_artists, yt.get_library_subscriptions):
        try:
            for a in getter(limit=100) or []:
                cid = _channel_id(a.get("browseId"))
                if cid.startswith("UC") and cid not in ids:
                    ids.append(cid)
        except Exception:
            traceback.print_exc()
    return ids


@app.get("/artists")
def artists():
    """Your 'favourite' artists — everything in the library + everything you
    follow, deduped. Row: {channelId, name, subscribers}."""
    if not require_auth():
        return err("not authenticated", 401)
    out, seen = [], set()
    for getter in (yt.get_library_artists, yt.get_library_subscriptions):
        try:
            for a in getter(limit=100) or []:
                cid = _channel_id(a.get("browseId"))
                if not cid.startswith("UC") or cid in seen:
                    continue
                seen.add(cid)
                out.append(
                    {
                        "channelId": cid,
                        "name": a.get("artist") or a.get("title") or "?",
                        "subscribers": a.get("subscribers"),
                        "thumbnail": (a.get("thumbnails") or [{}])[-1].get("url"),
                    }
                )
        except Exception:
            traceback.print_exc()
    out.sort(key=lambda x: x["name"].lower())
    return jsonify({"artists": out})


@app.get("/artist/<channel_id>")
def artist(channel_id):
    """One artist: top tracks (resolved to the full 'songs' playlist when
    possible) + related artists. Row tracks reuse the normal track shape."""
    if not require_auth():
        return err("not authenticated", 401)
    cid = _channel_id(channel_id)
    try:
        a = yt.get_artist(cid)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    songs = a.get("songs") or {}
    tracks = [track(t) for t in (songs.get("results") or []) if t.get("videoId")]
    pid = songs.get("browseId")
    if pid:
        try:
            full = yt.get_playlist(
                pid[2:] if pid.startswith("VL") else pid, limit=100
            ).get("tracks") or []
            full = [track(t) for t in full if t.get("videoId")]
            if full:
                tracks = full
        except Exception:
            traceback.print_exc()
    related = [
        {
            "channelId": r.get("browseId"),
            "name": r.get("title"),
            "subscribers": r.get("subscribers"),
        }
        for r in ((a.get("related") or {}).get("results") or [])
        if r.get("browseId")
    ]
    return jsonify(
        {
            "name": a.get("name"),
            "channelId": cid,
            "subscribers": a.get("subscribers"),
            "tracks": tracks,
            "related": related,
        }
    )


@app.get("/suggested-artists")
def suggested_artists():
    """"Fans might also like", aggregated from your library/followed artists
    and ranked by how many of them share each suggestion. Excludes artists you
    already have. A handful of get_artist() calls — cache it on the client."""
    if not require_auth():
        return err("not authenticated", 401)
    # library/follows first, then any extra seeds the client passes (its
    # most-played artist ids) so suggestions work even with a thin library
    seeds = _my_artist_ids()
    for cid in (request.args.get("seeds") or "").split(","):
        cid = cid.strip()
        if cid.startswith("UC") and cid not in seeds:
            seeds.append(cid)
    have = set(seeds)
    scored = {}
    for cid in seeds[:8]:  # cap the API calls
        try:
            a = yt.get_artist(cid)
        except Exception:
            continue
        for r in ((a.get("related") or {}).get("results") or []):
            rid = r.get("browseId")
            if not rid or rid in have:
                continue
            e = scored.setdefault(
                rid,
                {
                    "channelId": rid,
                    "name": r.get("title"),
                    "subscribers": r.get("subscribers"),
                    "count": 0,
                },
            )
            e["count"] += 1
    out = sorted(scored.values(), key=lambda x: -x["count"])[:20]
    for x in out:
        x.pop("count", None)
    return jsonify({"artists": out, "seedCount": len(seeds)})


@app.post("/rate")
def rate():
    """Like / un-like a song — writes to the account's real "Liked Music".

    rating: LIKE adds it, INDIFFERENT clears the rating (the un-favourite).
    Liked songs then show up in the LM virtual playlist the sidebar already
    lists, so "favourite now, shuffle later" needs no local storage.
    """
    if not require_auth():
        return err("not authenticated", 401)
    body = request.get_json(silent=True) or {}
    vid = (body.get("videoId") or "").strip()
    rating = (body.get("rating") or "INDIFFERENT").strip().upper()
    if not vid:
        return err("missing videoId")
    if rating not in ("LIKE", "DISLIKE", "INDIFFERENT"):
        return err("bad rating")
    try:
        yt.rate_song(vid, rating)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    return jsonify({"ok": True, "videoId": vid, "rating": rating})


@app.post("/playlist/create")
def playlist_create():
    """Create a real PRIVATE YT Music playlist. `videoIds` is optional now —
    the sidebar's ＋ button makes an empty one and songs get dragged in after."""
    if not require_auth():
        return err("not authenticated", 401)
    body = request.get_json(silent=True) or {}
    title = (body.get("title") or "").strip().replace("<", "").replace(">", "")
    title = title or "Retro YTM list"
    desc = (body.get("description") or "Created by Retro YTM").strip()
    vids = [v for v in (body.get("videoIds") or []) if v]
    try:
        res = yt.create_playlist(
            title, desc, privacy_status="PRIVATE", video_ids=vids or None
        )
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    if not isinstance(res, str):
        return err(f"unexpected response from YouTube: {res}", 502)
    return {"ok": True, "playlistId": res, "title": title, "count": len(vids)}


@app.post("/playlist/<pid>/add")
def playlist_add(pid):
    """Append tracks to a playlist (drag-and-drop target)."""
    if not require_auth():
        return err("not authenticated", 401)
    vids = [v for v in ((request.get_json(silent=True) or {}).get("videoIds") or []) if v]
    if not vids:
        return err("no videoIds")
    try:
        res = yt.add_playlist_items(pid, videoIds=vids, duplicates=False)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    status = res.get("status") if isinstance(res, dict) else str(res)
    ok = not status or "SUCCEED" in str(status).upper()
    return jsonify({"ok": ok, "status": status, "added": len(vids)})


@app.post("/playlist/<pid>/remove")
def playlist_remove(pid):
    """Remove items. Each item needs both videoId and its setVideoId."""
    if not require_auth():
        return err("not authenticated", 401)
    items = (request.get_json(silent=True) or {}).get("items") or []
    videos = [
        {"videoId": it["videoId"], "setVideoId": it["setVideoId"]}
        for it in items
        if it.get("videoId") and it.get("setVideoId")
    ]
    if not videos:
        return err("no removable items (missing setVideoId)")
    try:
        yt.remove_playlist_items(pid, videos)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    return jsonify({"ok": True, "removed": len(videos)})


@app.post("/playlist/<pid>/move")
def playlist_move(pid):
    """Reorder: move item `moved` (a setVideoId) to just before `before`
    (a setVideoId); `before` omitted → move to the end."""
    if not require_auth():
        return err("not authenticated", 401)
    body = request.get_json(silent=True) or {}
    moved = (body.get("moved") or "").strip()
    before = (body.get("before") or "").strip()
    if not moved:
        return err("missing 'moved' setVideoId")
    try:
        yt.edit_playlist(pid, moveItem=((moved, before) if before else moved))
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    return jsonify({"ok": True})


@app.post("/playlist/<pid>/rename")
def playlist_rename(pid):
    if not require_auth():
        return err("not authenticated", 401)
    title = ((request.get_json(silent=True) or {}).get("title") or "").strip()
    title = title.replace("<", "").replace(">", "")
    if not title:
        return err("empty title")
    try:
        yt.edit_playlist(pid, title=title)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    return jsonify({"ok": True, "title": title})


@app.post("/playlist/<pid>/delete")
def playlist_delete(pid):
    if not require_auth():
        return err("not authenticated", 401)
    if pid == "LM":
        return err("can't delete Liked Music")
    try:
        yt.delete_playlist(pid)
    except Exception as exc:
        traceback.print_exc()
        return err(str(exc), 502)
    return jsonify({"ok": True})


# yt-dlp is optional (only /download + /stream need it). Import it lazily and,
# if this interpreter doesn't have it, pip-install once. Returns (module, error).
def _ensure_ytdlp():
    try:
        import yt_dlp
        return yt_dlp, None
    except Exception:
        pass
    if FROZEN:
        # packaged build — yt-dlp is bundled; a miss means a broken build, not
        # something a pip-install at runtime could fix.
        return None, "yt-dlp is missing from this build."
    try:
        import subprocess
        import importlib
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "yt-dlp"],
            check=True, timeout=240,
        )
        importlib.invalidate_caches()
        import yt_dlp
        return yt_dlp, None
    except Exception as exc:
        return None, (
            f'yt-dlp is not available and auto-install failed ({exc}). '
            f'Run:  "{sys.executable}" -m pip install yt-dlp   then restart the app.'
        )


# audio the app fetched itself (embed-blocked tracks played via /stream, and
# any transient rips). Safe to delete anytime.
_AUDIO_CACHE = os.path.join(os.path.expanduser("~"), ".retro-ytm-cache")
# shared with electron/main.js — { keep: bool, capMB: number }
_CACHE_POLICY = os.path.join(os.path.expanduser("~"), ".retro-ytm-cache.json")


def _cache_cap_mb():
    """Size cap from the shared policy file (default 500 MB); 0 = no trimming."""
    try:
        with open(_CACHE_POLICY) as f:
            return float(json.load(f).get("capMB") or 500)
    except Exception:
        return 500.0


def _trim_audio_cache():
    """Evict least-recently-played files (oldest mtime first) past the cap."""
    cap = _cache_cap_mb() * 1024 * 1024
    if cap <= 0:
        return
    try:
        files = []
        for name in os.listdir(_AUDIO_CACHE):
            fp = os.path.join(_AUDIO_CACHE, name)
            if os.path.isfile(fp):
                st = os.stat(fp)
                files.append((st.st_mtime, st.st_size, fp))
        total = sum(sz for _, sz, _ in files)
        for _, sz, fp in sorted(files):
            if total <= cap:
                break
            try:
                os.remove(fp)
                total -= sz
            except OSError:
                pass
    except Exception:
        traceback.print_exc()


@app.get("/stream")
def stream():
    """Serve one video's audio so the renderer can play it through <audio>.

    This is the *play an embed-blocked track* path: the YouTube IFrame embed
    refuses 101/150 videos, so we fetch the audio with yt-dlp (COOKIE-FREE,
    same stance as /download) into a cache dir and stream the file back.
    First hit blocks while it downloads (~5-20s); re-hits are instant.
    Supports Range requests so the seek bar works.

    ?warm=1 → download into the cache but return {ok} instead of the bytes
    (the renderer uses this to pre-fetch the next track).
    """
    vid = (request.args.get("v") or "").strip()
    warm = request.args.get("warm") in ("1", "true", "yes")
    if not vid or len(vid) < 6:
        return err("bad video id")
    yt_dlp, problem = _ensure_ytdlp()
    if problem:
        return err(problem, 501)

    try:
        os.makedirs(_AUDIO_CACHE, exist_ok=True)
        cached = [
            f for f in os.listdir(_AUDIO_CACHE)
            if f.split(".")[0] == vid and os.path.isfile(os.path.join(_AUDIO_CACHE, f))
        ]
    except Exception:
        cached = []

    if cached:
        path = os.path.join(_AUDIO_CACHE, cached[0])
        try:
            os.utime(path, None)  # mark "just played" so LRU keeps it fresh
        except OSError:
            pass
    else:
        opts = {
            "format": "ba[ext=m4a]/bestaudio/best",
            "outtmpl": os.path.join(_AUDIO_CACHE, "%(id)s.%(ext)s"),
            "quiet": True, "no_warnings": True, "noprogress": True, "noplaylist": True,
        }
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(
                    "https://www.youtube.com/watch?v=" + vid, download=True
                )
                path = ydl.prepare_filename(info)
        except Exception as exc:
            traceback.print_exc()
            return err(f"stream failed: {exc}", 502)

    if not os.path.exists(path):
        return err("stream produced no file", 502)
    _trim_audio_cache()  # keep the cache under its size cap (LRU)
    if warm:
        return {"ok": True, "cached": os.path.basename(path)}
    import mimetypes
    mime = mimetypes.guess_type(path)[0] or "audio/mp4"
    return send_file(path, mimetype=mime, conditional=True)


@app.get("/download")
def download():
    """Rip the audio of one YouTube video to ~/Downloads/Retro YTM/ via yt-dlp.

    Deliberately COOKIE-FREE — no browser.json is passed to yt-dlp, so the
    signed-in Google account stays out of it (worst case is an IP throttle,
    not an account flag). This is a stream-rip and steps outside the
    "nothing is downloaded" rule the rest of the app follows — it exists
    only because the user asked for an explicit, on-demand download button.
    mp3 needs ffmpeg on PATH; without it we keep YouTube's native m4a.
    """
    vid = (request.args.get("v") or "").strip()
    if not vid or len(vid) < 6:
        return err("bad video id")

    yt_dlp, problem = _ensure_ytdlp()
    if problem:
        return err(problem, 501)

    # caller can override the destination (settings → download folder)
    req_dir = (request.args.get("dir") or "").strip()
    out_dir = (
        req_dir
        if req_dir and os.path.isabs(req_dir)
        else os.path.join(os.path.expanduser("~"), "Downloads", "Retro YTM")
    )
    try:
        os.makedirs(out_dir, exist_ok=True)
    except Exception as exc:
        return err(f"can't write to {out_dir}: {exc}")
    have_ffmpeg = shutil.which("ffmpeg") is not None
    opts = {
        "outtmpl": os.path.join(out_dir, "%(title).150s [%(id)s].%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "noplaylist": True,
    }
    if have_ffmpeg:
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]
    else:
        opts["format"] = "ba[ext=m4a]/bestaudio/best"

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(
                "https://www.youtube.com/watch?v=" + vid, download=True
            )
            path = ydl.prepare_filename(info)
            if have_ffmpeg:
                path = os.path.splitext(path)[0] + ".mp3"
        if not os.path.exists(path):
            # postprocessor / template surprise → fall back to newest file
            files = [os.path.join(out_dir, f) for f in os.listdir(out_dir)]
            files = [f for f in files if os.path.isfile(f)]
            if files:
                path = max(files, key=os.path.getmtime)
        return {
            "ok": True,
            "path": path,
            "file": os.path.basename(path),
            "dir": out_dir,
            "format": "mp3" if have_ffmpeg else "m4a",
        }
    except Exception as exc:
        traceback.print_exc()
        return err(f"download failed: {exc}", 502)


if __name__ == "__main__":
    print(f"[retro-ytm] sidecar on http://127.0.0.1:{PORT}  (authed={yt is not None})")
    app.run(host="127.0.0.1", port=PORT, threaded=True, use_reloader=False)
