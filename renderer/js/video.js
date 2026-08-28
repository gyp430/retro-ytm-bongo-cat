/* Retro Video — CRT window: general YouTube (non-music) search + playback.
   Playback is a real YouTube IFrame player in the shared Electron session,
   so Premium (no ads) applies. Play/pause/stop is reported to the main
   window over IPC so it can duck the music. */
(() => {
  const $ = (id) => document.getElementById(id);
  const API = window.RetroAPI;
  const R = window.retro || {};

  const el = {
    q: $('v-q'),
    go: $('v-go'),
    results: $('v-results'),
    foot: $('v-foot'),
    now: $('v-now'),
    noise: $('crt-noise'),
    screen: $('crt-screen'),
    led: $('crt-led'),
    dock: $('crt-dock'),
    min: $('crt-min'),
    close: $('crt-close'),
  };

  // ---- theme: kept in sync with the main window ------------------------
  // (same origin → same localStorage; `storage` fires on cross-window writes)
  function applyTheme() {
    try {
      const tv = JSON.parse(localStorage.getItem('retro.themeVars') || 'null');
      if (!tv) return;
      const s = document.documentElement.style;
      for (const k in tv) s.setProperty(k, tv[k]);
    } catch (_) {}
  }
  // volume is owned by the main window's slider (retro.videoVol), pushed here
  // via cross-window `storage` events
  const savedVidVol = () => {
    const v = parseInt(localStorage.getItem('retro.videoVol'), 10);
    return Number.isFinite(v) ? v : 90;
  };
  function applyVidVol() {
    if (!ready) return;
    try {
      const v = savedVidVol();
      if (v > 0 && player.isMuted && player.isMuted()) player.unMute();
      player.setVolume(v);
    } catch (_) {}
  }
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === 'retro.themeVars') applyTheme();
    if (!e.key || e.key === 'retro.videoVol') applyVidVol();
  });

  // ---- window buttons ----------------------------------------------------
  el.min.onclick = () => R.minimize && R.minimize();
  el.close.onclick = () => R.close && R.close();
  el.dock.onclick = () => R.toggleVideoDock && R.toggleVideoDock();

  if (R.onDockState)
    R.onDockState(({ docked }) => {
      el.dock.textContent = docked ? '◧' : '▢';
      el.dock.title = docked
        ? 'Detach from main window'
        : 'Dock to right of main window';
      el.dock.classList.toggle('on', docked);
    });

  // main-window search can push a video straight into this window
  if (R.onVideoLoad)
    R.onVideoLoad((p) => {
      const id = typeof p === 'string' ? p : p && p.id;
      if (!id) return;
      curMeta = p && typeof p === 'object' ? { title: p.title, channel: p.channel } : null;
      if (p && p.title)
        el.now.textContent =
          '◄►  ' + p.title + (p.channel ? '   —   ' + p.channel : '');
      playVideo(id);
    });

  // the main window's transport drives us while a video is the active source
  if (R.onVideoCommand)
    R.onVideoCommand((cmd) => {
      if (!ready) return;
      try {
        if (cmd === 'pause') player.pauseVideo();
        else if (cmd === 'play') player.playVideo();
        else if (cmd === 'stop') {
          player.stopVideo();
          stopTicks();
        } else if (cmd === 'toggle') {
          const st = player.getPlayerState();
          if (st === 1 || st === 3) player.pauseVideo();
          else player.playVideo();
        } else if (cmd.indexOf('seek:') === 0) {
          const d = parseFloat(cmd.slice(5)) || 0;
          player.seekTo(Math.max(0, (player.getCurrentTime() || 0) + d), true);
        }
      } catch (_) {}
    });

  // ---- YouTube IFrame player ------------------------------------------------
  let player = null;
  let ready = false;
  let pendingId = null;
  let curId = null;
  let curMeta = null; // { title, channel } from the result/list, as a fallback

  function report(kind) {
    const msg = { state: kind };
    if (kind === 'playing') {
      if (curMeta) {
        msg.title = curMeta.title || '';
        msg.channel = curMeta.channel || '';
      }
      try {
        const d = player.getVideoData && player.getVideoData();
        if (d && d.title) {
          msg.title = d.title;
          msg.channel = d.author || msg.channel || '';
        }
      } catch (_) {}
    }
    if (R.reportVideoActivity) R.reportVideoActivity(msg);
  }

  // stream the video's real time/duration to the main window so its LCD +
  // seek bar track the video (not the frozen song position)
  let tickTimer = null;
  function sendTime() {
    if (!ready || !R.reportVideoActivity) return;
    let cur = 0;
    let dur = 0;
    try {
      cur = player.getCurrentTime() || 0;
      dur = player.getDuration() || 0;
    } catch (_) {}
    R.reportVideoActivity({ state: 'time', cur, dur });
  }
  function startTicks() {
    stopTicks();
    sendTime();
    tickTimer = setInterval(sendTime, 250);
  }
  function stopTicks() {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
  }

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('vid', {
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        controls: 1,
      },
      events: {
        onReady: () => {
          ready = true;
          applyVidVol();
          if (pendingId) {
            const id = pendingId;
            pendingId = null;
            playVideo(id);
          }
        },
        onStateChange: (e) => {
          const S = YT.PlayerState;
          if (e.data === S.PLAYING) {
            el.led.classList.remove('off');
            report('playing');
            startTicks();
          } else if (e.data === S.PAUSED) {
            el.led.classList.add('off');
            report('paused');
            stopTicks();
            sendTime(); // pin the LCD to the exact pause position
          } else if (e.data === S.ENDED) {
            el.led.classList.add('off');
            report('ended');
            stopTicks();
          }
        },
        onError: (e) => {
          el.foot.textContent = 'playback error (' + e.data + ') — try another';
          report('paused');
        },
      },
    });
  };

  function playVideo(id) {
    if (!id) return;
    curId = id;
    if (!ready) {
      pendingId = id;
      return;
    }
    el.noise.classList.add('hidden');
    el.screen.classList.remove('power-on');
    void el.screen.offsetWidth; // restart the power-on animation
    el.screen.classList.add('power-on');
    player.loadVideoById(id);
    markPlaying();
  }

  function markPlaying() {
    [...el.results.children].forEach((li) =>
      li.classList.toggle('playing', li.dataset.id === curId)
    );
  }

  // ---- search -----------------------------------------------------------
  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  function renderResults(vids) {
    el.results.innerHTML = '';
    if (!vids.length) {
      el.foot.textContent = 'no results';
      return;
    }
    vids.forEach((v) => {
      const li = document.createElement('li');
      li.dataset.id = v.videoId;
      const sub = [v.channel, v.views, v.published].filter(Boolean).join('  ·  ');
      li.innerHTML =
        `<img class="v-thumb" loading="lazy" src="${esc(v.thumbnail)}" alt="" />` +
        `<span class="v-meta">` +
        `<span class="v-title">${esc(v.title)}</span>` +
        `<span class="v-sub">${esc(sub)}</span>` +
        `</span>` +
        `<span class="v-dur${v.live ? ' live' : ''}">${
          v.live ? 'LIVE' : esc(v.duration || '')
        }</span>`;
      li.addEventListener('click', () => {
        curMeta = { title: v.title, channel: v.channel };
        el.now.textContent =
          '◄►  ' + (v.title || '?') + (v.channel ? '   —   ' + v.channel : '');
        playVideo(v.videoId);
      });
      el.results.appendChild(li);
    });
    el.foot.textContent = vids.length + ' results';
    markPlaying();
  }

  async function doSearch() {
    const q = el.q.value.trim();
    if (!q) return;
    el.foot.textContent = 'searching…';
    try {
      const vids = await API.videoSearch(q);
      renderResults(vids);
    } catch (e) {
      el.foot.textContent = 'search failed: ' + (e.message || e);
    }
  }
  el.go.onclick = doSearch;
  el.q.addEventListener('keydown', (e) => e.key === 'Enter' && doSearch());
  el.q.focus();
})();
