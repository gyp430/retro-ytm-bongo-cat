/* Retro YTM — statistics window.
   Reads localStorage['retro.stats'] (written by the main window's app.js) and
   renders it. No sidecar calls. "Play" buttons go back to the player through
   window.retro.playFromStats() (preload → IPC → main window). */
(() => {
  const $ = (id) => document.getElementById(id);
  const STATS_KEY = 'retro.stats';

  const fmtDur = (ms) => {
    const s = Math.round((ms || 0) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };
  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  const dayKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STATS_KEY));
      if (s && s.tracks) return s;
    } catch (_) {}
    return { v: 2, tracks: {}, daily: {}, plays: [], totalMs: 0 };
  }

  // ---- "play" bridge ------------------------------------------------------
  function play(tracks, opts) {
    if (!tracks || !tracks.length) return;
    if (!(window.retro && window.retro.playFromStats)) {
      alert('Open this from the Retro YTM app (npm start).');
      return;
    }
    window.retro.playFromStats({
      tracks: tracks.slice(0, 200),
      shuffle: !!(opts && opts.shuffle),
      label: (opts && opts.label) || 'from statistics',
    });
  }
  // build a play-list entry from a track record + id
  const rec2track = (id, r) => ({
    videoId: id,
    title: r.title || '?',
    artists: r.artists || '',
  });

  // ---- aggregates -------------------------------------------------------
  function topTracks(stats, n) {
    return Object.entries(stats.tracks)
      .filter(([id, r]) => r.plays > 0 && !id.startsWith('local:'))
      .sort((a, b) => b[1].plays - a[1].plays || b[1].ms - a[1].ms)
      .slice(0, n);
  }
  function topArtists(stats, n) {
    const by = new Map();
    for (const [id, r] of Object.entries(stats.tracks)) {
      if (!r.plays || id.startsWith('local:')) continue;
      const names = (r.artists || 'Unknown').split(/,\s*/).filter(Boolean);
      for (const name of names.length ? names : ['Unknown']) {
        let a = by.get(name);
        if (!a) by.set(name, (a = { name, plays: 0, ms: 0, tracks: [] }));
        a.plays += r.plays;
        a.ms += r.ms;
        a.tracks.push([id, r]);
      }
    }
    return [...by.values()]
      .sort((x, y) => y.plays - x.plays || y.ms - x.ms)
      .slice(0, n);
  }
  function mostSkipped(stats, n) {
    return Object.entries(stats.tracks)
      .filter(([id, r]) => r.skips > 0 && !id.startsWith('local:'))
      .sort((a, b) => b[1].skips - a[1].skips)
      .slice(0, n);
  }
  // last `days` days: [{ key, label, count, ms }]
  function dailySeries(stats, days) {
    const counts = {};
    for (const p of stats.plays || []) {
      const k = dayKey(new Date(p.t));
      counts[k] = (counts[k] || 0) + 1;
    }
    const out = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const k = dayKey(d);
      out.push({
        key: k,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        count: counts[k] || 0,
        ms: stats.daily[k] || 0,
      });
    }
    return out;
  }
  function dayStreak(series) {
    let s = 0;
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].count > 0) s++;
      else break;
    }
    return s;
  }

  // ---- render ----------------------------------------------------------
  let daily = []; // kept for the canvas click handler

  function render() {
    const stats = load();
    const ids = Object.keys(stats.tracks);
    const anyPlays = (stats.plays || []).length > 0;

    $('st-empty').classList.toggle('hidden', anyPlays);
    $('st-body').classList.toggle('hidden', !anyPlays);
    $('st-updated').textContent = anyPlays
      ? 'updated ' + new Date().toLocaleTimeString()
      : '';
    if (!anyPlays) return;

    const totalPlays = Object.values(stats.tracks).reduce((a, r) => a + r.plays, 0);
    const totalSkips = Object.values(stats.tracks).reduce((a, r) => a + r.skips, 0);
    daily = dailySeries(stats, 30);
    const week = daily.slice(-7).reduce((a, d) => a + d.ms, 0);

    const tiles = [
      ['Listening time', fmtDur(stats.totalMs)],
      ['This week', fmtDur(week)],
      ['Plays', String(totalPlays)],
      ['Unique tracks', String(ids.filter((i) => !i.startsWith('local:')).length)],
      ['Skips', String(totalSkips)],
      ['Day streak', dayStreak(daily) + 'd'],
    ];
    $('st-tiles').innerHTML = tiles
      .map(
        ([k, v]) =>
          `<div class="st-tile"><div class="st-tile-v">${esc(v)}</div><div class="st-tile-k">${esc(
            k
          )}</div></div>`
      )
      .join('');

    drawDaily();

    // top tracks
    const tt = topTracks(stats, 20);
    $('st-play-top').style.display = tt.length ? '' : 'none';
    $('st-play-top').onclick = () =>
      play(tt.map(([id, r]) => rec2track(id, r)), {
        shuffle: true,
        label: 'top tracks',
      });
    $('st-top-tracks').innerHTML = tt
      .map(
        ([id, r], i) =>
          `<li><span class="st-rank">${i + 1}</span>` +
          `<span class="st-name" title="${esc(r.title)}">${esc(r.title)}` +
          `<span class="st-by">${esc(r.artists)}</span></span>` +
          `<span class="st-count">${r.plays}×</span></li>`
      )
      .join('');

    // top artists
    const ta = topArtists(stats, 15);
    const al = $('st-top-artists');
    al.innerHTML = '';
    ta.forEach((a, i) => {
      const li = document.createElement('li');
      li.innerHTML =
        `<span class="st-rank">${i + 1}</span>` +
        `<span class="st-name" title="${esc(a.name)}">${esc(a.name)}` +
        `<span class="st-by">${a.tracks.length} tracks · ${fmtDur(a.ms)}</span></span>` +
        `<button class="st-play st-play-sm" title="Shuffle ${esc(a.name)}">▶</button>` +
        `<span class="st-count">${a.plays}×</span>`;
      li.querySelector('.st-play').onclick = () =>
        play(
          a.tracks
            .sort((x, y) => y[1].plays - x[1].plays)
            .map(([id, r]) => rec2track(id, r)),
          { shuffle: true, label: a.name }
        );
      al.appendChild(li);
    });

    // most skipped (no play button)
    const ms = mostSkipped(stats, 12);
    $('st-skipped').innerHTML = ms.length
      ? ms
          .map(
            ([id, r], i) =>
              `<li><span class="st-rank">${i + 1}</span>` +
              `<span class="st-name" title="${esc(r.title)}">${esc(r.title)}` +
              `<span class="st-by">${esc(r.artists)}</span></span>` +
              `<span class="st-count">${r.skips}×</span></li>`
          )
          .join('')
      : '<li class="st-none">no skips recorded</li>';
  }

  // ---- daily bar chart (canvas) --------------------------------------
  function drawDaily() {
    const cv = $('st-daily');
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssW = cv.clientWidth || 700;
    const cssH = cv.clientHeight || 120;
    cv.width = cssW * dpr;
    cv.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const cs = getComputedStyle(document.documentElement);
    const top = cs.getPropertyValue('--vis-top').trim() || '#8dffb9';
    const bot = cs.getPropertyValue('--vis-bottom').trim() || '#0c7a37';
    const dim = cs.getPropertyValue('--lcd-dim').trim() || '#0c7a37';

    const n = daily.length;
    const pad = 4;
    const bw = (cssW - pad * 2) / n;
    const max = Math.max(1, ...daily.map((d) => d.count));
    const grad = ctx.createLinearGradient(0, 0, 0, cssH);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bot);

    daily.forEach((d, i) => {
      const h = d.count ? Math.max(2, (d.count / max) * (cssH - 22)) : 0;
      const x = pad + i * bw;
      const y = cssH - 16 - h;
      ctx.fillStyle = d.count ? grad : dim;
      ctx.globalAlpha = d.count ? 1 : 0.18;
      ctx.fillRect(x + 1, d.count ? y : cssH - 18, bw - 2, d.count ? h : 2);
      ctx.globalAlpha = 1;
      if (i % 5 === 0 || i === n - 1) {
        ctx.fillStyle = dim;
        ctx.font = '9px Consolas, monospace';
        ctx.fillText(d.label, x, cssH - 4);
      }
    });

    cv.onclick = (e) => {
      const rect = cv.getBoundingClientRect();
      const i = Math.floor((e.clientX - rect.left - pad) / bw);
      const d = daily[i];
      if (!d || !d.count) return;
      const stats = load();
      const seen = new Set();
      const list = (stats.plays || [])
        .filter((p) => dayKey(new Date(p.t)) === d.key)
        .map((p) => p.v)
        .filter((v) => v && !v.startsWith('local:') && !seen.has(v) && seen.add(v))
        .map((v) => rec2track(v, stats.tracks[v] || {}));
      play(list, { shuffle: false, label: d.label });
    };
  }

  render();
  // live-update when the player writes new stats, and on resize (chart)
  window.addEventListener('storage', (e) => {
    if (!e || e.key === STATS_KEY || e.key === 'retro.themeVars') render();
  });
  let rz = null;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (!$('st-body').classList.contains('hidden')) drawDaily();
    }, 120);
  });
})();
