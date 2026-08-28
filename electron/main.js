const { app, BrowserWindow, ipcMain, shell, session, screen, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.RETRO_YTM_PORT || '8765';
const ROOT = path.join(__dirname, '..');

// audio the sidecar fetched for embed-blocked tracks (mirrors _AUDIO_CACHE in
// server.py). Default: wiped on every startup (covers an unclean exit / crash /
// power loss) and again on shutdown. If the user turns on "keep between
// sessions" (settings → Stream cache) it's kept instead, and trimmed to a size
// cap (LRU — oldest-played evicted first) on startup and after each fetch.
const AUDIO_CACHE = path.join(os.homedir(), '.retro-ytm-cache');
// tiny sidecar-shared policy file: { keep: bool, capMB: number }
const CACHE_POLICY = path.join(os.homedir(), '.retro-ytm-cache.json');

function clearAudioCache() {
  try {
    fs.rmSync(AUDIO_CACHE, { recursive: true, force: true });
  } catch (_) {}
}

function readCachePolicy() {
  try {
    return { keep: false, capMB: 500, ...JSON.parse(fs.readFileSync(CACHE_POLICY, 'utf8')) };
  } catch (_) {
    return { keep: false, capMB: 500 };
  }
}

function cacheEntries() {
  try {
    return fs
      .readdirSync(AUDIO_CACHE)
      .map((f) => path.join(AUDIO_CACHE, f))
      .map((p) => {
        try {
          const s = fs.statSync(p);
          return s.isFile() ? { p, size: s.size, mtime: s.mtimeMs } : null;
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}
const cacheBytes = () => cacheEntries().reduce((n, e) => n + e.size, 0);

// evict least-recently-played (oldest mtime) until under capMB. Returns bytes freed.
function trimCache(capMB) {
  const cap = Math.max(0, capMB || 0) * 1024 * 1024;
  const files = cacheEntries().sort((a, b) => a.mtime - b.mtime);
  let total = files.reduce((n, e) => n + e.size, 0);
  let freed = 0;
  for (const f of files) {
    if (total <= cap) break;
    try {
      fs.rmSync(f.p, { force: true });
      total -= f.size;
      freed += f.size;
    } catch (_) {}
  }
  return freed;
}

// startup / shutdown: keep → trim to cap, otherwise wipe
function manageCacheStartup() {
  const pol = readCachePolicy();
  if (pol.keep) trimCache(pol.capMB);
  else clearAudioCache();
}

let win = null;
let videoWin = null;
let statsWin = null; // standalone listening-statistics window
let videoDocked = true; // CRT window starts snapped to the right of the main window
let py = null;

const DOCK_DEFAULT_W = 420;
const DOCK_MIN_W = 360;

// --------------------------------------------------------------------------- //
// Python sidecar
// --------------------------------------------------------------------------- //
// Probe an interpreter: does it exist, and does it have our deps?
// -> 'ok' | 'nodeps' | 'missing'
function checkInterp(cmd, preArgs) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(cmd, [...preArgs, '-c', 'import flask, ytmusicapi'], {
        stdio: 'ignore',
      });
    } catch (_) {
      return resolve('missing');
    }
    child.once('error', () => resolve('missing'));
    child.once('exit', (code) => resolve(code === 0 ? 'ok' : 'nodeps'));
  });
}

// per-user auth store (packaged): userData survives app updates and is writable
// even when the app lives in a read-only location. Dev keeps py/browser.json.
const AUTH_FILE = path.join(app.getPath('userData'), 'browser.json');

function wirePy(child, label) {
  child.stdout.on('data', (d) => process.stdout.write(`[py] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[py] ${d}`));
  child.on('exit', (code) => {
    if (code) console.error(`[main] python sidecar exited with code ${code}`);
  });
  py = child;
  console.log(`[main] python sidecar started via "${label}"`);
}

function spawnServer(cmd, preArgs) {
  const child = spawn(cmd, [...preArgs, path.join(ROOT, 'py', 'server.py')], {
    cwd: ROOT,
    env: {
      ...process.env,
      RETRO_YTM_PORT: PORT,
      PYTHONUNBUFFERED: '1',
      RETRO_AUTH_FILE: AUTH_FILE,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  wirePy(child, preArgs.length ? `${cmd} ${preArgs.join(' ')}` : cmd);
}

// packaged build: run the PyInstaller-frozen sidecar (no Python needed on the
// QA machine). Lives in resources/sidecar/ (electron-builder extraResources).
function spawnFrozenServer() {
  const exe = path.join(
    process.resourcesPath,
    'sidecar',
    process.platform === 'win32' ? 'server.exe' : 'server'
  );
  if (!fs.existsSync(exe)) {
    console.error(`[main] frozen sidecar not found at ${exe}`);
    return false;
  }
  const child = spawn(exe, [], {
    cwd: path.dirname(exe),
    env: {
      ...process.env,
      RETRO_YTM_PORT: PORT,
      PYTHONUNBUFFERED: '1',
      RETRO_AUTH_FILE: AUTH_FILE,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  wirePy(child, exe);
  return true;
}

async function startPython() {
  if (app.isPackaged) {
    if (spawnFrozenServer()) return;
    console.error('[main] falling back to a system Python for the sidecar');
  }
  // `py` (the Windows launcher) and `python` can point at different installs —
  // pick the first interpreter that actually has Flask + ytmusicapi.
  const candidates =
    process.platform === 'win32'
      ? [['python', []], ['py', ['-3']], ['python3', []]]
      : [['python3', []], ['python', []]];

  let firstPresent = null;
  for (const [cmd, pre] of candidates) {
    const status = await checkInterp(cmd, pre);
    if (status === 'ok') return spawnServer(cmd, pre);
    if (status === 'nodeps' && !firstPresent) firstPresent = [cmd, pre];
  }

  if (firstPresent) {
    const [cmd, pre] = firstPresent;
    const label = pre.length ? `${cmd} ${pre.join(' ')}` : cmd;
    console.error(
      `[main] "${label}" is missing Flask/ytmusicapi. Run:\n` +
        `        ${label} -m pip install -r py/requirements.txt`
    );
    spawnServer(cmd, pre); // start it anyway so the traceback surfaces in logs
    return;
  }
  console.error(
    '[main] No Python 3 found on PATH. Install it, then run `npm run setup`.'
  );
}

function stopPython() {
  if (py && !py.killed) {
    py.kill();
    py = null;
  }
}

function postJSON(pathname, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        method: 'POST',
        host: '127.0.0.1',
        port: PORT,
        path: pathname,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (d) => (buf += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(buf || '{}'));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function waitForServer(timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const ping = () => {
      const req = http.get(
        { host: '127.0.0.1', port: PORT, path: '/health', timeout: 1500 },
        (res) => {
          res.resume();
          resolve(res.statusCode === 200);
        }
      );
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) resolve(false);
        else setTimeout(ping, 500);
      });
      req.on('timeout', () => req.destroy());
    };
    ping();
  });
}

// --------------------------------------------------------------------------- //
// window
// --------------------------------------------------------------------------- //
// Frameless windows have no menu, so wire the usual dev keys by hand:
//   F5 / Ctrl+R          reload
//   Ctrl+Shift+R         reload ignoring cache
//   F12 / Ctrl+Shift+I   toggle DevTools
// Skipped in a packaged build.
function wireDevKeys(w) {
  if (app.isPackaged) return;
  w.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    const k = (input.key || '').toLowerCase();
    if (k === 'f5' || (input.control && !input.shift && k === 'r')) {
      w.webContents.reload();
      e.preventDefault();
    } else if (input.control && input.shift && k === 'r') {
      w.webContents.reloadIgnoringCache();
      e.preventDefault();
    } else if (k === 'f12' || (input.control && input.shift && k === 'i')) {
      w.webContents.toggleDevTools();
      e.preventDefault();
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 640,
    height: 600,
    minWidth: 560,
    minHeight: 340,
    frame: false,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#000000',
    title: 'Retro YTM Bongo Cat',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  wireDevKeys(win);
  win.on('closed', () => (win = null));
  return win;
}

// The retro CRT video window. A separate BrowserWindow, but it shares
// session.defaultSession with the main window (no custom partition), so the
// signed-in Google session — and therefore Premium — carries over.
//
// While "docked" it is glued to the right edge of the main window (same
// height, follows moves/resizes). The window's own titlebar button toggles
// docked ↔ free-floating.
function dockBounds(forceWidth) {
  const b = win.getBounds();
  const w =
    forceWidth ||
    (videoWin && !videoWin.isDestroyed()
      ? videoWin.getBounds().width
      : DOCK_DEFAULT_W);
  const area = screen.getDisplayMatching(b).workArea;
  let x = b.x + b.width;
  // no room on the right → dock on the left instead
  if (x + w > area.x + area.width && b.x - w >= area.x) x = b.x - w;
  return { x, y: b.y, width: w, height: b.height };
}

function positionDock() {
  if (!videoDocked) return;
  if (!win || win.isDestroyed() || !videoWin || videoWin.isDestroyed()) return;
  videoWin.setBounds(dockBounds());
}

function openVideoWindow() {
  if (videoWin && !videoWin.isDestroyed()) {
    if (videoWin.isMinimized()) videoWin.restore();
    videoWin.focus();
    return;
  }

  const start =
    videoDocked && win && !win.isDestroyed()
      ? dockBounds(DOCK_DEFAULT_W)
      : { width: 540, height: 720 };

  videoWin = new BrowserWindow({
    ...start,
    minWidth: DOCK_MIN_W,
    minHeight: 460,
    frame: false,
    resizable: !videoDocked,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#000000',
    title: 'Retro Video',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  // keep the docked window glued to the main window
  const follow = () => positionDock();
  const hideDocked = () => {
    if (videoDocked && videoWin && !videoWin.isDestroyed()) videoWin.hide();
  };
  const showDocked = () => {
    if (videoDocked && videoWin && !videoWin.isDestroyed()) videoWin.show();
  };
  win.on('move', follow);
  win.on('resize', follow);
  win.on('minimize', hideDocked);
  win.on('restore', showDocked);

  videoWin.on('closed', () => {
    if (win && !win.isDestroyed()) {
      win.off('move', follow);
      win.off('resize', follow);
      win.off('minimize', hideDocked);
      win.off('restore', showDocked);
      // video is gone → tell the player to un-duck the music
      win.webContents.send('video-activity', { state: 'closed' });
    }
    videoWin = null;
  });

  videoWin.webContents.on('did-finish-load', () => {
    if (videoWin && !videoWin.isDestroyed())
      videoWin.webContents.send('dock-state', { docked: videoDocked });
  });

  wireDevKeys(videoWin);
  videoWin.loadURL(`http://127.0.0.1:${PORT}/video.html`);
}

// load a specific video into the CRT window (opening/docking it if needed)
function playVideoInWindow(payload) {
  const wasOpen = videoWin && !videoWin.isDestroyed();
  openVideoWindow();
  if (!videoWin) return;
  const send = () => {
    if (videoWin && !videoWin.isDestroyed())
      videoWin.webContents.send('video:load', payload);
  };
  if (wasOpen && !videoWin.webContents.isLoading()) send();
  else videoWin.webContents.once('did-finish-load', send);
}

// standalone statistics window — reads localStorage['retro.stats'] itself
// (same origin as the main window), so no data IPC; it only sends back a
// "play these tracks" request.
function openStatsWindow() {
  if (statsWin && !statsWin.isDestroyed()) {
    if (statsWin.isMinimized()) statsWin.restore();
    statsWin.focus();
    return;
  }
  statsWin = new BrowserWindow({
    width: 760,
    height: 660,
    minWidth: 420,
    minHeight: 360,
    backgroundColor: '#000000',
    title: 'Retro YTM — Statistics',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  statsWin.setMenuBarVisibility(false);
  statsWin.on('closed', () => {
    statsWin = null;
  });
  wireDevKeys(statsWin);
  statsWin.loadURL(`http://127.0.0.1:${PORT}/stats.html`);
}

async function loadUI() {
  const up = await waitForServer();
  if (up) {
    win.loadURL(`http://127.0.0.1:${PORT}/`);
  } else {
    // degraded: load from disk so the user at least sees the "no server" state
    console.error('[main] sidecar never became healthy; loading UI from disk');
    win.loadFile(path.join(ROOT, 'renderer', 'index.html'));
  }
}

// --------------------------------------------------------------------------- //
// IPC
// --------------------------------------------------------------------------- //
ipcMain.handle('win:min', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.handle('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

// video window: open/focus it, and relay its playback state to the main window
ipcMain.handle('video:open', () => openVideoWindow());
ipcMain.handle('video:play', (_e, payload) => playVideoInWindow(payload));
ipcMain.handle('video:control', (_e, cmd) => {
  if (videoWin && !videoWin.isDestroyed())
    videoWin.webContents.send('video:command', String(cmd || ''));
});
ipcMain.on('video:activity', (_e, payload) => {
  if (win && !win.isDestroyed()) win.webContents.send('video-activity', payload);
});

// statistics window: open it, and relay its "play these tracks" request to the
// main window (bringing the main window forward so playback is visible)
ipcMain.handle('stats:open', () => openStatsWindow());
ipcMain.handle('stats:play', (_e, payload) => {
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    win.webContents.send('stats-play', payload);
  }
});

// dock ↔ float toggle (called from the CRT window's titlebar button)
ipcMain.handle('video:toggle-dock', () => {
  if (!videoWin || videoWin.isDestroyed()) return videoDocked;
  videoDocked = !videoDocked;
  if (videoDocked) {
    videoWin.setResizable(false);
    videoWin.setBounds(dockBounds(DOCK_DEFAULT_W));
  } else {
    videoWin.setResizable(true);
    const b = videoWin.getBounds(); // nudge off the seam so it reads as free
    videoWin.setBounds({ x: b.x - 28, y: b.y + 28, width: b.width, height: b.height });
  }
  videoWin.webContents.send('dock-state', { docked: videoDocked });
  return videoDocked;
});

// One-button connect: open Google's real login, then lift the resulting
// cookies straight out of Electron's session and hand them to the sidecar.
// The same session backs the embedded player, so this also turns on Premium.
ipcMain.handle('auth:interactive', async () => {
  const ses = session.defaultSession;
  const loginWin = new BrowserWindow({
    width: 480,
    height: 690,
    autoHideMenuBar: true,
    title: 'Sign in to Google',
    parent: win || undefined,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  const grabbed = await new Promise((resolve) => {
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      resolve(val);
      if (!loginWin.isDestroyed()) loginWin.close();
    };

    const check = async () => {
      try {
        const cookies = await ses.cookies.get({ url: 'https://music.youtube.com/' });
        if (!cookies.some((c) => c.name === '__Secure-3PAPISID')) return;
        finish({
          ok: true,
          cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
          userAgent: loginWin.webContents.getUserAgent(),
        });
      } catch (_) {
        /* window gone mid-check */
      }
    };

    const timer = setInterval(check, 2000);
    loginWin.webContents.on('did-navigate', check);
    loginWin.webContents.on('did-navigate-in-page', check);
    loginWin.on('closed', () => finish({ ok: false, reason: 'cancelled' }));
    loginWin.loadURL(
      'https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fmusic.youtube.com%2F'
    );
  });

  if (!grabbed.ok) return grabbed;
  try {
    return await postJSON('/auth/cookie', {
      cookie: grabbed.cookie,
      userAgent: grabbed.userAgent,
    });
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
});

ipcMain.handle('open:external', (_e, url) => {
  if (/^https?:\/\//.test(url)) shell.openExternal(url);
});

// download button: pop the OS file manager with the freshly-saved track selected
ipcMain.handle('shell:reveal', (_e, p) => {
  if (typeof p === 'string' && p) shell.showItemInFolder(p);
});

// settings → Stream cache: keep-between-sessions + size cap, clear now, size read
ipcMain.handle('cache:policy', (_e, p) => {
  const pol = {
    keep: !!(p && p.keep),
    capMB: Math.max(50, Math.min(8000, Math.round(+(p && p.capMB) || 500))),
  };
  try {
    fs.writeFileSync(CACHE_POLICY, JSON.stringify(pol));
  } catch (_) {}
  if (pol.keep) trimCache(pol.capMB);
  else clearAudioCache();
  return pol;
});
ipcMain.handle('cache:clear', () => {
  const freed = cacheBytes();
  clearAudioCache();
  return { freedMB: +(freed / 1048576).toFixed(1) };
});
ipcMain.handle('cache:size', () => {
  const e = cacheEntries();
  return {
    mb: +(e.reduce((n, x) => n + x.size, 0) / 1048576).toFixed(1),
    files: e.length,
  };
});

// settings: pick a download folder
ipcMain.handle('dialog:folder', async (e) => {
  const w = BrowserWindow.fromWebContents(e.sender) || win;
  const r = await dialog.showOpenDialog(w, {
    title: 'Choose download folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
});

// --------------------------------------------------------------------------- //
// lifecycle
// --------------------------------------------------------------------------- //
app.whenReady().then(async () => {
  manageCacheStartup(); // wipe, or (if "keep") trim to the size cap
  await startPython();
  createWindow();
  loadUI();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      loadUI();
    }
  });
});

function shutdown() {
  stopPython();
  if (!readCachePolicy().keep) clearAudioCache();
}

app.on('window-all-closed', () => {
  shutdown();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', shutdown);
process.on('exit', shutdown);
