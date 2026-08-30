# Retro YTM — project handoff

Paste this file's path into a fresh chat to bring it up to speed:
`HANDOFF.md` at the repo root. Last updated 2026-08-28.

**Latest (2026-08-28, follow-up session)** — in order:
- backlog #6 **"Stream everything"** mode (§5g). Opt-in `⚙` checkbox routing
  every track through `/stream` + the local `<audio>` so the real-FFT visualiser
  + beat cat work on all tracks; always-warm-ahead pre-caching. Default off.
- **Bongo-cat "drummer v2"** (§5f.7) — two-band kick/snare spectral-flux onset
  detector + tempo lock. User verdict: "PERFECT".
- **Visualiser "neon EQ"** restyle + compact/centred geometry + centre-weighting
  Tukey window (§5c "Visualiser", §6). DPR-crisp, glow, peak caps.
- **⚙ → Tuning** knobs (§5e) — sliders for beat sensitivity, groove fill, and
  the EQ height/centre/gap/glow/caps. Persisted as `retro.tune`.
- **Keybinds flyout** (`keybinds` foot button, §5c "panels").
- **Radio rework** — no longer floods the queue with one artist (§5c / Status).
- **ARTIST MIX** panel (§5h) — a pool of artists; shuffles random songs from
  them into the queue. New endpoint `GET /search-artists`.
- Title renamed to "Retro YTM Bongo Cat".
- **Packaged → portable Windows .exe** (§9) —
  `release/RetroYTM-BongoCat-1.0.0-portable.exe`, PyInstaller-frozen sidecar +
  electron-builder. Sidecar verified; GUI launch is QA's first job. See
  **QA.md**.

**Nothing below verified in a running Electron app yet** except what the user
eyeballed via screenshots (visualiser look, cat). Needs an `npm start` pass.

**Earlier that day added** (2026-08-28, all in §5f, in order):

1. **prev · NOW · next marquee** — the scrolling bar shows the previous and next
   queue tracks either side of the current one (dimmed), scroll speed scales
   with text width. Shuffle collapses it to NOW-only (`⤨`).
2. **FOR YOU sidebar section** (`#recs-section`, stacked under PLAYLISTS,
   toggle `for you` in `#pled-toggles`) — YTM home shelves via `GET /home`,
   plus **FAVOURITE ARTISTS** (`GET /artists` = library + follows, merged with
   most-played from `retro.stats`) and **SUGGESTED ARTISTS**
   (`GET /suggested-artists?seeds=` — "fans might also like" aggregation).
   `GET /artist/<channelId>` resolves an artist's full songs playlist +
   related. `track()` now also returns `artistId`.
3. **Player/editor resizer** — `#split-main` drag handle between `#main` and
   `#pled` sets `--display-h` (grid row on `.display`), persisted as
   `panels.displayH`, double-click resets, re-clamped on window resize.
4. **★ Favourites** — `#tp-fav` transport button + right-click entry →
   `POST /rate` (`rate_song` LIKE / INDIFFERENT). `likedIds` set, seeded when
   `LM` opens. `LM` in the sidebar *is* the liked-songs playlist.
5. **Full playlist management** — `＋` in the PLAYLISTS header / right-click =
   create (empty allowed now); drag a track row onto a playlist name = add
   (drop on `LM` → like); right-click a playlist row = Open / Play / Rename /
   Delete; per-row `×` + right-click "Remove from playlist"; drag-reorder
   within an owned playlist. Endpoints `POST /playlist/<id>/add|remove|move|
   rename|delete`; `/playlist/<id>` now returns `owned` + per-track
   `setVideoId`; `/playlists` dedupes the double "Liked Music".
6. **Listening statistics** — `retro.stats` in localStorage; a play = ≥30 s or
   ≥50 % listened. **Standalone stats window** (`main.js openStatsWindow()` →
   `/stats.html`, `renderer/js/stats.js` + `css/stats.css`) reads the store
   directly + live-updates on `storage`. Tiles, plays/day canvas, top tracks,
   top artists, most skipped; `▶` buttons play back via
   `window.retro.playFromStats` → IPC `stats:play`. Opened from `⚙` settings.
7. **Bongo cat taps to the beat** — `catBeat()` in `drawVis()` does onset
   detection off the real FFT → `catTap()`. The idle random loop always
   runs and just backs off in beat mode, so the cat never freezes.
   *(Rewritten later same day into a two-band kick/snare spectral-flux
   "drummer" with a tempo lock — see §5f.7.)*
8. **Stream-cache keep + LRU cap** — `~/.retro-ytm-cache` can persist between
   sessions with a size cap (oldest-played evicted first). `⚙` → *Stream
   cache*: keep toggle, max size, in-use readout, *Clear cached audio now*.
   Policy file `~/.retro-ytm-cache.json` shared by `main.js` + `server.py`.

**Previous session added** (2026-08-27):

1. **Per-theme game skins** (§5d) — `data-theme` on `<html>` +
   `renderer/css/game-skins.css`, a per-theme layer that re-skins the real UI
   from reference screenshots. **All 6 done:** SC2 · Machinae Supremacy ·
   Cyberpunk 2077 · Path of Exile · Valorant · Dota 2. Cyberpunk / Valorant /
   Dota 2 also needed `SEED` edits in `themes.js`.
2. **Visualiser rework** (§6) — simulated sum-of-slow-sines model; real-FFT
   path gets log-spaced bin→bar + per-bar auto-level (`vgain[]`).
3. **Local-file import** (§5e) — drag audio onto the window or Settings →
   *Import*; hidden `<audio id="local-audio">` 3rd source, same-origin ⇒ real
   FFT. Session-only.
4. **Download button** `⇩` → `GET /download` → yt-dlp rips current track's
   audio to a chosen folder. Cookie-free stream-rip.
5. **Play embed-blocked (101/150) tracks** (§5e) — `blockedMode='stream'`:
   `GET /stream?v=` (yt-dlp → `~/.retro-ytm-cache/` → Range-capable) plays via
   `<audio>`. `&warm=1` pre-fetch. (Cache lifecycle changed 2026-08-28 — §5f.8.)
6. **Settings flyout** `⚙` — volume · reset zoom · blocked-track mode ·
   visualiser on/off + mode · download folder · local files · bongo cat.
7. **Bongo cat** — inline-SVG mascot in the readout gap, theme-independent.
8. IPC/preload: `resetZoom`, `revealPath`, `pickFolder`. `py/requirements.txt`
   gains `yt-dlp`.

**Prior session added:** the CRT video window (§5c) — InnerTube video search,
right-edge docking w/ detach, unified All/Music/Video search, collapsible
result groups, whole-window Ctrl+wheel zoom, dev hotkeys (F5/Ctrl+R/F12),
music↔video mutual exclusion + transport/volume/LCD/marquee/visualiser
routing to whichever is active, playlist-editor panel hide/resize,
**radio v3** (drains a *varied* origin list first, else a `radio=True` station
seeded from 2 recent tracks and capped per-artist per refill — see the Status
table row), and **queueable video results** (play as audio like songs).

---

## 1. What this is

A local, **Winamp-skinned desktop player for YouTube Music Premium**. Electron
shell + a Python sidecar (`ytmusicapi`) for library/search + a hidden YouTube
**IFrame player** for audio. Because playback goes through a real embedded
YouTube player in a signed-in session, the user's **Premium** (no ads,
background play) applies. Default playback downloads nothing.

**Exception (this session, user-requested):** the `⇩` download button and the
"play an embed-blocked track" path both use **yt-dlp** to fetch audio
(cookie-free). See §5e + §6 — this is a deliberate, opt-in-by-existence step
outside the "nothing is downloaded" principle.

Endgame: package as a **portable Windows .exe**.

---

## 2. Run it

```
cd <repo root>
npm install          # Electron (~90 MB, one time)
npm run setup        # pip install -r py/requirements.txt (one time)
npm start
```

Electron spawns the Python sidecar itself and loads the UI from
`http://127.0.0.1:8765/` (served by Flask so the page has a real http origin —
the YT IFrame API is flaky from `file://`).

**Dev iteration (no full restart):** `wireDevKeys()` in `main.js` binds, in
each window (unpackaged builds only) — **F5 / Ctrl+R** reload, **Ctrl+Shift+R**
reload-ignoring-cache, **F12 / Ctrl+Shift+I** DevTools. A window reload
re-runs `preload.js` and re-fetches everything under `renderer/`, so
renderer + preload changes need only a reload. A full `npm start` restart is
only needed for `electron/main.js` (main process) or `py/server.py` (the
sidecar runs with `use_reloader=False`).

**First-run auth:** click **Sign in with Google** in the panel. Electron opens
the real Google login, then reads the signed-in session cookie out of its own
`session.defaultSession` and POSTs it to the sidecar (`POST /auth/cookie`),
which writes `py/browser.json`. Same session backs the player → Premium on at
the same time. The **◍** title-bar button re-runs this (switch account / cookie
expired). Header-paste is a fallback under "Advanced".

**Offline mode (2026-08-28):** the first-run overlay is no longer a hard gate.
A **"Skip — use as an offline player (local files only)"** button (`#auth-skip`
in `.auth-card`) hides the overlay and sets `localStorage['retro.offline']='1'`
so later launches don't re-prompt (`boot()` checks `offlineChosen()`; the flag is
cleared the instant `onConnected()` fires). In offline mode search / playlists /
radio / FOR YOU stay disabled (their existing `!state.authed` guards) but
local-file import + playback + the real-FFT visualiser all work. The **◍**
button always re-opens the sign-in overlay. `goOffline()` / `onConnected()` in
`app.js`.

Auth state as of writing: the user has completed sign-in; `py/browser.json`
exists and `/health` returns `authed:true`.

---

## 3. Architecture

```
electron/main.js      spawns Python, frameless 640px window, waitForServer(),
                      IPC: win:min/close, auth:interactive, open:external,
                      video:open/play/control/toggle-dock, video:activity;
                      stats:open (openStatsWindow) / stats:play (relay a
                      "play these tracks" request → main window);
                      cache:policy/clear/size (stream-cache keep + LRU cap,
                      §5f.8). CRT docking: dockBounds() / positionDock().
electron/preload.js   window.retro = { apiBase, minimize, close, connect,
                      openExternal, openVideo, playVideo, videoControl,
                      toggleVideoDock, reportVideoActivity, onVideoActivity,
                      onDockState, onVideoLoad, onVideoCommand, resetZoom,
                      revealPath, pickFolder,
                      setCachePolicy, clearCache, cacheSize,          (§5f.8)
                      openStats, playFromStats, onStatsPlay } (§5f.6).
                      Shared by all 3 windows. Also Ctrl+wheel / Ctrl +/-/0
                      whole-window zoom (localStorage['retro.zoom']).
py/server.py          Flask on 127.0.0.1:8765. Serves renderer/ as static
                      (so /stats.html, /video.html work with no route) +
                      wraps ytmusicapi. Endpoints below. + InnerTube video
                      search (uses `requests`).
renderer/             the skin (no build step, plain <script> tags)
renderer/video.html   the CRT video window — own CSP, api.js + video.js + IFrame API
renderer/stats.html   the standalone statistics window — own CSP, loads
                      js/stats.js only; reads localStorage['retro.stats']
                      directly (same origin) + live-updates on 'storage' (§5f.6)
```

