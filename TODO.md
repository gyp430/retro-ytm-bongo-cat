# TODO — deferred feature ideas

Small parked features the user wants but hasn't scheduled. Not bugs (those get
fixed as they come up); not the big parked items in `DEPS-AUDIT.md` / `HANDOFF §9`
(Electron bump, sidecar hardening, `app.js` split).

---

*(nothing parked right now)*

---

## Shipped

- **2026-08-31** — Named, switchable ARTIST MIX presets
  (`retro.artistMixes`, `▾` menu by the `mix` toggle). HANDOFF §5h.
- **2026-08-31** — Queue cap / auto-trim (`⚙` → Queue → "Cap the queue",
  `retro.queueCap`, default 250; `trimQueue()` in `renderQueue()`). HANDOFF §5b.
- **2026-08-31** — Static now-playing bar keeps prev/next (2-line stack).
  HANDOFF §5f.1.
- **2026-08-31** — Visualiser idle-CPU fix: `drawVis` rAF loop parks when
  nothing's playing / window hidden / visualiser off. HANDOFF §"Visualiser".
