# Retro YTM Bongo Cat — QA build

**Artifact:** `release/RetroYTM-BongoCat-1.0.0-portable.exe` (~91 MB, Windows x64)

Single self-contained portable exe. No install, no Python, no Node needed on the
QA machine. Everything (Electron shell + PyInstaller-frozen Python sidecar +
yt-dlp) is inside.

## Run it

1. Double-click `RetroYTM-BongoCat-1.0.0-portable.exe`.
   - Windows SmartScreen will warn ("unknown publisher") — the build is
     **unsigned**. Click *More info → Run anyway*.
   - First launch self-extracts to `%LOCALAPPDATA%\RetroYTM-BongoCat\` (a few
     seconds); later launches are instant.
2. The Winamp-skinned window opens. It's blank/"connecting" for ~1–3 s while the
   sidecar boots.
3. **Sign in:** click the **◍** title-bar button → a Google login window opens →
   sign in. That also switches on your YouTube Music **Premium**. The cookie is
   saved to `%APPDATA%\retro-ytm\browser.json` (per-user, survives restarts).

Needs an internet connection and a YouTube Music account (Premium recommended —
free works but with ads / no background play).

## What to test

Core:
- Search (music / video / all), double-click to play, queue add/reorder/remove.
- Transport: play/pause/stop, next/prev, seek, volume. **Keybinds:** `Space`,
  `Ctrl+→`/`Ctrl+←` (next/prev), `←`/`→` seek, `↑`/`↓` volume — full list under
  the **keybinds** button on the bottom bar.
- Radio (`≈`) — should pull a *varied* mix, not just the seed artist.
- Themes (**◈**), including the 6 game skins. **Visual QA the game skins** — they
  were never eyeballed in a running build before.
- CRT video window (**▣**), docking / detach.

This session's new stuff:
- **Bongo cat** taps to the beat while a streamed/downloaded/local track plays
  (real FFT). Embedded YouTube playback can't be analysed, so on those the cat
  just idles.
- **Visualizer** — compact centred "neon EQ", peak caps, glow.
- **⚙ → Tuning** — sliders for beat sensitivity / groove fill and EQ
  height/centre/gap/glow/caps. Live, persisted. *Reset tuning to defaults*.
- **⚙ → Stream everything** — routes every track through yt-dlp + local `<audio>`
  so the real visualizer + beat cat work on all tracks (costs Premium audio
  quality; first play of each track waits on a fetch).
- **ARTIST MIX** panel (queue column, toggle it via `artist mix` on the bottom
  bar) — add artists by search or by dragging FAVOURITE/SUGGESTED ARTIST rows
  from FOR YOU, hit **mix**, and it shuffles random songs from those artists into
  the queue. Mutually exclusive with radio.
- **★ Favourites**, full playlist management (create / drag-add / rename / delete
  / reorder), **FOR YOU** shelves + artists, listening **statistics** window
  (⚙ → *Open statistics window*), **⇩ download** current track (saves `.m4a` —
  no ffmpeg bundled, so no `.mp3`), local-file drag-drop import.
- **Stream cache** (⚙) — *keep between sessions* + size cap + *clear now*.

## Known limitations in this build

- **Unsigned** → SmartScreen warning (expected).
- **Default Electron icon** — no custom app icon yet.
- **No ffmpeg** bundled → `⇩` downloads and streamed tracks are `.m4a`, never
  `.mp3`.
- Sidecar binds **127.0.0.1:8765**. If something else already holds that port
  the app won't connect (rare on a QA box).
- yt-dlp is frozen at build time; if YouTube changes and streaming/downloads
  break, the fix is a new build (can't self-update inside the exe).
- The Python sidecar runs windowless; its logs go to the Electron process
  stdout — run the exe from a terminal to see `[py] …` lines when debugging.

## Rebuilding (dev machine — needs Python 3.14 + Node)

```
npm install
npm run setup                             # runtime pip deps for the sidecar
pip install -r py/requirements-dev.txt    # build-only: pyinstaller
npm run dist                              # pyinstaller (retro-sidecar.spec) → electron-builder → release/
```

- `npm run dist:sidecar` — just re-freeze the Python side (`dist/server/`).
- `npm run pack` — unpacked build in `release/win-unpacked/` (faster, for
  poking at the layout).

Build layout:
- `retro-sidecar.spec` — PyInstaller: `py/server.py` + bundled `renderer/`,
  `ytmusicapi`, `yt_dlp` → `dist/server/server.exe` (onedir).
- `package.json → build` — electron-builder: `dist/server/` copied to
  `resources/sidecar/`; `electron/` + `renderer/` packed in `app.asar`;
  `portable` target.
- `electron/main.js` — when `app.isPackaged`, spawns
  `resources/sidecar/server.exe` and passes `RETRO_AUTH_FILE` =
  `%APPDATA%\retro-ytm\browser.json`. Falls back to a system Python if the
  frozen exe is missing.
- `py/server.py` — `FROZEN` branch resolves `renderer/` from `sys._MEIPASS`;
  reads `RETRO_AUTH_FILE`; skips the yt-dlp pip self-install when frozen.
