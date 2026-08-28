# Retro YTM Bongo Cat

A local, **Winamp-skinned desktop player for YouTube Music Premium** — Electron
shell + a Python sidecar (`ytmusicapi`) for library/search + a hidden YouTube
**IFrame player** for audio. Because playback goes through a real embedded
YouTube player in your signed-in session, your **Premium** (no ads, background
play) applies. Default playback downloads nothing.

There is also a bongo cat that drums along to the music.

```
electron/   main process + preload — spawns the sidecar, frameless window, IPC
py/         Flask sidecar wrapping ytmusicapi  →  http://127.0.0.1:8765
renderer/   the skin — index.html, css/, js/ (no build step, plain <script> tags)
```

Full architecture / design notes: [`HANDOFF.md`](HANDOFF.md).
Packaging + QA build notes: [`QA.md`](QA.md).

---

## Features

**Player** — library, search (music / video / unified), queue with drag-reorder,
radio autoplay (`≈`), full transport + keyboard control, whole-window zoom.

**Playback routing** — audio through the hidden YouTube IFrame player (Premium).
Embed-blocked tracks (YT error 101/150) fall back to a cookie-free `yt-dlp`
stream through a local `<audio>`. Optional **"Stream everything"** mode
(⚙ settings) routes *every* track that way.

**Visualizer** — real FFT (`AnalyserNode`) for any track playing through the
local `<audio>` (imported files, streamed / embed-blocked tracks, or all tracks
in Stream-everything mode); a simulated model for embedded YouTube playback
(cross-origin audio can't be tapped). Compact centred "neon EQ" look with glow,
peak-hold caps and a centre-weighting envelope. Tunable in ⚙ → Tuning.

**Bongo cat** — an inline-SVG mascot in the readout. When the real FFT is live it
runs a two-band (kick / snare) spectral-flux onset detector with a tempo lock and
drums to the beat; otherwise it taps idly. Sensitivity + groove-fill are
⚙ → Tuning knobs.

**Themes** — every colour is a CSS token on `<html>`. 6 presets
(Classic Green, Amber CRT, Ice Blue, Vaporwave, Mono, Red Alert), 6 game HUD
skins (StarCraft II, Machinae Supremacy, Cyberpunk 2077, Path of Exile, Valorant,
Dota 2), and an 8-slot Custom theme. Applied before first paint (no flash).

**Library management** — ★ favourites (writes real Liked Music), full playlist
management (create / drag-add / rename / delete / remove / reorder, creates real
private YT Music playlists), **FOR YOU** shelves + favourite / suggested artists.

**ARTIST MIX** — a pool of artists (add by search, or drag rows from FOR YOU);
armed, it shuffles random songs from those artists into the queue as it runs low.

**Listening statistics** — a standalone window: listening time, plays/day chart,
top tracks / artists, most skipped, day streak. Play back from any of it.

**CRT video window** — a second retro-television window for watching general
YouTube videos, right-edge docking with detach, transport routing to whichever
source is active.

**Extras** — `⇩` download the current track's audio (cookie-free `yt-dlp`,
`.m4a`), drag-and-drop local audio import, per-session stream cache with an
optional keep-between-sessions + LRU size cap, in-app keybinds cheat-sheet.

---

## Run from source

Requires **Node 18+** and **Python 3.9+** on PATH (developed on Node 24 /
Python 3.14).

```bash
npm install          # Electron
npm run setup        # pip install -r py/requirements.txt
npm start
```

Electron starts the Python sidecar itself and loads the UI from
`http://127.0.0.1:8765/`.

**Dev iteration:** renderer / preload changes need only a window reload
(**F5** / **Ctrl+R**); `electron/main.js` and `py/server.py` need a full
`npm start` restart.

### First-run: connect YouTube Music

Click the **◍** button in the title bar. A real Google login window opens; finish
signing in and it closes itself. The app reads the resulting session cookie out
of Electron and writes it to an auth file (**git-ignored** — it holds your
cookies). That same session backs the embedded player, so **Premium is on at the
same time**.

- Switch accounts / re-auth later: **◍** again.
- Searches failing after a few weeks, or seeing ads? The cookie expired — hit ◍.
- Manual fallback: expand **Advanced** in the panel and paste raw request
  headers.

The auth file lives at `py/browser.json` when run from source, or
`%APPDATA%\retro-ytm\browser.json` in the packaged build.

---

## Build a portable Windows .exe

```bash
npm run dist
```

Runs PyInstaller (`retro-sidecar.spec`) to freeze the Python sidecar to
`dist/server/server.exe`, then electron-builder to produce
`release/RetroYTM-BongoCat-<version>-portable.exe` — a single self-contained exe
that needs no Python or Node on the target machine.

- `npm run dist:sidecar` — just re-freeze the Python side.
- `npm run pack` — unpacked build in `release/win-unpacked/` for inspection.

Details and the QA checklist: [`QA.md`](QA.md).

---

## Keyboard

| | |
|---|---|
| `Space` | play / pause |
| `Ctrl + →` / `Ctrl + ←` | next / previous track |
| `→` / `←` | seek ± 5 s |
| `↑` / `↓` | volume ± 5 |
| click the time | toggle elapsed / remaining |
| `Ctrl` + wheel · `Ctrl` `+`/`-`/`0` | zoom the whole window |

Playback keys are ignored while a text field is focused, and drive the CRT video
window when it's the active source. Full list: the **keybinds** button on the
bottom bar.

---

## Known limitations

- **Unofficial API surface** — `ytmusicapi` and the InnerTube video search are
  unofficial; a YouTube change can break them (`pip install -U ytmusicapi`).
- **`yt-dlp` paths** (`⇩` download, `/stream`, Stream-everything) step outside
  "nothing is downloaded". Kept cookie-free so the Google account isn't exposed.
  `yt-dlp` breaks often → `pip install -U yt-dlp` (or a fresh packaged build).
- **No ffmpeg bundled** — downloads and streamed tracks are `.m4a`, never
  `.mp3`.
- **Embedding disabled (YT 101/150)** is per-video and common for label uploads;
  handled by the stream fallback or by skipping.
- The packaged exe is **unsigned** (SmartScreen warning) and uses the default
  Electron icon.
- `browser.json` is browser-session cookie auth and needs occasional refresh.

---

## License

No license yet — treat as "all rights reserved" until one is added.
