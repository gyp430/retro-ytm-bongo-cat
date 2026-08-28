/* Retro YTM — theme engine + picker.
   A theme is a full map of the CSS tokens in winamp.css :root, applied as
   inline styles on <html>. Presets/game themes are generated from a small
   colour "seed"; "Custom" layers a few user-picked colours over Classic. */
window.RetroThemes = (() => {
  // ---------- colour utils ----------
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  function hexToRgb(h) {
    h = String(h).trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const toHex = (r, g, b) =>
    '#' + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, '0')).join('');
  function shade(hex, pct) {
    const [r, g, b] = hexToRgb(hex);
    const t = pct < 0 ? 0 : 255;
    const p = Math.abs(pct) / 100;
    return toHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
  }
  const rgba = (hex, a) => {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  const textOn = (hex) => {
    const [r, g, b] = hexToRgb(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#0b0b0b' : '#ffffff';
  };

  // ---------- Classic (must mirror winamp.css :root) ----------
  const CLASSIC = {
    '--body-bg': '#000000',
    '--window-a': '#434b5b', '--window-b': '#2b313d', '--window-c': '#232833',
    '--bevel-light': '#5a6474', '--bevel-dark': '#0a0d12',
    '--titlebar-a': '#2f6ab0', '--titlebar-b': '#123a67', '--titlebar-text': '#dbe8ff',
    '--subtitle-a': '#4a5364', '--subtitle-b': '#2b313d',
    '--btn-a': '#4b556a', '--btn-b': '#2b313d', '--btn-active': '#1a1e26',
    '--panel': '#2c323f',
    '--screen-bg': '#05070a', '--screen-black': '#000000',
    '--screen-edge': '#1c222c', '--screen-edge-lite': '#333b48',
    '--lcd': '#12ff6a', '--lcd-dim': '#0c7a37', '--lcd-glow': 'rgba(18,255,106,.55)',
    '--text': '#c9d4e2', '--text-dim': '#9fb0c4', '--text-faint': '#4c5a6e',
    '--text-strong': '#ffffff',
    '--list-bg': '#0b0e13', '--list-head-bg': '#161b23', '--row-hover': '#171c24',
    '--accent': '#1f6feb', '--accent-text': '#ffffff',
    '--toggle-on-a': '#f2c14e', '--toggle-on-b': '#9c7a1e', '--toggle-on-text': '#1a1204',
    '--dead': '#5b3b3b',
    '--vis-top': '#8dffb9', '--vis-bottom': '#0c7a37',
    '--thumb-a': '#c9d4e2', '--thumb-b': '#7f8a9c',
    '--cta-a': '#12ff6a', '--cta-b': '#0c7a37', '--cta-text': '#04210f',
  };
  const TOKENS = Object.keys(CLASSIC);

  // ---------- seed -> full token map ----------
  function build(s) {
    const text = s.text || '#cdd6e2';
    const lcdDim = s.lcdDim || shade(s.lcd, -45);
    const title = s.title || [shade(s.accent, 8), shade(s.accent, -38)];
    const tog = s.toggle || s.accent;
    return {
      '--body-bg': s.bg,
      '--window-a': shade(s.chrome, 16), '--window-b': shade(s.chrome, -2),
      '--window-c': shade(s.chrome, -13),
      '--bevel-light': shade(s.chrome, 36), '--bevel-dark': shade(s.bg, -35),
      '--titlebar-a': title[0], '--titlebar-b': title[1],
      '--titlebar-text': s.titleText || '#eef4ff',
      '--subtitle-a': shade(s.chrome, 8), '--subtitle-b': shade(s.chrome, -12),
      '--btn-a': shade(s.chrome, 20), '--btn-b': shade(s.chrome, -6),
      '--btn-active': shade(s.bg, 6),
      '--panel': shade(s.chrome, -1),
      '--screen-bg': shade(s.bg, 7), '--screen-black': s.bg,
      '--screen-edge': shade(s.chrome, -28), '--screen-edge-lite': shade(s.chrome, -12),
      '--lcd': s.lcd, '--lcd-dim': lcdDim, '--lcd-glow': rgba(s.glow || s.lcd, 0.55),
      '--text': text, '--text-dim': shade(text, -26), '--text-faint': shade(text, -48),
      '--text-strong': s.textStrong || '#ffffff',
      '--list-bg': shade(s.bg, 6), '--list-head-bg': shade(s.bg, 12),
      '--row-hover': shade(s.bg, 16),
      '--accent': s.accent, '--accent-text': s.accentText || textOn(s.accent),
      '--toggle-on-a': tog, '--toggle-on-b': shade(tog, -42),
      '--toggle-on-text': s.toggleText || textOn(tog),
      '--dead': shade(s.lcd, -55),
      '--vis-top': s.visTop || s.lcd, '--vis-bottom': s.visBottom || lcdDim,
      '--thumb-a': '#d7dde6', '--thumb-b': '#8b95a3',
      '--cta-a': s.lcd, '--cta-b': lcdDim, '--cta-text': s.ctaText || textOn(s.lcd),
    };
  }

  // ---------- catalogue ----------
  const PRESETS = [
    ['classic', 'Classic Green', '#12ff6a'],
    ['amber', 'Amber CRT', '#ffb000'],
    ['ice', 'Ice Blue', '#6fdaff'],
    ['vapor', 'Vaporwave', '#ff77e1'],
    ['mono', 'Mono', '#e8edf2'],
    ['redalert', 'Red Alert', '#ff4d4d'],
  ];
  const GAMES = [
    ['sc2', 'StarCraft II', '#ffcf6b'],
    ['machinae', 'Machinae Supremacy', '#38e6ff'],
    ['cyberpunk', 'Cyberpunk 2077', '#ff4b4b'],
    ['poe', 'Path of Exile', '#df9a33'],
    ['valorant', 'Valorant', '#ff4655'],
    ['dota2', 'Dota 2', '#57b4cf'],
  ];
  const SEED = {
    amber: { bg: '#0a0703', chrome: '#3a3a3f', lcd: '#ffb000', lcdDim: '#7a4f00', accent: '#c77b1f', toggle: '#ffb000', text: '#e8ddc9', title: ['#5a4a2a', '#241a08'] },
    ice: { bg: '#050b12', chrome: '#333c46', lcd: '#6fdaff', lcdDim: '#2a7398', accent: '#2f8fd0', toggle: '#6fdaff', text: '#d5e6f2', title: ['#2b6f9e', '#0d2c42'] },
    vapor: { bg: '#120720', chrome: '#3c2b52', lcd: '#ff77e1', lcdDim: '#8a3d94', accent: '#57e8ff', toggle: '#57e8ff', text: '#f0d9f7', title: ['#6a2b8f', '#241040'], toggleText: '#06131a' },
    mono: { bg: '#0b0b0d', chrome: '#35373b', lcd: '#e8edf2', lcdDim: '#7c828c', accent: '#8a929c', toggle: '#cfd4da', text: '#d6dade', title: ['#42454b', '#17181a'] },
    redalert: { bg: '#0c0505', chrome: '#3b2a2a', lcd: '#ff4d4d', lcdDim: '#7a1f1f', accent: '#c0392b', toggle: '#ff4d4d', text: '#e8cfcf', title: ['#6a2020', '#240c0c'] },

    sc2: { bg: '#060b12', chrome: '#28384c', lcd: '#ffcf6b', lcdDim: '#7a5a1e', accent: '#33ccff', toggle: '#33ccff', text: '#cfe3f5', title: ['#1f5c8c', '#0a2338'], toggleText: '#04131a', visTop: '#7fd8ff', visBottom: '#1e5a7a' },
    machinae: { bg: '#050916', chrome: '#20304f', lcd: '#38e6ff', lcdDim: '#1c6f8a', accent: '#ff2d95', toggle: '#ff2d95', text: '#cdd9f2', title: ['#1b2f66', '#0a1730'], titleText: '#bfeaff', visTop: '#66f0ff', visBottom: '#2a3f8a' },
    cyberpunk: { bg: '#0b0708', chrome: '#2a1416', lcd: '#ff4b4b', lcdDim: '#8f2b2b', accent: '#3b6bff', toggle: '#ff2f38', text: '#e8cfc9', title: ['#3a0f10', '#140708'], toggleText: '#0a0506', ctaText: '#140708', visTop: '#ff5a4a', visBottom: '#7a1f1f' },
    poe: { bg: '#0b0906', chrome: '#352b21', lcd: '#df9a33', lcdDim: '#6e4a18', accent: '#a01818', toggle: '#1ba29b', text: '#c8b48f', textStrong: '#f0e2c4', title: ['#4a2f18', '#1c130a'], toggleText: '#04140f', visTop: '#e0a94a', visBottom: '#6e4a18' },
    valorant: { bg: '#0f1923', chrome: '#1b2b38', lcd: '#7fffd4', lcdDim: '#2f7a63', accent: '#ff4655', toggle: '#ff4655', text: '#ece8e1', title: ['#1b2b38', '#0f1923'], titleText: '#ece8e1', toggleText: '#ffffff', visTop: '#7fffd4', visBottom: '#2f7a63' },
    dota2: { bg: '#16191b', chrome: '#2b3133', lcd: '#63bcd6', lcdDim: '#2f6b7d', accent: '#57b4cf', toggle: '#c8a05a', text: '#c3c8c9', textStrong: '#e6e9ea', title: ['#2b3133', '#191c1e'], toggleText: '#1a1206', visTop: '#6fd0e8', visBottom: '#2f6b7d' },
  };

  // ---------- custom ----------
  const CUSTOM_FIELDS = [
    ['lcd', 'Readout'],
    ['lcdDim', 'Readout dim'],
    ['accent', 'Selection'],
    ['toggle', 'Active button'],
    ['titleA', 'Title bar'],
    ['titleB', 'Title bar 2'],
    ['screen', 'Screen'],
    ['vis', 'Visualizer'],
  ];
  const DEFAULT_CUSTOM = {
    lcd: '#12ff6a', lcdDim: '#0c7a37', accent: '#1f6feb', toggle: '#f2c14e',
    titleA: '#2f6ab0', titleB: '#123a67', screen: '#000000', vis: '#8dffb9',
  };
  let customVals = { ...DEFAULT_CUSTOM };

  function buildCustom() {
    const v = { ...DEFAULT_CUSTOM, ...customVals };
    const m = { ...CLASSIC };
    m['--lcd'] = v.lcd; m['--lcd-dim'] = v.lcdDim; m['--lcd-glow'] = rgba(v.lcd, 0.55);
    m['--accent'] = v.accent; m['--accent-text'] = textOn(v.accent);
    m['--toggle-on-a'] = v.toggle; m['--toggle-on-b'] = shade(v.toggle, -42);
    m['--toggle-on-text'] = textOn(v.toggle);
    m['--titlebar-a'] = v.titleA; m['--titlebar-b'] = v.titleB;
    m['--body-bg'] = v.screen; m['--screen-black'] = v.screen;
    m['--screen-bg'] = shade(v.screen, 7);
    m['--vis-top'] = v.vis; m['--vis-bottom'] = v.lcdDim;
    m['--cta-a'] = v.lcd; m['--cta-b'] = v.lcdDim; m['--cta-text'] = textOn(v.lcd);
    m['--dead'] = shade(v.lcd, -55);
    return m;
  }

  // ---------- apply / persist ----------
  const cur = { id: 'classic' };

  function mapFor(id) {
    if (id === 'custom') return buildCustom();
    if (id === 'classic' || !SEED[id]) return CLASSIC;
    return build(SEED[id]);
  }
  function setVars(map) {
    const s = document.documentElement.style;
    for (const k of TOKENS) if (map[k] != null) s.setProperty(k, map[k]);
  }
  function apply(id) {
    const map = mapFor(id);
    setVars(map);
    // drives per-theme border ornaments (ornaments.css) — game themes only
    document.documentElement.setAttribute('data-theme', id);
    cur.id = id;
    try {
      localStorage.setItem('retro.theme', id);
      localStorage.setItem('retro.themeVars', JSON.stringify(map));
      if (id === 'custom')
        localStorage.setItem('retro.custom', JSON.stringify(customVals));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('retro:themechange', { detail: { id } }));
    renderPicker();
  }

  // ---------- picker UI ----------
  let pop = null;
  function buildPickerDom() {
    pop = document.getElementById('theme-pop');
    if (!pop) return;
    const rows = (arr) =>
      arr
        .map(
          ([id, name, sw]) =>
            `<div class="theme-row" data-id="${id}"><span class="theme-dot" style="background:${sw}"></span>${name}</div>`
        )
        .join('');
    pop.innerHTML =
      `<h3>Presets</h3>${rows(PRESETS)}` +
      `<h3>Game Themes</h3>${rows(GAMES)}` +
      `<h3>Custom</h3>` +
      `<div class="theme-row" data-id="custom"><span class="theme-dot" style="background:linear-gradient(135deg,#12ff6a,#57e8ff,#ff77e1)"></span>Custom&hellip;</div>` +
      `<div class="theme-custom" id="theme-custom">` +
      CUSTOM_FIELDS.map(
        ([k, label]) =>
          `<label>${label}<input type="color" data-k="${k}"></label>`
      ).join('') +
      `<button class="theme-reset" id="theme-reset">reset custom</button>` +
      `</div>`;

    pop.querySelectorAll('.theme-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        if (id === 'custom') syncCustomInputs();
        apply(id);
      });
    });
    pop.querySelectorAll('#theme-custom input[type=color]').forEach((inp) => {
      inp.addEventListener('input', () => {
        customVals[inp.dataset.k] = inp.value;
        apply('custom');
      });
    });
    const reset = document.getElementById('theme-reset');
    if (reset)
      reset.addEventListener('click', () => {
        customVals = { ...DEFAULT_CUSTOM };
        syncCustomInputs();
        apply('custom');
      });

    const btn = document.getElementById('btn-theme');
    if (btn)
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        pop.classList.toggle('hidden');
        renderPicker();
      });
    document.addEventListener('click', (e) => {
      if (
        pop &&
        !pop.classList.contains('hidden') &&
        !pop.contains(e.target) &&
        e.target.id !== 'btn-theme'
      )
        pop.classList.add('hidden');
    });
  }
  function syncCustomInputs() {
    if (!pop) return;
    pop.querySelectorAll('#theme-custom input[type=color]').forEach((inp) => {
      inp.value = customVals[inp.dataset.k] || DEFAULT_CUSTOM[inp.dataset.k];
    });
  }
  function renderPicker() {
    if (!pop) return;
    pop.querySelectorAll('.theme-row').forEach((r) =>
      r.classList.toggle('active', r.dataset.id === cur.id)
    );
    const cu = document.getElementById('theme-custom');
    if (cu) cu.classList.toggle('show', cur.id === 'custom');
  }

  // ---------- init ----------
  function init() {
    let id = 'classic';
    try {
      id = localStorage.getItem('retro.theme') || 'classic';
      const saved = JSON.parse(localStorage.getItem('retro.custom') || 'null');
      if (saved) customVals = { ...DEFAULT_CUSTOM, ...saved };
    } catch (_) {}
    buildPickerDom();
    syncCustomInputs();
    apply(id);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();

  return { apply, init, catalogue: () => ({ PRESETS, GAMES }) };
})();