### Sidecar endpoints (`py/server.py`)
| Route | Purpose |
|---|---|
| `GET /health` | `{ok, authed}` |
| `POST /auth/cookie` | body `{cookie, userAgent}` → builds `browser.json` (uses `ytmusicapi.helpers.get_authorization` + `sapisid_from_cookie`); then `_finalize_auth()` verifies with a real call |
| `POST /auth` | fallback: body `{headers}` raw-header paste → `ytmusicapi.setup()` |
| `GET /search?q=` | songs |
| `GET /playlists` | library playlists + a synthetic `LM` = Liked Music. **Dedupes** — ytmusicapi 1.12 returns its own `LM` row, so the route filters `LM` out of the raw list and pins exactly one at the top. |
| `GET /playlist/<id>` | tracks (`LM` → `get_liked_songs`). Now also returns **`owned`** (unlocks rename/delete/remove/reorder in the UI; always false for `LM`) and **`isLM`**; each track carries **`setVideoId`** (per-playlist-item id, needed to remove/reorder). |
| `GET /library-songs` | `get_library_songs` |
| `GET /related/<videoId>` | `get_watch_playlist(radio=True)` → a style-locked radio station (falls back to the plain up-next queue if empty). Used by `≈` autoplay. |
| `GET /home` | **FOR YOU shelves.** `yt.get_home(limit=8)` → keeps only shelves with playable single tracks (`videoId`); playlist/album/mix tiles dropped. `{sections:[{title, tracks}]}`. §5f.2. |
| `GET /artists` | **favourite artists** = `get_library_artists` ∪ `get_library_subscriptions`, deduped by `UC…` channel id (strips the `MPLA` browse-id prefix), sorted by name. `{artists:[{channelId, name, subscribers, thumbnail}]}`. §5f.2. |
| `GET /artist/<channelId>` | one artist: **top tracks resolved to the full `songs` playlist** (up to 100) + `related` artists. `{name, channelId, subscribers, tracks:[…], related:[{channelId, name, subscribers}]}`. |
| `GET /suggested-artists[?seeds=id,id]` | **"fans might also like"** aggregated from up to 8 of your library/followed artists (+ any `seeds` the renderer passes — its top-played channel ids), ranked by shared-suggestion count, minus artists you already have. A few `get_artist()` calls (~1–5 s) — cache on the client. `{artists:[…], seedCount}`. |
| `GET /search-artists?q=` | **artist name search** for the ARTIST MIX panel (§5h). `yt.search(q, filter="artists", limit=10)` → `{artists:[{channelId, name, subscribers, thumbnail}]}` (browseId → `UC…` via `_channel_id`). |
| `POST /rate` | body `{videoId, rating}` (`LIKE`/`DISLIKE`/`INDIFFERENT`) → `yt.rate_song()`. Writes the real thumbs-up → the track lands in Liked Music (`LM`). Used by the `★` transport button + right-click. §5f.4. |
| `POST /playlist/create` | body `{title, videoIds?}` → `yt.create_playlist()` (PRIVATE). **`videoIds` optional now** — the `＋` sidebar button makes an empty playlist. Returns `{playlistId, title, count}`. Also used by session-list "▲ YTM". |
| `POST /playlist/<id>/add` | body `{videoIds}` → `add_playlist_items(duplicates=False)`. Reports `{ok:false}` on a dup instead of erroring. Drag-drop target. |
| `POST /playlist/<id>/remove` | body `{items:[{videoId, setVideoId}]}` → `remove_playlist_items`. |
| `POST /playlist/<id>/move` | body `{moved, before}` (setVideoIds) → `edit_playlist(moveItem=(moved, before))`. Drag-reorder. |
| `POST /playlist/<id>/rename` | body `{title}` → `edit_playlist(title=…)`. |
| `POST /playlist/<id>/delete` | `delete_playlist` (refuses `LM`). |
| `GET /stream?v=<id>[&warm=1]` | **play an embed-blocked track.** yt-dlp fetches best audio (cookie-free) into `~/.retro-ytm-cache/<id>.<ext>`, then `send_file(..., conditional=True)` streams it back (Range → `206`). `&warm=1` = cache only, return `{ok,cached}`. On a **cache hit** `os.utime()` bumps the file's mtime (LRU freshness); after every fetch `_trim_audio_cache()` evicts oldest-mtime files past the cap. **Cache lifecycle now depends on the keep setting** — see §5f.8 (default: wiped on startup & shutdown). |
| `GET /download?v=<id>&dir=<abs path>` | **stream-rip.** `yt_dlp…extract_info(download=True)` → best audio. Dest = `dir` if abs (`retro.dlDir`) else `~/Downloads/Retro YTM/`. mp3 via `FFmpegExtractAudio` if `ffmpeg` on PATH, else m4a. Cookie-free. Self-pip-installs yt-dlp on first use. Returns `{ok, path, file, dir, format}`. Transport `⇩` button. |
| `GET /video-search?q=` | **general YouTube video search (not music)**. No auth needed. InnerTube `youtubei/v1/search` (WEB client key). `_collect_videos()` walks the payload for `videoRenderer`s. Row: `{videoId, title, channel, duration, durationSeconds, thumbnail, views, published, live}`. |

Track shape returned to the UI: `{videoId, title, artists, album, duration,
durationSeconds, thumbnail, isAvailable, setVideoId, artistId}`. `setVideoId` is
non-null only from `/playlist/<id>`; `artistId` is the primary artist's `UC…`
channel id (used by the stats window to map most-played back to an artist page).

### Renderer
| File | Lines | Role |
|---|---|---|
| `renderer/index.html` | ~346 | markup. **Script order matters**: `themes.js`, `api.js`, `player.js`, `app.js`, then `iframe_api` LAST. Inline `<head>` script re-applies theme (+ `data-theme`) pre-paint. Titlebar: `◈` `▣` `◍` `⚙`. Transport: `#tp-dl` (`⇩`), `#tp-fav` (`★`/`☆`, §5f.4). `.display` is a grid (`"readout vis"` / `"mq"` / `"slid"`) whose top row flexes with `--display-h` — the `#split-main` handle between `#main` and `#pled` (§5f.3). `#pl-sidebar` has two stacked sections: `#pl-lib-section` (PLAYLISTS + `#pl-add` `＋`) and `#recs-section` (FOR YOU + `#recs-refresh` `⟳`, §5f.2); `#pled-toggles` gains a `for you` button. Settings flyout (`#settings-pop`) gains **Stream cache** (`#set-cache-keep/-cap/-size/-clear`, §5f.8) and **Statistics** (`#set-stats`, §5f.6). Also `#local-audio`, `#file-input`, `#drop-zone`, `#cat`. |
| `renderer/css/winamp.css` | ~580 | the skin. Every colour is a `:root` token (see §5), mirrored with `CLASSIC` in `themes.js`. Also `.splitter` / `.hsplitter` (`#split-main`) / `.pled-toggles` / `.panel-hidden` / `--sidebar-w` / `--queue-w` / `--display-h`; `.head-tools` (shared PLAYLISTS + FOR YOU header row), `.recs-sub` / `.recs-artist`, `.drop-hot` / `.reorder-hot` / `.t-rm` (playlist DnD), `#tp-fav`, prev/now/next `.mq-*` marquee spans. |
| `renderer/css/game-skins.css` | ~1342 | Per-theme element restyle (§5d). One `html[data-theme="<id>"]` block per game theme. **All 6** built; presets/Custom get nothing. `.display` has **no `overflow:hidden`** (would clip the `::after{inset:-4px}` corner rivets) — `.readout` clips itself instead (§5f.3). |
| `renderer/js/api.js` | 95 | `window.RetroAPI` — fetch wrapper. Methods incl. `home`, `artists`, `artist(id)`, `suggestedArtists(seeds)`, `rate`, `addToPlaylist` / `removeFromPlaylist` / `movePlaylistItem` / `renamePlaylist` / `deletePlaylist` / `createPlaylist`. |
| `renderer/js/player.js` | 105 | `window.RetroPlayer` — wraps the YT IFrame player. `snapshot()` → `{ready,cur,dur,playing,state}`. Polls 250 ms → `tick`. |
| `renderer/js/app.js` | ~2793 | glue (a third of the codebase — GRAPH_REPORT flags it for a module split). `state = {list, queue, qi, shuffle, repeat, radio, showRemaining, authed, lists, activeListId, **plView**, originTracks}`; flags `videoActive/videoPlaying`, `localActive/localPlaying`. Everything from prior sessions **plus** this session: prev·now·next marquee (`setNowPlaying`), **stats** module (`statLoad/statStart/statTick/statFlush`, `topStatsArtists`, `retro.stats`, §5f.6) + `onStatsPlay` handler, **FOR YOU** (`loadRecs/loadArtists/renderForYou`, `openArtist/playArtist/getArtist`, §5f.2), **★ favourites** (`likedIds`, `rateTrack/toggleFav/updateFavBtn`, §5f.4), **playlist management** (`newYtPlaylist`, `dropTrackOnPlaylist`, `removeFromPl`, `reorderInPl`, `playlistMenu`, `renamePl`, `deletePl`, `makePlaylistRow`, `optimisticPls`/`suppressedPls`, §5f.5), **`#split-main`** resizer (`bindMainSplit`, §5f.3), **bongo→FFT** (`catBeat`, `catSetBeatMode`, `catTap`, `catRefresh`, §5f.7), **stream-cache** settings (`pushCachePolicy`, `refreshCacheSize`, §5f.8). |
| `renderer/js/stats.js` | 278 | **new.** The stats window. Reads `localStorage['retro.stats']`, aggregates (`topTracks`, `topArtists`, `mostSkipped`, `dailySeries`), draws the plays/day canvas chart, wires `▶` → `window.retro.playFromStats`. Re-renders on `storage`. No sidecar calls. §5f.6. |
| `renderer/css/stats.css` | 89 | **new.** The stats window skin — Classic-Green fallbacks + shared theme tokens. |
| `renderer/stats.html` | 69 | **new.** Own CSP, loads `js/stats.js` only. §5f.6. |
| `renderer/js/themes.js` | 277 | `window.RetroThemes` — theme engine + picker (see §5). |
| `renderer/js/video.js` | ~280 | CRT window glue. YT IFrame player on `#vid` (visible, `controls:1`), `API.videoSearch()` → results list, click → `loadVideoById`. Reports `playing/paused/ended` (+ title/channel) and a 250ms `state:'time'` stream via `window.retro.reportVideoActivity`. `onVideoLoad` plays a video pushed from the main-window search; `onVideoCommand('pause')` stops it when a song takes over. `onDockState` updates the `◧`/`▢` dock button. Applies `retro.videoVol`, re-applies theme, on `storage` events. |
| `renderer/css/video.css` | ~180 | the CRT skin — bezel, tube curvature (`border-radius x/y`), scanlines, vignette, flicker, power-on animation. Same `:root` token fallback = Classic Green; live theme comes from `retro.themeVars`. |

### Playback path
`app.js` double-click track → `RetroPlayer.load(videoId)` → hidden `#yt` div
becomes a YouTube `<iframe>` → `tick`/`state` events drive LCD, seekbar,
marquee, auto-advance. Web Audio can't tap the cross-origin audio, so the
visualiser is faked (reacts to play/pause, not real FFT).

---

## 4. Status

