# Next chat — QA & bug-fixing

Paste this file's path into a fresh chat. It's the short "start here" for the
**QA / fix phase**. Deep context lives in [`HANDOFF.md`](HANDOFF.md); the QA
checklist is [`QA.md`](QA.md); a dependency audit (npm/pip vulns, outdated,
unused) with a suggested work order is in [`DEPS-AUDIT.md`](DEPS-AUDIT.md).

Work from the repo root (a **git repo** — see "Repo" below).

---

## Where things stand (2026-08-28)

Feature-complete and **packaged**. `release/RetroYTM-BongoCat-1.0.0-portable.exe`
builds and the frozen sidecar is smoke-tested (health / UI / all routes / yt-dlp).
Public repo: <https://github.com/gyp430/retro-ytm-bongo-cat> (source only — the
`.exe` is not on GitHub).

**Your job:** work through the verification debt below, fix whatever QA turns up,
keep the docs + graph current.

---

## Run it

```
cd <repo root>
npm start                     # dev — Electron + system-Python sidecar on :8765
```

- Renderer / preload edits → just **F5** (window reload).
- `electron/main.js` or `py/server.py` edits → full `npm start` restart
  (sidecar runs `use_reloader=False`).
- Auth is done (`py/browser.json` exists, `/health` → `authed:true`).
- Packaged build: `npm run dist` (PyInstaller → electron-builder → `release/`).
  `npm run dist:sidecar` re-freezes just the Python side; `npm run pack` = an
  unpacked build in `release/win-unpacked/`.

Note: a shell tool's working dir can drift to a parent — use absolute paths or
re-`cd` into the repo root.

---

## graphify — use it BEFORE grepping

There's a knowledge graph at `graphify-out/graph.json`. Project `CLAUDE.md`
enforces this and PreToolUse hooks nudge on `grep`/`Read`. Commands (`graphify`
is a `uv tool` — put its shim dir, typically `%USERPROFILE%\.local\bin`, on
PATH; the interpreter with the package is
`%APPDATA%\uv\tools\graphifyy\Scripts\python.exe`):

```
graphify query "how does <thing> work"
graphify explain "<functionName>"
graphify path "<A>" "<B>"
graphify god-nodes
graphify update .          # AFTER every code edit — AST-only, free
```

`graphify-out/GRAPH_REPORT.md` = god-nodes + community lists (regenerable, and
git-ignored). Run `graphify update .` after each edit so the next query is right.

---

## Verification debt (untested in a running Electron app)

| Area | What to check | Entry points (graphify `explain`) |
|---|---|---|
| **Packaged .exe** | double-click it, go through ◍ Google sign-in end to end, confirm the sidecar starts from `resources/sidecar/server.exe` | `spawnFrozenServer`, `startPython` (main.js) |
| **Radio rework** | user reported "queue fills with one artist". Fix: skip the origin-drain unless the origin has ≥4 distinct artists, then a 2-seed station capped at 2/artist. Verify it actually diversifies now. | `extendRadioNow`, `diversifyTracks`, `distinctArtists` |
| **ARTIST MIX** | add artists (search + drag from FOR YOU), arm "mix", confirm it shuffles varied tracks in; mutual-exclusion with radio | `extendArtistMix`, `addArtistToMix`, `renderArtistMix`, `GET /search-artists` |
| **Stream-everything** | ⚙ toggle → every track routes through `/stream`; real visualiser + beat cat on all of them; next-track pre-warm | `streamTrack`, `prefetchNextIfBlocked`, `playAt` |
| **Visualiser look** | "neon EQ" — compact, centred, no diagonal slope; peak caps; glow. User iterated via screenshots; confirm final. | `drawVis`, `resizeVis`, `buildCentreWindow`, `readVisColors` |
| **Bongo cat** | user said **"PERFECT"** for the drummer — just re-confirm it tracks the beat on a few genres | `catBeat`, `catOnset`, `catTap`, `bongoTick` |
| **⚙ Tuning** | sliders (beat sens / groove fill / EQ height·centre·gap·glow·caps) apply live + persist (`retro.tune`); Reset works | `bindTune`, `TUNE_DEFAULTS`, `syncSettings` |
| **Keybinds flyout** | `keybinds` foot button opens/closes; list matches actual keydown handler | `renderKeybinds`, `KEYBINDS` |
| **Stats window** | live tracking end-to-end (only tested with seeded data); `▶` play-from-stats | `renderer/js/stats.js`, `statStart`/`statTick`/`statFlush` |
| **Stream-cache IPC** | ⚙ keep-toggle / size readout / clear button (only the LRU logic was unit-tested) | `pushCachePolicy`, `refreshCacheSize`, `manageCacheStartup` (main.js) |
| **Game skins** | all 6 (`data-theme`) — never eyeballed in the running app | `renderer/css/game-skins.css`, `themes.js apply` |
| **Title bar** | now "Retro YTM Bongo Cat" — needs a full restart to show in the taskbar | — |

---

## Quick tuning knobs (likely QA-feedback targets)

- **Bongo cat sensitivity:** `catBeat()` in `app.js` — `kRatio`/`sRatio` (base
  `1.55`/`1.7`); or the `beatSens` slider (⚙ → Tuning).
- **EQ shape:** `drawVis()` — `maxH` (`tune.eqHeight`), `botPad`
  (`tune.eqBottom`); centre-hump = `WIN_TAPER`-equivalent `tune.eqCenter` in
  `buildCentreWindow()`.
- **Radio breadth:** `extendRadioNow()` — the `distinctArtists(origin) >= 4`
  gate, `diversifyTracks(fresh, 2, 14)` caps. Server: drop `radio=True` in
  `py/server.py` `/related` for a looser mix.

---

## Repo

Git repo, remote `origin` = <https://github.com/gyp430/retro-ytm-bongo-cat>
(public). `gh` CLI is installed + authed as `gyp430`.

- `.gitignore` excludes `node_modules/`, `build/`, `dist/`, `release/`,
  `graphify-out/`, `.claude/`, and **`py/browser.json`** (auth cookies — never
  commit it).
- The InnerTube API key is **scraped at runtime** (`_innertube_key()` in
  `server.py`), not hardcoded — a plaintext `AIza…` literal tripped GitHub
  secret scanning even though the key is public. Don't re-add it.
- Commit + push as you land fixes: `git add -A && git commit -m "…" && git push`.
  Keep `HANDOFF.md` / `QA.md` / this file updated in the same commits.

---

## Don't forget

- `graphify update .` after **every** code edit.
- Update `HANDOFF.md` (the relevant `§`) when behaviour changes.
- No `window.prompt()` in Electron — use the in-app `#modal` (`askText` /
  `askConfirm`).
- Two Python 3.14 installs on this box; `main.js` probes for the one with
  `flask, ytmusicapi` (handled, but keep `npm run setup` in sync).
