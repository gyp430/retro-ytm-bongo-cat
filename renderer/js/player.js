/* Wraps the YouTube IFrame player. Real YouTube playback => your Premium
   (no ads, background) applies when the app's Google session is signed in. */
window.RetroPlayer = (() => {
  let yt = null;
  let ready = false;
  let vol = 80;
  let pollTimer = null;
  const cbs = {}; // ready | state | tick | error

  function fire(name, arg) {
    if (typeof cbs[name] === 'function') cbs[name](arg);
  }

  // called by the IFrame API script once it loads
  window.onYouTubeIframeAPIReady = function () {
    yt = new YT.Player('yt', {
      height: '180',
      width: '320',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          ready = true;
          try {
            yt.setVolume(vol);
          } catch (_) {}
          fire('ready');
          startPoll();
        },
        onStateChange: (e) => fire('state', e.data),
        onError: (e) => fire('error', e.data),
      },
    });
  };

  function startPoll() {
    stopPoll();
    pollTimer = setInterval(() => fire('tick', snapshot()), 250);
  }
  function stopPoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function snapshot() {
    if (!ready) return { ready: false, cur: 0, dur: 0, playing: false };
    let cur = 0,
      dur = 0,
      st = -1;
    try {
      cur = yt.getCurrentTime() || 0;
      dur = yt.getDuration() || 0;
      st = yt.getPlayerState();
    } catch (_) {}
    return { ready: true, cur, dur, playing: st === 1, buffering: st === 3, state: st };
  }

  return {
    STATES: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
    on(name, fn) {
      cbs[name] = fn;
    },
    isReady: () => ready,
    load(id) {
      if (ready && id) yt.loadVideoById(id);
    },
    play() {
      if (ready) yt.playVideo();
    },
    pause() {
      if (ready) yt.pauseVideo();
    },
    stop() {
      if (ready) yt.stopVideo();
    },
    togglePlay() {
      if (!ready) return;
      const st = yt.getPlayerState();
      if (st === 1 || st === 3) yt.pauseVideo();
      else yt.playVideo();
    },
    seekFrac(f) {
      if (!ready) return;
      const d = yt.getDuration() || 0;
      yt.seekTo(Math.max(0, Math.min(1, f)) * d, true);
    },
    seekBy(sec) {
      if (!ready) return;
      const c = yt.getCurrentTime() || 0;
      yt.seekTo(Math.max(0, c + sec), true);
    },
    setVolume(v) {
      vol = Math.max(0, Math.min(100, v | 0));
      if (ready) yt.setVolume(vol);
    },
    getVolume: () => vol,
    snapshot,
  };
})();
