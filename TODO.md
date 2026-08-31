# TODO — deferred feature ideas

Small parked features the user wants but hasn't scheduled. Not bugs (those get
fixed as they come up); not the big parked items in `DEPS-AUDIT.md` / `HANDOFF §9`
(Electron bump, sidecar hardening, `app.js` split).

---

## Named, switchable ARTIST MIX presets

**Asked for:** 2026-08-31.

Today there's a single always-on artist pool (`state.artistMix` →
`localStorage['retro.artistMix']`, §5h). You can't keep several mixes and switch.

**Want:**
- Save the current pool as a named preset ("save as…" → `askText`).
- A dropdown / small list by the `ARTIST MIX` header to load or delete a preset.
- Loading a preset replaces `state.artistMix` (and re-renders); arming "mix"
  works as now.

**Sketch:**
- New store `localStorage['retro.artistMixes']` = `{ "<name>": [{id,name}], … }`.
- `state.artistMix` stays the live working pool; presets are named copies.
- UI: `#aq-section` `.qp-head` gets a `▾` presets button next to `mix`, opening a
  little menu (reuse `.ctx-menu` / the `#keys-pop` flyout pattern): each saved
  name → Load / Delete, plus "＋ Save current as…".
- `saveArtistMixPreset(name)` / `loadArtistMixPreset(name)` /
  `deleteArtistMixPreset(name)` next to `saveArtistMix()` in `app.js`.
- HANDOFF §5h + the localStorage-keys list.

---

## Cap / auto-trim the queue

**Asked for:** 2026-08-31.

`state.queue` grows unbounded — radio (`extendRadioNow`, +~14 when ≤2 from the
end) and artist mix (`extendArtistMix`, +~6–8 when ≤3 from the end) keep
appending and nothing removes already-played tracks. `renderQueue()` rebuilds
the whole `<ol>` with ~7 listeners per row on every track change / add / refill,
so a few hundred entries → visible stutter (worse with "Restore queue on
startup" on, since `saveSession()` re-serialises the lot every 1.2 s).

**Want:**
- A **dropdown in `⚙` settings** (Queue section, next to "Restore queue on
  startup") where the user picks the cap: **No limit / 50 / 100 / 250 / 500 /
  1000**. Persisted as `retro.queueCap` (default e.g. `250`).
- When the queue exceeds the cap, trim **already-played** tracks from the front
  (never anything at or after `state.qi`), and subtract the drop count from
  `state.qi` (and from any queue-index bookkeeping).
- `#set-queue-cap` `<select>` in `index.html`; `el.setQueueCap` + a `change`
  handler + `syncSettings()` line, mirroring `#set-cache-cap`.

**Watch out:**
- `prev()` walks `playHist` (track-object refs) via `state.queue.indexOf(...)`;
  trimmed tracks → `indexOf === -1` → skipped. So "previous" would only reach
  back as far as the trim keeps. Document it, or also cap `playHist` to match.
- Do the trim in one place — e.g. end of `renderQueue()` or a `trimQueue()`
  called after every `state.queue.push(...)` / `splice`.
- `moveInQueue` / `insertInQueue` / `removeFromQueue` / `restoreSession` all
  touch `state.qi` — make sure the trim's `qi` adjustment composes with them.
- HANDOFF §5b + the localStorage-keys list.
