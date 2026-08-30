const { contextBridge, ipcRenderer, webFrame } = require('electron');

// ---- whole-window zoom: Ctrl + mouse wheel (also Ctrl +/-/0) ----------------
// Lives in preload so BOTH windows (main player + CRT video) inherit it from
// the shared script. webFrame.setZoomFactor scales every element, like the
// browser's own zoom. Persisted to localStorage and mirrored between windows.
(() => {
  const MIN = 0.5;
  const MAX = 2.0; // the fixed skin can't hold together past ~2×
  const STEP = 0.1;
  const clamp = (f) => Math.min(MAX, Math.max(MIN, Math.round(f * 100) / 100));

  function setZoom(f, save) {
    const z = clamp(f);
    webFrame.setZoomFactor(z);
    if (save !== false) {
      try {
        localStorage.setItem('retro.zoom', String(z));
      } catch (_) {}
    }
  }
  const bump = (d) => setZoom(webFrame.getZoomFactor() + d);

  function restore() {
    try {
      const s = parseFloat(localStorage.getItem('retro.zoom'));
      if (s && Math.abs(s - webFrame.getZoomFactor()) > 0.001) setZoom(s, false);
    } catch (_) {}
  }
  restore();
  window.addEventListener('DOMContentLoaded', restore);

  window.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      bump(e.deltaY < 0 ? STEP : -STEP);
    },
    { passive: false }
  );

  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    if (e.key === '0') {
      e.preventDefault();
      setZoom(1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      bump(STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      bump(-STEP);
    }
  });

  // keep the two windows' zoom in sync live
  window.addEventListener('storage', (e) => {
    if (e.key !== 'retro.zoom' || !e.newValue) return;
    const f = parseFloat(e.newValue);
    if (f && Math.abs(f - webFrame.getZoomFactor()) > 0.001) setZoom(f, false);
  });
})();

contextBridge.exposeInMainWorld('retro', {
  apiBase: `http://127.0.0.1:${process.env.RETRO_YTM_PORT || '8765'}`,
  minimize: () => ipcRenderer.invoke('win:min'),
  close: () => ipcRenderer.invoke('win:close'),
  toggleMaximize: () => ipcRenderer.invoke('win:toggle-max'),
  connect: () => ipcRenderer.invoke('auth:interactive'),
  openExternal: (url) => ipcRenderer.invoke('open:external', url),
  // settings menu: reset whole-window zoom to 100%
  resetZoom: () => {
    try {
      localStorage.setItem('retro.zoom', '1');
    } catch (_) {}
    webFrame.setZoomFactor(1);
  },
  // download button: reveal the saved file in the OS file manager
  revealPath: (p) => ipcRenderer.invoke('shell:reveal', p),
  // settings: native folder picker → absolute path or null
  pickFolder: () => ipcRenderer.invoke('dialog:folder'),

  // --- retro CRT video window ---
  // main window: open it, or open+load a specific video
  openVideo: () => ipcRenderer.invoke('video:open'),
  playVideo: (payload) => ipcRenderer.invoke('video:play', payload),
  // video window: toggle docked ↔ free-floating
  toggleVideoDock: () => ipcRenderer.invoke('video:toggle-dock'),
  // main window: drive the CRT video — 'play' | 'pause' | 'toggle' | 'stop'
  // | 'seek:<±secs>'  (so the main transport buttons work on the video)
  videoControl: (cmd) => ipcRenderer.invoke('video:control', cmd),
  // video window: report play/pause/ended so the music can duck/un-duck
  reportVideoActivity: (payload) => ipcRenderer.send('video:activity', payload),
  // main window: subscribe to those reports. returns an unsubscribe fn.
  onVideoActivity: (fn) => {
    const listener = (_e, payload) => fn(payload);
    ipcRenderer.on('video-activity', listener);
    return () => ipcRenderer.removeListener('video-activity', listener);
  },
  // video window: dock-state pushes + "load this video" commands
  onDockState: (fn) => {
    const listener = (_e, payload) => fn(payload);
    ipcRenderer.on('dock-state', listener);
    return () => ipcRenderer.removeListener('dock-state', listener);
  },
  onVideoLoad: (fn) => {
    const listener = (_e, payload) => fn(payload);
    ipcRenderer.on('video:load', listener);
    return () => ipcRenderer.removeListener('video:load', listener);
  },
  onVideoCommand: (fn) => {
    const listener = (_e, cmd) => fn(cmd);
    ipcRenderer.on('video:command', listener);
    return () => ipcRenderer.removeListener('video:command', listener);
  },

  // --- stream cache (settings) ---
  setCachePolicy: (p) => ipcRenderer.invoke('cache:policy', p), // {keep, capMB}
  clearCache: () => ipcRenderer.invoke('cache:clear'), // → { freedMB }
  cacheSize: () => ipcRenderer.invoke('cache:size'), // → { mb, files }

  // --- statistics window ---
  openStats: () => ipcRenderer.invoke('stats:open'), // main window: open it
  // stats window: ask the player to play a set of tracks
  //   payload = { tracks: [{videoId,title,artists,durationSeconds}], shuffle }
  playFromStats: (payload) => ipcRenderer.invoke('stats:play', payload),
  // main window: subscribe to those requests. returns an unsubscribe fn.
  onStatsPlay: (fn) => {
    const listener = (_e, payload) => fn(payload);
    ipcRenderer.on('stats-play', listener);
    return () => ipcRenderer.removeListener('stats-play', listener);
  },
});
