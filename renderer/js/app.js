/* Retro YTM — UI glue */
(() => {
  const $ = (id) => document.getElementById(id);
  const API = window.RetroAPI;
  const P = window.RetroPlayer;

  // ---- element refs -------------------------------------------------------
  const el = {
    signin: $('btn-signin'),
    video: $('btn-video'),
    settings: $('btn-settings'),
    settingsPop: $('settings-pop'),
    setVol: $('set-vol'),
    setBlocked: $('set-blocked'),
    setStreamAll: $('set-stream-all'),
    setZoom: $('set-zoom'),
    setVisOn: $('set-vis-on'),
    setVisMode: $('set-vis-mode'),
    setImport: $('set-import'),
    setStats: $('set-stats'),
    setLocalList: $('set-local-list'),
    setLocalClear: $('set-local-clear'),
    setDlDir: $('set-dl-dir'),
    setDlPick: $('set-dl-pick'),
    setDlReset: $('set-dl-reset'),
    setCacheKeep: $('set-cache-keep'),
    setCacheCap: $('set-cache-cap'),
    setCacheSize: $('set-cache-size'),
    setCacheClear: $('set-cache-clear'),
    setKeepQueue: $('set-keep-queue'),
    setQueueCap: $('set-queue-cap'),
    setCombineTransport: $('set-combine-transport'),
    setTimeMode: $('set-time-mode'),
    setMarqueeStatic: $('set-marquee-static'),
    setVisColors: $('set-vis-colors'),
    setCat: $('set-cat'),
    tuneBeat: $('tune-beat'),
    tuneGroove: $('tune-groove'),
    tuneEqH: $('tune-eq-h'),
    tuneEqC: $('tune-eq-c'),
    tuneEqB: $('tune-eq-b'),
    tuneEqG: $('tune-eq-g'),
    tuneEqCaps: $('tune-eq-caps'),
    tuneReset: $('tune-reset'),
    cat: $('cat'),
    fileInput: $('file-input'),
    dropZone: $('drop-zone'),
    localAudio: $('local-audio'),
    tpDl: $('tp-dl'),
    tpFav: $('tp-fav'),
    plAdd: $('pl-add'),
    min: $('btn-min'),
    close: $('btn-close'),
    titlebar: $('titlebar'),
    vis: $('vis'),
    lcd: $('lcd-time'),
    kbps: $('kbps'),
    khz: $('khz'),
    chan: $('chan'),
    title: $('track-title'),
    marquee: $('marquee'),
    posbar: $('posbar'),
    posFill: $('pos-fill'),
    posThumb: $('pos-thumb'),
    volbar: $('volbar'),
    volFill: $('vol-fill'),
    volThumb: $('vol-thumb'),
    tpPrev: $('tp-prev'),
    tpPlay: $('tp-play'),
    tpPause: $('tp-pause'),
    tpStop: $('tp-stop'),
    tpNext: $('tp-next'),
    tpShuffle: $('tp-shuffle'),
    tpRepeat: $('tp-repeat'),
    tpRadio: $('tp-radio'),
    names: $('pl-names'),
    plLibSection: $('pl-lib-section'),
    recsSection: $('recs-section'),
    recsNames: $('recs-names'),
    recsRefresh: $('recs-refresh'),
    tracks: $('pl-tracks'),
    foot: $('pl-foot'),
    q: $('q'),
    qGo: $('q-go'),
    qMode: $('q-mode'),
    queuePanel: $('queue-panel'),
    queueList: $('queue-list'),
    queueFoot: $('queue-foot'),
    qClear: $('q-clear'),
    plSidebar: $('pl-sidebar'),
    plSearch: $('pl-search'),
    queueSection: $('queue-section'),
    aqSection: $('aq-section'),
    aqList: $('aq-list'),
    aqFoot: $('aq-foot'),
    aqToggle: $('aq-toggle'),
    aqPresets: $('aq-presets'),
    aqInput: $('aq-input'),
    aqAddBtn: $('aq-add-btn'),
    slSection: $('sl-section'),
    splitSidebar: $('split-sidebar'),
    splitQueue: $('split-queue'),
    splitMain: $('split-main'),
    mainDisplay: $('main-display'),
    pledToggles: $('pled-toggles'),
    keysBtn: $('keys-btn'),
    keysPop: $('keys-pop'),
    modal: $('modal'),
    modalMsg: $('modal-msg'),
    modalInput: $('modal-input'),
    modalOk: $('modal-ok'),
    modalCancel: $('modal-cancel'),
    slSelect: $('sl-select'),
    slSave: $('sl-save'),
    slLoad: $('sl-load'),
    slPlay: $('sl-play'),
    slRename: $('sl-rename'),
    slDel: $('sl-del'),
    slPush: $('sl-push'),
    ctx: $('ctx-menu'),
    toast: $('toast'),
    auth: $('auth'),
    authGoogle: $('auth-google'),
    authHeaders: $('auth-headers'),
    authConnect: $('auth-connect'),
    authMsg: $('auth-msg'),
    authSkip: $('auth-skip'),
  };

  // ---- state ------------------------------------------------------------
  const state = {
    list: [], // what's shown in the track pane
    queue: [], // what's actually playing
    qi: -1,
    shuffle: false,
    repeat: 'off', // off | all | one
    radio: false,
    // LCD time readout: 'elapsed' | 'remaining' | 'both' (click the LCD to
    // cycle, or ⚙ → Playback). Persisted as retro.timeMode.
    timeMode: (() => {
      const m = localStorage.getItem('retro.timeMode');
      return m === 'remaining' || m === 'both' ? m : 'elapsed';
    })(),
    // marquee: scroll prev·NOW·next (false) or a static NOW-only bar (true)
    marqueeStatic: localStorage.getItem('retro.marqueeStatic') === '1',
    authed: false,
    lists: [], // session lists: [{ id, name, tracks: [] }]
    activeListId: null,
    plView: null, // { id, title, owned, isLM } when a real playlist is open in
    //              the pane — drives the remove-× / drag-reorder controls
    originTracks: [], // the search/playlist that started this queue — radio
    //                   drains the rest of these before falling back to a
    //                   seeded station
    artistMix: [], // [{ id, name }] — ARTIST MIX pool
    artistMixOn: false, // shuffle random songs from artistMix into the queue
  };

  // videoActive: a CRT video is the current playback context (playing OR
  //   paused) — the transport buttons, space, volume slider and LCD target it.
  // videoPlaying: it's actually rolling right now — drives the visualiser.
  let videoActive = false;
  let videoPlaying = false;

  // localActive / localPlaying are the same idea for imported audio files,
  // which play through <audio id="local-audio"> instead of RetroPlayer.
  let localActive = false;
  let localPlaying = false;
  const localImports = []; // [{ id, name, url }] — settings list + cleanup
  const localTracks = []; // track objects for imported files (shown in the pane)
  let dlDir = localStorage.getItem('retro.dlDir') || ''; // '' = default (~/Downloads/Retro YTM)
  let cacheKeep = localStorage.getItem('retro.keepCache') === '1';
  let cacheCapMB = +localStorage.getItem('retro.cacheCapMB') || 500;
  let keepQueue = localStorage.getItem('retro.keepQueue') === '1'; // restore queue on startup
  const LS_SESSION = 'retro.session';
  // ⚙ "Cap the queue" — 0 = no limit; otherwise trim already-played tracks off
  // the front once state.queue outgrows this (see trimQueue()). Default 250.
  let queueCap = (() => {
    const v = localStorage.getItem('retro.queueCap');
    return v == null ? 250 : +v || 0;
  })();
  let combineTransport = localStorage.getItem('retro.combineTransport') === '1'; // one play/pause button
  const LA = el.localAudio;

  // ---- helpers --------------------------------------------------------
  const mmss = (s) => {
    s = Math.max(0, Math.round(s || 0));
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };
  const durSecs = (t) =>
    t.durationSeconds ||
    (t.duration
      ? t.duration.split(':').reduce((a, p) => a * 60 + (+p || 0), 0)
      : 0);

  // ---- listening stats (localStorage['retro.stats']) --------------------
  // Written here, read by the standalone stats window (same origin). A track
  // is a "play" once ≥30 s OR ≥50 % has actually been listened to; anything
  // abandoned under 30 s counts as a skip. Time is wall-clock between ticks,
  // so seeks / pauses / tab-throttling (gap > 4 s) are simply not counted.
  const STATS_KEY = 'retro.stats';
  const STAT_PLAY_MS = 30000;
  let stats = statLoad();
  let statCur = null; // { videoId, title, artists, dur, listened, counted }
  let statTs = 0;
  function statLoad() {
    try {
      const s = JSON.parse(localStorage.getItem(STATS_KEY));
      if (s && s.tracks) {
        if (!s.daily) s.daily = {};
        if (!s.plays) s.plays = [];
        if (typeof s.totalMs !== 'number') s.totalMs = 0;
        return s;
      }
    } catch (_) {}
    return { v: 2, tracks: {}, daily: {}, plays: [], totalMs: 0 };
  }
  let statSaveT = null;
  function statSave(now) {
    clearTimeout(statSaveT);
    const write = () => {
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      } catch (_) {}
    };
    if (now) write();
    else statSaveT = setTimeout(write, 800);
  }
  const statDayKey = (d) => {
    d = d || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  };
  function statRec(c) {
    return (
      stats.tracks[c.videoId] ||
      (stats.tracks[c.videoId] = {
        title: c.title,
        artists: c.artists,
        artistId: c.artistId || null,
        plays: 0,
        skips: 0,
        ms: 0,
        first: Date.now(),
        last: Date.now(),
      })
    );
  }
  // close out the current track: bank listened time, count a skip if it never
  // reached the play threshold
  function statFlush() {
    const c = statCur;
    statCur = null;
    if (!c || c.listened < 1000) return;
    const r = statRec(c);
    r.title = c.title;
    r.artists = c.artists;
    if (c.artistId) r.artistId = c.artistId;
    r.ms += c.listened;
    r.last = Date.now();
    if (!c.counted && c.listened < STAT_PLAY_MS) r.skips++;
    stats.totalMs += c.listened;
    const dk = statDayKey();
    stats.daily[dk] = (stats.daily[dk] || 0) + c.listened;
    statSave();
  }
  function statStart(t) {
    statFlush();
    if (!t || !t.videoId) return;
    statCur = {
      videoId: t.videoId,
      title: t.title || '?',
      artists: t.artists || '',
      artistId: t.artistId || null,
      dur: (durSecs(t) || 0) * 1000,
      listened: 0,
      counted: false,
    };
    statTs = Date.now();
  }
  function statTick() {
    if (!statCur) return;
    const now = Date.now();
    const dt = now - statTs;
    statTs = now;
    if (dt <= 0 || dt > 4000) return; // seek / pause / throttle — ignore the gap
    statCur.listened += dt;
    if (
      !statCur.counted &&
      (statCur.listened >= STAT_PLAY_MS ||
        (statCur.dur > 0 && statCur.listened >= statCur.dur * 0.5))
    ) {
      statCur.counted = true;
      statRec(statCur).plays++;
      stats.plays.push({ v: statCur.videoId, t: Date.now() });
      if (stats.plays.length > 4200) stats.plays = stats.plays.slice(-4000);
      statSave();
    }
  }
  window.addEventListener('beforeunload', () => {
    statFlush();
    statSave(true);
    saveSession(true); // final flush of queue + position for "restore on startup"
  });

  // ---- marquee ------------------------------------------------------
  // The scrolling bar shows prev · NOW · next when the passed track is the
  // live queue track. For anything else (CRT video, boot message, nothing
  // playing) it falls back to the single-label form. Shuffle makes the
  // neighbours unpredictable, so it collapses to NOW-only with a ⤨ marker.
  let lastNowTrack = null; // so a settings toggle can repaint the marquee
  function setNowPlaying(t) {
    lastNowTrack = t;
    el.marquee.classList.toggle('static', !!state.marqueeStatic);
    const seg = (tr) =>
      escapeHtml(`${tr.artists ? tr.artists + ' — ' : ''}${tr.title || '?'}`);
    const q = state.queue;
    const qi = state.qi;
    const onQueue =
      !!t &&
      qi >= 0 &&
      !!q[qi] &&
      (t === q[qi] || (t.videoId && t.videoId === q[qi].videoId));

    let html;
    if (!t) {
      html = `<span class="mq-now">◄►&nbsp;&nbsp;YouTube Music</span>`;
    } else if (onQueue && !state.shuffle && q.length > 1) {
      const sep = `<span class="mq-sep">•</span>`;
      const pv = q[qi - 1];
      const nx = q[qi + 1];
      if (state.marqueeStatic) {
        // static bar keeps prev/next too — a 2-line stack (NOW on top, dim
        // prev · next beneath), no scroll. CSS grows .marquee to fit.
        const nb = [];
        if (pv) nb.push(`<span class="mq-side">◄ ${seg(pv)}</span>`);
        if (nx) nb.push(`<span class="mq-side">${seg(nx)} ►</span>`);
        html =
          `<span class="mq-l1 mq-now">◄►&nbsp;&nbsp;${seg(t)}</span>` +
          (nb.length ? `<span class="mq-l2">${nb.join(sep)}</span>` : '');
      } else {
        const bits = [];
        if (pv) bits.push(`<span class="mq-side">◄ ${seg(pv)}</span>`);
        bits.push(`<span class="mq-now">◄►&nbsp;&nbsp;${seg(t)}</span>`);
        if (nx) bits.push(`<span class="mq-side">${seg(nx)} ►</span>`);
        html = bits.join(sep);
      }
    } else {
      const tag = onQueue && state.shuffle ? '⤨&nbsp;&nbsp;' : '◄►&nbsp;&nbsp;';
      html = `<span class="mq-now">${tag}${seg(t)}</span>`;
    }
    el.title.innerHTML = html + (state.marqueeStatic ? '' : '&nbsp;&nbsp;&nbsp;&nbsp;');
    el.title.classList.remove('scroll');
    el.title.style.animationDuration = '';
    if (state.marqueeStatic) return; // no scroll, CSS centres + ellipsises it
    // let layout settle, then decide if it needs to scroll
    requestAnimationFrame(() => {
      if (el.title.scrollWidth > el.marquee.clientWidth + 4) {
        // keep the scroll speed roughly constant however much text there is
        const secs = Math.min(48, Math.max(12, Math.round(el.title.scrollWidth / 42)));
        el.title.style.animationDuration = secs + 's';
        el.title.classList.add('scroll');
      }
    });
  }
  el.marquee.classList.toggle('static', state.marqueeStatic); // pre-paint state

  // makes any track-pane <li> draggable onto the queue — shared by song rows
  // and video rows so they behave identically
  function makeRowDraggable(li, track) {
    li.draggable = true;
    li.addEventListener('dragstart', (e) => {
      dragPayload = {
        kind: 'track',
        track,
        // for drag-reorder inside an open playlist
        fromPlId: state.plView ? state.plView.id : null,
        setVideoId: track.setVideoId || null,
      };
      e.dataTransfer.effectAllowed = 'copy';
      try {
        e.dataTransfer.setData('text/plain', trackLabel(track));
      } catch (_) {}
    });
    li.addEventListener('dragend', () => {
      dragPayload = null;
      el.queuePanel.classList.remove('drop-active');
      el.tracks
        .querySelectorAll('.reorder-hot')
        .forEach((n) => n.classList.remove('reorder-hot'));
      el.names
        .querySelectorAll('.drop-hot')
        .forEach((n) => n.classList.remove('drop-hot'));
    });
  }

  // ---- track pane render ------------------------------------------
  // plView (optional): { id, title, owned, isLM } — set when the pane is
  // showing a real YT playlist. `owned` unlocks drag-reorder + the remove-×;
  // `isLM` shows the × too (routed through un-favourite). Any renderTracks
  // call without it (search, recs, session lists) clears the playlist view.
  function renderTracks(tracks, heading, plView) {
    state.list = tracks;
    state.plView = plView || null;
    const editable = !!plView && (plView.owned || plView.isLM);
    el.tracks.innerHTML = '';
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.dataset.i = i;
      if (t.isAvailable === false) li.classList.add('dead');
      li.innerHTML =
        `<span class="t-title">${t.isVideo ? '<span class="q-vid">▶</span> ' : ''}${escapeHtml(
          (t.artists ? t.artists + ' — ' : '') + (t.title || '?')
        )}</span>` +
        `<span class="t-dur">${t.duration || mmss(durSecs(t))}</span>` +
        `<button class="t-add" title="Add to queue">＋</button>` +
        (editable ? `<button class="t-rm" title="Remove from playlist">×</button>` : '');
      li.addEventListener('dblclick', () => {
        state.queue = tracks.slice();
        state.originTracks = tracks;
        playAt(i);
      });
      li.querySelector('.t-add').addEventListener('click', (e) => {
        e.stopPropagation();
        // adding the first track from a fresh pane → radio should draw from
        // the whole pane, not just this one song
        if (!state.queue.length) state.originTracks = tracks;
        enqueue(t, 'end');
      });
      if (editable)
        li.querySelector('.t-rm').addEventListener('click', (e) => {
          e.stopPropagation();
          removeFromPl(t, i);
        });
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        trackMenu(e, t, { from: 'pane', list: tracks, index: i });
      });
      makeRowDraggable(li, t);
      // drag-reorder within an owned playlist
      if (plView && plView.owned) {
        li.addEventListener('dragover', (e) => {
          if (!dragPayload || dragPayload.fromPlId !== plView.id) return;
          e.preventDefault();
          li.classList.add('reorder-hot');
        });
        li.addEventListener('dragleave', () => li.classList.remove('reorder-hot'));
        li.addEventListener('drop', (e) => {
          if (!dragPayload || dragPayload.fromPlId !== plView.id) return;
          e.preventDefault();
          e.stopPropagation();
          li.classList.remove('reorder-hot');
          reorderInPl(dragPayload.setVideoId, t.setVideoId);
        });
      }
      el.tracks.appendChild(li);
    });
    const total = tracks.reduce((a, t) => a + durSecs(t), 0);
    el.foot.textContent =
      `${heading ? heading + '  ·  ' : ''}${tracks.length} tracks  ·  ${mmss(
        total
      )}`;
    highlightPlaying();
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function highlightPlaying() {
    const cur = state.queue[state.qi];
    [...el.tracks.children].forEach((li) => {
      const t = state.list[+li.dataset.i];
      li.classList.toggle('playing', !!cur && t && t.videoId === cur.videoId);
    });
    markQueueCurrent();
    updateDlBtn();
    updateFavBtn();
  }

  // the transport download button makes sense for any real YouTube track
  // (incl. one currently streamed as audio), but not an imported local file
  function updateDlBtn() {
    const t = state.queue[state.qi];
    const ok =
      !!t && !!t.videoId && !t.videoId.startsWith('local:') && !videoActive;
    el.tpDl.style.display = ok ? '' : 'none';
  }

  // ---- ★ favourites — wired straight to YTM's "Liked Music" (LM) ----------
  // No local store: liked songs land in the LM virtual playlist the sidebar
  // already shows, so shuffling them later is just "open LM → shuffle".
  // likedIds is a best-effort mirror — seeded when LM is opened, and kept in
  // sync on every toggle (ytmusicapi has no cheap single-song like lookup).
  const likedIds = new Set();

  function updateFavBtn() {
    const t = state.queue[state.qi];
    const ok =
      !!t &&
      !!t.videoId &&
      !t.videoId.startsWith('local:') &&
      !videoActive &&
      state.authed;
    el.tpFav.style.display = ok ? '' : 'none';
    if (!ok) return;
    const liked = likedIds.has(t.videoId);
    el.tpFav.classList.toggle('on', liked);
    el.tpFav.textContent = liked ? '★' : '☆';
    el.tpFav.title = liked ? 'Remove from Liked Music' : 'Add to Liked Music';
  }

  // like/un-like a track; throws on failure so callers can toast it
  async function rateTrack(t, like) {
    if (!t || !t.videoId || t.videoId.startsWith('local:')) return;
    await API.rate(t.videoId, like ? 'LIKE' : 'INDIFFERENT');
    if (like) likedIds.add(t.videoId);
    else likedIds.delete(t.videoId);
    toast(like ? '★ added to Liked Music' : '☆ removed from Liked Music');
    updateFavBtn();
  }

  async function toggleFav() {
    const t = state.queue[state.qi];
    if (!t || !t.videoId || t.videoId.startsWith('local:') || !state.authed) return;
    el.tpFav.disabled = true;
    try {
      await rateTrack(t, !likedIds.has(t.videoId));
    } catch (e) {
      toast('rating failed: ' + (e.message || e));
    } finally {
      el.tpFav.disabled = false;
    }
  }

  // ---- queue panel -------------------------------------------
  function trackLabel(t) {
    return (t.artists ? t.artists + ' — ' : '') + (t.title || '?');
  }

  // ⚙ "Cap the queue": once state.queue outgrows queueCap, drop already-played
  // tracks off the front (never anything at or after state.qi) and slide qi +
  // the playHist stack to match. Trimmed tracks fall out of "previous" reach —
  // that's the documented trade-off (HANDOFF §5b).
  function trimQueue() {
    if (!queueCap || state.queue.length <= queueCap) return;
    const drop = Math.min(state.queue.length - queueCap, Math.max(0, state.qi));
    if (drop <= 0) return;
    const removed = new Set(state.queue.splice(0, drop));
    state.qi -= drop;
    for (let i = playHist.length - 1; i >= 0; i--)
      if (removed.has(playHist[i])) playHist.splice(i, 1);
  }

  function renderQueue() {
    trimQueue();
    el.queueList.innerHTML = '';
    state.queue.forEach((t, i) => {
      const li = document.createElement('li');
      li.dataset.i = i;
      li.draggable = true;
      if (i === state.qi) li.classList.add('current');
      else if (i < state.qi) li.classList.add('past');
      li.innerHTML =
        `<span class="q-grip">⋮⋮</span>` +
        `<span class="q-title">${t.isVideo ? '<span class="q-vid">▶</span> ' : ''}${escapeHtml(
          trackLabel(t)
        )}</span>` +
        `<button class="q-rm" title="Remove">×</button>`;
      li.addEventListener('dblclick', () => playAt(i));
      li.querySelector('.q-rm').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromQueue(i);
      });
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        trackMenu(e, t, { from: 'queue', index: i });
      });
      li.addEventListener('dragstart', (e) => {
        dragPayload = { kind: 'queue', index: i };
        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        li.classList.add('dragover');
      });
      li.addEventListener('dragleave', () => li.classList.remove('dragover'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.remove('dragover');
        handleQueueDrop(i);
      });
      el.queueList.appendChild(li);
    });
    const upcoming = state.queue.slice(state.qi + 1);
    const left = upcoming.reduce((a, t) => a + durSecs(t), 0);
    el.queueFoot.textContent = state.queue.length
      ? `${state.queue.length} tracks · ${upcoming.length} up next · ${mmss(left)} left`
      : 'drop tracks here';
    saveSession(); // ⚙ "Restore queue on startup" — debounced, no-op when off
  }
  let dragPayload = null;

  // ---- session persistence — ⚙ "Restore queue on startup" ---------------
  // Saves the queue + current index + playback position to localStorage so the
  // app can reopen where you left off (paused). Imported local files are
  // dropped — their object URLs die on exit.
  const SESSION_KEYS = [
    'videoId', 'title', 'artists', 'album',
    'duration', 'durationSeconds', 'thumbnail', 'artistId', 'setVideoId', 'isVideo',
  ];
  // an imported local file (videoId "local:N") can't be restored — its object
  // URL dies on exit. A *streamed* YT track carries isLocal too but has a real
  // videoId, so it restores fine (it just re-fetches), hence the id-only test.
  const isLocalTrack = (t) => !t || !t.videoId || String(t.videoId).startsWith('local:');
  let sessionSaveT = 0;
  function saveSession(immediate) {
    if (!keepQueue) return;
    // don't overwrite a saved position with 0 before the user resumes it
    if (resumePending && !P.snapshot().playing && !localPlaying) return;
    clearTimeout(sessionSaveT);
    const run = () => {
      const kept = [];
      let qi = -1;
      let curKept = false;
      state.queue.forEach((t, i) => {
        if (isLocalTrack(t)) return;
        if (i === state.qi) {
          qi = kept.length;
          curKept = true;
        }
        const o = {};
        for (const k of SESSION_KEYS) if (t[k] != null) o[k] = t[k];
        kept.push(o);
      });
      // empty queue → leave the last saved session alone (the app boots with an
      // empty queue transiently, and a stopped player isn't "forget my queue").
      // The session is only dropped when the user turns the option off.
      if (!kept.length) return;
      if (qi < 0) qi = 0; // current track was a local file → start at the top
      let pos = 0;
      if (curKept) {
        pos = localActive ? LA.currentTime || 0 : P.snapshot().cur || 0;
        if (!isFinite(pos) || pos < 0) pos = 0;
      }
      try {
        localStorage.setItem(
          LS_SESSION,
          JSON.stringify({ v: 1, queue: kept, qi, pos, ts: Date.now() })
        );
      } catch (_) {}
    };
    immediate ? run() : (sessionSaveT = setTimeout(run, 1200));
  }

  let resumePending = false; // a restored queue is cued but not yet played
  let sessionRestored = false; // stays true for the session — guards boot messaging
  let resumePos = 0;
  function restoreSession() {
    if (!keepQueue) return false;
    let s;
    try { s = JSON.parse(localStorage.getItem(LS_SESSION)); } catch (_) {}
    if (!s || !Array.isArray(s.queue) || !s.queue.length) return false;
    sessionRestored = true;
    state.queue = s.queue.map((t) => ({ ...t, isAvailable: true }));
    state.qi = Math.max(0, Math.min(state.queue.length - 1, s.qi | 0));
    state.originTracks = state.queue.slice();
    resumePos = Math.max(0, +s.pos || 0);
    resumePending = true;
    renderQueue();
    highlightPlaying();
    setNowPlaying(state.queue[state.qi]);
    el.kbps.textContent = '256';
    el.khz.textContent = '48';
    toast('↺ queue restored — press Play to resume');
    return true;
  }
  // once the YT IFrame player is ready, cue the restored track at its position
  function cueResumeIfPending() {
    if (!resumePending) return;
    const t = state.queue[state.qi];
    if (t && t.videoId && !isLocalTrack(t)) {
      try { P.cue(t.videoId, resumePos); } catch (_) {}
    } else {
      resumePending = false;
    }
  }
  // the user's first Play on a restored queue: take ownership + start stats
  function consumeResume() {
    if (!resumePending) return;
    resumePending = false;
    const t = state.queue[state.qi];
    if (t) statStart(t);
  }
  let lastPosSave = 0;
  function maybeSaveSessionPos() {
    if (!keepQueue) return;
    const now = Date.now();
    if (now - lastPosSave < 5000) return;
    lastPosSave = now;
    saveSession(true);
  }

  // drops onto empty queue space / below the last row → append
  el.queueList.addEventListener('dragover', (e) => {
    if (!dragPayload) return;
    e.preventDefault();
    el.queuePanel.classList.add('drop-active');
  });
  el.queueList.addEventListener('dragleave', (e) => {
    if (e.target === el.queueList) el.queuePanel.classList.remove('drop-active');
  });
  el.queueList.addEventListener('drop', (e) => {
    e.preventDefault();
    el.queuePanel.classList.remove('drop-active');
    if (!e.target.closest('li')) handleQueueDrop(state.queue.length);
  });

  function handleQueueDrop(to) {
    const p = dragPayload;
    dragPayload = null;
    el.queuePanel.classList.remove('drop-active');
    if (!p) return;
    if (p.kind === 'queue') {
      if (p.index !== to) moveInQueue(p.index, Math.min(to, state.queue.length - 1));
    } else if (p.kind === 'track') {
      insertInQueue(p.track, to);
    }
  }

  function insertInQueue(track, at) {
    if (!track || !track.videoId) return;
    if (!state.queue.length) {
      state.queue = [track];
      if (!state.originTracks.length) state.originTracks = [track];
      playAt(0);
      return;
    }
    at = Math.max(0, Math.min(at, state.queue.length));
    state.queue.splice(at, 0, track);
    if (at <= state.qi) state.qi++;
    renderQueue();
    highlightPlaying();
    toast('Added to queue');
  }

  function markQueueCurrent() {
    [...el.queueList.children].forEach((li) => {
      const i = +li.dataset.i;
      li.classList.toggle('current', i === state.qi);
      li.classList.toggle('past', i < state.qi);
    });
  }

  function enqueue(track, mode) {
    if (!track || !track.videoId) return;
    if (!state.queue.length) {
      state.queue = [track];
      if (!state.originTracks.length) state.originTracks = [track];
      playAt(0);
      return;
    }
    const at =
      mode === 'next' || mode === 'now'
        ? Math.max(state.qi + 1, 0)
        : state.queue.length;
    state.queue.splice(at, 0, track);
    if (mode === 'now') {
      playAt(at);
    } else {
      renderQueue();
      toast(mode === 'next' ? 'Playing next' : 'Added to queue');
    }
  }

  function removeFromQueue(i) {
    if (i < 0 || i >= state.queue.length) return;
    state.queue.splice(i, 1);
    if (i < state.qi) state.qi--;
    else if (i === state.qi) state.qi = Math.min(state.qi, state.queue.length - 1);
    renderQueue();
    highlightPlaying();
  }

  function moveInQueue(from, to) {
    const [item] = state.queue.splice(from, 1);
    state.queue.splice(to, 0, item);
    // keep state.qi pointing at the same playing track
    if (from === state.qi) state.qi = to;
    else {
      if (from < state.qi) state.qi--;
      if (to <= state.qi) state.qi++;
    }
    renderQueue();
  }

  function clearQueue() {
    const cur = state.qi >= 0 ? state.queue[state.qi] : null;
    state.queue = cur ? [cur] : [];
    state.qi = cur ? 0 : -1;
    if (!state.queue.length) state.originTracks = [];
    renderQueue();
    highlightPlaying();
  }
  el.qClear.onclick = clearQueue;

  // ---- session lists ---------------------------------------
  const LS_LISTS = 'retro.lists';
  function loadLists() {
    try {
      state.lists = JSON.parse(localStorage.getItem(LS_LISTS)) || [];
    } catch (_) {
      state.lists = [];
    }
  }
  function saveLists() {
    try {
      localStorage.setItem(LS_LISTS, JSON.stringify(state.lists));
    } catch (_) {}
  }
  const activeList = () => state.lists.find((l) => l.id === state.activeListId);

  function renderListUI() {
    el.slSelect.innerHTML = '';
    if (!state.lists.length) {
      el.slSelect.innerHTML = '<option value="">— no lists —</option>';
    } else {
      state.lists.forEach((l) => {
        const o = document.createElement('option');
        o.value = l.id;
        o.textContent = `${l.name} (${l.tracks.length})`;
        el.slSelect.appendChild(o);
      });
      if (!activeList()) state.activeListId = state.lists[0].id;
      el.slSelect.value = state.activeListId;
    }
    const has = !!activeList();
    [el.slLoad, el.slPlay, el.slRename, el.slDel].forEach(
      (b) => (b.disabled = !has)
    );
    el.slPush.disabled = !has || !state.authed || !activeList().tracks.length;
  }

  function newList(name, tracks) {
    const l = { id: 'L' + Date.now().toString(36), name, tracks: tracks || [] };
    state.lists.push(l);
    state.activeListId = l.id;
    saveLists();
    renderListUI();
    return l;
  }
  function addToList(listId, track) {
    const l = state.lists.find((x) => x.id === listId);
    if (!l || !track || !track.videoId) return;
    if (l.tracks.some((t) => t.videoId === track.videoId)) {
      toast('Already in ' + l.name);
      return;
    }
    l.tracks.push(track);
    saveLists();
    renderListUI();
    toast('Added to ' + l.name);
  }

  el.slSelect.onchange = () => {
    state.activeListId = el.slSelect.value;
    renderListUI();
  };
  el.slSave.onclick = async () => {
    if (!state.queue.length) return toast('Queue is empty');
    const name = await askText(
      'Name this list:',
      'Session ' + (state.lists.length + 1)
    );
    if (name) newList(name, state.queue.slice());
  };
  el.slLoad.onclick = () => {
    const l = activeList();
    if (!l) return;
    renderTracks(l.tracks.slice(), 'list: ' + l.name);
    setActiveName(null);
  };
  el.slPlay.onclick = () => {
    const l = activeList();
    if (l && l.tracks.length) {
      state.queue = l.tracks.slice();
      state.originTracks = l.tracks.slice();
      playAt(0);
    }
  };
  el.slRename.onclick = async () => {
    const l = activeList();
    if (!l) return;
    const name = await askText('Rename list:', l.name);
    if (name) {
      l.name = name;
      saveLists();
      renderListUI();
    }
  };
  el.slDel.onclick = async () => {
    const l = activeList();
    if (l && (await askConfirm(`Delete list "${l.name}"?`))) {
      state.lists = state.lists.filter((x) => x.id !== l.id);
      state.activeListId = state.lists[0] ? state.lists[0].id : null;
      saveLists();
      renderListUI();
    }
  };
  el.slPush.onclick = async () => {
    const l = activeList();
    if (!l || !l.tracks.length) return;
    if (
      !(await askConfirm(
        `Create YouTube Music playlist "${l.name}" with ${l.tracks.length} tracks?`
      ))
    )
      return;
    el.slPush.disabled = true;
    toast('Creating playlist…');
    try {
      const vids = l.tracks
        .map((t) => t.videoId)
        .filter((v) => v && !v.startsWith('local:'));
      const res = await API.createPlaylist(l.name, vids);
      toast(`Created "${res.title}" (${res.count}) ✓`);
      loadPlaylists();
    } catch (e) {
      toast('Failed: ' + (e.message || e));
    } finally {
      renderListUI();
    }
  };

  // ---- right-click menu -----------------------------------
  function closeCtx() {
    el.ctx.classList.add('hidden');
    el.ctx.innerHTML = '';
  }
  document.addEventListener('click', closeCtx);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeCtx());

  function showCtx(ev, items) {
    el.ctx.innerHTML = '';
    items.forEach((it) => {
      if (it === '-') {
        el.ctx.appendChild(document.createElement('hr'));
        return;
      }
      if (it.label && !it.fn) {
        const s = document.createElement('div');
        s.className = 'ctx-label';
        s.textContent = it.label;
        el.ctx.appendChild(s);
        return;
      }
      const b = document.createElement('button');
      b.textContent = it.label;
      if (it.disabled) b.disabled = true;
      else
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          closeCtx();
          it.fn();
        });
      el.ctx.appendChild(b);
    });
    el.ctx.classList.remove('hidden');
    const { innerWidth: W, innerHeight: H } = window;
    const r = el.ctx.getBoundingClientRect();
    el.ctx.style.left = Math.min(ev.clientX, W - r.width - 6) + 'px';
    el.ctx.style.top = Math.min(ev.clientY, H - r.height - 6) + 'px';
  }

  function trackMenu(ev, t, ctxInfo) {
    const items = [
      { label: 'Play now', fn: () => {
          if (ctxInfo.from === 'queue') playAt(ctxInfo.index);
          else if (t.isVideo) enqueue(t, 'now'); // don't replace the queue with one video
          else {
            const src = ctxInfo.list || [t];
            state.queue = src.slice();
            state.originTracks = src;
            playAt(ctxInfo.index || 0);
          }
        } },
      { label: 'Play next', fn: () => enqueue(t, 'next') },
      { label: 'Add to queue', fn: () => enqueue(t, 'end') },
    ];
    if (t.videoId && !t.videoId.startsWith('local:'))
      items.push({
        label: '▶ Play anyway (fetch audio)',
        fn: () => {
          let target = t;
          if (ctxInfo.from === 'queue') {
            state.qi = ctxInfo.index;
            target = state.queue[state.qi];
          } else {
            const src = ctxInfo.list || [t];
            state.queue = src.slice();
            state.originTracks = src;
            state.qi = ctxInfo.index || 0;
            target = state.queue[state.qi];
          }
          delete target._streamed; // force a fresh attempt
          streamTrack(target);
        },
      });
    if (t.videoId && !t.videoId.startsWith('local:') && state.authed) {
      const liked = likedIds.has(t.videoId);
      items.push('-', {
        label: liked ? '★ Remove from Liked Music' : '☆ Add to Liked Music',
        fn: () =>
          rateTrack(t, !liked).catch((e) =>
            toast('rating failed: ' + (e.message || e))
          ),
      });
    }
    if (
      ctxInfo.from === 'pane' &&
      state.plView &&
      (state.plView.owned || state.plView.isLM) &&
      typeof ctxInfo.index === 'number'
    ) {
      items.push('-', {
        label: `✕ Remove from "${state.plView.title}"`,
        fn: () => removeFromPl(t, ctxInfo.index),
      });
    }
    if (ctxInfo.watch)
      items.push('-', { label: '▶ Open in video window', fn: ctxInfo.watch });
    if (t.isVideo && window.retro && window.retro.openExternal)
      items.push({
        label: '↗ Open on YouTube',
        fn: () =>
          window.retro.openExternal(
            'https://www.youtube.com/watch?v=' + t.videoId
          ),
      });
    items.push('-', { label: 'Add to list' });
    state.lists.forEach((l) =>
      items.push({ label: '   ' + l.name, fn: () => addToList(l.id, t) })
    );
    items.push({
      label: '   ＋ New list…',
      fn: async () => {
        const name = await askText(
          'New list name:',
          'Session ' + (state.lists.length + 1)
        );
        if (name) newList(name, [t]);
      },
    });
    if (ctxInfo.from === 'queue') {
      items.push('-', {
        label: 'Remove from queue',
        fn: () => removeFromQueue(ctxInfo.index),
      });
    }
    showCtx(ev, items);
  }

  // ---- toast ---------------------------------------------
  let toastT = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.toast.classList.remove('show'), 2200);
  }

  // ---- modal (Electron has no window.prompt) -------------
  function openModal({ msg, value, withInput }) {
    return new Promise((resolve) => {
      el.modalMsg.textContent = msg;
      el.modalInput.style.display = withInput ? '' : 'none';
      el.modalInput.value = value || '';
      el.modal.classList.remove('hidden');
      if (withInput) {
        el.modalInput.focus();
        el.modalInput.select();
      } else el.modalOk.focus();
      const finish = (val) => {
        el.modal.classList.add('hidden');
        el.modalOk.removeEventListener('click', ok);
        el.modalCancel.removeEventListener('click', cancel);
        el.modal.removeEventListener('keydown', key);
        resolve(val);
      };
      const ok = () =>
        finish(withInput ? el.modalInput.value.trim() || null : true);
      const cancel = () => finish(withInput ? null : false);
      const key = (e) => {
        if (e.key === 'Enter') (e.preventDefault(), ok());
        else if (e.key === 'Escape') (e.preventDefault(), cancel());
      };
      el.modalOk.addEventListener('click', ok);
      el.modalCancel.addEventListener('click', cancel);
      el.modal.addEventListener('keydown', key);
    });
  }
  const askText = (msg, value) => openModal({ msg, value, withInput: true });
  const askConfirm = (msg) => openModal({ msg, withInput: false });

  // ---- playback control ----------------------------------------
  // tracks actually played, newest last — so "previous" means the song you were
  // just listening to, not queue[qi-1] (which is wrong under shuffle, and was
  // the "prev doesn't go back" bug).
  const playHist = [];
  function playAt(i, fromHist) {
    if (i < 0 || i >= state.queue.length) return;
    resumePending = false; // any explicit play supersedes a restored-but-unplayed queue
    const outgoing = state.qi >= 0 ? state.queue[state.qi] : null;
    if (!fromHist && outgoing && state.qi !== i) {
      playHist.push(outgoing);
      if (playHist.length > 200) playHist.shift();
    }
    state.qi = i;
    const t = state.queue[i];
    if (!t || !t.videoId) return next();
    statStart(t); // begin tracking this track for the stats window
    stopVideoIfPlaying(); // starting a track stops the CRT video
    if (t.isLocal) {
      playLocal(t);
    } else if (streamAll && !t._streamed) {
      // "stream everything" mode — fetch this track's audio and play it
      // locally so the analyser can see it. streamTrack() does its own
      // renderQueue/highlight/prefetch; the tail below re-runs them harmlessly.
      stopLocalIfPlaying();
      streamTrack(t, true);
    } else {
      stopLocalIfPlaying(); // …and any imported file
      P.load(t.videoId);
      setNowPlaying(t);
      el.kbps.textContent = '256';
      el.khz.textContent = '48';
    }
    renderQueue();
    highlightPlaying();
    maybeExtendRadio();
    maybeExtendArtistMix();
    prefetchNextIfBlocked();
    kickVis(); // a new track is starting — make sure the visualiser loop is live
  }

  // imported-file playback: hand off from the YT player to <audio>
  function playLocal(t) {
    try { P.pause(); } catch (_) {}
    localActive = true;
    localPlaying = false;
    try {
      LA.src = t.localUrl;
      LA.volume = loadVol() / 100;
      wireLocalAnalyser();
      LA.play().catch(() => {});
    } catch (_) {}
    setNowPlaying(t);
    el.kbps.textContent = t.viaStream ? 'YT' : 'MP3';
    el.khz.textContent = '44';
  }

  // play a track the YT embed refuses (101/150) by fetching its audio from
  // the sidecar (/stream) and routing it through the local <audio> player
  function streamTrack(t, quiet) {
    if (!t || !t.videoId || t.videoId.startsWith('local:')) return;
    t._streamed = true; // guard: if the stream ALSO fails, don't loop
    t.isLocal = true;
    t.viaStream = true;
    t.isAvailable = true;
    t.localUrl = API.streamUrl(t.videoId);
    const fresh = !warmed.has(t.videoId); // not pre-warmed → the fetch is slow
    warmed.add(t.videoId);
    // in stream-everything mode a toast on every track is noise; only nag when
    // the audio isn't already cached/warmed and there'll be a visible wait
    if (!quiet) toast('▶ fetching audio (embed blocked) — a few seconds…');
    else if (fresh) toast('▶ streaming audio…');
    el.lcd.classList.add('blink'); // "buffering" until it actually plays
    playLocal(t);
    renderQueue();
    highlightPlaying();
    updateDlBtn();
    prefetchNextIfBlocked(); // this batch is probably all blocked — warm the next
  }

  // if the next queue track is likely embed-blocked, pre-fetch its audio so
  // the switch is instant. Only fires when there's evidence of blocking:
  // we're currently streaming, or the next track was streamed before.
  const warmed = new Set();
  function prefetchNextIfBlocked() {
    if (blockedMode !== 'stream' && !streamAll) return;
    const cur = state.queue[state.qi];
    const nx = state.queue[state.qi + 1];
    if (!nx || !nx.videoId || nx.videoId.startsWith('local:') || nx.isLocal) return;
    // stream-everything → always warm the next track so the switch is instant;
    // otherwise only when there's evidence this batch is embed-blocked
    const likely = streamAll || (cur && cur.viaStream) || nx._streamed;
    if (!likely || warmed.has(nx.videoId)) return;
    warmed.add(nx.videoId);
    API.warmStream(nx.videoId);
  }

  // a struck-through track (embedding disabled, removed, etc.) must never be
  // auto-selected again — otherwise repeat-one / radio just loops the error
  const isDead = (t) => !t || t.isAvailable === false;

  function nextIndex(dir) {
    const n = state.queue.length;
    if (!n) return -1;
    if (state.repeat === 'one' && !isDead(state.queue[state.qi])) return state.qi;
    if (state.shuffle) {
      if (n === 1) return state.repeat === 'all' && !isDead(state.queue[0]) ? 0 : -1;
      for (let tries = 0; tries < n * 3; tries++) {
        const r = Math.floor(Math.random() * n);
        if (r !== state.qi && !isDead(state.queue[r])) return r;
      }
      return -1; // nothing playable left
    }
    let i = state.qi;
    for (let steps = 0; steps < n; steps++) {
      i += dir;
      if (i >= n) {
        if (state.repeat !== 'all') return -1;
        i = 0;
      } else if (i < 0) {
        if (state.repeat !== 'all') return -1;
        i = n - 1;
      }
      if (!isDead(state.queue[i])) return i;
    }
    return -1; // every remaining track is dead
  }

  function next() {
    const i = nextIndex(1);
    if (i === -1) {
      if (state.artistMixOn && state.artistMix.length) return extendArtistMix(true);
      if (state.radio) return extendRadioNow();
      statFlush();
      P.stop();
      setNowPlaying(null);
      state.qi = -1;
      highlightPlaying();
      return;
    }
    playAt(i);
  }
  function prev() {
    if (localActive) {
      // streamed / imported track owns playback — P.snapshot() is stale
      if ((LA.currentTime || 0) > 3) { LA.currentTime = 0; return; }
    } else {
      const s = P.snapshot();
      if (s.cur > 3) return P.seekFrac(0); // restart current, Winamp-style
    }
    // walk back through the real play history (survives shuffle); skip entries
    // whose track has since left the queue
    while (playHist.length) {
      const j = state.queue.indexOf(playHist.pop());
      if (j !== -1 && !isDead(state.queue[j])) return playAt(j, true);
    }
    const i = nextIndex(-1); // nothing in history → fall back to queue order
    if (i !== -1) playAt(i);
  }

  // radio / autoplay ------------------------------------------------
  function maybeExtendRadio() {
    if (!state.radio) return;
    if (state.queue.length - state.qi <= 2) extendRadioNow();
  }
  let extending = false;
  const radioSeen = new Set(); // videoIds already offered by radio this session
  const radioTitleSeen = new Set(); // normalised titles radio has served this session

  const artistKey = (t) =>
    String((t && (t.artistId || t.artists)) || '').toLowerCase().trim();

  // strip a title down to its bare identity so radio stops refilling with the
  // same song wearing different hats — "<song>", "<song> (Extended)", "<song>
  // (Eurobeat Remix)", "<song> [Initial D]", "Artist - <song>", nightcore/sped-up
  // re-uploads, topic vs MV uploads. Aggressive on purpose (radio wants variety).
  const RADIO_NOISE =
    /\b(?:official|video|audio|lyrics?|visualizer|m\/?v|hd|hq|4k|full|version|ver|extended|radio\s*edit|radio\s*mix|club\s*mix|original\s*mix|remaster(?:ed)?|remix|bootleg|nightcore|sped\s*up|slowed|reverb|super\s*eurobeat|eurobeat|initial\s*d|8d)\b/g;
  const deAccent = (s) => s.normalize('NFD').replace(/\p{M}/gu, ''); // "déjà" → "deja"
  const normTitle = (title, artist) => {
    let x = deAccent(String(title || '').toLowerCase());
    const a = deAccent(String(artist || '').toLowerCase().trim());
    if (a.length > 2) x = x.split(a).join(' '); // drop an artist name baked into the title
    return x
      .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}|~[^~]*~|【[^】]*】|『[^』]*』|「[^」]*」/g, ' ')
      .replace(/\b(?:feat|ft|featuring|prod|with)\b.*$/i, ' ')
      .replace(RADIO_NOISE, ' ')
      .replace(/[^\p{L}\p{N}]+/gu, '')
      .trim();
  };
  const rememberRadioTitles = (list) => {
    for (const t of list) {
      const nk = normTitle(t.title, t.artists);
      if (nk) radioTitleSeen.add(nk);
    }
  };
  // keep only the first track per normalised title; when dropSessionSeen is set,
  // also drop titles radio already served this session (the near-dup flood guard)
  const dedupByTitle = (list, dropSessionSeen) => {
    const seen = new Set();
    const out = [];
    for (const t of list) {
      const nk = normTitle(t.title, t.artists);
      if (nk) {
        if (seen.has(nk)) continue;
        if (dropSessionSeen && radioTitleSeen.has(nk)) continue;
        seen.add(nk);
      }
      out.push(t);
    }
    return out;
  };

  // trim a candidate list so no single artist dominates one refill — keeps
  // radio from stacking a pile of tracks by the seed's artist in a row. Tracks
  // with no artist (eurobeat comps, "Various Artists") are bucketed by title so
  // they can't slip past the cap.
  function diversifyTracks(list, perArtist, max) {
    const seen = new Map();
    const out = [];
    for (const t of list) {
      const k = artistKey(t) || 't:' + normTitle(t.title, t.artists);
      const n = k ? seen.get(k) || 0 : 0;
      if (k && n >= perArtist) continue;
      if (k) seen.set(k, n + 1);
      out.push(t);
      if (out.length >= max) break;
    }
    return out;
  }
  const distinctArtists = (list) => {
    const s = new Set();
    for (const t of list) {
      const k = artistKey(t);
      if (k) s.add(k);
    }
    return s.size;
  };

  function resumeIfEnded() {
    if (state.qi + 1 < state.queue.length && P.snapshot().state === P.STATES.ENDED)
      playAt(state.qi + 1);
  }
  async function extendRadioNow() {
    if (extending || !state.authed) return;
    const have = new Set(state.queue.map((t) => t.videoId));
    const origin = state.originTracks || [];
    const cur = state.queue[state.qi] || {};
    rememberRadioTitles(state.queue); // never re-offer a song that's already queued

    // 1) drain whatever's left of the search / playlist that started this queue
    //    — BUT only when the origin is genuinely varied. Opening an artist or
    //    album page makes `originTracks` one artist's whole catalogue; draining
    //    that is exactly the "queue fills with the same artist" bug, so skip
    //    straight to the station in that case.
    if (distinctArtists(origin) >= 4) {
      const rest = dedupByTitle(
        origin.filter((t) => t.videoId && !have.has(t.videoId)),
        true
      );
      if (rest.length) {
        const chunk = diversifyTracks(rest, 3, 20);
        state.queue.push(...chunk);
        chunk.forEach((t) => have.add(t.videoId));
        rememberRadioTitles(chunk);
        console.info(`[retro] radio — +${chunk.length} from the origin list`);
        toast(`≈ ${chunk.length} more from your list`);
        renderQueue();
        resumeIfEnded();
        return;
      }
    }

    // 2) a real station. Seed from up to 2 recent queue tracks — preferring
    //    ones whose artist ISN'T the current one — so a single narrow seed
    //    can't lock the refill and the station drifts outward each time.
    const recent = state.queue
      .slice(-8)
      .filter((t) => !t.isVideo && t.videoId && t.videoId.length >= 10);
    const curK = artistKey(cur);
    const drifted = recent.filter((t) => artistKey(t) !== curK);
    let seedPool = (drifted.length ? drifted : recent).map((t) => t.videoId);
    if (!seedPool.length) {
      seedPool = origin
        .filter((t) => !t.isVideo && t.videoId && t.videoId.length >= 10)
        .map((t) => t.videoId);
    }
    // shuffle + take 2 distinct
    seedPool = seedPool.slice().sort(() => Math.random() - 0.5);
    const seedIds = [];
    for (const v of seedPool) {
      if (!seedIds.includes(v)) seedIds.push(v);
      if (seedIds.length >= 2) break;
    }
    if (!seedIds.length && !cur.isVideo && cur.videoId) seedIds.push(cur.videoId);
    if (!seedIds.length) return;

    extending = true;
    try {
      const lists = await Promise.all(
        seedIds.map((v) => API.related(v).catch(() => []))
      );
      const merged = [];
      const mseen = new Set();
      for (const list of lists)
        for (const t of list)
          if (t.videoId && !mseen.has(t.videoId)) {
            mseen.add(t.videoId);
            merged.push(t);
          }
      merged.sort(() => Math.random() - 0.5); // don't front-load one seed's list
      const vidFresh = merged.filter(
        (t) => t.videoId && !have.has(t.videoId) && !radioSeen.has(t.videoId)
      );
      // drop near-dups of anything radio already served; if a niche seed leaves
      // us with almost nothing, relax to video-id-only so radio doesn't stall
      let fresh = dedupByTitle(vidFresh, true);
      if (fresh.length < 3) fresh = dedupByTitle(vidFresh, false);
      const chunk = diversifyTracks(fresh, 2, 14); // artist-capped bite
      console.info(
        `[retro] radio — ${seedIds.length} seed(s) → ${merged.length} cand → ${fresh.length} fresh → +${chunk.length}`
      );
      chunk.forEach((t) => radioSeen.add(t.videoId));
      rememberRadioTitles(chunk);
      state.queue.push(...chunk);
      if (chunk.length) toast(`≈ ${chunk.length} similar tracks`);
      renderQueue();
      resumeIfEnded();
    } catch (e) {
      console.warn('radio extend failed', e);
    } finally {
      extending = false;
    }
  }

  // ---- ARTIST MIX — shuffle songs from a pool of artists into the queue ---
  const LS_AQ = 'retro.artistMix';
  const LS_AQ_ON = 'retro.artistMixOn';
  const aqSeen = new Set(); // videoIds already served by the mix this session
  let aqBusy = false;
  try {
    state.artistMix = JSON.parse(localStorage.getItem(LS_AQ)) || [];
  } catch (_) {}
  state.artistMixOn = localStorage.getItem(LS_AQ_ON) === '1';
  const saveArtistMix = () => {
    try {
      localStorage.setItem(LS_AQ, JSON.stringify(state.artistMix));
      localStorage.setItem(LS_AQ_ON, state.artistMixOn ? '1' : '0');
    } catch (_) {}
  };

  // ---- named ARTIST MIX presets (⚙ ▾ next to "mix") --------------------
  // state.artistMix stays the live working pool; presets are named copies in
  // localStorage['retro.artistMixes'] = { "<name>": [{id,name}], … }.
  const LS_AQ_PRESETS = 'retro.artistMixes';
  const loadArtistMixes = () => {
    try {
      const o = JSON.parse(localStorage.getItem(LS_AQ_PRESETS));
      return o && typeof o === 'object' ? o : {};
    } catch (_) {
      return {};
    }
  };
  const saveArtistMixes = (o) => {
    try {
      localStorage.setItem(LS_AQ_PRESETS, JSON.stringify(o));
    } catch (_) {}
  };
  function loadArtistMixPreset(name) {
    const p = loadArtistMixes()[name];
    if (!p) return;
    state.artistMix = p.map((a) => ({ id: a.id, name: a.name }));
    aqSeen.clear(); // fresh pool → let its tracks flow again
    saveArtistMix();
    renderArtistMix();
    toast(`loaded “${name}” (${state.artistMix.length})`);
    if (state.artistMixOn) extendArtistMix(true);
  }
  function artistMixPresetMenu(anchor) {
    const mixes = loadArtistMixes();
    const names = Object.keys(mixes).sort((a, b) => a.localeCompare(b));
    const items = [
      {
        label: '＋ Save current as…',
        fn: async () => {
          if (!state.artistMix.length) return toast('the mix is empty — nothing to save');
          const name = await askText('Save this artist mix as:', '');
          if (!name) return;
          const m = loadArtistMixes();
          const existed = !!m[name];
          m[name] = state.artistMix.map((a) => ({ id: a.id, name: a.name }));
          saveArtistMixes(m);
          toast(`${existed ? 'updated' : 'saved'} preset “${name}”`);
        },
      },
    ];
    if (names.length) {
      items.push('-', { label: 'Load (replaces the pool)' });
      names.forEach((n) =>
        items.push({ label: `   ${n}  ·  ${mixes[n].length}`, fn: () => loadArtistMixPreset(n) })
      );
      items.push('-', { label: 'Delete' });
      names.forEach((n) =>
        items.push({
          label: `   ✕ ${n}`,
          fn: async () => {
            if (!(await askConfirm(`Delete artist-mix preset “${n}”?`))) return;
            const m = loadArtistMixes();
            delete m[n];
            saveArtistMixes(m);
            toast(`deleted “${n}”`);
          },
        })
      );
    }
    const r = anchor.getBoundingClientRect();
    showCtx({ clientX: r.left, clientY: r.bottom }, items);
  }
  if (el.aqPresets)
    el.aqPresets.addEventListener('click', (e) => {
      e.stopPropagation(); // don't let the document-click handler close it instantly
      artistMixPresetMenu(el.aqPresets);
    });

  function renderArtistMix() {
    el.aqList.innerHTML = '';
    state.artistMix.forEach((a, i) => {
      const li = document.createElement('li');
      li.innerHTML =
        `<span class="aq-name">${escapeHtml(a.name)}</span>` +
        `<button class="aq-rm" title="Remove">×</button>`;
      li.querySelector('.aq-rm').onclick = () => {
        state.artistMix.splice(i, 1);
        if (!state.artistMix.length) state.artistMixOn = false;
        saveArtistMix();
        renderArtistMix();
      };
      el.aqList.appendChild(li);
    });
    el.aqToggle.classList.toggle('on', state.artistMixOn);
    el.aqFoot.textContent = state.artistMix.length
      ? `${state.artistMix.length} artist${state.artistMix.length > 1 ? 's' : ''}` +
        (state.artistMixOn ? ' · mixing' : '')
      : 'search or drag favourite artists here';
  }

  function addArtistToMix(id, name) {
    if (!id || !name) return;
    if (state.artistMix.some((a) => a.id === id)) return toast(name + ' already in the mix');
    state.artistMix.push({ id, name });
    saveArtistMix();
    renderArtistMix();
    toast('＋ ' + name + ' → artist mix');
    if (state.artistMixOn) maybeExtendArtistMix();
  }

  async function aqSearchAdd() {
    const q = el.aqInput.value.trim();
    if (!q) return;
    el.aqAddBtn.disabled = true;
    try {
      const d = await API.searchArtists(q);
      const a = (d.artists || [])[0];
      if (!a) return toast('no artist found for "' + q + '"');
      addArtistToMix(a.channelId, a.name);
      el.aqInput.value = '';
    } catch (e) {
      toast('artist search failed');
    } finally {
      el.aqAddBtn.disabled = false;
    }
  }

  function maybeExtendArtistMix() {
    if (!state.artistMixOn || !state.artistMix.length) return;
    if (state.queue.length - state.qi <= 3) extendArtistMix();
  }

  async function extendArtistMix(kick) {
    if (aqBusy || !state.artistMixOn || !state.artistMix.length) return;
    const ahead = state.queue.length - 1 - Math.max(state.qi, 0);
    if (!kick && ahead > 4) return;
    aqBusy = true;
    try {
      const have = new Set(state.queue.map((t) => t.videoId));
      const want = kick ? 8 : Math.max(2, 6 - Math.max(0, ahead));
      const picks = [];
      let guard = 0;
      while (picks.length < want && guard++ < 40) {
        const a = state.artistMix[(Math.random() * state.artistMix.length) | 0];
        let d;
        try {
          d = await getArtist(a.id);
        } catch (_) {
          continue;
        }
        const pool = (d.tracks || []).filter(
          (t) => t.videoId && !have.has(t.videoId) && !aqSeen.has(t.videoId)
        );
        if (!pool.length) continue;
        const t = pool[(Math.random() * pool.length) | 0];
        have.add(t.videoId);
        aqSeen.add(t.videoId);
        picks.push(t);
      }
      if (!picks.length) return;
      const wasEmpty = !state.queue.length;
      state.queue.push(...picks);
      state.radio = false; // the mix owns the queue tail now
      el.tpRadio.classList.remove('on');
      renderQueue();
      if (wasEmpty) playAt(0);
      else resumeIfEnded();
      toast(`≈ ${picks.length} from your artist mix`);
    } finally {
      aqBusy = false;
    }
  }

  el.aqAddBtn.onclick = aqSearchAdd;
  el.aqInput.addEventListener('keydown', (e) => e.key === 'Enter' && aqSearchAdd());
  el.aqToggle.onclick = () => {
    if (!state.artistMix.length) return toast('add some artists to the mix first');
    state.artistMixOn = !state.artistMixOn;
    if (state.artistMixOn && state.radio) {
      state.radio = false;
      el.tpRadio.classList.remove('on');
    }
    saveArtistMix();
    renderArtistMix();
    if (state.artistMixOn) extendArtistMix(true);
  };
  // drop a FOR-YOU artist row onto the panel to add it
  ['dragover', 'dragenter'].forEach((ev) =>
    el.aqSection.addEventListener(ev, (e) => {
      if (!dragPayload || dragPayload.kind !== 'artist') return;
      e.preventDefault();
      el.aqSection.classList.add('drop-hot');
    })
  );
  el.aqSection.addEventListener('dragleave', (e) => {
    if (!el.aqSection.contains(e.relatedTarget)) el.aqSection.classList.remove('drop-hot');
  });
  el.aqSection.addEventListener('drop', (e) => {
    el.aqSection.classList.remove('drop-hot');
    if (!dragPayload || dragPayload.kind !== 'artist') return;
    e.preventDefault();
    addArtistToMix(dragPayload.id, dragPayload.name);
    dragPayload = null;
  });

  // paints the LCD + seek bar from a (current, duration) pair — shared by the
  // music player tick and the CRT video's time reports
  let lastTime = { cur: 0, dur: 0 }; // so a mode change can repaint while paused
  function paintTime(cur, dur) {
    lastTime = { cur, dur };
    const rem = Math.max(0, (dur || 0) - cur);
    const both = state.timeMode === 'both' && dur;
    el.lcd.textContent = both
      ? mmss(cur) + ' / -' + mmss(rem)
      : state.timeMode === 'remaining' && dur
      ? '-' + mmss(rem)
      : mmss(cur);
    el.lcd.classList.toggle('lcd--both', !!both); // smaller font so both fit
    const f = dur ? cur / dur : 0;
    el.posFill.style.width = f * 100 + '%';
    el.posThumb.style.left = f * 100 + '%';
  }

  // ---- player events ------------------------------------------
  P.on('ready', () => {
    P.setVolume(loadVol());
    paintVol();
    if (resumePending) cueResumeIfPending(); // restore a saved session, paused
    else setNowPlaying(null);
  });
  P.on('state', (st) => {
    if (videoActive || localActive) return; // another source owns the transport/LCD
    if (st === P.STATES.ENDED) next();
    el.lcd.classList.toggle('blink', st === P.STATES.PAUSED);
  });
  P.on('tick', (s) => {
    if (videoActive || localActive) return; // another source owns the readout
    if (!s.ready) return;
    if (s.playing) {
      statTick();
      maybeSaveSessionPos();
    }
    paintTime(s.cur, s.dur);
  });
  let skipRun = 0;
  let skipRunT = null;
  P.on('error', (code) => {
    // 2 => bad id · 5 => HTML5 error · 100 => removed/private
    // 101/150 => embedding disabled by the uploader — VERY common for
    //            official-label music videos (Napalm/Nuclear Blast/etc.);
    //            the CRT window can't play them either. Use ♪ Music search
    //            (those Art-Tracks embed fine) or the ⇩ download button.
    if (videoActive || localActive) return; // the YT player isn't the source
    console.warn('yt error', code);
    const cur = state.queue[state.qi];
    // a restored-but-not-yet-played track: just flag it, don't auto-advance or
    // start streaming before the user has even pressed Play
    if (resumePending) {
      if (cur) cur.isAvailable = false;
      highlightPlaying();
      return;
    }
    const embedBlocked = code === 101 || code === 150;
    // "play it anyway": fetch the audio and route through <audio>
    if (cur && embedBlocked && blockedMode === 'stream' && !cur._streamed) {
      console.warn('[retro] embed blocked → streaming', cur.videoId);
      return streamTrack(cur);
    }
    if (cur) {
      cur.isAvailable = false;
      const why = embedBlocked
        ? "can't be embedded"
        : code === 100
        ? 'unavailable'
        : 'playback error';
      skipRun++;
      clearTimeout(skipRunT);
      toast(
        skipRun === 1
          ? `⚠ ${cur.title || 'track'}: ${why} — skipped`
          : `⚠ ${skipRun} tracks skipped — ${why}`
      );
      skipRunT = setTimeout(() => (skipRun = 0), 2600);
    }
    highlightPlaying();
    setTimeout(next, 600);
  });

  // ---- sliders (pointer drag) ------------------------------
  function bindBar(bar, onFrac) {
    const calc = (e) => {
      const r = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    };
    let dragging = false;
    bar.addEventListener('pointerdown', (e) => {
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      onFrac(calc(e));
    });
    bar.addEventListener('pointermove', (e) => dragging && onFrac(calc(e)));
    bar.addEventListener('pointerup', (e) => {
      dragging = false;
      try {
        bar.releasePointerCapture(e.pointerId);
      } catch (_) {}
    });
  }
  bindBar(el.posbar, (f) => {
    if (localActive) {
      if (LA.duration) LA.currentTime = f * LA.duration;
    } else {
      P.seekFrac(f);
    }
    el.posFill.style.width = f * 100 + '%';
    el.posThumb.style.left = f * 100 + '%';
  });
  bindBar(el.volbar, (f) => {
    const v = Math.round(f * 100);
    if (videoActive) {
      // while a CRT video is the active source the slider drives its volume;
      // video.js picks up retro.videoVol via a cross-window `storage` event
      saveVideoVol(v);
    } else {
      P.setVolume(v);
      LA.volume = v / 100; // imported files share the music volume
      saveVol(v);
    }
    el.volFill.style.width = v + '%';
    el.volThumb.style.left = v + '%';
  });
  function paintVol() {
    const v = videoActive ? loadVideoVol() : P.getVolume();
    el.volFill.style.width = v + '%';
    el.volThumb.style.left = v + '%';
  }
  const loadVol = () => {
    const v = parseInt(localStorage.getItem('retro.vol'), 10);
    return Number.isFinite(v) ? v : 80;
  };
  const saveVol = (v) => localStorage.setItem('retro.vol', v);
  const loadVideoVol = () => {
    const v = parseInt(localStorage.getItem('retro.videoVol'), 10);
    return Number.isFinite(v) ? v : 90;
  };
  const saveVideoVol = (v) => localStorage.setItem('retro.videoVol', v);
  function nudgeVol(d) {
    if (videoActive) {
      saveVideoVol(Math.max(0, Math.min(100, loadVideoVol() + d)));
    } else {
      P.setVolume(P.getVolume() + d);
      LA.volume = P.getVolume() / 100;
      saveVol(P.getVolume());
    }
    paintVol();
  }

  // ---- visualizer (simulated — cross-origin audio can't be tapped) ----
  // sits top-right of the .display; bar count follows its width (resizeVis)
  const vctx = el.vis.getContext('2d');
  let BARS = 24;
  let heights = new Array(BARS).fill(0);
  let targets = new Array(BARS).fill(0);
  // per-bar drift params (rebuilt on resize) — a sum of slow sines per bar
  // gives smooth, breathing, organic motion instead of per-frame noise
  const rndPhase = () => Math.random() * Math.PI * 2;
  const rndFreq = () => 0.55 + Math.random() * 0.9;
  const rndAmp = () => 0.7 + Math.random() * 0.3; // per-bar height, keeps it from ramping
  let vphase = new Array(BARS).fill(0).map(rndPhase);
  let vfreq = new Array(BARS).fill(0).map(rndFreq);
  let vamp = new Array(BARS).fill(0).map(rndAmp);
  let vgain = new Array(BARS).fill(0.3); // per-bar running level (real-FFT auto-balance)
  let peaks = new Array(BARS).fill(0); // peak-hold caps (fall slowly toward the bar)

  // ---- user-tunable knobs (⚙ → "Tuning") -----------------------------
  // one place for the bongo-cat beat detector + equalizer feel/look, all
  // persisted to localStorage['retro.tune'] and applied live.
  const TUNE_DEFAULTS = {
    beatSens: 50, // 0..100 — higher = more cat taps (lowers the flux ratio)
    grooveFill: 1, // 0/1 — tempo-lock filler taps between detected beats
    eqHeight: 58, // 35..85 — % of H a full-scale centre bar reaches (maxH)
    eqCenter: 40, // 0..80 — centre-hump strength (Tukey taper %); 0 = flat wall
    eqBottom: 26, // 5..40 — empty gap below the bars (% of H)
    eqGlow: 100, // 0..200 — % of the default bar glow (shadowBlur)
    eqCaps: 1, // 0/1 — draw the floating peak-hold caps
  };
  let tune = { ...TUNE_DEFAULTS };
  try {
    Object.assign(tune, JSON.parse(localStorage.getItem('retro.tune')) || {});
  } catch (_) {}
  const saveTune = () => {
    try {
      localStorage.setItem('retro.tune', JSON.stringify(tune));
    } catch (_) {}
  };

  // centre-weighting envelope (Tukey window): flat across the middle, cosine
  // taper at both ends — so the display reads as a centred blob instead of the
  // track's natural bass-heavy left ramp. Rebuilt on resize + on knob change.
  const WIN_FLOOR = 0.2; // edge bars keep this much height (never fully flat)
  function buildCentreWindow(n) {
    const w = new Array(n);
    const edge = Math.max(1, ((tune.eqCenter / 100) * (n - 1)) / 2);
    for (let i = 0; i < n; i++) {
      let t = 1;
      if (i < edge) t = 0.5 * (1 - Math.cos(Math.PI * (i / edge)));
      else if (i > n - 1 - edge)
        t = 0.5 * (1 - Math.cos(Math.PI * ((n - 1 - i) / edge)));
      w[i] = WIN_FLOOR + (1 - WIN_FLOOR) * t;
    }
    return w;
  }
  let vwin = buildCentreWindow(BARS);
  let vt = 0; // slow time accumulator
  let vframe = 0;
  let VW = 1, VH = 1, VDPR = 1; // CSS-px canvas size + device-pixel ratio
  let visRAF = 0; // rAF handle — 0 while the draw loop is parked (idle CPU saver)
  // settings-menu controls (declared here so drawVis can read them safely)
  let visOn = localStorage.getItem('retro.visOn') !== '0';
  let visMode = localStorage.getItem('retro.visMode') || 'auto'; // auto | sim
  // bar colours: 'theme' (--vis-top/-bottom gradient) | 'spectrum' (hue by bar
  // position) | 'rainbow' (spectrum + a slow hue drift). Read live in drawVis.
  let visColors = localStorage.getItem('retro.visColors') || 'theme';
  // how to handle YT err 101/150: 'stream' (fetch audio, play locally) | 'skip'
  let blockedMode = localStorage.getItem('retro.blockedMode') || 'stream';
  // opt-in "stream everything": route EVERY real YT track through /stream + the
  // local <audio> so the real-FFT visualiser + beat-reactive bongo cat work on
  // every track — not just embed-blocked ones. Costs Premium audio quality and
  // puts yt-dlp in the critical path, so it's off by default (see HANDOFF §6).
  let streamAll = localStorage.getItem('retro.streamAll') === '1';
  let visTop = '#8dffb9',
    visBot = '#0c7a37',
    visHot = '#e9fff2', // visTop pushed toward white — the bar's glowing core/tip
    visTopRGB = '141,255,185';
  // parse "#rgb"/"#rrggbb"/"rgb()" → [r,g,b]; used for glow + hot-tip blend
  function parseRGB(c) {
    c = (c || '').trim();
    let m = c.match(/^#([0-9a-f]{3})$/i);
    if (m) {
      const h = m[1];
      return [h[0] + h[0], h[1] + h[1], h[2] + h[2]].map((x) => parseInt(x, 16));
    }
    m = c.match(/^#([0-9a-f]{6})$/i);
    if (m)
      return [m[1].slice(0, 2), m[1].slice(2, 4), m[1].slice(4, 6)].map((x) =>
        parseInt(x, 16)
      );
    m = c.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    return [141, 255, 185];
  }
  function readVisColors() {
    const cs = getComputedStyle(document.documentElement);
    visTop = cs.getPropertyValue('--vis-top').trim() || visTop;
    visBot = cs.getPropertyValue('--vis-bottom').trim() || visBot;
    const t = parseRGB(visTop);
    visTopRGB = t.join(',');
    visHot = `rgb(${t.map((x) => Math.round(x + (255 - x) * 0.55)).join(',')})`;
  }
  function resizeVis() {
    const r = el.vis.getBoundingClientRect();
    VW = Math.max(1, Math.round(r.width));
    VH = Math.max(1, Math.round(r.height));
    VDPR = Math.min(2, window.devicePixelRatio || 1); // crisp on HiDPI, capped
    const bw = Math.round(VW * VDPR),
      bh = Math.round(VH * VDPR);
    if (el.vis.width !== bw) el.vis.width = bw;
    if (el.vis.height !== bh) el.vis.height = bh;
    // ~7 CSS-px per bar → a finely spread spectrum like a real EQ
    const n = Math.max(16, Math.round(VW / 7));
    if (n !== BARS) {
      BARS = n;
      heights = new Array(BARS).fill(0);
      targets = new Array(BARS).fill(0);
      peaks = new Array(BARS).fill(0);
      vphase = new Array(BARS).fill(0).map(rndPhase);
      vfreq = new Array(BARS).fill(0).map(rndFreq);
      vamp = new Array(BARS).fill(0).map(rndAmp);
      vgain = new Array(BARS).fill(0.3);
      vwin = buildCentreWindow(BARS);
    }
    kickVis(true); // canvas just got resized/cleared — repaint once (re-parks if idle)
  }
  readVisColors();
  window.addEventListener('retro:themechange', readVisColors);
  if (window.ResizeObserver) new ResizeObserver(resizeVis).observe(el.vis);
  resizeVis();

  // ---- visualiser frame loop --------------------------------------------
  // 60fps of shadow-blurred canvas was the app's biggest idle-CPU cost. The
  // loop now parks itself (visRAF = 0) whenever there's nothing to animate —
  // visualiser off, window hidden, or playback stopped with the bars decayed —
  // and kickVis() restarts it. A 500ms watchdog covers any play path that
  // doesn't call kickVis() itself.
  function visShouldRun() {
    if (document.hidden || !visOn) return false;
    if ((P && P.snapshot().playing) || videoPlaying || localPlaying) return true;
    for (let i = 0; i < BARS; i++)
      if (heights[i] > 0.004 || peaks[i] > 0.03) return true; // still settling
    return false;
  }
  // kickVis()      — resume the loop only if there's motion to draw
  // kickVis(true)  — also paint ONE frame when idle (resting baseline after a
  //                  cold start / resize / visualiser-on), which then re-parks
  function kickVis(force) {
    if (visRAF) return;
    if (force ? visOn && !document.hidden : visShouldRun())
      visRAF = requestAnimationFrame(drawVis);
  }

  function drawVis() {
    visRAF = 0;
    const W = VW,
      H = VH;
    vctx.setTransform(VDPR, 0, 0, VDPR, 0, 0); // draw in CSS px, crisp on HiDPI
    vctx.clearRect(0, 0, W, H);
    if (!visOn) {
      catSetBeatMode(false);
      return; // parked — kickVis() restarts the loop when the visualiser returns
    }

    // real spectrum for imported files (same-origin → analyser can see it);
    // everything else stays the simulated sine model.
    const real = localPlaying && analyser && visMode !== 'sim';
    const active = P.snapshot().playing || videoPlaying || localPlaying;
    catSetBeatMode(real); // real audio → bongo cat taps to the beat, not at random

    if (real) {
      analyser.getByteFrequencyData(freqBuf);
      catBeat(freqBuf, analyser.frequencyBinCount);
      vt += 0.02;
      const bins = analyser.frequencyBinCount;
      const lo = 2;
      const hi = Math.floor(bins * 0.85);
      const span = hi / lo;
      for (let i = 0; i < BARS; i++) {
        // log-spaced slice → treble gets as many bars as bass (linear mapping
        // dumped the whole mix's energy into the leftmost third)
        let b0 = Math.floor(lo * Math.pow(span, i / BARS));
        let b1 = Math.floor(lo * Math.pow(span, (i + 1) / BARS));
        if (b1 <= b0) b1 = b0 + 1;
        let sum = 0;
        let n = 0;
        for (let j = b0; j < b1 && j < bins; j++) {
          sum += freqBuf[j];
          n++;
        }
        const raw = n ? sum / n / 255 : 0;
        // per-bar auto-level: track this bar's own recent loudness (fast up,
        // slower down) and normalise to it, so every bar — bass or treble —
        // dances around mid-height and the whole spread stays lively
        vgain[i] += (raw - vgain[i]) * (raw > vgain[i] ? 0.38 : 0.045);
        const norm = raw / (vgain[i] * 1.32 + 0.04);
        let mag =
          norm * 1.0 * (0.97 + (i / BARS) * 0.06) * vamp[i] + // near-flat: no slope
          0.1 * Math.abs(Math.sin(vt * (2 + vfreq[i] * 3) + vphase[i])); // idle hiccup
        targets[i] = Math.max(0.03, Math.min(1, mag));
      }
      // gentle neighbour smoothing (1-2-1) → an even EQ landscape, not spikes
      const sm = targets.slice();
      for (let i = 1; i < BARS - 1; i++)
        targets[i] = sm[i - 1] * 0.26 + sm[i] * 0.48 + sm[i + 1] * 0.26;
    } else if (active) {
      vt += 0.018; // advance slow time (~breathing over several seconds)
      // occasional tiny phase nudge so it never settles into a pure loop
      if (++vframe % 75 === 0) {
        for (let i = 0; i < BARS; i++) vphase[i] += (Math.random() - 0.5) * 0.5;
      }
      for (let i = 0; i < BARS; i++) {
        const bass = 1 - i / BARS;
        const a = Math.sin(vt * vfreq[i] + vphase[i]);
        const b = Math.sin(vt * vfreq[i] * 0.5 + vphase[i] * 2.3);
        const travel = Math.sin(vt * 0.6 - i * 0.33); // a wave rolls across the bars
        let v = 0.6 + 0.26 * a + 0.15 * b + 0.12 * travel;
        v *= (0.94 + bass * 0.06) * vamp[i]; // near-flat: no left/right slope
        targets[i] = Math.max(0.03, Math.min(1, v));
      }
    }

    // centre-weight the whole spectrum → tall in the middle, tapered at both
    // edges (the sketch), regardless of where the track's energy actually sits
    if (real || active) {
      for (let i = 0; i < BARS; i++) targets[i] *= vwin[i];
    }

    const ease = real ? 0.36 : active ? 0.14 : 0.06; // FFT snappier; sim gentle
    const bw = W / BARS;
    const gap = Math.min(3, bw * 0.36); // clear spacing → bars read as separate
    const barW = Math.max(1, bw - gap);
    const rad = Math.min(barW / 2, 2.5);
    // compact + vertically centred: bars grow up from a raised horizontal
    // baseline; the occupied band sits around the middle with clear empty
    // space above AND below. Height / bottom gap / glow are ⚙ → Tuning knobs.
    const glow = tune.eqGlow / 100;
    const botPad = Math.round(H * (tune.eqBottom / 100)); // gap under the bars
    const maxH = H * (tune.eqHeight / 100); // tallest a (centre) bar can get
    const floorY = H - botPad; // the (perfectly horizontal) baseline

    // colour mode: 'theme' uses the palette; 'spectrum'/'rainbow' give each bar
    // its own hue (rainbow also drifts it over time)
    const multi = visColors === 'spectrum' || visColors === 'rainbow';
    const hueDrift = visColors === 'rainbow' ? vt * 12 : 0; // ~13°/s
    const hueAt = (i) => (((i / BARS) * 300 + hueDrift) % 360 + 360) % 360;
    const baseRGB = multi ? '255,255,255' : visTopRGB;

    // faint glowing baseline (the "floor light" in classic EQ art)
    vctx.shadowColor = `rgba(${baseRGB},0.85)`;
    vctx.shadowBlur = 6 * glow;
    vctx.strokeStyle = `rgba(${baseRGB},0.35)`;
    vctx.lineWidth = 1;
    vctx.beginPath();
    vctx.moveTo(0, floorY);
    vctx.lineTo(W, floorY);
    vctx.stroke();

    for (let i = 0; i < BARS; i++) {
      const tgt = real || active ? targets[i] : 0;
      heights[i] += (tgt - heights[i]) * ease;
      // peak-hold cap: jump to the bar top, then sink slowly
      peaks[i] = Math.max(peaks[i] - 0.012, heights[i]);

      const bh = Math.max(1, heights[i] * maxH);
      const x = i * bw + gap / 2;
      const y = floorY - bh;

      const g = vctx.createLinearGradient(0, y, 0, floorY);
      let hotCol;
      if (multi) {
        const h = hueAt(i);
        hotCol = `hsl(${h} 95% 80%)`;
        g.addColorStop(0, hotCol); // hot tip
        g.addColorStop(0.35, `hsl(${h} 92% 58%)`);
        g.addColorStop(1, `hsl(${h} 82% 30%)`); // dim base
        vctx.shadowColor = `hsla(${h} 90% 60% / 0.9)`;
      } else {
        hotCol = visHot;
        g.addColorStop(0, visHot); // hot core at the tip
        g.addColorStop(0.35, visTop);
        g.addColorStop(1, visBot); // dim at the base
        vctx.shadowColor = `rgba(${visTopRGB},0.9)`;
      }
      vctx.fillStyle = g;
      vctx.shadowBlur = 7 * glow;
      if (vctx.roundRect) {
        vctx.beginPath();
        vctx.roundRect(x, y, barW, bh, [rad, rad, 0, 0]);
        vctx.fill();
      } else {
        vctx.fillRect(x, y, barW, bh);
      }

      // the floating peak cap (toggleable)
      const py = floorY - Math.max(peaks[i] * maxH, 1) - 3;
      if (tune.eqCaps && peaks[i] > 0.04 && py < y - 1) {
        vctx.fillStyle = hotCol;
        vctx.shadowBlur = 8 * glow;
        vctx.fillRect(x, py, barW, 2);
      }
    }
    vctx.shadowBlur = 0;
    if (visShouldRun()) visRAF = requestAnimationFrame(drawVis);
  }
  kickVis(true); // draw the resting baseline once at startup, then park
  setInterval(kickVis, 500); // watchdog for play paths that don't kick directly
  document.addEventListener('visibilitychange', () => kickVis(true));

  // ---- transport wiring --------------------------------------
  // while a CRT video is the active source the transport drives *it*
  const vctl = (cmd) => window.retro && window.retro.videoControl(cmd);
  // is something actually rolling right now, whichever source owns playback?
  const isPlayingNow = () => {
    if (videoActive) return videoPlaying;
    if (localActive) return !!localPlaying || (LA && !LA.paused && !LA.ended);
    return P.snapshot().playing;
  };
  const doPlay = () => {
    kickVis(); // wake the visualiser loop if it parked while paused/stopped
    if (videoActive) return vctl('play');
    if (localActive) return LA.play().catch(() => {});
    consumeResume(); // first Play on a restored queue → own it + start stats
    if (P.snapshot().ready) P.play();
  };
  const doPause = () => {
    if (videoActive) return vctl('pause');
    if (localActive) return LA.pause();
    P.pause();
  };
  el.tpPlay.onclick = () => {
    // ⚙ "Combine play/pause": the play button doubles as pause while rolling
    if (combineTransport && isPlayingNow()) doPause();
    else doPlay();
    updatePlayPauseBtn();
  };
  el.tpPause.onclick = doPause;

  // ---- ⚙ "Combine play/pause into one button" -------------------------
  let ppTimer = 0;
  function updatePlayPauseBtn() {
    if (!combineTransport) return;
    const playing = isPlayingNow();
    const glyph = playing ? '❚❚' : '►';
    if (el.tpPlay.textContent !== glyph) el.tpPlay.textContent = glyph;
    el.tpPlay.title = playing ? 'Pause' : 'Play';
  }
  function applyCombineTransport() {
    el.tpPause.style.display = combineTransport ? 'none' : '';
    clearInterval(ppTimer);
    if (combineTransport) {
      updatePlayPauseBtn();
      ppTimer = setInterval(updatePlayPauseBtn, 300); // cheap; mirrors the P poll
    } else {
      el.tpPlay.textContent = '►';
      el.tpPlay.title = 'Play';
    }
  }
  applyCombineTransport();
  el.tpStop.onclick = () => {
    statFlush();
    if (videoActive) {
      vctl('stop');
      videoActive = false;
      videoPlaying = false;
      setNowPlaying(state.queue[state.qi] || null);
      paintVol();
      return;
    }
    if (localActive) {
      try { LA.pause(); LA.currentTime = 0; } catch (_) {}
      localActive = false;
      localPlaying = false;
      state.qi = -1;
      el.lcd.classList.remove('blink');
      setNowPlaying(null);
      highlightPlaying();
      return;
    }
    P.stop();
    state.qi = -1;
    setNowPlaying(null);
    highlightPlaying();
  };
  el.tpPrev.onclick = () => {
    if (!videoActive) prev();
  };
  el.tpNext.onclick = () => {
    if (!videoActive) next();
  };
  el.tpShuffle.onclick = () => {
    state.shuffle = !state.shuffle;
    el.tpShuffle.classList.toggle('on', state.shuffle);
  };
  el.tpRepeat.onclick = () => {
    state.repeat =
      state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    el.tpRepeat.classList.toggle('on', state.repeat !== 'off');
    el.tpRepeat.textContent = state.repeat === 'one' ? '↺1' : '↺';
  };
  el.tpRadio.onclick = () => {
    state.radio = !state.radio;
    el.tpRadio.classList.toggle('on', state.radio);
    if (state.radio) {
      if (state.artistMixOn) {
        state.artistMixOn = false; // radio and the artist mix can't both own the tail
        saveArtistMix();
        renderArtistMix();
      }
      maybeExtendRadio();
    }
  };
  // click the LCD to cycle elapsed → remaining → both
  const TIME_MODES = ['elapsed', 'remaining', 'both'];
  function setTimeMode(m) {
    state.timeMode = TIME_MODES.includes(m) ? m : 'elapsed';
    localStorage.setItem('retro.timeMode', state.timeMode);
    if (el.setTimeMode) el.setTimeMode.value = state.timeMode;
    paintTime(lastTime.cur, lastTime.dur); // repaint now (also covers paused)
  }
  el.lcd.onclick = () =>
    setTimeMode(TIME_MODES[(TIME_MODES.indexOf(state.timeMode) + 1) % 3]);

  // ---- download current track (yt-dlp, on demand) ----------------------
  el.tpDl.onclick = async () => {
    const t = state.queue[state.qi];
    if (!t || t.isLocal || !t.videoId) return;
    el.tpDl.disabled = true;
    toast('⇩ preparing download…');
    try {
      const r = await API.download(t.videoId, dlDir || undefined);
      toast(`saved ${r.format || ''} → ${r.file}`);
      if (window.retro && window.retro.revealPath && r.path)
        window.retro.revealPath(r.path);
    } catch (e) {
      toast('download failed: ' + (e.message || e));
    } finally {
      el.tpDl.disabled = false;
    }
  };

  el.tpFav.onclick = toggleFav;

  // ---- window buttons ---------------------------------------
  el.min.onclick = () => window.retro && window.retro.minimize();
  el.close.onclick = () => window.retro && window.retro.close();
  // double-click the titlebar → maximise / restore (native frameless titlebars
  // don't do this for themselves). Ignore double-clicks on the ◈▣◍⚙_× buttons.
  el.titlebar.addEventListener('dblclick', (e) => {
    if (e.target.closest('.title-btns')) return;
    window.retro && window.retro.toggleMaximize && window.retro.toggleMaximize();
  });
  el.signin.onclick = () => connectGoogle();
  el.video.onclick = () => {
    if (window.retro && window.retro.openVideo) window.retro.openVideo();
    else toast('Video window needs the app (npm start)');
  };

  // ---- settings flyout -------------------------------------------------
  function syncSettings() {
    el.setVol.value = loadVol();
    el.setBlocked.value = blockedMode;
    el.setStreamAll.checked = streamAll;
    el.setVisOn.checked = visOn;
    el.setVisMode.value = visMode;
    el.setVisColors.value = visColors;
    el.setCat.checked = catOn;
    el.setDlDir.textContent = dlDir || 'Downloads / Retro YTM  (default)';
    el.setDlDir.title = dlDir || '';
    el.setDlReset.disabled = !dlDir;
    el.setCacheKeep.checked = cacheKeep;
    el.setCacheCap.value = String(cacheCapMB);
    el.setKeepQueue.checked = keepQueue;
    el.setQueueCap.value = String(queueCap);
    el.setCombineTransport.checked = combineTransport;
    el.setTimeMode.value = state.timeMode;
    el.setMarqueeStatic.checked = state.marqueeStatic;
    el.tuneBeat.value = tune.beatSens;
    el.tuneGroove.checked = !!tune.grooveFill;
    el.tuneEqH.value = tune.eqHeight;
    el.tuneEqC.value = tune.eqCenter;
    el.tuneEqB.value = tune.eqBottom;
    el.tuneEqG.value = tune.eqGlow;
    el.tuneEqCaps.checked = !!tune.eqCaps;
    refreshCacheSize();
    renderLocalList();
  }

  // ---- tuning knobs: bind each control → tune{} → localStorage, live -----
  function bindTune(node, key, rebuildWin) {
    const isCheck = node.type === 'checkbox';
    node.addEventListener(isCheck ? 'change' : 'input', () => {
      tune[key] = isCheck ? (node.checked ? 1 : 0) : +node.value;
      saveTune();
      if (rebuildWin) vwin = buildCentreWindow(BARS);
    });
  }
  bindTune(el.tuneBeat, 'beatSens');
  bindTune(el.tuneGroove, 'grooveFill');
  bindTune(el.tuneEqH, 'eqHeight');
  bindTune(el.tuneEqC, 'eqCenter', true);
  bindTune(el.tuneEqB, 'eqBottom');
  bindTune(el.tuneEqG, 'eqGlow');
  bindTune(el.tuneEqCaps, 'eqCaps');
  el.tuneReset.onclick = () => {
    tune = { ...TUNE_DEFAULTS };
    saveTune();
    vwin = buildCentreWindow(BARS);
    syncSettings();
    toast('tuning reset to defaults');
  };

  // ---- stream cache policy (keep between sessions + LRU size cap) --------
  function pushCachePolicy() {
    if (window.retro && window.retro.setCachePolicy)
      window.retro.setCachePolicy({ keep: cacheKeep, capMB: cacheCapMB });
  }
  function refreshCacheSize() {
    if (!(window.retro && window.retro.cacheSize)) {
      el.setCacheSize.textContent = '—';
      return;
    }
    window.retro
      .cacheSize()
      .then((r) => {
        el.setCacheSize.textContent = r
          ? `${r.mb} MB · ${r.files} file${r.files === 1 ? '' : 's'}`
          : '—';
      })
      .catch(() => {});
  }
  pushCachePolicy(); // sync main.js with our saved setting on boot
  el.setCacheKeep.addEventListener('change', () => {
    cacheKeep = el.setCacheKeep.checked;
    localStorage.setItem('retro.keepCache', cacheKeep ? '1' : '0');
    pushCachePolicy();
    setTimeout(refreshCacheSize, 300);
  });
  el.setCacheCap.addEventListener('change', () => {
    cacheCapMB = +el.setCacheCap.value || 500;
    localStorage.setItem('retro.cacheCapMB', String(cacheCapMB));
    pushCachePolicy();
    setTimeout(refreshCacheSize, 300);
  });
  el.setKeepQueue.addEventListener('change', () => {
    keepQueue = el.setKeepQueue.checked;
    localStorage.setItem('retro.keepQueue', keepQueue ? '1' : '0');
    if (keepQueue) saveSession(true); // snapshot the current queue right away
    else {
      try { localStorage.removeItem(LS_SESSION); } catch (_) {}
    }
  });
  el.setQueueCap.addEventListener('change', () => {
    queueCap = +el.setQueueCap.value || 0;
    localStorage.setItem('retro.queueCap', String(queueCap));
    renderQueue(); // apply the new cap now (trims played tracks off the front)
  });
  el.setCombineTransport.addEventListener('change', () => {
    combineTransport = el.setCombineTransport.checked;
    localStorage.setItem('retro.combineTransport', combineTransport ? '1' : '0');
    applyCombineTransport();
  });
  el.setTimeMode.addEventListener('change', () => setTimeMode(el.setTimeMode.value));
  el.setMarqueeStatic.addEventListener('change', () => {
    state.marqueeStatic = el.setMarqueeStatic.checked;
    localStorage.setItem('retro.marqueeStatic', state.marqueeStatic ? '1' : '0');
    setNowPlaying(lastNowTrack); // repaint the bar now
  });
  el.setCacheClear.onclick = () => {
    if (!(window.retro && window.retro.clearCache))
      return toast('needs the app (npm start)');
    window.retro.clearCache().then((r) => {
      toast(`cleared ${r ? r.freedMB : 0} MB of cached audio`);
      refreshCacheSize();
    });
  };
  el.settings.onclick = (e) => {
    e.stopPropagation();
    const open = el.settingsPop.classList.toggle('hidden') === false;
    if (open) {
      const tp = document.getElementById('theme-pop');
      if (tp) tp.classList.add('hidden');
      const kp = document.getElementById('keys-pop');
      if (kp) kp.classList.add('hidden');
      const kb = document.getElementById('keys-btn');
      if (kb) kb.classList.remove('on');
      syncSettings();
    }
  };
  document.addEventListener('click', (e) => {
    if (
      !el.settingsPop.classList.contains('hidden') &&
      !el.settingsPop.contains(e.target) &&
      e.target !== el.settings
    )
      el.settingsPop.classList.add('hidden');
  });
  // one "×" close button for every flyout / overlay (.pop-close, top-right).
  // The auth overlay's × means "use offline" so it doesn't nag next launch.
  document.addEventListener('click', (e) => {
    const x = e.target.closest('.pop-close');
    if (!x) return;
    e.stopPropagation();
    const pop = x.closest('.theme-pop, .overlay');
    if (!pop) return;
    if (pop.id === 'keys-pop') return closeKeysPop();
    if (pop.id === 'auth') return goOffline();
    pop.classList.add('hidden'); // theme-pop, settings-pop
  });
  el.setVol.addEventListener('input', () => {
    const v = +el.setVol.value;
    saveVol(v);
    P.setVolume(v);
    LA.volume = v / 100;
    paintVol();
  });
  el.setBlocked.addEventListener('change', () => {
    blockedMode = el.setBlocked.value;
    localStorage.setItem('retro.blockedMode', blockedMode);
  });
  el.setStreamAll.addEventListener('change', () => {
    streamAll = el.setStreamAll.checked;
    localStorage.setItem('retro.streamAll', streamAll ? '1' : '0');
    if (streamAll) {
      prefetchNextIfBlocked(); // start warming ahead right away
      // if a track is already playing through the YT embed, restart it through
      // the stream so the real visualiser + beat cat kick in immediately
      const cur = state.queue[state.qi];
      if (cur && !cur.isLocal && !videoActive && !cur._streamed) playAt(state.qi);
      toast('stream-everything on — real visualiser on every track');
    } else {
      toast('stream-everything off — new tracks use YT (Premium) again');
    }
  });
  el.setZoom.onclick = () =>
    window.retro && window.retro.resetZoom && window.retro.resetZoom();
  el.setStats.onclick = () =>
    window.retro && window.retro.openStats && window.retro.openStats();
  el.setVisOn.addEventListener('change', () => {
    visOn = el.setVisOn.checked;
    localStorage.setItem('retro.visOn', visOn ? '1' : '0');
    kickVis(true); // turned on → repaint/restart; turned off → parks next frame
  });
  el.setVisMode.addEventListener('change', () => {
    visMode = el.setVisMode.value;
    localStorage.setItem('retro.visMode', visMode);
  });
  el.setVisColors.addEventListener('change', () => {
    visColors = el.setVisColors.value; // drawVis reads it live each frame
    localStorage.setItem('retro.visColors', visColors);
  });
  let catOn = localStorage.getItem('retro.cat') !== '0';
  el.cat.classList.toggle('hidden', !catOn);
  el.setCat.addEventListener('change', () => {
    catOn = el.setCat.checked;
    localStorage.setItem('retro.cat', catOn ? '1' : '0');
    el.cat.classList.toggle('hidden', !catOn);
    catRefresh();
    resizeVis(); // the readout column just changed height → refit the canvas
  });

  // ---- bongo cat: randomised paw taps + RGB key-cap flashes ----------
  const catSvg = el.cat.querySelector('svg');
  const paw = {
    l: catSvg && catSvg.querySelector('.paw-l'),
    r: catSvg && catSvg.querySelector('.paw-r'),
  };
  const keybed = {
    l: catSvg ? [...catSvg.querySelectorAll('.keybed-l .key')] : [],
    r: catSvg ? [...catSvg.querySelectorAll('.keybed-r .key')] : [],
  };
  let bongoT = 0;
  let lastHand = Math.random() < 0.5 ? 'l' : 'r';
  let catBeatMode = false; // true while the real-FFT beat detector drives taps
  const catReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function flashKey(hand) {
    const keys = keybed[hand];
    if (!keys.length) return;
    const k = keys[(Math.random() * keys.length) | 0];
    const c = `hsl(${(Math.random() * 360) | 0} 92% 60%)`;
    k.style.fill = c; // colour snaps in…
    k.style.fillOpacity = '1';
    k.style.filter = `drop-shadow(0 0 5px ${c})`;
    clearTimeout(k._off);
    k._off = setTimeout(() => {
      k.style.fillOpacity = ''; // …then the CSS transition fades it out
      k.style.filter = '';
    }, 190);
  }

  // one paw press + key flash. `hand` omitted → auto-alternate (25% keep).
  // `power` 0..1 deepens the press so hard hits read harder; the sub-pixel
  // jitter forces the transform to re-animate on rapid same-hand hits.
  function catTap(hand, power) {
    if (catReduced || !catSvg || el.cat.classList.contains('hidden')) return;
    hand = hand || (Math.random() < 0.25 ? lastHand : lastHand === 'l' ? 'r' : 'l');
    lastHand = hand;
    const p = paw[hand];
    if (!p) return;
    const depth = 4 + (power || 0) * 4 + Math.random() * 0.7; // ~4–8.7px
    p.style.setProperty('--paw-y', depth.toFixed(2) + 'px');
    p.classList.add('down');
    flashKey(hand);
    clearTimeout(p._up);
    p._up = setTimeout(() => p.classList.remove('down'), 90);
  }

  // The idle loop ALWAYS runs while the cat is on. In beat mode it just backs
  // off — a sparse safety-net tap only when the FFT detector has gone quiet —
  // so the cat is never frozen, whether or not beats are landing.
  function bongoTick() {
    const now = performance.now();
    const beatsLively = catBeatMode && now - catLastBeat < 900;
    if (!beatsLively) catTap();
    const gap = catBeatMode
      ? 650 + Math.random() * 700 // quick recovery if the detector stalls
      : Math.random() < 0.14
      ? 140 + Math.random() * 220
      : 500 + Math.random() * 3000;
    bongoT = setTimeout(bongoTick, gap);
  }

  function stopBongo() {
    clearTimeout(bongoT);
  }
  function startBongo() {
    stopBongo();
    if (catReduced || !catSvg || el.cat.classList.contains('hidden')) return;
    bongoT = setTimeout(bongoTick, 300 + Math.random() * 1200);
  }
  function catRefresh() {
    stopBongo();
    if (catOn) startBongo();
  }
  // just a flag now — bongoTick reads it live each iteration
  function catSetBeatMode(on) {
    catBeatMode = !!on;
  }

  // ---- real-FFT "drummer" ----------------------------------------------
  // Two-band onset detection (kick vs snare/clap) off positive spectral flux,
  // each with its own adaptive threshold, plus a light tempo lock so the cat
  // keeps the groove through quiet bars instead of only reacting to peaks.
  // Called every frame from drawVis() while the local analyser is live.
  let catPrev = null;           // last frame's spectrum, for flux
  let catKAvg = 0, catSAvg = 0; // running flux baseline per band
  let catKGap = 0, catSGap = 0; // performance.now() of last hit per band
  let catLastBeat = 0;
  let catIoi = 0;               // smoothed inter-onset interval (≈ beat period)
  let catPredict = 0;           // when the groove says the next beat is due

  // register a detected hit: tap, learn the tempo, flam on a hard hit
  function catOnset(now, hand, hard) {
    const dt = now - catLastBeat;
    if (dt > 120 && dt < 1100) catIoi = catIoi ? catIoi + (dt - catIoi) * 0.25 : dt;
    catLastBeat = now;
    catPredict = now + (catIoi || 480);
    catTap(hand, hard ? 1 : 0.35);
    if (hard && Math.random() < 0.55)
      setTimeout(() => catTap(hand === 'l' ? 'r' : 'l', 0.5), 42); // flam
  }

  function catBeat(buf, bins) {
    if (catReduced || !catSvg || el.cat.classList.contains('hidden')) return;
    const now = performance.now();
    if (!catPrev || catPrev.length !== bins) catPrev = new Float32Array(bins);

    // band edges (fftSize 256 → ~172 Hz/bin @44.1k):
    //   kick  ≈ bins 0..3   (sub + low bass)
    //   snare ≈ bins 6..44  (~1–7.5 kHz: snare/clap body + crack, hats)
    const kHi = Math.max(2, (bins * 0.03) | 0);
    const sLo = Math.max(kHi + 1, (bins * 0.05) | 0);
    const sHi = Math.max(sLo + 2, (bins * 0.35) | 0);

    let kFlux = 0, sFlux = 0;
    for (let j = 0; j < sHi; j++) {
      const v = buf[j] / 255;
      const d = v - catPrev[j]; // positive spectral flux only
      catPrev[j] = v;
      if (d <= 0) continue;
      if (j < kHi) kFlux += d;
      else if (j >= sLo) sFlux += d;
    }
    kFlux /= kHi;
    sFlux /= sHi - sLo;

    // adaptive baseline: fast attack tracks a build-up, slow release keeps one
    // loud hit from raising the bar for the next
    catKAvg += (kFlux - catKAvg) * (kFlux > catKAvg ? 0.45 : 0.05);
    catSAvg += (sFlux - catSAvg) * (sFlux > catSAvg ? 0.45 : 0.05);

    // "Beat sensitivity" knob (0..100, 50 = default) shifts both flux ratios:
    // higher sensitivity → lower ratio → more taps. Base 1.55 / 1.7.
    const sMul = (tune.beatSens - 50) / 100; // -0.5 … +0.5
    const kRatio = Math.max(1.05, 1.55 - sMul * 0.9);
    const sRatio = Math.max(1.1, 1.7 - sMul * 0.95);
    const kHit = kFlux > 0.009 && kFlux > catKAvg * kRatio && now - catKGap > 85;
    const sHit = sFlux > 0.011 && sFlux > catSAvg * sRatio && now - catSGap > 95;

    if (kHit) { catKGap = now; catOnset(now, 'l', kFlux > catKAvg * 2.6); } // left paw = kick
    if (sHit) { catSGap = now; catOnset(now, 'r', sFlux > catSAvg * 2.8); } // right paw = snare

    // groove fill — keep time on the predicted beat when the detector goes
    // quiet mid-song (only inside a sane tempo range, ~70–315 BPM). Toggleable.
    if (tune.grooveFill && catIoi > 190 && catIoi < 850 && now > catPredict && now - catLastBeat > catIoi * 0.7) {
      catPredict = now + catIoi;
      catLastBeat = now;
      catTap(null, 0.25);
    }
  }
  catRefresh();
  el.setDlPick.onclick = async () => {
    if (!(window.retro && window.retro.pickFolder))
      return toast('needs the app (npm start)');
    const p = await window.retro.pickFolder();
    if (p) {
      dlDir = p;
      localStorage.setItem('retro.dlDir', p);
      syncSettings();
      toast('downloads → ' + p);
    }
  };
  el.setDlReset.onclick = () => {
    dlDir = '';
    localStorage.removeItem('retro.dlDir');
    syncSettings();
  };
  el.setImport.onclick = () => el.fileInput.click();
  el.setLocalClear.onclick = clearLocal;
  el.fileInput.addEventListener('change', () => {
    if (el.fileInput.files.length) importFiles(el.fileInput.files);
    el.fileInput.value = '';
  });
  renderLocalList();
  LA.volume = loadVol() / 100;

  // ---- drag-and-drop audio import (files only; internal DnD untouched) --
  let dragDepth = 0;
  const isFileDrag = (e) => {
    const dt = e.dataTransfer;
    if (!dt) return false;
    if (dt.types && [...dt.types].includes('Files')) return true;
    if (dt.items && [...dt.items].some((it) => it.kind === 'file')) return true;
    return !!(dt.files && dt.files.length);
  };
  window.addEventListener(
    'dragenter',
    (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth++;
      el.dropZone.classList.remove('hidden');
    },
    true
  );
  window.addEventListener(
    'dragover',
    (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    },
    true
  );
  window.addEventListener(
    'dragleave',
    (e) => {
      if (!isFileDrag(e)) return;
      e.stopPropagation();
      if (--dragDepth <= 0) {
        dragDepth = 0;
        el.dropZone.classList.add('hidden');
      }
    },
    true
  );
  window.addEventListener(
    'drop',
    (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth = 0;
      el.dropZone.classList.add('hidden');
      if (e.dataTransfer.files && e.dataTransfer.files.length)
        importFiles(e.dataTransfer.files);
    },
    true
  );

  // ---- music ↔ CRT video handoff ---------------------------------------
  // starting a song (playAt) hands playback back from the video to the music
  function stopVideoIfPlaying() {
    if (!videoActive) return;
    videoActive = false;
    videoPlaying = false;
    if (window.retro && window.retro.videoControl) window.retro.videoControl('pause');
    paintVol();
  }

  // ---- imported local audio (<audio id="local-audio">) ----------------
  function stopLocalIfPlaying() {
    if (!localActive) return;
    localActive = false;
    localPlaying = false;
    try { LA.pause(); } catch (_) {}
  }

  // real-FFT visualiser path — only local files are same-origin, so this is
  // the one place the analyser can see actual audio. Wired once (a media
  // element can only be sourced into Web Audio a single time).
  let actx = null, analyser = null, freqBuf = null, audioWired = false;
  function wireLocalAnalyser() {
    if (audioWired) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const src = actx.createMediaElementSource(LA);
      analyser = actx.createAnalyser();
      // 256 → 128 bins (~170 Hz each): enough to split kick from snare for the
      // bongo-cat beat detector. Lower smoothing keeps transients sharp for
      // onset detection; the visualiser adds its own easing so bars stay smooth.
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      freqBuf = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      analyser.connect(actx.destination);
      audioWired = true;
    } catch (e) {
      console.warn('web audio unavailable — visualiser stays simulated', e);
    }
  }

  LA.addEventListener('timeupdate', () => {
    if (!localActive) return;
    if (!LA.paused) {
      statTick();
      maybeSaveSessionPos();
    }
    paintTime(LA.currentTime || 0, LA.duration || 0);
  });
  LA.addEventListener('play', () => {
    localPlaying = true;
    if (actx && actx.state === 'suspended') actx.resume();
  });
  LA.addEventListener('playing', () => {
    localPlaying = true;
    el.lcd.classList.remove('blink'); // buffering done
  });
  LA.addEventListener('waiting', () => {
    if (localActive) el.lcd.classList.add('blink'); // buffering / stalled
  });
  LA.addEventListener('pause', () => {
    localPlaying = false;
    if (localActive && !LA.ended) el.lcd.classList.add('blink');
  });
  LA.addEventListener('ended', () => {
    localPlaying = false;
    if (localActive) next();
  });
  LA.addEventListener('error', () => {
    if (!localActive) return;
    const cur = state.queue[state.qi];
    if (cur && cur.viaStream) {
      cur.isAvailable = false;
      toast(`⚠ couldn't fetch "${cur.title || 'track'}" — skipped`);
    } else {
      toast('⚠ local file failed — skipped');
    }
    localActive = false;
    localPlaying = false;
    el.lcd.classList.remove('blink');
    highlightPlaying();
    setTimeout(next, 400);
  });

  function importFiles(files) {
    const ok = [...files].filter(
      (f) =>
        /^audio\//.test(f.type) ||
        /\.(mp3|m4a|flac|ogg|oga|opus|wav|aac)$/i.test(f.name)
    );
    if (!ok.length) return toast('No audio files in that drop');
    // stable per-file id (name + size) so listening stats for the same file
    // merge across sessions instead of every import being a brand-new "unique"
    // track. Re-importing a file already in this session is a no-op.
    const fresh = ok.filter(
      (f) => !localImports.some((l) => l.id === 'local:' + f.size + ':' + f.name)
    );
    if (!fresh.length) return toast('Already imported');
    const added = fresh.map((f) => {
      const id = 'local:' + f.size + ':' + f.name;
      const url = URL.createObjectURL(f);
      localImports.push({ id, name: f.name, url });
      return {
        videoId: id,
        title: f.name.replace(/\.[^.]+$/, ''),
        artists: 'Local file',
        album: '',
        duration: '',
        durationSeconds: 0,
        thumbnail: '',
        isAvailable: true,
        isLocal: true,
        localUrl: url,
      };
    });
    localTracks.push(...added);
    // show them in the track pane so the drop has an obvious visible result
    renderTracks(localTracks.slice(), `local files (${localTracks.length})`);
    if (!state.queue.length) {
      state.queue = added.slice();
      state.originTracks = added.slice();
      renderQueue();
      playAt(0);
    } else {
      state.queue.push(...added);
      renderQueue();
      toast(`＋ ${added.length} file${added.length > 1 ? 's' : ''} → queue`);
    }
    renderLocalList();
  }

  function renderLocalList() {
    el.setLocalList.innerHTML = '';
    if (!localImports.length) {
      el.setLocalList.innerHTML = '<li class="set-empty">none imported</li>';
    } else {
      localImports.forEach((l) => {
        const li = document.createElement('li');
        li.textContent = l.name;
        li.title = l.name;
        el.setLocalList.appendChild(li);
      });
    }
    if (el.setLocalClear) el.setLocalClear.disabled = !localImports.length;
  }

  function clearLocal() {
    if (!localImports.length) return;
    const cur = state.queue[state.qi] || null;
    if (cur && cur.isLocal) stopLocalIfPlaying();
    localImports.forEach((l) => {
      try { URL.revokeObjectURL(l.url); } catch (_) {}
    });
    localImports.length = 0;
    localTracks.length = 0;
    if (state.list.some((t) => t.isLocal)) renderTracks([], 'local files (0)');
    state.queue = state.queue.filter((t) => !t.isLocal);
    state.qi =
      cur && !cur.isLocal
        ? state.queue.indexOf(cur)
        : Math.min(state.qi, state.queue.length - 1);
    if (cur && cur.isLocal) setNowPlaying(state.queue[state.qi] || null);
    renderQueue();
    highlightPlaying();
    renderLocalList();
    toast('Cleared imported files');
  }
  // the statistics window asks us to play a set of tracks (top tracks, an
  // artist, a day's history) — build a queue and go
  if (window.retro && window.retro.onStatsPlay) {
    window.retro.onStatsPlay((payload) => {
      const src = (payload && payload.tracks) || [];
      if (!src.length) return;
      const q = src
        .filter((t) => t && t.videoId)
        .map((t) => ({
          videoId: t.videoId,
          title: t.title || '?',
          artists: t.artists || '',
          duration: t.duration || '',
          durationSeconds: t.durationSeconds || 0,
          isAvailable: true,
        }));
      if (!q.length) return;
      if (payload.shuffle)
        for (let i = q.length - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          [q[i], q[j]] = [q[j], q[i]];
        }
      stopVideoIfPlaying();
      stopLocalIfPlaying();
      state.queue = q;
      state.originTracks = q.slice();
      state.qi = -1;
      state.radio = false;
      el.tpRadio.classList.remove('on');
      renderTracks(q, '📊 ' + (payload.label || 'from statistics'));
      playAt(0);
    });
  }
  if (window.retro && window.retro.onVideoActivity) {
    window.retro.onVideoActivity((msg) => {
      const st = msg.state;
      if (st === 'time') {
        if (videoActive) paintTime(msg.cur, msg.dur); // LCD + seek follow the video
        return;
      }
      if (st === 'playing') {
        if (!videoActive) {
          const musicWasPlaying = P.snapshot().playing || localPlaying;
          P.pause(); // song stops when a video takes over
          stopLocalIfPlaying(); // …and any imported file
          if (musicWasPlaying) toast('⏸ audio paused — video playing');
        }
        videoActive = true;
        videoPlaying = true;
        el.lcd.classList.remove('blink');
        updateDlBtn();
        updateFavBtn();
        setNowPlaying(
          msg.title ? { artists: msg.channel || '', title: msg.title } : null
        );
      } else if (st === 'paused') {
        videoPlaying = false; // still the active source — transport targets it
        if (videoActive) el.lcd.classList.add('blink');
      } else {
        // ended | stopped | closed → music regains the transport
        videoPlaying = false;
        el.lcd.classList.remove('blink');
        if (videoActive) {
          videoActive = false;
          setNowPlaying(state.queue[state.qi] || null);
        }
        updateDlBtn();
        updateFavBtn();
      }
      paintVol(); // slider reflects whichever source is live
    });
  }

  // ---- unified search (music + video) + playlists ----------
  const SEARCH_MODES = ['all', 'music', 'video'];
  const MODE_GLYPH = { all: 'A', music: '♪', video: '▶' };
  let searchMode = localStorage.getItem('retro.searchMode') || 'all';
  if (!SEARCH_MODES.includes(searchMode)) searchMode = 'all';
  function paintSearchMode() {
    el.qMode.textContent = MODE_GLYPH[searchMode];
    el.qMode.title = `Search scope: ${searchMode} — click to cycle`;
  }
  paintSearchMode();
  el.qMode.onclick = () => {
    searchMode =
      SEARCH_MODES[(SEARCH_MODES.indexOf(searchMode) + 1) % SEARCH_MODES.length];
    localStorage.setItem('retro.searchMode', searchMode);
    paintSearchMode();
    if (el.q.value.trim()) doSearch();
  };

  // ---- collapsible group headers (All-mode "♪ MUSIC" / "▶ VIDEO") --------
  function groupHeader(grp, label) {
    const li = document.createElement('li');
    li.className = 'grp';
    li.dataset.grp = grp;
    li.textContent = label;
    li.addEventListener('click', () => {
      const collapsed = !li.classList.contains('collapsed');
      li.classList.toggle('collapsed', collapsed);
      [...el.tracks.children].forEach((row) => {
        if (row.dataset.grp === grp && !row.classList.contains('grp'))
          row.style.display = collapsed ? 'none' : '';
      });
    });
    return li;
  }

  // normalise a /video-search row into the same shape as a music track so it
  // can live in state.queue / session lists and play (audio) via RetroPlayer
  function videoToTrack(v) {
    return {
      videoId: v.videoId,
      title: v.title,
      artists: v.channel || '',
      album: null,
      duration: v.live ? 'LIVE' : v.duration,
      durationSeconds: v.durationSeconds,
      thumbnail: v.thumbnail,
      isAvailable: true,
      isVideo: true,
    };
  }

  // video rows share the track pane with songs. Double-click / ＋ / drag adds
  // them to the queue (they play as audio in the main player); the right-click
  // menu also offers "Open in video window" to actually watch one.
  function renderVideoResults(vids, q, opts) {
    opts = opts || {};
    if (!opts.append) {
      state.list = [];
      el.tracks.innerHTML = '';
    }
    if (opts.append && vids.length)
      el.tracks.appendChild(groupHeader('video', `▶  VIDEO · ${vids.length}`));
    vids.forEach((v) => {
      const t = videoToTrack(v);
      const li = document.createElement('li');
      li.className = 'vid';
      if (opts.append) li.dataset.grp = 'video';
      li.dataset.videoId = v.videoId;
      li.innerHTML =
        `<span class="t-title">${escapeHtml(v.title || '?')}</span>` +
        `<span class="t-sub">${escapeHtml(v.channel || '')}</span>` +
        `<span class="t-dur${v.live ? ' live' : ''}">${
          v.live ? 'LIVE' : escapeHtml(v.duration || '')
        }</span>` +
        `<button class="t-add" title="Add to queue">＋</button>`;
      const watch = () => {
        if (window.retro && window.retro.playVideo)
          window.retro.playVideo({ id: v.videoId, title: v.title, channel: v.channel });
        else toast('Video window needs the app (npm start)');
      };
      li.addEventListener('dblclick', () => enqueue(t, 'now')); // play as audio
      li.querySelector('.t-add').addEventListener('click', (e) => {
        e.stopPropagation();
        enqueue(t, 'end');
      });
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        trackMenu(e, t, { from: 'pane', list: [t], index: 0, watch });
      });
      makeRowDraggable(li, t);
      el.tracks.appendChild(li);
    });
    if (opts.append) el.foot.textContent += `  +  ${vids.length} video`;
    else el.foot.textContent = `video: "${q}"  ·  ${vids.length} results`;
  }

  async function doSearch() {
    const q = el.q.value.trim();
    if (!q) return;
    el.foot.textContent = 'searching…';
    setActiveName(null);
    state.plView = null; // search results aren't a playlist view
    try {
      if (searchMode === 'music') {
        renderTracks(await API.search(q), `music: "${q}"`);
      } else if (searchMode === 'video') {
        renderVideoResults(await API.videoSearch(q), q);
      } else {
        const [music, vids] = await Promise.all([
          API.search(q).catch(() => []),
          API.videoSearch(q).catch(() => []),
        ]);
        renderTracks(music, `music: "${q}"`);
        if (music.length) {
          [...el.tracks.children].forEach((li) => (li.dataset.grp = 'music'));
          el.tracks.insertBefore(
            groupHeader('music', `♪  MUSIC · ${music.length}`),
            el.tracks.firstChild
          );
        }
        renderVideoResults(vids, q, { append: true });
      }
    } catch (e) {
      el.foot.textContent = 'search failed: ' + (e.message || e);
    }
  }
  el.qGo.onclick = doSearch;
  el.q.addEventListener('keydown', (e) => e.key === 'Enter' && doSearch());

  function setActiveName(id) {
    [...el.names.children].forEach((li) =>
      li.classList.toggle('active', li.dataset.id === id)
    );
  }

  // YouTube's library list is eventually-consistent: a just-created playlist
  // won't appear in get_library_playlists() for a few seconds, and a just-
  // deleted one lingers. Bridge that gap locally.
  const optimisticPls = new Map(); // id -> {playlistId,title,count} to show early
  const suppressedPls = new Set(); // ids to hide until the server drops them

  function makePlaylistRow(p) {
    const li = document.createElement('li');
    li.dataset.id = p.playlistId;
    li.textContent = p.title + (p.count ? `  (${p.count})` : '');
    li.title = p.title;
    li.onclick = () => openPlaylist(p.playlistId, p.title);
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      playlistMenu(e, p);
    });
    // drag a track-pane row onto a playlist name → add it (LM → like)
    li.addEventListener('dragover', (e) => {
      if (!dragPayload || dragPayload.kind !== 'track') return;
      e.preventDefault();
      li.classList.add('drop-hot');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drop-hot'));
    li.addEventListener('drop', (e) => {
      li.classList.remove('drop-hot');
      if (!dragPayload || !dragPayload.track) return;
      e.preventDefault();
      e.stopPropagation();
      dropTrackOnPlaylist(p.playlistId, p.title, dragPayload.track);
    });
    return li;
  }

  async function loadPlaylists() {
    try {
      const pls = await API.playlists();
      const seen = new Set(pls.map((p) => p.playlistId));
      // clear pending state the server has now caught up on
      optimisticPls.forEach((_, id) => seen.has(id) && optimisticPls.delete(id));
      suppressedPls.forEach((id) => !seen.has(id) && suppressedPls.delete(id));
      el.names.innerHTML = '';
      pls
        .filter((p) => !suppressedPls.has(p.playlistId))
        .forEach((p) => el.names.appendChild(makePlaylistRow(p)));
      // keep freshly-created playlists visible until YT's library catches up
      optimisticPls.forEach((p) => el.names.appendChild(makePlaylistRow(p)));
    } catch (e) {
      el.foot.textContent = 'could not load playlists: ' + e.message;
    }
  }

  async function openPlaylist(id, title) {
    setActiveName(id);
    setActiveRec(null);
    el.foot.textContent = 'loading…';
    try {
      const data = await API.playlist(id);
      // opening Liked Music is our chance to learn what's already favourited
      if (id === 'LM')
        data.tracks.forEach((t) => t.videoId && likedIds.add(t.videoId));
      renderTracks(data.tracks, data.title || title, {
        id,
        title: data.title || title,
        owned: !!data.owned,
        isLM: !!data.isLM || id === 'LM',
      });
      updateFavBtn();
    } catch (e) {
      el.foot.textContent = 'failed: ' + e.message;
    }
  }

  // ---- playlist management (create / drag-add / rename / delete / reorder) --
  async function newYtPlaylist() {
    if (!state.authed) return toast('connect a Google account first');
    const name = await askText('New playlist name:', 'New playlist');
    if (!name) return;
    try {
      const r = await API.createPlaylist(name, []);
      if (r && r.playlistId)
        optimisticPls.set(r.playlistId, {
          playlistId: r.playlistId,
          title: name,
          count: 0,
        });
      toast('playlist created: ' + name);
      await loadPlaylists();
      setTimeout(loadPlaylists, 3000); // reconcile once YT's library propagates
    } catch (e) {
      toast('create failed: ' + (e.message || e));
    }
  }

  async function dropTrackOnPlaylist(id, title, t) {
    if (!t.videoId || t.videoId.startsWith('local:'))
      return toast('only YouTube tracks can be added');
    try {
      if (id === 'LM') {
        await rateTrack(t, true); // LM is the liked-songs list
      } else {
        const r = await API.addToPlaylist(id, [t.videoId]);
        if (r && r.ok === false) {
          toast('already in "' + title + '"');
          return;
        }
        toast('added to "' + title + '"');
        if (state.plView && state.plView.id === id)
          openPlaylist(id, title); // refresh so the new row has its setVideoId
      }
    } catch (e) {
      toast('add failed: ' + (e.message || e));
    }
  }

  async function removeFromPl(t, i) {
    const pv = state.plView;
    if (!pv) return;
    try {
      if (pv.isLM) {
        await rateTrack(t, false); // un-favourite
      } else {
        if (!t.setVideoId) return toast("can't remove this item");
        await API.removeFromPlaylist(pv.id, [
          { videoId: t.videoId, setVideoId: t.setVideoId },
        ]);
        toast('removed from "' + pv.title + '"');
      }
      state.list.splice(i, 1); // optimistic
      renderTracks(state.list, '✎ ' + pv.title, pv);
    } catch (e) {
      toast('remove failed: ' + (e.message || e));
    }
  }

  async function reorderInPl(moved, before) {
    const pv = state.plView;
    if (!pv || !pv.owned || !moved || moved === before) return;
    try {
      await API.movePlaylistItem(pv.id, moved, before);
      openPlaylist(pv.id, pv.title); // re-fetch the canonical order
    } catch (e) {
      toast('reorder failed: ' + (e.message || e));
    }
  }

  function playlistMenu(ev, p) {
    const items = [
      { label: 'Open', fn: () => openPlaylist(p.playlistId, p.title) },
      {
        label: 'Play',
        fn: async () => {
          try {
            const d = await API.playlist(p.playlistId);
            if (!d.tracks.length) return toast('playlist is empty');
            state.queue = d.tracks.slice();
            state.originTracks = d.tracks;
            renderTracks(d.tracks, d.title || p.title, {
              id: p.playlistId,
              title: d.title || p.title,
              owned: !!d.owned,
              isLM: !!d.isLM || p.playlistId === 'LM',
            });
            setActiveName(p.playlistId);
            playAt(0);
          } catch (e) {
            toast('failed: ' + (e.message || e));
          }
        },
      },
    ];
    if (p.playlistId !== 'LM') {
      items.push(
        '-',
        { label: 'Rename…', fn: () => renamePl(p) },
        { label: 'Delete playlist', fn: () => deletePl(p) }
      );
    }
    showCtx(ev, items);
  }

  async function renamePl(p) {
    const name = await askText('Rename playlist:', p.title);
    if (!name || name === p.title) return;
    try {
      await API.renamePlaylist(p.playlistId, name);
      toast('renamed');
      if (state.plView && state.plView.id === p.playlistId)
        state.plView.title = name;
      const row = [...el.names.children].find(
        (li) => li.dataset.id === p.playlistId
      );
      if (row) row.textContent = name; // patch now; server list lags
      if (optimisticPls.has(p.playlistId))
        optimisticPls.get(p.playlistId).title = name;
      setTimeout(loadPlaylists, 3000);
    } catch (e) {
      toast('rename failed: ' + (e.message || e));
    }
  }

  async function deletePl(p) {
    if (!(await askConfirm(`Delete playlist "${p.title}"? This can't be undone.`)))
      return;
    try {
      await API.deletePlaylist(p.playlistId);
      toast('deleted "' + p.title + '"');
      optimisticPls.delete(p.playlistId);
      suppressedPls.add(p.playlistId); // hide until get_library_playlists drops it
      if (state.plView && state.plView.id === p.playlistId) {
        state.plView = null;
        renderTracks([], 'deleted');
      }
      await loadPlaylists();
      setTimeout(loadPlaylists, 3000);
    } catch (e) {
      toast('delete failed: ' + (e.message || e));
    }
  }

  el.plAdd.onclick = (e) => {
    e.stopPropagation();
    newYtPlaylist();
  };
  // right-click the PLAYLISTS header (or its empty list area) → New playlist…
  const plHead = el.plLibSection.querySelector('.head-tools');
  [plHead, el.names].forEach((node) =>
    node.addEventListener('contextmenu', (e) => {
      if (e.target.closest('#pl-names li')) return; // row menu handles its own
      e.preventDefault();
      showCtx(e, [{ label: '＋ New playlist…', fn: newYtPlaylist }]);
    })
  );

  // ---- "FOR YOU" — recommendations + artists (sidebar section) -----------
  // Three sources, all cached ~30 min (⟳ forces a refetch):
  //   API.home()             → YTM's history-based shelves (quick picks, …)
  //   API.artists()          → artists in your library / follows
  //   API.suggestedArtists() → "fans might also like", aggregated from those
  // A section/artist click drops tracks into the main pane; ▶ plays shuffled.
  let recsCache = null; // { at, sections:[{title,tracks}] }
  let artistsCache = null; // { at, favourites:[{channelId,name}], suggested:[…] }
  let recsBusy = false;
  let artistsBusy = false;
  const RECS_TTL = 30 * 60 * 1000;
  const artistTrackCache = new Map(); // channelId -> {name, tracks, related}

  function setActiveRec(li) {
    [...el.recsNames.children].forEach((n) => n.classList.toggle('active', n === li));
  }
  function recsMsg(txt) {
    el.recsNames.innerHTML = '';
    const li = document.createElement('li');
    li.className = 'recs-empty';
    li.textContent = txt;
    el.recsNames.appendChild(li);
  }

  async function getArtist(id) {
    if (artistTrackCache.has(id)) return artistTrackCache.get(id);
    const d = await API.artist(id);
    artistTrackCache.set(id, d);
    return d;
  }
  async function openArtist(id, name) {
    setActiveName(null);
    setActiveRec(null);
    el.foot.textContent = 'loading ' + name + '…';
    try {
      const d = await getArtist(id);
      state.originTracks = d.tracks || [];
      renderTracks(d.tracks || [], '🎤 ' + (d.name || name));
    } catch (e) {
      el.foot.textContent = 'failed: ' + (e.message || e);
    }
  }
  async function playArtist(id, name) {
    try {
      const d = await getArtist(id);
      const q = (d.tracks || []).slice();
      if (!q.length) return toast('no tracks for ' + name);
      for (let i = q.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [q[i], q[j]] = [q[j], q[i]];
      }
      state.queue = q;
      state.originTracks = d.tracks || [];
      state.qi = -1;
      state.radio = false;
      el.tpRadio.classList.remove('on');
      renderTracks(q, '🎤 ' + (d.name || name));
      playAt(0);
    } catch (e) {
      toast('failed: ' + (e.message || e));
    }
  }

  function renderForYou() {
    if (!state.authed) return recsMsg('connect to see recommendations');
    const sections = (recsCache && recsCache.sections) || [];
    const fav = (artistsCache && artistsCache.favourites) || [];
    const sug = (artistsCache && artistsCache.suggested) || [];
    if (!recsCache && !artistsCache) return recsMsg('loading…');
    if (recsCache && artistsCache && !sections.length && !fav.length && !sug.length)
      return recsMsg('nothing yet — play a few songs');

    el.recsNames.innerHTML = '';
    const sub = (txt) => {
      const li = document.createElement('li');
      li.className = 'recs-sub';
      li.textContent = txt;
      el.recsNames.appendChild(li);
    };
    const artistRow = (a) => {
      const li = document.createElement('li');
      li.className = 'recs-artist';
      li.title = a.name + (a.subscribers ? ' · ' + a.subscribers : '');
      li.innerHTML =
        `<span class="ra-name">${escapeHtml(a.name)}</span>` +
        `<button class="ra-play" title="Shuffle ${escapeHtml(a.name)}">▶</button>`;
      li.onclick = () => openArtist(a.channelId, a.name);
      li.querySelector('.ra-play').onclick = (e) => {
        e.stopPropagation();
        playArtist(a.channelId, a.name);
      };
      // drag onto the ARTIST MIX panel to add
      if (a.channelId) {
        li.draggable = true;
        li.addEventListener('dragstart', (e) => {
          dragPayload = { kind: 'artist', id: a.channelId, name: a.name };
          e.dataTransfer.effectAllowed = 'copy';
        });
        li.addEventListener('dragend', () => (dragPayload = null));
      }
      el.recsNames.appendChild(li);
    };

    sections.forEach((sec) => {
      const li = document.createElement('li');
      li.textContent = `${sec.title}  (${sec.tracks.length})`;
      li.title = sec.title;
      li.onclick = () => {
        setActiveName(null);
        setActiveRec(li);
        state.originTracks = sec.tracks;
        renderTracks(sec.tracks, '✨ ' + sec.title);
      };
      el.recsNames.appendChild(li);
    });
    if (fav.length) {
      sub('FAVOURITE ARTISTS');
      fav.forEach(artistRow);
    }
    if (sug.length) {
      sub('SUGGESTED ARTISTS');
      sug.forEach(artistRow);
    }
  }

  async function loadRecs(force) {
    if (!state.authed) return renderForYou();
    if (recsBusy) return;
    if (!force && recsCache && Date.now() - recsCache.at < RECS_TTL)
      return renderForYou();
    recsBusy = true;
    renderForYou();
    try {
      const data = await API.home();
      recsCache = { at: Date.now(), sections: data.sections || [] };
    } catch (e) {
      if (!recsCache) recsCache = { at: Date.now(), sections: [] };
      console.warn('[retro] /home failed:', e.message);
    } finally {
      recsBusy = false;
      renderForYou();
    }
  }

  // most-played artists from local stats (retro.stats) — merged into the
  // "favourite artists" list so it fills in from listening even when the YTM
  // library is empty. Needs artistId, which track() now carries.
  function topStatsArtists(n) {
    const by = new Map();
    const s = statLoad();
    for (const r of Object.values(s.tracks || {})) {
      if (!r || !r.plays || !r.artistId) continue;
      let a = by.get(r.artistId);
      if (!a)
        by.set(
          r.artistId,
          (a = {
            channelId: r.artistId,
            name: (r.artists || '').split(/,\s*/)[0] || r.artists || '?',
            plays: 0,
          })
        );
      a.plays += r.plays;
    }
    return [...by.values()].sort((x, y) => y.plays - x.plays).slice(0, n);
  }

  async function loadArtists(force) {
    if (!state.authed) return;
    if (artistsBusy) return;
    if (!force && artistsCache && Date.now() - artistsCache.at < RECS_TTL) return;
    artistsBusy = true;
    const statFav = topStatsArtists(20);
    try {
      const [fav, sug] = await Promise.all([
        API.artists().catch(() => ({ artists: [] })),
        API.suggestedArtists(statFav.map((a) => a.channelId)).catch(() => ({
          artists: [],
        })),
      ]);
      // library / follows first, then most-played that aren't already listed
      const merged = (fav.artists || []).slice();
      const seen = new Set(merged.map((a) => a.channelId));
      for (const a of statFav)
        if (a.channelId && !seen.has(a.channelId)) {
          merged.push(a);
          seen.add(a.channelId);
        }
      artistsCache = {
        at: Date.now(),
        favourites: merged.slice(0, 16),
        suggested: (sug.artists || []).slice(0, 14),
      };
    } catch (e) {
      if (!artistsCache)
        artistsCache = { at: Date.now(), favourites: [], suggested: [] };
    } finally {
      artistsBusy = false;
      renderForYou();
    }
  }

  function loadForYou(force) {
    loadRecs(force);
    loadArtists(force);
  }
  el.recsRefresh.onclick = (e) => {
    e.stopPropagation();
    artistTrackCache.clear();
    loadForYou(true);
  };

  // ---- auth flow ------------------------------------------
  // "offline mode" = the user dismissed the first-run sign-in and just wants a
  // local-file player. Persisted so it doesn't nag on every launch; cleared the
  // moment they actually connect. The ◍ titlebar button always re-opens sign-in.
  const LS_OFFLINE = 'retro.offline';
  const offlineChosen = () => localStorage.getItem(LS_OFFLINE) === '1';

  function onConnected() {
    state.authed = true;
    localStorage.removeItem(LS_OFFLINE);
    el.authMsg.textContent = 'connected!';
    el.auth.classList.add('hidden');
    loadPlaylists();
    loadForYou(true);
    renderListUI();
  }

  function goOffline() {
    localStorage.setItem(LS_OFFLINE, '1');
    el.auth.classList.add('hidden');
    recsMsg('offline mode — sign in via ◍ for search, playlists & radio');
    toast('offline mode — import audio via ⚙ or drag files onto the window');
  }

  async function connectGoogle() {
    if (!(window.retro && window.retro.connect)) {
      el.authMsg.textContent =
        'run this inside the app (npm start), not a plain browser';
      return;
    }
    el.auth.classList.remove('hidden');
    el.authGoogle.disabled = true;
    el.authMsg.textContent = 'opening Google sign-in… finish it in the popup';
    try {
      const res = await window.retro.connect();
      if (res && res.ok) onConnected();
      else
        el.authMsg.textContent =
          'not connected' + (res && res.reason ? ' — ' + res.reason : '');
    } catch (e) {
      el.authMsg.textContent = 'failed: ' + (e.message || e);
    } finally {
      el.authGoogle.disabled = false;
    }
  }
  el.authGoogle.onclick = connectGoogle;
  el.authSkip.onclick = goOffline;

  el.authConnect.onclick = async () => {
    const headers = el.authHeaders.value.trim();
    if (!headers) {
      el.authMsg.textContent = 'paste the request headers first';
      return;
    }
    el.authConnect.disabled = true;
    el.authMsg.textContent = 'connecting…';
    try {
      await API.auth(headers);
      onConnected();
    } catch (e) {
      el.authMsg.textContent = 'failed: ' + e.message;
    } finally {
      el.authConnect.disabled = false;
    }
  };

  // ---- keyboard -----------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (videoActive) vctl('toggle');
        else if (localActive) LA.paused ? LA.play().catch(() => {}) : LA.pause();
        else {
          consumeResume(); // first Space on a restored queue → own it + stats
          P.togglePlay();
        }
        break;
      case 'ArrowRight':
        if (videoActive) vctl('seek:5');
        else if (e.ctrlKey) next();
        else if (localActive) LA.currentTime = Math.min(LA.duration || 0, (LA.currentTime || 0) + 5);
        else P.seekBy(5);
        break;
      case 'ArrowLeft':
        if (videoActive) vctl('seek:-5');
        else if (e.ctrlKey) prev();
        else if (localActive) LA.currentTime = Math.max(0, (LA.currentTime || 0) - 5);
        else P.seekBy(-5);
        break;
      case 'ArrowUp':
        nudgeVol(5);
        break;
      case 'ArrowDown':
        nudgeVol(-5);
        break;
    }
  });

  // ---- keybinds cheat-sheet (the "keybinds" foot button) ----------------
  // keep this list in sync with the keydown handler above + preload.js zoom
  const KEYBINDS = [
    ['Playback', [
      ['Space', 'Play / pause'],
      ['Ctrl + →', 'Next track'],
      ['Ctrl + ←', 'Previous track (or restart)'],
      ['→ / ←', 'Seek + / − 5 s'],
      ['↑ / ↓', 'Volume + / − 5'],
      ['click LCD', 'Cycle elapsed / remaining / both'],
    ]],
    ['Window', [
      ['Ctrl + wheel', 'Zoom the whole window'],
      ['Ctrl + + / −', 'Zoom in / out'],
      ['Ctrl + 0', 'Reset zoom to 100%'],
      ['Esc', 'Close an open menu'],
    ]],
    ['Dev (unpackaged only)', [
      ['F5 / Ctrl + R', 'Reload the window'],
      ['Ctrl + Shift + R', 'Reload, ignore cache'],
      ['F12 / Ctrl+Shift+I', 'Toggle DevTools'],
    ]],
  ];
  function renderKeybinds() {
    if (el.keysPop.dataset.built) return;
    el.keysPop.dataset.built = '1';
    el.keysPop.innerHTML =
      `<button class="pop-close" type="button" title="Close">&times;</button>` +
      KEYBINDS.map(
        ([title, rows]) =>
          `<h3>${title}</h3><table>` +
          rows
            .map(
              ([k, d]) =>
                `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(d)}</td></tr>`
            )
            .join('') +
          `</table>`
      ).join('') +
      `<p class="keys-hint">Playback keys do nothing while a text box is focused, ` +
      `and drive the CRT video when it's the active source.</p>`;
  }
  function closeKeysPop() {
    el.keysPop.classList.add('hidden');
    el.keysBtn.classList.remove('on');
  }
  el.keysBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    renderKeybinds();
    const open = el.keysPop.classList.toggle('hidden') === false;
    el.keysBtn.classList.toggle('on', open);
    if (open) {
      const tp = document.getElementById('theme-pop');
      if (tp) tp.classList.add('hidden');
      el.settingsPop.classList.add('hidden');
    }
  });
  document.addEventListener('click', (e) => {
    if (
      !el.keysPop.classList.contains('hidden') &&
      !el.keysPop.contains(e.target) &&
      e.target !== el.keysBtn
    )
      closeKeysPop();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeKeysPop());

  // ---- playlist-editor panels: hide/show (foot toggles) + column resize --
  const PANEL_NODES = {
    sidebar: el.plLibSection, // the PLAYLISTS section (key kept as "sidebar" for
    recs: el.recsSection, //     retro.panels back-compat); "recs" = FOR YOU
    search: el.plSearch,
    queue: el.queueSection,
    artists: el.aqSection, // ARTIST MIX
    lists: el.slSection,
  };
  let panels = {};
  try {
    panels = JSON.parse(localStorage.getItem('retro.panels')) || {};
  } catch (_) {
    panels = {};
  }
  const savePanels = () => {
    try {
      localStorage.setItem('retro.panels', JSON.stringify(panels));
    } catch (_) {}
  };
  function applyPanels() {
    Object.keys(PANEL_NODES).forEach((k) => {
      const hidden = panels[k] === false;
      if (PANEL_NODES[k]) PANEL_NODES[k].classList.toggle('panel-hidden', hidden);
      const btn = el.pledToggles.querySelector(`[data-panel="${k}"]`);
      if (btn) btn.classList.toggle('on', !hidden);
    });
    // drop the whole queue column (and its splitter) when all its parts are off
    const qGone =
      panels.queue === false && panels.lists === false && panels.artists === false;
    el.queuePanel.classList.toggle('panel-hidden', qGone);
    el.splitQueue.classList.toggle('panel-hidden', qGone);
    // …same for the left column: gone only when PLAYLISTS *and* FOR YOU are off
    const sGone = panels.sidebar === false && panels.recs === false;
    el.plSidebar.classList.toggle('panel-hidden', sGone);
    el.splitSidebar.classList.toggle('panel-hidden', sGone);
    const rs = document.documentElement.style;
    if (panels.sidebarW) rs.setProperty('--sidebar-w', panels.sidebarW + 'px');
    if (panels.queueW) rs.setProperty('--queue-w', panels.queueW + 'px');
    if (panels.displayH) {
      // re-clamp to the current window so a saved-big value can't swallow #pled
      const h = Math.max(120, Math.min(panels.displayH, window.innerHeight - 260));
      rs.setProperty('--display-h', h + 'px');
    } else {
      rs.removeProperty('--display-h');
    }
  }
  el.pledToggles.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-panel]');
    if (!btn) return;
    const k = btn.dataset.panel;
    panels[k] = panels[k] === false ? true : false;
    savePanels();
    applyPanels();
  });

  function bindSplitter(node, key, target, invert) {
    node.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = target.getBoundingClientRect().width;
      try {
        node.setPointerCapture(e.pointerId);
      } catch (_) {}
      const onMove = (ev) => {
        let dx = ev.clientX - startX;
        if (invert) dx = -dx;
        const w = Math.max(84, Math.min(460, Math.round(startW + dx)));
        document.documentElement.style.setProperty(
          key === 'sidebarW' ? '--sidebar-w' : '--queue-w',
          w + 'px'
        );
        panels[key] = w;
      };
      const onUp = (ev) => {
        try {
          node.releasePointerCapture(ev.pointerId);
        } catch (_) {}
        node.removeEventListener('pointermove', onMove);
        node.removeEventListener('pointerup', onUp);
        savePanels();
      };
      node.addEventListener('pointermove', onMove);
      node.addEventListener('pointerup', onUp);
    });
  }
  bindSplitter(el.splitSidebar, 'sidebarW', el.plSidebar, false);
  bindSplitter(el.splitQueue, 'queueW', el.queuePanel, true);

  // vertical handle: drag to trade height between .display (player top) and
  // #pled (the editor). Persisted as panels.displayH; double-click resets.
  (function bindMainSplit() {
    const node = el.splitMain;
    const maxH = () => Math.max(140, window.innerHeight - 260);
    node.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = el.mainDisplay.getBoundingClientRect().height;
      try { node.setPointerCapture(e.pointerId); } catch (_) {}
      const onMove = (ev) => {
        const h = Math.max(120, Math.min(maxH(), Math.round(startH + ev.clientY - startY)));
        document.documentElement.style.setProperty('--display-h', h + 'px');
        panels.displayH = h;
      };
      const onUp = (ev) => {
        try { node.releasePointerCapture(ev.pointerId); } catch (_) {}
        node.removeEventListener('pointermove', onMove);
        node.removeEventListener('pointerup', onUp);
        savePanels();
      };
      node.addEventListener('pointermove', onMove);
      node.addEventListener('pointerup', onUp);
    });
    node.addEventListener('dblclick', () => {
      delete panels.displayH;
      savePanels();
      applyPanels();
    });
    // keep a saved height from swallowing the editor when the window shrinks
    window.addEventListener('resize', () => {
      if (panels.displayH) applyPanels();
    });
  })();

  applyPanels();

  // ---- boot: poll the sidecar ---------------------------
  console.info('[retro] renderer build: radio-v3 / video-transport-routing');
  loadLists();
  renderListUI();
  // ⚙ "Restore queue on startup" — rebuild a saved queue (paused); it renders
  // the queue itself, so only paint an empty one when there's nothing to restore
  if (!restoreSession()) renderQueue();
  renderArtistMix();
  recsMsg('loading…');

  let bootMsgShown = false;
  async function boot() {
    try {
      const h = await API.health();
      state.authed = !!h.authed;
      renderListUI();
      if (h.authed) {
        el.auth.classList.add('hidden');
        loadPlaylists();
        loadForYou();
      } else if (offlineChosen()) {
        // user picked "offline player" on a previous run — don't nag
        el.auth.classList.add('hidden');
        recsMsg('offline mode — sign in via ◍ for search, playlists & radio');
      } else {
        el.auth.classList.remove('hidden');
        recsMsg('connect to see recommendations');
      }
    } catch (e) {
      if (!bootMsgShown && !sessionRestored) {
        // don't stomp a just-restored queue's marquee while the sidecar warms up
        setNowPlaying({ artists: '', title: 'starting local server…' });
        bootMsgShown = true;
      }
      setTimeout(boot, 1200);
    }
  }
  boot();
})();
