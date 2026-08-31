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