| Feature | State |
|---|---|
| Core player (auth, library, search, queue, radio, transport, keyboard) | **done, verified** end-to-end incl. real playback |
| One-button Google auth (cookie grab in Electron) | **done** |
| **Theme / palette chooser** | **done 2026-08-27** — see §5 |
| **Per-theme game skins** (element restyle) | **all 6 done 2026-08-27** (SC2, Machinae, Cyberpunk, PoE, Valorant, Dota 2) — see §5d |
| Queue panel + session lists | **done 2026-08-27** — see §5b |
| YouTube video search + retro CRT side window | **done 2026-08-27** — see §5c. InnerTube search, right-edge **docking** (detach/re-attach), **unified All/Music/Video search**, collapsible groups, mutual-exclusion + transport routing, queueable video rows. **Verified live** by the user this session (drag-drop, transport, radio, zoom, panels all exercised). |
| Playlist-editor panel hide/resize · whole-window zoom · dev hotkeys | **done 2026-08-27** — see §5c ("Playlist-editor panels", "Whole-window zoom") and §2 ("Dev iteration"). |
| Radio autoplay quality (`≈`) | **done 2026-08-27; reworked 2026-08-28** — "radio v3": `/related` uses `get_watch_playlist(radio=True)`. **2026-08-28 fix — "queue fills with one artist":** `extendRadioNow` now (a) **only drains `state.originTracks` when it holds ≥4 distinct artists** (an artist/album page is one artist → skip straight to the station), (b) seeds the station from **up to 2 recent queue tracks, preferring ones whose artist ≠ the current track**, via `Promise.all` of two `/related` calls merged + shuffled, and (c) caps every refill at **2 per artist** (`diversifyTracks`). So the station drifts outward instead of orbiting the seed artist. See §5c + §3. |
| **Local-file import + real-FFT visualiser** | **done 2026-08-27** — see §5e |
| **Download button (yt-dlp) + settings menu** | **done 2026-08-27** — see §5e; `/download` endpoint in §3 |
| **Visualiser: slower / organic** + LCD blink `1s→1.5s` | **done 2026-08-27** — see §6 |
| **prev · NOW · next marquee** | **done 2026-08-28** — §5f.1 |
| **FOR YOU** (recommendations + favourite/suggested artists) | **done 2026-08-28** — §5f.2. `/home` + `/artists` + `/artist/<id>` + `/suggested-artists`; stats-fed favourites. **Verified live** (rows render, artist load + `▶` shuffle, stats merge). |
| **Player/editor resizer** (`#split-main`) | **done 2026-08-28** — §5f.3 |
| **★ Favourites** (→ real Liked Music) | **done 2026-08-28** — §5f.4. `/rate`. **Verified live.** |
| **Playlist management** (create / drag-add / rename / delete / remove / reorder) | **done 2026-08-28** — §5f.5. **Verified live** incl. reorder + the double-`LM` and new-playlist-lag fixes. |
| **Listening statistics + standalone stats window + play-from-stats** | **done 2026-08-28** — §5f.6. Tracking hooks + `/stats.html` window. **Stats window verified** with a seeded dataset; live tracking not yet exercised end-to-end. |
| **Bongo cat taps to the FFT** | **done 2026-08-28; "drummer v2" rewrite same day** — §5f.7. Two-band (kick→left / snare→right) spectral-flux onset detector + tempo lock + power-scaled press; `fftSize 256` / smoothing `0.72`. Idle loop always runs. User: **"PERFECT"**. Sensitivity + groove-fill now exposed as ⚙ → *Tuning* knobs (`retro.tune`). |
| **Visualiser "neon EQ" restyle** | **done 2026-08-28** — DPR-crisp, glow + peak-hold caps + rounded bars + 3-stop gradient + neighbour-smoothed spectrum + centre-weighting Tukey window, shared by real-FFT and sim paths. Height / centre-focus / bottom-gap / glow / caps are ⚙ → *Tuning* knobs (`retro.tune`). See §5c "Visualiser" + §6. Needs an in-app eyeball. |
| **Stream-cache keep between sessions + LRU cap + clear button** (backlog #2) | **done 2026-08-28** — §5f.8. LRU eviction **verified** (temp-dir test); Electron IPC path not exercised outside `npm start`. |
| **"Stream everything" mode** (backlog #6 — real visualiser + beat cat on *every* track) | **done 2026-08-28** — §5g. `⚙` → *Stream everything* checkbox (`retro.streamAll`, default off). `playAt` routes non-local YT tracks through `streamTrack(t, quiet)`; `prefetchNextIfBlocked` always warms the next track while on. **Not verified in-app** (needs `npm start` + a listen — this also finally exercises the bongo-cat beat detector against real music). |
| **ARTIST MIX panel** | **done 2026-08-28** — §5h. `#aq-section` in the queue column: a pool of artists (add by search via new `GET /search-artists`, or drag from FOR YOU) that shuffles random songs from random pooled artists into the queue when armed. Mutually exclusive with radio. **Needs `npm start`** (server route) + an in-app check. |
| Game-skin visual QA | **outstanding** — the 6 game skins were verified structurally, **never eyeballed in the running Electron app**. Do a pass on `npm start`. |
| Package → portable .exe | **done 2026-08-28** — §9. `retro-sidecar.spec` (PyInstaller onedir: `server.py` + bundled `renderer/` + `ytmusicapi` + `yt_dlp`) → `package.json → build` (electron-builder `portable`) → **`release/RetroYTM-BongoCat-1.0.0-portable.exe`** (~91 MB). Frozen sidecar smoke-tested (health / UI / all routes / yt-dlp all OK). GUI launch of the packaged exe not yet done by a human. No ffmpeg bundled (downloads stay `.m4a`); unsigned. **Bongo-cat app icon added 2026-08-28** (`build/make-icon.py` → `build/icon.ico` + `renderer/icon.png`, wired via `build.win.icon` + `BrowserWindow({icon})`). See **QA.md**. |

---

## 5. Theme system (most recent work)

- All skin colour is ~41 semantic CSS custom properties on `<html>`
  (`--lcd`, `--lcd-dim`, `--lcd-glow`, `--screen-black`, `--bevel-light/dark`,
  `--titlebar-a/b`, `--btn-a/b`, `--accent`, `--toggle-on-a/b`, `--vis-top/bottom`,
  `--cta-*`, …). `winamp.css :root` = Classic Green.
- `themes.js`: a theme is a **full token map**. Presets + game themes are
  generated from a small `SEED` object (`{bg, chrome, lcd, accent, toggle,
  text, title:[a,b], …}`) by `build(seed)`, which derives bevels/panels/hover
  by `shade()`-ing the seed colours and picks contrast text via luminance.
  "Custom" = 8 `<input type=color>` values layered over `CLASSIC` by
  `buildCustom()`.
- **6 presets**: Classic Green, Amber CRT, Ice Blue, Vaporwave, Mono, Red Alert.
- **6 game themes**: StarCraft II, Machinae Supremacy, Cyberpunk 2077,
  Path of Exile, Valorant, Dota 2.
- Picker: **◈** title-bar button → flyout `#theme-pop` (built by `themes.js`),
  grouped Presets / Game Themes / Custom.
- Persistence: `localStorage` keys `retro.theme`, `retro.themeVars` (resolved
  map, used by the inline no-flash script), `retro.custom`. The Electron app
  keeps localStorage in its own userData partition.
- Visualiser reads `--vis-top`/`--vis-bottom` on the `retro:themechange` event
  (`app.js readVisColors`).
- **Add a theme**: one `SEED` entry + one row in `PRESETS`/`GAMES` in themes.js.

---

## 5b. Queue panel + session lists

Third column in `.pled-body` (`index.html` `#queue-panel`), all in `app.js`:

- **Live queue** — renders `state.queue`, current row highlighted, past rows
  dimmed. Per-row `×` remove, HTML5 drag to reorder (`moveInQueue` keeps
  `state.qi` pinned to the playing track). `clear` = keep only the playing
  track. Foot shows "N tracks · M up next · mm:ss left".
- **Add to queue** — hover `＋` on any track-pane row (add to end), the
  right-click menu (`trackMenu`): Play now / Play next (insert at `qi+1`) /
  Add to queue / **Add to list ▸** (`state.lists` names + "＋ New list…") /
  Remove from queue (queue rows only) — or **drag a track-pane row onto the
  queue** (`dragPayload = {kind:'track'|'queue'}`, `handleQueueDrop` →
  `insertInQueue` / `moveInQueue`; drop on a row inserts there, drop on empty
  space appends).
- **Electron has no `window.prompt()`** — all naming/confirm dialogs go through
  the in-app `#modal` (`openModal` / `askText` / `askConfirm` in app.js).
  `window.confirm()` does work in Electron but the modal is used for a
  consistent skinned look.
- **Session lists** — `state.lists = [{id,name,tracks}]`, persisted to
  `localStorage['retro.lists']`. `#sl-*` toolbar: `save queue` (snapshot
  current queue → named list), load (into track pane), play, rename, del.
- **`▲ YTM`** — `POST /playlist/create` → real PRIVATE YT Music playlist,
  then `loadPlaylists()` refreshes the left sidebar. Disabled unless authed +
  list non-empty. **Creating a playlist is a real irreversible account write.**
- `toast(msg)` — transient bottom-centre status (`#toast`).

---

## 5c. Video window + auto-duck + unified search (most recent — 2026-08-27)

A second **CRT-television window** for watching general YouTube videos
(not music), a **unified music+video search** in the main window so it
reads as one app, and **window docking**.

### Opening / docking (`main.js`)

- **Open:** `▣` button in the main titlebar (between `◈` and `◍`) →
  `window.retro.openVideo()` → IPC `video:open` → `openVideoWindow()`. Also
  opened implicitly by activating a video row in the main search
  (`window.retro.playVideo({id,title,channel})` → IPC `video:play` →
  `playVideoInWindow()` opens/focuses then pushes `video:load`).
- **Docked by default** (`videoDocked = true`). Docked = frameless window
  glued to the **right edge** of the main window, matched height,
  `resizable:false`. `dockBounds()` computes the rect (falls back to the
  **left** edge if the display has no room on the right); `positionDock()`
  re-applies it on the main window's `move` / `resize`, and `hide`/`show`s
  it with the main window's `minimize` / `restore`.
- **Detach / re-attach:** `◧` (on) / `▢` (off) button in the CRT titlebar →
  `window.retro.toggleVideoDock()` → IPC `video:toggle-dock`. Flips
  `videoDocked`, toggles `setResizable`, snaps back to `dockBounds()` on
  re-dock (nudges off the seam on detach). Main process pushes `dock-state`
  → `video.js` updates the button.
- **Premium carries over** — the window uses the default `session` (no
  `partition`), same signed-in Google session as the main player.

### CRT window (`video.html` / `video.css` / `video.js`)

- Own CSP. Loads `api.js` + `video.js` + the IFrame API.
- Own search box → `RetroAPI.videoSearch(q)` → `GET /video-search`
  (InnerTube). Kept for when the window is detached / used standalone.
  `#v-foot` (status line under the results) starts **empty** and is hidden
  while empty (`.crt-foot:empty`) — reserved for a future feature; search
  still writes transient status into it.
- Click a result (or receive `video:load`) → visible YT IFrame player
  (`#vid`, `controls:1`) in the CRT screen; `power-on` animation, `NO
  SIGNAL` placeholder hidden after first load. LED reflects play state.
- **Theme sync:** same no-flash inline script; re-applies `retro.themeVars`
  on `storage` events, so a theme change in the main window restyles it live.
- **Volume:** the CRT player has no volume UI of its own — it reads
  `localStorage['retro.videoVol']` on `onReady` and on cross-window
  `storage` events (`applyVidVol`, un-mutes if needed). The main window's
  slider is the single source of truth.

### CRT video ↔ main screen (`video.js` → `main.js` → `app.js`)

`video.js` reports `playing / paused / ended` (with `{title, channel}` on
`playing`, from `curMeta`/`getVideoData()`) plus a `{state:'time', cur, dur}`
message every 250ms while playing — all via
`window.retro.reportVideoActivity` → IPC `video:activity` → `main.js` →
`video-activity`. `app.js`'s listener tracks `videoPlaying` and, while true:

- **Music ↔ video are mutually exclusive**, tracked by two flags:
  `videoActive` (a CRT video is the playback context — playing *or* paused)
  and `videoPlaying` (actually rolling). On video `playing`, `app.js` calls
  `P.pause()`. `playAt()` calls `stopVideoIfPlaying()` (clears `videoActive`,
  sends `videoControl('pause')`) so double-clicking a song hands playback
  back to the music.
- **The main transport drives whichever is active.** While `videoActive`,
  `el.tp{Play,Pause,Stop}`, the space bar and ◄/► arrows route through
  `window.retro.videoControl(cmd)` → IPC `video:control` → `video:command`
  (`play`/`pause`/`toggle`/`stop`/`seek:±n`) instead of `RetroPlayer`.
  `P.on('state')` / `P.on('tick')` early-return while `videoActive`.
  Prev/next are no-ops (the CRT window has no playlist).
- **Volume slider follows the video** — `bindBar(el.volbar)` and the ↑/↓
  keys (`nudgeVol`) write `retro.videoVol` instead of `retro.vol`;
  `paintVol()` shows `loadVideoVol()`. `video.js` applies it via the
  `storage` event. On stop, the slider snaps back to the music volume.
- **LCD + seek bar follow the video** — `paintTime(cur, dur)` (factored out
  of the `P.on('tick')` handler) is driven by the `state:'time'` messages;
  `P.on('tick')` early-returns while `videoPlaying`, so the readout no longer
  freezes at the paused song's position.
- **Marquee follows the video** — `setNowPlaying({artists: channel, title})`
  on `playing`; back to `state.queue[state.qi]` on stop.
- **Visualiser follows the video** — `drawVis()` uses `active =
  P.snapshot().playing || videoPlaying`. Still simulated (cross-origin audio
  can't be FFT'd — same limit as music).

`main.js` sends `{state:'closed'}` from the video window's `closed` handler
so everything resets when it's closed mid-play.

### Visualiser (`.display` / `app.js`)

`#vis` is a normal grid cell in the **top-right** of `.display` (`grid-template-
columns: 160px 1fr`, areas `"readout vis"`) — readout/LCD on the left, the
analyser fills the rest of the top row. `resizeVis()` (a `ResizeObserver` on
`#vis`) keeps the canvas backing store matched to its box and sets `BARS`
from the width. `drawVis()` runs off `P.snapshot().playing || videoPlaying`.

**"Neon EQ" look (2026-08-28):** `resizeVis()` now sizes the backing store
**DPR-scaled** (capped 2×, `VW`/`VH`/`VDPR`) and `drawVis()` does
`setTransform(VDPR…)` so it draws in crisp CSS px (`#vis` lost
`image-rendering:pixelated`). Bars: **`~w/7`** of them, clear inter-bar `gap`,
rounded tops (`roundRect`), a 3-stop vertical gradient
**`--vis-bottom` → `--vis-top` → `visHot`** (`--vis-top` blended 55 % toward
white for a hot tip), per-bar **`shadowBlur` glow**, **peak-hold caps** (jump to
the bar top, sink `0.012/frame`), and a faint glowing **baseline line**. Real
branch also gets **1-2-1 neighbour smoothing** on `targets[]` so the spectrum
reads as an even landscape, not spikes; auto-level release loosened
(`0.02 → 0.045`), divisor `vgain*1.32+.04`. `parseRGB()` + `visHot`/`visTopRGB`
recomputed in `readVisColors()` (init + `retro:themechange`). Both the real-FFT
and simulated paths share the new draw code, so embedded YT playback gets the
same styling (just sine-driven motion).

**Compact / centred geometry (2026-08-28, follow-up):** bars are deliberately
*not* a full-height wall. `drawVis()` grows them up from a **raised horizontal
baseline** `floorY = H − round(H*0.26)` and a full-scale bar reaches only
`maxH = H*0.58`, so the occupied band is ≈ `0.16H … 0.74H` — centred, with clear
empty space above **and** below, baseline dead level. The old left/right
frequency tilts were flattened to near-1 (`0.97 + i/BARS*0.06` real,
`0.94 + bass*0.06` sim) to kill any diagonal/sloped read.

**Centre-weighting envelope:** a real music spectrum is genuinely bass-heavy —
loud on the left, rolling off to the right — which read as "left-taller". So
`buildCentreWindow(n)` precomputes a **Tukey window** (`vwin[]`, rebuilt on
resize): flat `1.0` across the middle, raised-cosine taper over the outer
`WIN_TAPER` (0.4) of the bars each side, never below `WIN_FLOOR` (0.2).
`targets[i] *= vwin[i]` every frame (when `real || active`) → tall in the
centre, tapered at both edges regardless of the actual spectral content.
Knobs: `botPad` `0.26`, `maxH` `0.58`, `WIN_TAPER` `0.4` (more = wider taper /
narrower flat top), `WIN_FLOOR` `0.2` (edge-bar minimum).

### Playlist-editor panels — hide/show + resize (`index.html` / `app.js`)

- **Foot toggle bar** `#pled-toggles` (bottom of `#pled`): `playlists`,
  `search`, `queue`, `lists` buttons toggle `.panel-hidden`
  (`display:none`) on `#pl-sidebar` / `#pl-search` / `#queue-section` /
  `#sl-section`; lit (`.on`) = visible. When both queue parts are hidden the
  whole `#queue-panel` + its splitter go too.
- **`keybinds`** button (same bar, no `data-panel` so the panel handler skips
  it) → toggles `#keys-pop`, a `.theme-pop`-style flyout that pops **up** from
  the bottom-left (`left:6px;bottom:26px`). Content is built once from the
  `KEYBINDS` array in `app.js` (kept next to the keydown handler — **update both
  together**); `renderKeybinds` / `closeKeysPop`, outside-click + Esc close,
  opening it closes the theme + settings pops and vice-versa. 2026-08-28.
- **Column resize** — `.splitter` handles (`#split-sidebar`, `#split-queue`)
  drag to set `--sidebar-w` / `--queue-w` on `<html>`; `.pl-sidebar` /
  `.queue-panel` are `flex:0 1 var(--…-w, …)`, `.pl-main` takes the rest.
- All of it (hidden flags + widths) persists to
  `localStorage['retro.panels']`; `applyPanels()` restores on boot.

### Unified search (`index.html` / `app.js`)

- `#q-mode` button next to `go` cycles **All → ♪ Music → ▶ Video**
  (`SEARCH_MODES`, glyphs `A` / `♪` / `▶`), persisted to
  `localStorage['retro.searchMode']`. Re-runs the current query on change.
- `doSearch()`: `music` → `renderTracks()` (unchanged); `video` →
  `renderVideoResults()`; `all` → `Promise.all` of both, then a
  `♪ MUSIC · n` header + music rows + a `▶ VIDEO · n` header + video rows in
  the **same** `#pl-tracks` list.
- **Video rows are queueable** — `renderVideoResults` maps each hit through
  `videoToTrack(v)` (→ music-track shape + `isVideo:true`, `channel`→`artists`)
  and gives the `<li class="vid">` the full treatment: `dblclick` →
  `enqueue(t,'now')`, hover `＋` → `enqueue(t,'end')`, drag→queue via the
  shared `makeRowDraggable(li, track)` (used by song rows too — `dragstart`
  sets `dragPayload={kind:'track',track}`, `dragend` clears it), right-click
  → `trackMenu` (Play now/next/queue/list) **plus** "▶ Open in video window"
  (`ctxInfo.watch` → `window.retro.playVideo`). Queued videos **play as
  audio in the hidden main player** like songs (`P.load(videoId)`);
  `renderQueue`/`renderTracks` mark them with a `▶` (`.q-vid`). Radio
  seeding skips `isVideo` items. **Caveat:** lots of plain YouTube videos
  have embedding disabled by the uploader — those raise YT error 101/150 in
  *either* player, so `P.on('error')` strikes the row through, toasts
  `⚠ … can't be embedded — skipped`, and auto-advances. The video row's
  right-click menu has `↗ Open on YouTube` (`openExternal`) as the escape
  hatch.
- **Collapsible groups** — in `all` mode the `♪ MUSIC` / `▶ VIDEO` header
  rows (`groupHeader()`, `<li class="grp" data-grp=…>`) toggle a `collapsed`
  class (▾/▸ caret) and `display:none` every sibling row with the matching
  `data-grp`. State is per-render (fresh on each search), not persisted.
### Whole-window zoom (`preload.js`)

- **Ctrl + mouse wheel** (also `Ctrl` `+` / `-` / `0`) zooms the entire
  window via `webFrame.setZoomFactor` — every element, like browser zoom.
- Lives in a top-level IIFE in `preload.js`, so **both** windows get it from
  the shared preload. Clamped **0.5–2.0** (the fixed skin can't hold past
  ~2×), step 0.1. Persisted to `localStorage['retro.zoom']`, restored on
  load (+ `DOMContentLoaded`), and mirrored between the two windows via a
  `storage` listener.
- Independent of the theme system and of `--list-font` (that token was
  removed — this replaced the earlier per-list text-size button).
- CSS was hardened for zoom: `min-width:0` on the flex text children
  (`.t-title`, `.t-sub`, `.q-title`, `.pl-search input`), `.pl-foot` set to
  `nowrap`+ellipsis, and the two side columns (`.pl-sidebar`,
  `.queue-panel`) changed from `flex:0 0` to `flex:0 1` with a `min-width`
  floor so the middle pane doesn't starve.

### IPC / preload surface added

`preload.js` → `window.retro`: `playVideo`, `videoControl`, `toggleVideoDock`,
`onDockState`, `onVideoLoad`, `onVideoCommand` (plus `openVideo`,
`reportVideoActivity`, `onVideoActivity` from before). Main→video IPC:
`video:play`, `video:control` (→ `video:command` play/pause/toggle/stop/seek),
`video:toggle-dock`.
`win:min` / `win:close` now resolve the
target via `BrowserWindow.fromWebContents(e.sender)` so the CRT titlebar
buttons work through the shared preload. `preload.js` also has a
non-`window.retro` IIFE that wires Ctrl+wheel / Ctrl+`+`/`-`/`0` zoom via
`webFrame` (see "Whole-window zoom" above).

Added 2026-08-27: `window.retro.resetZoom()` (settings "reset zoom", sets
`retro.zoom=1` + `webFrame.setZoomFactor(1)`); `window.retro.revealPath(p)`
→ IPC `shell:reveal` → `shell.showItemInFolder(p)` (download button pops the
saved file in the OS file manager); `window.retro.pickFolder()` → IPC
`dialog:folder` → `dialog.showOpenDialog({properties:['openDirectory',
'createDirectory']})` → abs path or null (settings download-folder chooser).

### localStorage keys (all of them)

`retro.theme` · `retro.themeVars` (resolved token map, no-flash script) ·
`retro.custom` (theme picker) · `retro.vol` (music **+ local-file** volume;
also the settings "startup volume") · `retro.videoVol` (CRT video volume,
shared → video.js via `storage`) · `retro.lists` (session lists) ·
`retro.searchMode` (All/♪/▶) · `retro.zoom` (window zoom factor, shared
between windows) · `retro.panels` (`{sidebar,recs,search,queue,artists,lists}`
hidden flags + `sidebarW`/`queueW`/**`displayH`** — `sidebar` key = the PLAYLISTS
section, `recs` = FOR YOU, `artists` = ARTIST MIX (§5h), `displayH` = the
`#split-main` player height, §5f.3) ·
`retro.visOn` (`'1'`/`'0'` — visualiser on/off) · `retro.visMode`
(`'auto'`/`'sim'`) · `retro.blockedMode` (`'stream'`/`'skip'` — how to handle
YT err 101/150) · `retro.dlDir` (download folder abs path; absent =
`~/Downloads/Retro YTM`) · `retro.cat` (`'1'`/`'0'` — bongo cat on/off) ·
**`retro.stats`** (listening stats — see §5f.6 for the shape) ·
**`retro.keepCache`** (`'1'`/`'0'` — keep the stream cache between sessions) ·
**`retro.cacheCapMB`** (LRU size cap: 250/500/1000/2000) ·
**`retro.streamAll`** (`'1'`/`'0'` — route every track through `/stream`, §5g) ·
**`retro.tune`** (JSON — the ⚙ → *Tuning* knobs: `beatSens`, `grooveFill`,
`eqHeight`, `eqCenter`, `eqBottom`, `eqGlow`, `eqCaps`; missing keys fall back to
`TUNE_DEFAULTS` in `app.js`) ·
**`retro.artistMix`** (JSON `[{id,name}]` — the ARTIST MIX pool, §5h) ·
**`retro.artistMixOn`** (`'1'`/`'0'` — mix armed).
Queue contents and
imported local files are **not** persisted (object URLs die on reload). The
stream-cache keep/cap are also mirrored to `~/.retro-ytm-cache.json` for the
Electron main process + sidecar (§5f.8).

### Gotchas

- InnerTube is unofficial (like `ytmusicapi`). If video search returns
  `[]`, YouTube reshuffled the payload — `_collect_videos()` walks the whole
  tree so layout churn is mostly absorbed. The InnerTube API key is **scraped
  from youtube.com at runtime** (`_innertube_key()`, cached; regex
  `"INNERTUBE_API_KEY":"…"` off the homepage) rather than hardcoded — a
  hardcoded `AIza…` literal tripped GitHub secret scanning even though the key
  is public/non-credential (2026-08-28). If the scrape ever fails the POST is
  retried keyless, which usually still works.
- Docked-window follow uses the main window's continuous `move` event —
  fine for two windows; if it ever feels janky on a slow box, switch the
  `win.on('move', follow)` to `'moved'` (fires once after the drag).

---

## 5d. Per-theme game skins — element restyle (most recent — 2026-08-27)

Goal: make the six **game themes** actually look like their game's HUD, not
just recolour. This is done by re-skinning the **real UI elements**
(window shells, the screen, every chrome button, list housings, inputs,
scrollbars) in a per-theme CSS layer — **not** by overlaying decorative
art. Presets + Custom are 100% untouched (winamp.css only).

**All six game themes are built** (SC2, Machinae Supremacy, Cyberpunk 2077,
Path of Exile, Valorant, Dota 2) — each from a reference HUD screenshot the
user supplied. Presets + Custom get no block and are 100% winamp.css.

> **`game-skins.css` can only add *material* (borders, shadows, gradients,
> pseudo-elements) — it CANNOT recolour a theme.** `themes.js apply()`
> writes `--lcd` / `--accent` / every palette token as an **inline style on
> `<html>`**, which beats any stylesheet rule. So a skin that needs a
> different readout/selection colour (Cyberpunk did) must edit that theme's
> `SEED` entry **and** its swatch in the `GAMES` catalogue array in
> `themes.js`. Local `--xx-*` helper vars declared on the
> `html[data-theme="…"]` selector are fine (no collision).

**Machinae Supremacy** (refs: the *Redeemer* + *Deus Ex Machinae* album
art) — same SC2 skeleton, different material: glossy piano-black shells
(`13px` radius, wet top-highlight gradient), **dark reflective chrome**
buttons (the 45%/53% hard gradient step = the fake reflection horizon),
**cyan** keyline + glow on the screen (vs SC2's green) inside a polished
chrome surround with a bright `--ms-chrome-hi` specular ring, `::before`
top-edge wet sheen, `::after` = two mirror chrome **chevrons** on the
screen's lower corners (the *Deus Ex* blades). Red shows up twice, small:
a `3px` inset stripe down the left of the transport, and one stylised red
ink-**splatter** SVG in the bottom-right dead space — that splatter reuses
`#ornaments .orn-br` (the only current user of the dormant overlay) so it
can't disturb the flex layout.

**Cyberpunk 2077** (ref: the red braindance / evidence-DB screens — *not*
the yellow menu look) — deliberately **flat, no bevels**: everything is a
sharp black rectangle with a thin **bright-red glowing hairline** border
(`1px solid` + layered `rgba(255,59,59,…)` bloom shadows). List panels +
transport get a `2px` red top-accent bar. The screen: black, red hairline
+ inner bloom, a `::before` that layers **CRT scanlines + four corner
brackets** in one multi-`background` (8 tiny `linear-gradient` ticks + a
`repeating-linear-gradient`), and a `::after` tiny mono serial
(`SYS_2.0.77 · NET//SEC`) in the top corner; `#main .title-text::after`
appends `//SEC.NET_2.0.77`. Section headers get a `◆` prefix
(`::before` on `.pl-sidebar-head` and `.qp-head > span:first-child`).
Buttons are flat dark w/ a red frame + red legend; `:hover` brightens the
frame, `:active`/`.on` fill solid red. **Palette:** this is the first skin
to also edit `themes.js` — `SEED.cyberpunk` changed to a **red** readout
(`lcd:#ff4b4b`) + **blue** selection (`accent:#3b6bff`) + dark-red title,
and the `GAMES` swatch to `#ff4b4b` (see the callout above for why CSS
alone couldn't do it).

**Path of Exile** (ref: the flask/skill HUD bar) — closest to SC2's
skeleton (beveled metal + stacked-ring screen surround + corner rivets)
but **warm**: blackened-bronze shells (`3px` radius) with an **inset
aged-gold keyline** (`inset 0 0 0 1px` gold-deep), parchment button
legends, near-black recessed slots. The screen keeps SC2's stacked box-
shadow surround (bronze tones) + a `::before` **nested inner gold frame
line** (`inset:4px; border:1px solid rgba(201,162,74,.32)` — the PoE
double-frame signature) + `::after` **4 gold corner rivets**. Gothic
flourishes: `⟡` before the main title, `✦` on section headers, and a
**repeating gold-tick "XP bar"** across the top of `#pled-toggles`
(`::before`, `repeating-linear-gradient`). `SEED.poe` already fit (gold
`--lcd`, deep-red `--accent`) so **no themes.js change** this time.

**Valorant** (ref: the PLAY menu) — deliberately **matte, no glow** (unlike
Cyberpunk's neon bloom): flat dark-navy fills, thin **crisp cool-white
hairlines** (`--val-line #cdd8de`), sharp corners. Buttons get a real
`clip-path` **notch** on the bottom-right corner (`--val-notch`, safe on
small elements); `:hover` brightens the border, `.on`/CTA = **solid
`#ff4655` red**, bold white. Screen: flat black, `2px` red top-tab,
`::before` = 8 white **corner-bracket ticks**, `::after` = a `◆` diamond
hanging off the bottom-centre (the Valorant banner tail). `◆` markers on
the title + section headers. `SEED.valorant` changed: `title` moved from
red → navy (`['#1b2b38','#0f1923']`), `titleText` → bone, swatch → `#ff4655`
— so red is reserved for action, matching the ref.

**Dota 2** (ref: the default action bar) — `SEED.dota2` was **reworked**
from its old warm-bronze (which overlapped PoE) to **cold desaturated
charcoal + teal**: `bg #16191b`, `chrome #2b3133`, `lcd #63bcd6` (teal),
`accent #57b4cf`, `toggle #c8a05a` (gold — the Dota "active" key),
`title` charcoal, swatch → `#57b4cf`. Skin: charcoal shells with a soft
bevel + `6px` radius (a nod to Dota's curved frames, vs Valorant's `0`),
grey button legends, gold lit-state. Screen = SC2-style stacked charcoal
surround + `::before` **nested teal frame line** + `::after` **4 gold
rivets** + teal keyline glow. `◈` markers on title + headers; teal header
text.

### Files
| File | Role |
|---|---|
| `renderer/css/game-skins.css` | **new.** Loaded after `winamp.css`. Tiny base block (keeps the dormant `#ornaments` overlay hidden) + one big `html[data-theme="sc2"]` block. Add one block per game theme. |
| `renderer/index.html` | `<link>` to `game-skins.css` after `winamp.css`. No-flash `<head>` script also sets `data-theme` from `localStorage['retro.theme']` so the skin is right before first paint. `<div id="ornaments">` (6 empty `<i>`, fixed / `pointer-events:none` / `z-index:45`) is a stuck-on overlay for art that must sit *above* the chrome — currently only Machinae uses it (`.orn-br` = the red splatter); the other 5 slots are free. |
| `renderer/js/themes.js` | `apply(id)` does `document.documentElement.setAttribute('data-theme', id)` — the single hook. |

### The SC2 block (pattern to copy)
- Local metal palette as `--sc2-*` custom props on the `html[data-theme="sc2"]`
  selector (usable here — unlike inside an SVG data URI — because it's plain
  descendant CSS), then:
  - `#main` / `#pled`: `border-radius:11px`, gunmetal vertical gradient,
    `inset` top-highlight + bottom-shadow bevel + drop shadow.
  - `.display` (the hero): black panel, `border-radius:9px`, **green keyline**
    = `inset 0 0 0 2px` dim-green + `inset 0 0 16px` green glow, then a
    **stacked metal surround** faked with layered non-inset `box-shadow`
    spread rings (`0 0 0 3px`, `4px`, `7px`, `8px` alternating mid/deep).
    `margin` bumped 6→12px for ring room. `::after` (`inset:-4px`) paints
    **4 bronze corner rivets** as 4 `radial-gradient`s (no SVG).
  - One shared beveled-button recipe for `.title-btns button, .tp, #q-mode,
    .pl-search button, .pled-toggles button, .sl-toolbar button, .qp-head
    button, .theme-reset, .modal-btns button, #auth-connect` — gradient,
    light `border-top-color`, `border-radius:3px`, inset highlight, green
    text w/ glow. `:active` = darker + inset press.
  - Lit state (`.tp.toggle.on`, `#sl-push`, `#modal-ok`, `.big-btn`) =
    solid green gradient, dark text, outer glow.
  - `.pl-sidebar/.pl-main/.queue-panel` = metal frame, rounded, recessed
    inner shadow (command-card look — **no** green keyline, that's screen-only).
  - Recessed inputs w/ green `:focus` keyline; gradient headers/foots;
    metal `.splitter`; rounded `.ctx-menu/.modal-card/.theme-pop/.toast/
    .auth-card`; `::-webkit-scrollbar` = dark trough + metal thumb (green
    on hover).
- Verified via the served page + computed-style probing: every override
  lands under `data-theme="sc2"` and **fully reverts** when switched to a
  preset. **Not yet eyeballed in the running Electron app** — do a visual
  pass on `npm start`.

### To add the next game theme
1. Get a HUD reference screenshot.
2. Add an `html[data-theme="<id>"] { … }` block to `game-skins.css`
   following the SC2 pattern (local palette props → shells → screen →
   button recipe → panels → inputs → scrollbars).
3. No JS/HTML change needed — `data-theme` is already wired.
- The CRT video window (`video.html`) has no `data-theme` hook (theme-syncs
  via `retro.themeVars` only) → no game skin there yet.

---

## 5e. Local-file playback · download button · settings menu (2026-08-27)

### Local audio import — the 3rd playback source
- `<audio id="local-audio">` in `index.html`. `app.js` flags `localActive` /
  `localPlaying` mirror `videoActive`/`videoPlaying`; `stopLocalIfPlaying()`
  mirrors `stopVideoIfPlaying()`. `playAt()` routes `t.isLocal` → `playLocal()`
  (pauses `RetroPlayer`, sets `LA.src` to the object URL, `LA.play()`); a
  non-local `playAt` calls `stopLocalIfPlaying()`; a CRT video starting also
  stops local. Transport buttons, space, ◄/►, seek bar and the volume slider
  all get a `localActive` branch (local shares `retro.vol` with music).
  `P.on('state'|'tick')` early-return on `localActive` too.
- **Import:** drag audio files anywhere onto the window (capture-phase
  `dragenter/over/leave/drop` on `window`, gated by `isFileDrag()` —
  `dataTransfer.types` has `'Files'` **or** an `items[].kind==='file'` **or**
  `files.length` — so the queue's internal DnD is untouched; `#drop-zone`
  overlay shows while dragging), or Settings → *Import audio files…*
  (`#file-input`). `importFiles()` → `URL.createObjectURL` per file → track
  shape `{videoId:'local:N', isLocal:true, localUrl, artists:'Local file', …}`.
  They're pushed to `localTracks[]` and **rendered into the track pane**
  (`renderTracks(localTracks, 'local files (N)')`) so the drop has an obvious
  visible result, and appended to `state.queue` (auto-play if it was empty).
- `localImports[]` backs the settings list + `clearLocal()` (revokes the
  object URLs, strips `isLocal` tracks from the queue, re-points `state.qi`).
  Session-only — object URLs die on reload; **not** persisted. `▲ YTM`
  playlist-create filters out `local:` ids.

### Real-FFT visualiser (local files only)
`wireLocalAnalyser()` (once — `createMediaElementSource` is single-use)
builds `AudioContext` → `MediaElementSource(LA)` → `AnalyserNode`
(`fftSize 128`) → destination. `drawVis()` branch: `real = localPlaying &&
analyser && visMode !== 'sim'` → `getByteFrequencyData`, max-per-bin-group
into `targets[]`, ease `0.34`. Everything else (YT music, CRT video) stays
the simulated sine model — cross-origin audio still can't be tapped.

### Play an embed-blocked track (`/stream`)
Default behaviour now (`retro.blockedMode='stream'`): on YT err 101/150,
`streamTrack(t)` points `<audio>` at `…/stream?v=<id>` (sidecar yt-dlp →
cached m4a → streamed back), flips the track to `isLocal`+`viaStream`, and
plays it locally — real-FFT visualiser included. First one is slow (fetch);
the LCD blinks as "buffering" until `<audio>` fires `playing`. Also on the
right-click menu as **▶ Play anyway (fetch audio)** for manual use. Setting
it to `'skip'` restores the old strike-through behaviour.

### Download button (`⇩` in the transport)
`updateDlBtn()` shows it for any real YT track — incl. one currently being
streamed — but not an imported `local:` file; called from
`highlightPlaying()` + the video-activity handler. Click →
`API.download(id, dlDir || undefined)` → `GET /download` (see §3) → toast
`saved <fmt> → <file>` → `window.retro.revealPath(path)`. **mp3 needs ffmpeg
on PATH**; without it the file is native `.m4a`. `yt-dlp` in
`py/requirements.txt`; the endpoint also self-pip-installs it on first use if
the running interpreter lacks it. **A sidecar started before yt-dlp was
installed must be fully restarted (`npm start`, not Ctrl+R) — `server.py`
runs with `use_reloader=False`.**

### Settings flyout (`⚙` titlebar button, between `◍` and `_`)
`#settings-pop` reuses the `.theme-pop` shell + `#settings-pop .set-*` CSS.
Opening it closes `#theme-pop`; outside-click closes it (same pattern as the
theme picker). Contents:
- **Volume** (`#set-vol`) — live volume *and* the startup default
  (`retro.vol`); drives `P.setVolume` + `LA.volume`.
- **Reset window zoom** → `window.retro.resetZoom()`.
- **Show visualizer** (`retro.visOn`) — when off, `drawVis` clears + idles.
- **Mode** (`retro.visMode`) — `auto` (real FFT for local) / `sim` (always).
- **Download folder** (`#set-dl-dir` label + *Change…* / *Use default*) —
  `window.retro.pickFolder()` → IPC `dialog:folder` → native dir picker;
  path saved to `retro.dlDir` (empty = default), passed to `/download`.
- **Import audio files…** / list (`localImports`) / **Clear imported files**
  (also clears `localTracks` + the pane if it's showing them).
- **Show bongo cat** (`retro.cat`, default on) — toggles `.hidden` on `#cat`.
- **Tuning — bongo cat** (2026-08-28): *Beat sensitivity* slider
  (`tune.beatSens` 0–100, 50 = default; shifts both `catBeat` flux ratios
  1.55 / 1.7 by ±0.9 / ±0.95, clamped) + *Groove fill* checkbox
  (`tune.grooveFill` — the tempo-lock filler taps).
- **Tuning — equalizer** (2026-08-28): *Bar height* (`tune.eqHeight` 35–85 →
  `maxH = H*%`), *Centre focus* (`tune.eqCenter` 0–80 → Tukey taper %, rebuilds
  `vwin`), *Bottom gap* (`tune.eqBottom` 5–40 → `botPad`), *Glow*
  (`tune.eqGlow` 0–200 % → `shadowBlur` multiplier), *Peak caps* checkbox
  (`tune.eqCaps`). **Reset tuning to defaults** button. All persisted as JSON in
  `retro.tune`, applied live (no reload); `bindTune()` wires each control,
  `TUNE_DEFAULTS` is the fallback.

### Bongo cat (`#cat`)
Inline SVG in the `.readout` gap (between the LCD and the `kbps` line).
**Deliberately theme-independent:** its `winamp.css` block uses hard-coded
hex (`#ece7d9` line, `#e389a6` blush), *not* theme tokens, and nothing in
`themes.js` / `game-skins.css` targets `#cat` — so it's identical under every
theme. `z-index:3` keeps it above the game-skin `.display::before` scanlines.
Built as SVG rather than embedding the user's PNG because that art is black
line-work on transparent → invisible on the always-black screen; a swap to a
matted raster is a one-file change if wanted.

**Taps + key flashes are JS-driven** (`app.js`, near the `#cat` toggle):
one `bongoTick()` self-`setTimeout` loop — each tick picks a hand
(**33 % keep `lastHand`, 67 % switch**), presses it (`.down` class → CSS
`translateY(5px)` for 120 ms), then waits `500–3500 ms` (14 % chance of a
`~140–360 ms` quick drum-roll follow-up). On each tap `flashKey(hand)`
lights one random `.keybed-<hand> .key` rect a random `hsl(…)` colour with a
matching `drop-shadow`, cleared after 190 ms (CSS `.key` transition fades
it). `startBongo()` / `stopBongo()` are called from init and the settings
toggle; both no-op under `prefers-reduced-motion`. The `.keybed-l` /
`.keybed-r` groups (3 `.key` rects each) sit under the paws in the SVG.

---

## 5f. 2026-08-28 additions

All in `app.js` unless noted. New localStorage keys: `retro.stats`,
`retro.keepCache`, `retro.cacheCapMB`, `retro.panels.displayH`,
`retro.panels.recs` (the FOR YOU panel toggle). Endpoint + IPC/preload details
are in §3.

### 5f.1 prev · NOW · next marquee

`setNowPlaying(t)` builds the scrolling `#track-title` as three spans:
`◄ <prev> • ◄► <now> • <next> ►` when `t` is the live queue track — prev/next
from `state.queue[qi∓1]`, dimmed via `.mq-side` (`--lcd-dim`, no glow).
Falls back to the single-label form for CRT-video / boot / nothing-playing.
**Shuffle** collapses it to `⤨ <now>` (positional neighbours aren't what plays
next). Scroll `animation-duration` now scales with `scrollWidth` (`/42`, clamped
12–48 s) so three titles don't whip past. CSS: `.mq-now` / `.mq-side` / `.mq-sep`
in `winamp.css`.

### 5f.2 FOR YOU — recommendations + artists

`#pl-sidebar` is now two stacked sections: `#pl-lib-section` (PLAYLISTS) and
`#recs-section` (FOR YOU, header `.head-tools` with `#recs-refresh` `⟳`). A
`for you` button in `#pled-toggles` hides/shows it (`PANEL_NODES.recs`,
persisted `panels.recs`); the whole left column drops only when **both**
PLAYLISTS and FOR YOU are off.

Three sources, each cached ~30 min (`RECS_TTL`), all refreshed by `⟳`
(`loadForYou(true)` → `loadRecs` + `loadArtists`):

- **`loadRecs`** → `GET /home` → `recsCache.sections`. Section names listed as
  `<li>`; click → `renderTracks(sec.tracks, '✨ '+title)` + sets
  `state.originTracks`.
- **`loadArtists`** → `Promise.all(GET /artists, GET /suggested-artists?seeds=)`.
  `favourites` = library/follows **merged with `topStatsArtists(20)`** (most-
  played from `retro.stats`, keyed by `artistId`) — library first, then most-
  played not already listed, capped 16. `suggested` capped 14; the seed list
  passed to `/suggested-artists` is the merged favourites' channel ids, so
  suggestions work even with an empty YTM library.
- **`renderForYou()`** redraws `#recs-names` as each source lands: sections,
  then `FAVOURITE ARTISTS` / `SUGGESTED ARTISTS` sub-headers (`.recs-sub`) +
  `.recs-artist` rows (name + hover `▶`).

Artist rows: click name → `openArtist(channelId, name)` → `getArtist(id)`
(per-id cache) → `GET /artist/<id>` → `renderTracks(d.tracks, '🎤 '+name)`.
`▶` → `playArtist` = shuffle those tracks into the queue + `playAt(0)`.

> `track()` in `server.py` now returns **`artistId`** (primary artist's `UC…`
> channel id). `statStart`/`statRec`/`statFlush` persist it so
> `topStatsArtists` can map most-played back to a real artist page. Old
> `retro.stats` records lack it and backfill on replay.

### 5f.3 Player/editor resizer (`#split-main`)

`.display` (id `#main-display`) is a grid `minmax(0,1fr) auto auto` — the
readout/visualiser row flexes, marquee + sliders keep their height. Its
`height` is `var(--display-h, auto)`. `#split-main` (`.hsplitter`, `row-resize`)
sits between `#main` and `#pled` in the body flex column; `bindMainSplit()`
drags it → sets `--display-h` (clamped 120 … `innerHeight-260`), persisted as
`panels.displayH`, **double-click clears it**, `resize` re-clamps.
`applyPanels()` restores/re-clamps on boot. `.readout` gets
`min-height:0;overflow:hidden` so the fixed-height cat clips itself; `.display`
deliberately has **no** `overflow:hidden` (game skins paint corner rivets at
`::after{inset:-4px}`, outside the box).

### 5f.4 ★ Favourites → real Liked Music

`#tp-fav` (`.tp.toggle`, after `#tp-dl`) + a `trackMenu` entry. `POST /rate`
(`rate_song` `LIKE` / `INDIFFERENT`). `likedIds` Set is a best-effort mirror —
seeded from `data.tracks` when `LM` is opened, updated on every toggle
(ytmusicapi has no cheap single-song like lookup). `rateTrack(t, like)` is the
shared path (also called by dropping a track on the `LM` sidebar row).
`updateFavBtn()` shows `★`/`☆` + gold `.on`, hidden for `local:` ids / CRT
video / not-authed; called wherever `updateDlBtn()` is. Undo is one click →
no confirm dialog, just a toast.

### 5f.5 Full playlist management

- **Create:** `#pl-add` `＋` in the PLAYLISTS header, and right-click the header
  / empty list → `New playlist…` → `askText` → `API.createPlaylist(name, [])`
  (`/playlist/create` allows empty now).
- **Drag a track-pane row onto a `#pl-names` row** → `dropTrackOnPlaylist` →
  `API.addToPlaylist` (or `rateTrack(t,true)` when the target is `LM`).
  Re-opens the playlist if it's the one on screen (to get the new row's
  `setVideoId`). `{ok:false}` from the endpoint = "already in playlist".
- **Right-click a `#pl-names` row** (`playlistMenu`): Open / Play / Rename… /
  Delete (last two hidden for `LM`). `renamePl` patches the row text
  immediately; `deletePl` uses `askConfirm`.
- **Remove a track:** per-row `×` (`.t-rm`) **and** a `trackMenu` entry
  `✕ Remove from "<name>"` — both shown only while an editable playlist is open
  (`state.plView.owned || .isLM`). `removeFromPl` → `API.removeFromPlaylist`
  (`{videoId,setVideoId}`) or `rateTrack(t,false)` for `LM`; optimistic splice.
- **Drag-reorder** within an owned playlist: rows are drop targets for
  same-playlist drags (`dragPayload.fromPlId` / `.setVideoId` set by
  `makeRowDraggable`); `reorderInPl` → `API.movePlaylistItem(id, moved, before)`
  → re-open for the canonical order. Accent bar = `.reorder-hot`.
- **`state.plView`** = `{id, title, owned, isLM}` when a real playlist is shown;
  any `renderTracks` call without a 3rd arg clears it (search, recs, lists), and
  `doSearch` clears it explicitly too.
- **Eventual-consistency bridges:** YouTube's library list lags a fresh
  `create_playlist` by seconds and keeps a deleted one briefly.
  `makePlaylistRow` factored out; `optimisticPls` (Map) shows a just-created
  playlist until the server list catches up; `suppressedPls` (Set) hides a
  just-deleted one until it's gone; `newYtPlaylist`/`renamePl`/`deletePl` also
  fire a `setTimeout(loadPlaylists, 3000)` reconcile.
- **`/playlists` dedupe:** ytmusicapi 1.12 returns its own `LM` row → the route
  filters `LM` from the raw list and pins exactly one synthetic copy at the top
  (fixed the "two Liked Music" bug).

### 5f.6 Listening statistics + standalone window + play-from-stats

**Store** (`retro.stats` in localStorage, written by the main renderer):
```
{ v:2,
  tracks: { <videoId>: { title, artists, artistId, plays, skips, ms, first, last } },
  daily:  { "YYYY-MM-DD": ms },
  plays:  [ { v:<videoId>, t:<epochMs> } ],   // ordered log — powers "a day's plays"
  totalMs }
```
`plays[]` capped at 4200 (trimmed to 4000). A **play** = ≥30 s OR ≥50 %
*listened* (wall-clock between ticks; a gap > 4 s = seek/pause/throttle, not
counted). Abandoned < 30 s = a **skip**.

**Hooks:** `statStart(t)` in `playAt`; `statTick()` from `P.on('tick')` (only
when `s.playing`) and `LA` `timeupdate` (only when `!LA.paused`); `statFlush()`
in the stop button, `next()`'s dead-end, and `beforeunload` (`statSave(true)`
bypasses the 800 ms debounce). No pause hook needed — the `>4 s` gap guard
handles it.

**Standalone stats window** — `electron/main.js openStatsWindow()` → a plain
resizable `BrowserWindow` loading `/stats.html` (Flask serves it; no route
needed). IPC `stats:open`. `renderer/stats.html` + `js/stats.js` +
`css/stats.css`. It reads `localStorage['retro.stats']` **directly** (same
origin as the main window, like the video window does for themes) and
**re-renders on the `storage` event**, so no data IPC. Renders: stat tiles
(listening time / this week / plays / unique / skips / day streak), a
plays-per-day `<canvas>` bar chart (theme-gradient, click a bar to play that
day), TOP TRACKS, TOP ARTISTS (aggregated across `"A, B"` strings), MOST
SKIPPED (no play button). Opened from `⚙` settings → *Open statistics window*
(`#set-stats`).

**Play-from-stats:** each `▶` → `window.retro.playFromStats({tracks, shuffle,
label})` → IPC `stats:play` → `main.js` brings the player window forward + sends
`stats-play` → `onStatsPlay` in `app.js` builds a queue (Fisher-Yates shuffle
if asked), clears radio, `renderTracks(q, '📊 '+label)`, `playAt(0)`.
Top tracks / an artist → shuffled; a day's bar → in order.

### 5f.7 Bongo cat taps to the FFT  (rewritten 2026-08-28 — "drummer" v2)

`catTap(hand?, power?)` — one paw press + `flashKey`. `power` 0..1 deepens the
press via an inline `--paw-y` CSS var (hard hits punch harder; a sub-pixel
jitter makes rapid same-hand hits re-animate). Hold shortened 120→90 ms, CSS
transition 0.09→0.07 s.

**`catBeat(freqBuf, bins)` — two-band spectral-flux onset detector** (replaces
the v1 single-band energy-vs-average model). Called every frame from `drawVis()`
while the local analyser is live. Analyser bumped to **`fftSize 256`**
(128 bins) / **`smoothingTimeConstant 0.72`** so transients survive for onset
detection.

- **Positive spectral flux** per bin (`v − prevFrame[v]`, clamped ≥0), summed
  into two bands: **kick** (`bins 0 … bins*0.03`, sub+low bass → **left paw**)
  and **snare/clap** (`bins*0.05 … bins*0.35`, ~1–7.5 kHz → **right paw**). Kick
  left / snare right is what reads as "drumming".
- Each band has its own **adaptive baseline** (`catKAvg`/`catSAvg`, fast attack
  `0.45` / slow release `0.05`). A hit = `flux > floor` **and**
  `flux > baseline*ratio` **and** past its min-gap.
  **Knobs:** ratio `1.55` (kick) / `1.7` (snare) — lower = more taps; floor
  `0.009` / `0.011`; min-gap `85` / `95` ms. A hard hit
  (`flux > baseline*2.6/2.8`) → deep press + 55 % chance of a ~42 ms flam on
  the other paw.
- **Tempo lock / groove fill:** `catOnset()` smooths the inter-onset interval
  into `catIoi`; if no hit lands for `catIoi*0.7` and the tempo is sane
  (`190–850 ms` ≈ 70–315 BPM), `catBeat` drops a soft filler tap on the
  predicted beat so the cat keeps time through quiet bars.

`catSetBeatMode(real)` just flips a flag. **The idle random loop always runs
when the cat is on** and backs off in beat mode — now recovers faster
(safety-net tap if no beat in **0.9 s**, retry gap **650–1350 ms**). This was a
v1 bug: the first cut stopped the idle loop and the strict thresholds produced
zero taps → frozen cat. `catRefresh()` (init + settings toggle) is the only
thing that (re)starts the loop. Still not verified against real music in-app
(the agent sandbox won't run an AudioContext without a trusted gesture) — needs
`npm start` + a listen, easiest via §5g stream-everything mode.

### 5f.8 Stream-cache: keep between sessions + LRU cap

`~/.retro-ytm-cache` (embed-blocked audio) can now persist. Shared policy file
**`~/.retro-ytm-cache.json`** = `{ keep: bool, capMB: number }`, read by both
`main.js` (`os.homedir()`) and `server.py` (`os.path.expanduser("~")`).

- `⚙` → **Stream cache**: `#set-cache-keep` (`retro.keepCache`, default off),
  `#set-cache-cap` (`retro.cacheCapMB` — 250 / 500 / 1000 / 2000),
  `#set-cache-size` (live `N MB · M files`), `#set-cache-clear`. `app.js`
  `pushCachePolicy()` writes the policy to `main.js` via `cache:policy` on boot
  and on every change.
- **`main.js`**: `manageCacheStartup()` replaces the unconditional startup wipe
  — `keep` → `trimCache(capMB)` (evict oldest `mtime` first until under cap),
  else `clearAudioCache()`. `shutdown()` wipes only when `!keep`. IPC
  `cache:policy` (write file + re-enforce), `cache:clear` (wipe now → `{freedMB}`),
  `cache:size` (`{mb, files}`).
- **`server.py` `/stream`**: on a **cache hit** `os.utime(path, None)` bumps the
  file's mtime so "recently played" == "recently kept" (true LRU); after every
  fetch `_trim_audio_cache()` enforces the cap mid-session (reads `capMB` from
  the policy file, default 500).
- A hard crash that skips the shutdown wipe is caught on next startup:
  `keep` → trim-to-cap, `!keep` → wipe. Plus the manual *Clear now* button.
- **Verified:** LRU eviction with a temp-dir test (cap 3 MB, 5×1 MB staggered
  mtimes → 2 oldest evicted). The Electron IPC path isn't exercisable outside
  `npm start`.

### 5g "Stream everything" mode (backlog #6)

Opt-in `⚙` → **Stream everything** checkbox (`#set-stream-all`,
`retro.streamAll`, **default off**). When on, **every** real YT track plays
through yt-dlp + the local `<audio>` instead of the hidden YT embed — so the
same-origin `AnalyserNode` sees it and the **real-FFT visualiser + beat-reactive
bongo cat run on every track**, not just embed-blocked (101/150) ones. All in
`app.js`.

- **`playAt(i)`** — the non-local branch now: `t.isLocal` → `playLocal`;
  else `streamAll && !t._streamed` → `streamTrack(t, true)`; else the normal
  `P.load(t.videoId)` embed path. `streamTrack` already flips the track to
  `isLocal`+`viaStream`+`_streamed` and calls `playLocal`, so all the existing
  `localActive` routing (transport, seek, volume, LCD, marquee, stats,
  auto-advance on `<audio>` `ended`) is reused unchanged.
- **`streamTrack(t, quiet)`** — `quiet` (set from `playAt`) swaps the
  "fetching audio (embed blocked)…" toast for a one-off "streaming audio…"
  shown **only when the track wasn't pre-warmed** (`warmed` set), so there's no
  per-track toast spam.
- **`prefetchNextIfBlocked()`** — guard is now `blockedMode==='stream' ||
  streamAll`; while `streamAll` it **always** warms `state.queue[qi+1]` via
  `API.warmStream` (the "always-warm-ahead" pairing), so after the first fetch
  every switch is instant.
- **`prev()`** — gained a `localActive` branch (`LA.currentTime > 3` → restart)
  since in this mode *every* track is `localActive` and `P.snapshot().cur`
  would be stale.
- **Toggle handler** — on enable: warms ahead + **restarts the current track**
  through the stream (`playAt(state.qi)` if it's a live YT-embed track) so the
  visualiser kicks in without waiting for the next track. On disable: new plays
  use the embed again; anything already `_streamed` in the queue keeps
  streaming until re-queued.
- **Not default, on purpose** — loses Premium audio quality and puts yt-dlp in
  the critical path (first play of each fresh track waits on the fetch). Same
  cookie-free stream-rip caveat as `/stream` / `/download` (§6).
- **Cache:** streamed audio lands in `~/.retro-ytm-cache` like embed-blocked
  tracks — so the *Stream cache → Keep between sessions* setting (§5f.8) now
  matters a lot more with this on (a kept, warm cache = instant playback across
  sessions).
- **Not yet verified in-app.** Needs `npm start` + a real listen. This is also
  the first real-music test of the bongo-cat "drummer v2" (§5f.7) — if it
  feels sparse/twitchy, the knobs are the `1.55` / `1.7` ratios in `catBeat()`.

---

## 5h ARTIST MIX — an artist pool that feeds the queue

A section in `#queue-panel` (below QUEUE, above SESSION LISTS) holding a pool of
artists; when armed it shuffles **random songs from random artists in the pool**
into the queue as it runs low — a broader alternative to radio. All in `app.js`
+ one new endpoint. Needs a full `npm start` (server route).

- **Markup** (`index.html`): `#aq-section` = `.qp-head` ("ARTIST MIX" +
  `#aq-toggle` "mix" button) · `.aq-add` (`#aq-input` + `#aq-add-btn` `＋`) ·
  `#aq-list` (chip rows, per-row `×`) · `#aq-foot`. New `#pled-toggles` button
  `data-panel="artists"` → `PANEL_NODES.artists` = `#aq-section`; the queue
  column now drops only when queue **and** artists **and** lists are all off.
- **State:** `state.artistMix = [{id,name}]` (→ `localStorage['retro.artistMix']`),
  `state.artistMixOn` (→ `retro.artistMixOn`). `aqSeen` Set dedupes within a
  session. `saveArtistMix()` persists both.
- **Add an artist:** type a name → `#aq-add-btn` / Enter → `aqSearchAdd()` →
  `GET /search-artists?q=` → adds the top match. **Or drag** a `FAVOURITE /
  SUGGESTED ARTISTS` row from FOR YOU — those `.recs-artist` rows are now
  `draggable` (`dragPayload = {kind:'artist', id, name}`); `#aq-section` is the
  drop target (`.drop-hot`). `addArtistToMix()` dedupes by channel id.
- **Arm it:** the **mix** button (`#aq-toggle`, lit like a transport toggle).
  `extendArtistMix(kick)` — pick a random pooled artist → `getArtist(id)`
  (client cache) → a random track not in the queue and not in `aqSeen`; repeat
  to ~6 ahead (`kick` = fill 8 now, used on arm + on a queue dead-end). Hooked
  from `playAt` (`maybeExtendArtistMix()`), and `next()`'s dead-end checks it
  **before** radio.
- **Mutually exclusive with radio** — arming either one disarms the other (they
  both own the queue tail). `state.artistMixOn` is **not** cleared just because
  radio was the last thing toggled unless you toggle radio on.
- `renderArtistMix()` on boot + every change.

---

## 6. Known limitations / gotchas

- **Visualiser is real** for imported local files **and streamed
  (embed-blocked / stream-everything) tracks** — both go through the local
  `<audio>`, which is same-origin, so `AnalyserNode` sees them. Real-FFT branch
  (`drawVis`): **log-spaced** bin→bar mapping + **per-bar auto-level**
  (`vgain[]`, fast attack `0.38` / slow release `0.045`,
  `norm = raw/(vgain*1.32+.04)`) + a **1-2-1 neighbour blur** on `targets[]` so
  the spectrum reads as an even landscape rather than isolated spikes. Small
  treble lift + `vamp[]` + an idle sine "hiccup" floor keep it lively edge to
  edge. YT music + the CRT video stay **simulated** — their audio is
  cross-origin and can't be tapped without the yt-dlp route (rejected for
  default playback: ToS + loses Premium; opt-in via §5g). Simulated motion
  model (`app.js` `drawVis`, reworked 2026-08-27): each bar is a **sum of slow
  sines** (`vphase`/`vfreq` per bar, rebuilt on resize) + a wave that rolls
  across the bars + occasional tiny phase nudges — slow, organic breathing
  (~5–6 s swings) rather than per-frame `Math.random`. `vt += 0.018`/frame;
  ease `0.36` real-FFT · `0.14` sim-active · `0.06` decay. Low-end tilt is
  nearly flat (`0.82 + bass*0.18`) + a per-bar random height `vamp[]`
  (`0.7–1.0`) so the shape is a random bump, not a slope.
- **Visualiser render — "neon EQ" (2026-08-28):** shared by both paths. Canvas
  backing store is **DPR-scaled** (`resizeVis` → `VW`/`VH`/`VDPR` capped 2×;
  `drawVis` does `setTransform(VDPR…)` and works in CSS px), `#vis` dropped
  `image-rendering:pixelated`. `~w/7` bars with a real inter-bar `gap`, rounded
  tops via `roundRect` (guarded), 3-stop gradient
  `--vis-bottom → --vis-top → visHot` (`--vis-top` mixed 55 % to white),
  per-bar `shadowBlur` glow, **peak-hold caps** (`peaks[]`, sink `0.012`/frame),
  faint glowing baseline line. **Compact/centred:** baseline raised
  `H*0.26` off the bottom, bars capped at `H*0.55` tall → band sits mid-canvas
  with headroom above and below; frequency tilts flattened so there's no
  diagonal slope. Colours via `parseRGB()` → `visHot`/`visTopRGB`, recomputed in
  `readVisColors()`. Perf: per-bar gradient + shadow each frame on a tiny
  canvas — fine in Electron; cache the gradients if it ever chugs.
- **`/download` is a stream-rip** — steps outside the project's "nothing is
  downloaded" principle, on the user's explicit request. Kept cookie-free so
  the Google account isn't exposed (worst case: an IP throttle). `yt-dlp`
  breaks often → `python -m pip install -U yt-dlp`. No `ffmpeg` on this box,
  so downloads are `.m4a` not `.mp3` until one is installed.
- **LCD blink** (paused / video-active) is `@keyframes blink` in
  `winamp.css` — `1.5s steps(1)` (slowed from `1s`).
- `py/browser.json` is browser-session cookie auth; expires every few weeks →
  re-hit ◍. It contains cookies → git-ignored.
- `ytmusicapi` is unofficial; a YouTube change can break it → `uv pip install -U
  ytmusicapi` (or `pip`).
- **Embedding disabled (YT err 101/150)** — the IFrame embed refuses the
  video *regardless of whether ytmusicapi returned it as a "song" or a
  "video"*; it's per-video and endemic to label uploads (Nuclear Blast /
  Napalm / …). Switching search mode does **not** help. Handling
  (`P.on('error')`):
  - `retro.blockedMode` (settings, default **`'stream'`**): fetch the audio
    via `/stream` and play it through the local `<audio>` (`streamTrack()` —
    sets `isLocal`+`viaStream`, LCD blinks while buffering, real-FFT vis).
    `_streamed` guards against a retry loop if the fetch also fails.
  - `'skip'`: mark `isAvailable=false`, struck through, advance.
  - Right-click any YT row → **▶ Play anyway (fetch audio)** forces the
    stream path on demand.
  - **Next-track pre-fetch:** `prefetchNextIfBlocked()` (called from `playAt`
    + `streamTrack`) fires `API.warmStream(nextId)` when there's evidence the
    next track is also blocked (current is `viaStream`, or next already has
    `_streamed`) — power-metal albums are all-or-nothing, so the switch is
    instant. `warmed` Set dedupes.
  - **Cache lifecycle (updated 2026-08-28, §5f.8):** `main.js`
    `manageCacheStartup()` on `app.whenReady()` and `shutdown()` on
    `before-quit`/`window-all-closed`/`process 'exit'` now branch on the
    `~/.retro-ytm-cache.json` policy — `keep:true` → `trimCache(capMB)` (LRU,
    oldest `mtime` first), else the old full `clearAudioCache()` wipe. A crash
    that skips shutdown is still caught on next startup. Only this cache —
    imported local files and `⇩` downloads are the user's, never touched.
  - `nextIndex()` skips `isDead()` rows (bounded) so a skipped track can't be
    re-selected by repeat-one / radio / advance (was the "keep getting the
    error" loop). Consecutive skips coalesce into one `⚠ N tracks skipped`
    toast (`skipRun`, 2.6 s window).
- Electron GUI may not surface a window in a headless/agent shell; the user runs
  `npm start` in a real terminal.
- `npm install` warns about Electron's `postinstall` under this npm's
  allow-scripts; the binary still landed and `npm start` works.
- **Two Python 3.14 installs on the dev box**: `python` → `C:\Python314`
  (has Flask/ytmusicapi), `py -3` → a `pythoncore-3.14-64` under
  `%LOCALAPPDATA%\Python`. `main.js startPython()` now probes each with
  `-c "import flask, ytmusicapi"` and uses the first that passes (tries
  `python` first), so this is handled — but `npm run setup` installs via
  `python -m pip`, so keep those in sync.

---

## 7. Environment

- Developed on Windows 10. **Now a git repo** (see §9 / README).
- Python **3.14.6** (`python` on PATH). Node **24**, npm 11.
- Flask + flask-cors + **ytmusicapi 1.12.2** + **yt-dlp** (2026.8.19) in user
  site-packages via `pip install -r py/requirements.txt`. **No `ffmpeg`** on
  PATH → `/download` yields `.m4a`, not `.mp3`.
- `graphify` / `graphify-mcp` installed via `uv tool` — the shim is on PATH
  (typically `%USERPROFILE%\.local\bin`); the interpreter that actually has the
  package is `%APPDATA%\uv\tools\graphifyy\Scripts\python.exe`.
- Source: **~8,170 lines** (JS+PY ~5,470 / CSS+HTML ~2,700). `app.js` alone is
  2,793 — GRAPH_REPORT keeps suggesting a module split (cohesion 0.08).

---

## 8. Code knowledge graph (graphify)

`graphify` (PyPI pkg `graphifyy`) is installed **project-scoped** here. Its
v0.9.50 source was reviewed and is clean; nothing global was modified.

- Files it added: `.claude/skills/graphify/`, `.claude/CLAUDE.md`, `CLAUDE.md`,
  `.claude/settings.json` (two PreToolUse hooks: `Bash|Grep` → `hook-guard
  search`, `Read|Glob` → `hook-guard read`, soft-nudge, **no-op unless
  `graphify-out/graph.json` exists**). These hooks only load for a Claude Code
  session whose project dir *is* `winamp/`.
- Graph: **`graphify-out/graph.json`** — **~374 nodes, ~667 edges** over the
  JS/Python files, kept current all session with `graphify update .` after
  every edit (free, AST-only). `graph.html` (interactive) + `GRAPH_REPORT.md`
  regenerate alongside — `graphify export html`.
- **Known noise:** the graph was first built when `.claude/skills/graphify/*.md`
  + `.claude/CLAUDE.md` were in the corpus, so a few communities are graphify's
  own skill docs (`What You Must Do When Invoked`, `graphify reference: …`).
  Incremental `update` carries them. A clean rebuild:
  `graphify extract . --code-only --force`.
- Communities cluster by file/feature but are **unnamed** (AST-only skips LLM
  labelling). Arrow-fn `const`s are weakly tracked. `GRAPH_REPORT.md` has
  god-nodes + community node lists. **Navigation index, not a context
  substitute** — pair with this file for the "why".

Query it (from the repo root):
```
graphify query "how does the radio queue extend"
graphify explain "playAt"
graphify path "connectGoogle" "auth_cookie"
graphify god-nodes
graphify update .          # refresh after code changes (AST only, free)
```
Richer semantic graph: set `ANTHROPIC_API_KEY` and run `graphify extract .`
(drop `--code-only`), or `/graphify .` inside Claude Code launched in `winamp/`.

Revert graphify entirely: `graphify uninstall --project` (`--purge` also drops
`graphify-out/`).

---

## 9. Packaging → portable Windows .exe  (2026-08-28)

**Output:** `release/RetroYTM-BongoCat-1.0.0-portable.exe` (~91 MB, x64, single
self-extracting exe — no Python/Node on the target). Full QA instructions:
**`QA.md`**.

### Pieces
- **`retro-sidecar.spec`** — PyInstaller **onedir** freeze of `py/server.py` →
  `dist/server/server.exe` + `dist/server/_internal/`. `collect_all` for
  `ytmusicapi` + `yt_dlp` (locale json / lazy extractor modules);
  `--add-data renderer;renderer` so Flask serves the UI for all three windows
  from `sys._MEIPASS/renderer`. `console=False` (Electron pipes its stdout).
- **`package.json → "build"`** — electron-builder. `files` = `electron/**` +
  `renderer/**` (disk fallback) + `package.json` → `app.asar`.
  `extraResources` copies `dist/server/` → `resources/sidecar/`. `win.target` =
  `portable`, `artifactName RetroYTM-BongoCat-${version}-portable.exe`.
  Scripts: `npm run dist:sidecar` (`python -m PyInstaller …` — module form, not
  the bare `pyinstaller` shim which isn't on PATH here), `npm run dist`
  (sidecar → electron-builder), `npm run pack` (unpacked).
- **`electron/main.js`** — `startPython()`: if `app.isPackaged`, `spawnFrozenServer()`
  runs `process.resourcesPath/sidecar/server.exe` (falls back to the system-Python
  probe if it's missing). All spawns now pass **`RETRO_AUTH_FILE`** =
  `app.getPath('userData')/browser.json` (const `AUTH_FILE`).
- **`py/server.py`** — `FROZEN = getattr(sys,'frozen',False)`; `RENDERER` from
  `sys._MEIPASS` when frozen; `AUTH_FILE = os.environ["RETRO_AUTH_FILE"] or
  py/browser.json`; `_ensure_ytdlp()` returns an error instead of pip-installing
  when `FROZEN`.

### Verified
Frozen `server.exe` run standalone: `/health` 200, `/` + `/css` + `/js` served,
`/search-artists` routed, **yt-dlp works** (reached YouTube, extracted). Package
layout checked (`server.exe` + `_internal/renderer/` in `resources/sidecar/`;
`electron/` + `renderer/` in `app.asar`). **Not yet done:** a human
double-clicking the portable exe and going through Google sign-in.

### Not covered / next
- **Unsigned** — SmartScreen "unknown publisher". Needs a code-signing cert.
- ~~**No app icon**~~ — **done 2026-08-28.** `build/make-icon.py` (Pillow, no
  SVG rasteriser) programmatically redraws the in-app bongo-cat mascot on the
  black-screen / green-LCD surface → `build/icon.ico` (16…256) + `build/icon.png`
  + `renderer/icon.png` (runtime copy). `package.json → build.win.icon` =
  `build/icon.ico` (portable .exe icon); `electron/main.js` `APP_ICON` =
  `renderer/icon.png`, passed as `icon:` to all three `BrowserWindow`s (dev +
  packaged taskbar/window icon). `.gitignore` switched `build/` → `build/*` with
  negations so the icon source/output commit but PyInstaller's `build/retro-sidecar/`
  work dir stays ignored. Re-run `python build/make-icon.py` to regenerate.
- **No ffmpeg** — `/download` + streamed tracks stay `.m4a`. Optionally ship a
  static ffmpeg and point yt-dlp's `ffmpeg_location` at it.
- Port 8765 is hard-coded-ish (`RETRO_YTM_PORT` env, default 8765); no
  auto-pick-free-port.
- Build dirs (`build/`, `dist/`, `release/`) are git-ignored — regenerated by
  `npm run dist`.
