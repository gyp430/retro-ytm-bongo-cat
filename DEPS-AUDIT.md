# Dependency audit — 2026-08-28

Covers: security vulnerabilities · outdated packages · unused / undeclared
dependencies, across the Node (Electron) and Python (sidecar) sides.

**TL;DR** — the Python runtime deps are all current and clean. The npm side has
real findings: **Electron 33 is end-of-life** (33 advisories against it) and
`electron-builder` 24's tree carries build-time advisories. Neither ships an
exploit path that's live today given the app's config, but the Electron bump is
worth doing before wider distribution. No unused packages; one build-only dep
(PyInstaller) isn't declared anywhere.

---

## 1. Node / npm

`package.json` has **no runtime dependencies** — only two devDeps:

| Package | Installed | Latest | Role |
|---|---|---|---|
| `electron` | 33.4.11 | 44.0.0 | the app shell (bundled into the exe) |
| `electron-builder` | 24.13.3 | 26.15.3 | packaging only (`npm run dist`) |

`electron/main.js` + `preload.js` use only Node built-ins + `electron`. Nothing
unused, nothing undeclared. `electron-builder` is correctly a devDep.

### `npm audit` — 10 advisories (1 critical, 9 high)

All of them are in **two subtrees**:

**a) `electron` ≤ 40.10.2 — 33 CVEs (high).** We're on **33.4.11, which is EOL**
(Electron supports ~4 majors; 33 stopped getting security patches in early 2025).
Notable ones relevant to *this* app (frameless Windows app that loads
`youtube.com` in an iframe + a hidden IFrame player):

- ASAR integrity bypass via resource modification (`GHSA-vmqv-hx8q-j7mg`)
- Context-isolation bypass via `Function.prototype.bind` hijack (`GHSA-h7rp-cf8h-j98x`)
- HTTP redirect followed into local-file loader (`GHSA-v64r-4m7r-3mvq`)
- HTTP response-header injection in custom protocol / `webRequest` (`GHSA-4p4r-m79c-wq3v`)
- `shell.openPath` path-validation bypass via embedded NUL (`GHSA-5c9j-mhmv-5xgx`)
- Several use-after-frees in permission / download / power-monitor callbacks

Most of the rest are macOS/Linux-specific or need misconfigurations this app
doesn't have (`nodeIntegration:false`, `contextIsolation:true` everywhere — see
§4). Still: shipping an EOL Chromium/Electron in a distributed `.exe` is the
single biggest item here.

**b) `electron-builder` 24 tree (build-time only):**

- `app-builder-lib` / `builder-util-runtime` — `electron-updater` path-element
  and credential-leak-on-redirect issues (`GHSA-7g7r-gx96-252g`,
  `GHSA-p2f4-r6v6-j797`). **We don't use `electron-updater`** (no auto-update
  wired). Runs only during `npm run dist` on the dev box.
- `extract-zip` symlink path traversal (`GHSA-jmr9-qjv8-65gv`) — used to unpack
  the Electron release zip during the build. Input is a GitHub release the tool
  verified by hash. Build-time, trusted input.

### Recommendation (npm)

1. **Bump Electron** to a currently-supported major and re-test + rebuild.
   `npm install electron@latest --save-dev` (currently 44). Re-run the full QA
   pass afterwards — a 33→44 jump crosses several Chromium versions; check the
   IFrame player, CSP, frameless window chrome, dev-key handling, and the
   3 windows.
2. **Bump `electron-builder`** to 26 (`npm install electron-builder@latest -D`).
   Config in `package.json` is minimal (`portable` target, one `extraResources`
   entry) so the breaking changes should be low-impact — verify the portable
   exe still builds and launches.
3. `npm audit fix --force` does both but blindly; prefer the two explicit bumps
   so you control the re-test.
4. Neither is a "drop everything" emergency: 127.0.0.1-only, no auto-update, no
   arbitrary remote content beyond youtube.com, hardened webPreferences.

---

## 2. Python (sidecar)

`py/requirements.txt`:

```
Flask>=3.0.0
flask-cors>=4.0.0
ytmusicapi>=1.8.0
requests>=2.31.0
yt-dlp>=2024.1.1
```

Installed / bundled (the frozen `dist/server/_internal/` matches this env):

| Package | Installed | Latest-ish | Notes |
|---|---|---|---|
| Flask | 3.1.3 | current | clean |
| Werkzeug | 3.1.8 | current | (Flask dep) clean |
| flask-cors | 6.0.5 | current | clean — **but see the floor below** |
| requests | 2.34.2 | current | clean |
| urllib3 | 2.7.0 | current | (requests dep) clean |
| Jinja2 | 3.1.6 | current | (Flask dep) clean |
| certifi | 2026.7.22 | current | clean |
| ytmusicapi | 1.12.2 | current | clean |
| yt-dlp | 2026.8.19 | ~current | clean; breaks often by nature — keep fresh |

