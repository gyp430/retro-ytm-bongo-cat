# Next chat — small fixes + QA only

Paste this file's path into a fresh chat. Deep context: [`HANDOFF.md`](HANDOFF.md).
QA checklist: [`QA.md`](QA.md). Dependency status: [`DEPS-AUDIT.md`](DEPS-AUDIT.md).
Parked feature ideas: [`TODO.md`](TODO.md).

Work from the repo root: <https://github.com/gyp430/retro-ytm-bongo-cat>
(`gh` installed + authed as `gyp430`).

---

## Scope

The app is **feature-complete, packaged, and on GitHub** (secrets scrubbed, deps
audited). This phase is **small bug-fixes and QA only** — tweak behaviour, fix
what breaks, polish. Ask before doing anything bigger:

- **Out of scope unless the user asks:** Electron 33 → 44 bump (needs a full
  re-QA), the sidecar auth-token / CORS hardening, the `app.js` module split,
  any new feature. Those are parked in `DEPS-AUDIT.md` / `HANDOFF.md §9`.

---

## Run it

```
cd <repo root>
npm start          # dev — Electron + system-Python sidecar on :8765
```

- Renderer / preload edit → **F5** (reload). `electron/main.js` or
  `py/server.py` edit → full `npm start` restart.
- Auth is done (`py/browser.json` present, `/health` → `authed:true`).
- Repackage: `npm run dist` → `release/RetroYTM-BongoCat-*.exe`.

---

## graphify — before grepping

```
graphify explain "<fn>"      graphify query "<question>"      graphify path "<A>" "<B>"
graphify update .            # after EVERY code edit (AST-only, free)
```

`CLAUDE.md` + PreToolUse hooks enforce this. If `graphify` isn't on PATH it's a
`uv tool` — shim in `%USERPROFILE%\.local\bin`, interpreter at
`%APPDATA%\uv\tools\graphifyy\Scripts\python.exe`.

---

## QA pass (click through these in `npm start`)

Nothing below was exercised in a running Electron app; drive each once.

- [ ] **Core** — search, double-click to play, queue reorder/remove, transport,
      keyboard (`Space`, `Ctrl+←/→`, seek, volume).
- [ ] **Radio** (`≈`) — should now diversify, not flood one artist
      (`extendRadioNow` / `diversifyTracks`).
- [ ] **ARTIST MIX** — add via search + drag from FOR YOU, arm "mix", confirm
      varied tracks flow in; radio & mix are mutually exclusive
      (`extendArtistMix`).
- [ ] **Stream-everything** (⚙) — every track routes through `/stream`; real
      visualiser + beat cat on all of them (`streamTrack`).
- [ ] **Visualiser** — compact, centred, no diagonal slope; peak caps + glow
      (`drawVis`).
- [ ] **Bongo cat** — tracks the beat on a few genres (user already said
      "PERFECT" — just sanity-check) (`catBeat`).
- [ ] **⚙ Tuning** — the 7 knobs apply live + persist (`retro.tune`); Reset
      works (`bindTune`).
- [ ] **Keybinds flyout**, **Stats window** live tracking + `▶` playback,
      **Stream-cache** ⚙ (keep toggle / size / clear).
- [ ] **Game skins** — eyeball all 6 (`data-theme` on `<html>`).
- [ ] **Packaged .exe** — double-click, ◍ Google sign-in end to end, sidecar
      starts from `resources/sidecar/server.exe`.

---

## Likely small-fix knobs

- **Bongo cat feel:** `catBeat()` — `kRatio`/`sRatio` (base `1.55`/`1.7`), or
  the `beatSens` slider.
- **EQ shape:** `drawVis()` — `maxH`/`botPad`; centre hump = `tune.eqCenter`
  in `buildCentreWindow()`.
- **Radio breadth:** `extendRadioNow()` — the `distinctArtists(origin) >= 4`
  gate and `diversifyTracks(fresh, 2, 14)` caps; server `/related` `radio=True`.

---

## Rules

- `graphify update .` after every code edit; update `HANDOFF.md` (the right `§`)
  when behaviour changes.
- Commit + push each fix: `git add -A && git commit -m "…" && git push`.
  **Never** commit `py/browser.json`. **Don't** re-add a hardcoded InnerTube key
  (`_innertube_key()` scrapes it at runtime — a literal trips secret scanning).
- No `window.prompt()` in Electron — use the in-app `#modal` (`askText` /
  `askConfirm`).