### `pip-audit` result

- **Runtime deps: no known vulnerabilities.**
- One hit environment-wide: `pip` 26.1.2 (`PYSEC-2026-3721`, fixed in 26.2) —
  that's the build tool, **not a project dependency and not bundled**. Optional:
  `python -m pip install -U pip`.

### requirements.txt hygiene (not vulns, but worth fixing)

- **`flask-cors>=4.0.0`** — flask-cors 4.x/5.x carried several CVEs
  (`CVE-2024-6221` private-network default, `CVE-2024-6839/6844/6866` path &
  regex matching, `CVE-2024-1681` log injection). The installed 6.0.5 is fine;
  **raise the floor to `>=6.0.0`** so a fresh install can't resolve to a
  vulnerable 4.x/5.x.
- **`yt-dlp>=2024.1.1`** and **`ytmusicapi>=1.8.0`** — floors are ~2 years
  stale; a fresh install *does* get latest, but bump them (`yt-dlp>=2025.1.1`,
  `ytmusicapi>=1.12.0`) to document reality and fail fast on anything ancient.
- For **reproducible release builds**, freeze exact versions used for a shipped
  `.exe`: `python -m pip freeze > py/requirements.lock.txt` and build the
  frozen sidecar from that. The current `>=` spec means two builds a month apart
  can bundle different code.

---

## 3. Unused / undeclared

| | Finding |
|---|---|
| **Node unused** | none — `electron`, `electron-builder` both used |
| **Node undeclared** | none — code uses only built-ins + `electron` |
| **Python unused (declared, not imported)** | none — `Flask`, `flask-cors`, `ytmusicapi`, `requests`, `yt-dlp` all imported in `py/server.py` |
| **Python undeclared (imported/used, not in requirements)** | **`pyinstaller`** — used by `npm run dist:sidecar` / `retro-sidecar.spec`, not listed anywhere. Add a `py/requirements-dev.txt` (`pyinstaller>=6.11`) or at least a line in `QA.md`'s rebuild section, so a clean machine can build. |
| **Python unused imports in-file** | none obvious — the `ytmusicapi.helpers` names are all used by the cookie-auth path |
| **Runtime external (not a package)** | `renderer/index.html` + `video.html` load `https://www.youtube.com/iframe_api`. Required for playback, CSP-allowed. If YouTube changes it, playback breaks — inherent to the architecture, not fixable here. |

---

## 4. Security posture notes (adjacent to deps)

Not dependency CVEs, but they change how much the Electron CVEs matter:

- **Electron webPreferences are hardened** — `contextIsolation: true`,
  `nodeIntegration: false` on all four windows; a dedicated `preload.js` via
  `contextBridge`. `sandbox` is **not set explicitly** (defaults on with this
  preload style in modern Electron) — pin `sandbox: true` in each
  `webPreferences` to be safe across the version bump.
- **The sidecar has no caller authentication.** `require_auth()` only checks
  *"is the sidecar itself signed in"*, and `CORS(app)` allows every origin
  (`*`). While the app runs, **any local process — including a webpage in any
  browser — can POST to `http://127.0.0.1:8765/playlist/<id>/delete`, `/rate`,
  `/playlist/create`**, etc. Bind is already `127.0.0.1` (no LAN exposure), but
  a drive-by page could still tamper with the user's library.
  Mitigation: have `main.js` generate a random token per launch, pass it to the
  sidecar (env var) and to the renderer (preload), require it as a header on
  state-changing routes; and scope `CORS` to the app's own origin instead of
  `*`.
- `/download` and `/stream` write files under `~/Downloads` / `~/.retro-ytm-cache`
  from a `?dir=` / `?v=` param — `dir` is checked for `os.path.isabs`; `v` goes
  straight into a yt-dlp URL. Low risk (local, cookie-free) but worth a glance
  when touching those.

---

## Suggested order of work

1. `flask-cors` floor → `>=6.0.0`; bump `yt-dlp` / `ytmusicapi` floors;
   add `py/requirements-dev.txt` with `pyinstaller`. *(5 min, zero risk.)*
2. Add the sidecar launch-token + tighten CORS. *(Small, removes the only real
   "anyone can" gap.)*
3. Bump `electron-builder` → 26, rebuild the portable exe, verify it launches.
4. Bump `electron` → current stable, full QA pass, rebuild. *(Biggest, do it
   with time to re-test everything.)*
5. Optional: `pip install -U pip`; `python -m pip freeze > py/requirements.lock.txt`
   for the next release build.
