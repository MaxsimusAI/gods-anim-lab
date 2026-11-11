(function () {
  'use strict';

  const FIG_HT = 0.07;
  const ENEMY_IDS = ['hades', 'zeus', 'thor', 'ares', 'anubis'];
  const ALLY_LAYOUT = ['athena', 'artemis', '__HERO__', 'apollo', 'ra'];

  const state = {
    godId: 'kitsune',
    tier: 'mob',
    supRes: '720p',
    activeSlot: 'idle',
    autoCycle: false,
    arenas: [],
    sheetReady: {},
    playStartMs: performance.now(),
    actionMode: false,
    actionSlot: 'idle',
    actionDurMs: 2800,
    autoTimer: 0,
  };

  function preloadSheet(url) {
    if (!url || state.sheetReady[url]) return;
    const im = new Image();
    im.onload = () => { state.sheetReady[url] = true; };
    im.src = url;
  }

  function warmGodSheets(god) {
    for (const tier of ['mob', 'lite']) {
      for (const aKey of ['live_bt', 'new_bt', 'new_ti']) {
        const pack = god.arenas[aKey];
        if (!pack) continue;
        for (const sl of ['idle', 'atk', 'sup', 'hyp', 'sup_360p']) {
          const sh = pack.sheets[sl] && pack.sheets[sl][tier];
          if (sh && sh.src) preloadSheet(sh.src);
        }
      }
    }
  }

  /* ---------- Procedural FX Texture Cache (R-05 compliant: abstract glows, flame tongues, stars, leaves) ---------- */
  const TX = (function () {
    const cache = {};
    function make(key, w, h, drawFn) {
      if (cache[key]) return cache[key];
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      drawFn(c.getContext('2d'), w, h);
      cache[key] = c;
      return c;
    }
    return {
      glow(col) {
        return make('glow:' + col, 64, 64, (g, w, h) => {
          const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(0.22, col);
          gr.addColorStop(0.62, col + '44');
          gr.addColorStop(1, col + '00');
          g.fillStyle = gr;
          g.fillRect(0, 0, w, h);
        });
      },
      tongue(colCore, colEdge) {
        return make('tongue:' + colCore + ':' + colEdge, 48, 84, (g, w, h) => {
          const gr = g.createLinearGradient(w / 2, h * 0.88, w / 2, h * 0.06);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(0.32, colCore);
          gr.addColorStop(0.75, colEdge);
          gr.addColorStop(1, colEdge + '00');
          g.fillStyle = gr;
          g.beginPath();
          g.moveTo(w * 0.5, h * 0.04);
          g.bezierCurveTo(w * 0.86, h * 0.34, w * 0.88, h * 0.78, w * 0.5, h * 0.94);
          g.bezierCurveTo(w * 0.12, h * 0.78, w * 0.14, h * 0.34, w * 0.5, h * 0.04);
          g.fill();
        });
      },
      star4(col) {
        return make('star4:' + col, 48, 48, (g, w, h) => {
          const cx = w / 2, cy = h / 2;
          g.fillStyle = col;
          g.beginPath();
          for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? w * 0.46 : w * 0.11;
            const a = (i * Math.PI) / 4;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          g.closePath();
          g.fill();
        });
      },
      leaf(col) {
        return make('leaf:' + col, 28, 28, (g, w, h) => {
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(w * 0.15, h * 0.85);
          g.quadraticCurveTo(w * 0.2, h * 0.18, w * 0.85, h * 0.15);
          g.quadraticCurveTo(w * 0.82, h * 0.8, w * 0.15, h * 0.85);
          g.fill();
        });
      },
    };
  })();

  /* ---------- Exact Sprite Positioning (src/ui/sheets.js + src/ui/cards.js) ---------- */
  function v2k(f) {
    return (1 - FIG_HT) / Math.max(0.1, f.foot - f.top);
  }

  function applyFigBoxStyle(el, sh, idleFig, figWrapEl) {
    el.style.backgroundImage = `url(${sh.src})`;
    el.style.backgroundSize = `${sh.cols * 100}% ${sh.rows * 100}%`;
    el.style.aspectRatio = `${sh.w} / ${sh.h}`;

    if (sh.relMode === 'v2_atk' && idleFig) {
      // Exact live BT relative offset formula from src/ui/sheets.js:779 & cards.js:322
      const k = v2k(idleFig);
      const aH = sh.aH * k;
      const xA = sh.xA * k;
      const bA = (sh.bA - 1 + idleFig.foot) * k;
      const hPx = figWrapEl.offsetHeight || 195;
      el.style.height = `${(aH * 100).toFixed(2)}%`;
      el.style.bottom = `${(bA * 100).toFixed(2)}%`;
      el.style.left = `calc(50% + ${(xA * hPx).toFixed(2)}px)`;
      el.style.transform = 'none';
      el.style.translate = 'none';
    } else if (sh.fig) {
      // Universal corridor-normalized v2Style(sh.fig)
      const f = sh.fig;
      const k = v2k(f);
      el.style.height = `${(k * 100).toFixed(2)}%`;
      el.style.bottom = '0';
      el.style.left = '50%';
      el.style.transform = 'translateX(-50%)';
      el.style.translate = `${((0.5 - f.ax) * 100).toFixed(2)}% ${((1 - f.foot) * 100).toFixed(2)}%`;
    }
  }

  function setSpriteFrame(el, frameIdx, cols, rows) {
    if (el._f === frameIdx) return;
    el._f = frameIdx;
    const c = frameIdx % cols;
    const r = Math.floor(frameIdx / cols);
    const px = cols > 1 ? (c / (cols - 1)) * 100 : 0;
    const py = rows > 1 ? (r / (rows - 1)) * 100 : 0;
    el.style.backgroundPosition = `${px.toFixed(3)}% ${py.toFixed(3)}%`;
  }

  /* ---------- Build DOM for Top Bar & 3 Mini-Arenas ---------- */
  function renderRoster() {
    const host = document.getElementById('godRoster');
    const gods = window.GODS_MANIFEST.gods;
    let html = '';
    gods.forEach((g, idx) => {
      const cls = g.id === state.godId ? 'god-pill active' : 'god-pill';
      html += `<button class="${cls}" data-god="${g.id}" type="button"><img src="${g.portrait}" alt=""><span>${idx + 1}. ${g.name}</span></button>`;
    });
    html += `<span class="god-pill upcoming" title="После одобрения пилота">+5 богов (Этап 2)</span>`;
    html += `<span class="god-pill upcoming" title="Контрольная пятёрка">+5 богов (Этап 3)</span>`;
    html += `<span class="god-pill upcoming" title="Полный пакет остальных богов">Остальные (Этап 4А)</span>`;
    host.innerHTML = html;
    host.querySelectorAll('button[data-god]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.godId = btn.dataset.god;
        rebuildAll();
      });
    });
  }

  function getSheetForSlot(arenaPack, slot) {
    if (slot === 'sup' && state.supRes === '360p' && arenaPack.sheets.sup_360p) {
      return arenaPack.sheets.sup_360p[state.tier];
    }
    const mapped = (arenaPack.clipMap && arenaPack.clipMap[slot]) || slot;
    return arenaPack.sheets[mapped][state.tier];
  }

  function renderMetrics(god) {
    const tier = state.tier;
    const liveIdle = god.arenas.live_bt.sheets.idle[tier];
    const liveAtk = god.arenas.live_bt.sheets.atk[tier];
    const liveKb = (liveIdle.kb + liveAtk.kb).toFixed(0);
    const liveRam = (liveIdle.ramMb + liveAtk.ramMb).toFixed(2);

    const sum4 = (pack) => {
      const slots = ['idle', 'atk', state.supRes === '360p' && pack.sheets.sup_360p ? 'sup_360p' : 'sup', 'hyp'];
      let kb = 0, ram = 0;
      for (const s of slots) {
        kb += pack.sheets[s][tier].kb;
        ram += pack.sheets[s][tier].ramMb;
      }
      return { kb: kb.toFixed(0), ram: ram.toFixed(2), avgRam: (ram / 4).toFixed(2) };
    };
    const nBt = sum4(god.arenas.new_bt);
    const nTi = sum4(god.arenas.new_ti);

    document.getElementById('metricsLine').innerHTML =
      `<span class="el-badge">🔥 ${god.elementRu} · ${god.roleRu}</span>` +
      `<span>Сейчас в БТ (2 активных листа): <b>${liveKb} КБ</b> / <b>${liveRam} МБ RAM</b></span>` +
      `<span>Новая БТ (4 листа ${tier}): <b>${nBt.kb} КБ</b> / <b>${nBt.ram} МБ</b> (~${nBt.avgRam} МБ/умение)</span>` +
      `<span>Новая TI (4 листа ${tier}): <b>${nTi.kb} КБ</b> / <b>${nTi.ram} МБ</b> (~${nTi.avgRam} МБ/умение)</span>`;
  }

  function buildArenasDOM(god) {
    const grid = document.getElementById('arenasGrid');
    grid.innerHTML = '';
    state.arenas = [];

    const defs = [
      { key: 'live_bt', title: 'Арена 1 — Сейчас в игре (Битва титанов)', tag: 'Live БТ + текущий FX', isNew: false, styleSet: 'bt', bg: 'assets/ui/arena-bt.webp' },
      { key: 'new_bt', title: 'Арена 2 — Новая: Битва титанов', tag: 'Новые 4 листа 5×5 + FX', isNew: true, styleSet: 'bt', bg: 'assets/ui/arena-bt.webp' },
      { key: 'new_ti', title: 'Арена 3 — Новая: Titan Idols (Аниме)', tag: 'Новые 4 листа Аниме + FX', isNew: true, styleSet: 'ti', bg: 'assets/ui/arena-ti.webp' },
    ];

    for (const d of defs) {
      const pack = god.arenas[d.key];
      const card = document.createElement('section');
      card.className = 'arena-card' + (d.isNew ? ' is-new' : '');

      const enemyBarsHtml = ENEMY_IDS.map((_, i) =>
        `<div class="bar" data-ebar="${i}"><div class="tracks"><div class="track"><i class="lag" style="width:100%"></i><i class="cur" style="width:100%"></i><b>100%</b></div></div></div>`
      ).join('');

      const enemyFigsHtml = ENEMY_IDS.map((hid, i) =>
        `<div class="figcell" data-ecell="${i}">` +
          `<div class="figwrap mannequin" data-ewrap="${i}">` +
            `<i class="aura up"></i><i class="aura down"></i>` +
            `<img class="mannequin-img" src="assets/ui/dummy-${d.styleSet}-${hid}.webp" alt="" style="animation-delay:${(-i * 0.55).toFixed(2)}s">` +
            `<span class="sts2" data-ests="${i}"></span>` +
          `</div>` +
        `</div>`
      ).join('');

      const allyFigsHtml = ALLY_LAYOUT.map((hid, i) => {
        if (hid === '__HERO__') {
          return `<div class="figcell hero-spot" data-acell="${i}">` +
            `<div class="decoy-layer" data-adecoy="${i}">` +
              `<img class="fox-decoy" src="${pack.decoyImg}" style="left:20%" alt="">` +
              `<img class="fox-decoy" src="${pack.decoyImg}" style="left:80%" alt="">` +
              `<img class="fox-decoy" src="${pack.decoyImg}" style="left:6%" alt="">` +
            `</div>` +
            `<div class="figwrap" data-awrap="${i}" data-hero="1">` +
              `<i class="aura up"></i><i class="aura down"></i>` +
              `<div class="fig sprite" data-hero-idle="1"></div>` +
              `<div class="atk sprite" data-hero-act="1"></div>` +
              `<span class="sts2" data-asts="${i}"></span>` +
            `</div>` +
          `</div>`;
        }
        return `<div class="figcell" data-acell="${i}">` +
          `<div class="decoy-layer" data-adecoy="${i}">` +
            `<img class="fox-decoy" src="${pack.decoyImg}" style="left:76%" alt="">` +
          `</div>` +
          `<div class="figwrap mannequin" data-awrap="${i}">` +
            `<i class="aura up"></i><i class="aura down"></i>` +
            `<img class="mannequin-img" src="assets/ui/dummy-${d.styleSet}-${hid}.webp" alt="" style="animation-delay:${(-i * 0.47).toFixed(2)}s">` +
            `<span class="sts2" data-asts="${i}"></span>` +
          `</div>` +
        `</div>`;
      }).join('');

      const allyBarsHtml = ALLY_LAYOUT.map((hid, i) => {
        const isHero = hid === '__HERO__';
        return `<div class="bar" data-abar="${i}"><div class="tracks">` +
          `<div class="track"><i class="lag" style="width:100%"></i><i class="cur" style="width:100%"></i><b>100%</b></div>` +
          `<div class="enbar${isHero ? ' full' : ''}" data-aen="${i}"><i style="width:${isHero ? 100 : 40}%"></i></div>` +
        `</div></div>`;
      }).join('');

      card.innerHTML =
        `<div class="arena-head">` +
          `<span class="arena-title">${d.title}</span>` +
          `<span class="arena-tag">${d.tag}</span>` +
        `</div>` +
        `<div class="arena-stage" style="background-image:url(${d.bg})">` +
          `<div class="arena-note-pill" data-note="1"></div>` +
          `<div class="team-block enemy-block">` +
            `<div class="row5 bars-row">${enemyBarsHtml}</div>` +
            `<div class="row5 enemy-figs">${enemyFigsHtml}</div>` +
          `</div>` +
          `<canvas class="arena-fxc"></canvas>` +
          `<div class="arena-fxdom"></div>` +
          `<div class="team-block ally-block">` +
            `<div class="row5 ally-figs">${allyFigsHtml}</div>` +
            `<div class="row5 bars-row">${allyBarsHtml}</div>` +
          `</div>` +
        `</div>`;

      grid.appendChild(card);

      const stageEl = card.querySelector('.arena-stage');
      const canvas = card.querySelector('.arena-fxc');
      const fxDom = card.querySelector('.arena-fxdom');
      const heroWrap = card.querySelector('[data-hero="1"]');
      const idleEl = card.querySelector('[data-hero-idle="1"]');
      const actEl = card.querySelector('[data-hero-act="1"]');
      const noteEl = card.querySelector('[data-note="1"]');

      const arenaObj = {
        key: d.key,
        pack,
        card,
        stageEl,
        canvas,
        ctx: canvas.getContext('2d'),
        fxDom,
        heroWrap,
        idleEl,
        actEl,
        noteEl,
        particles: [],
        shots: [],
        lanterns: [],
        sunbeams: [],
        timers: [],
        cleanups: [],
      };
      state.arenas.push(arenaObj);
    }

    syncArenaIdleSheets(god);
    resizeCanvases();
  }

  function syncArenaIdleSheets(god) {
    for (const a of state.arenas) {
      const idleSh = getSheetForSlot(a.pack, 'idle');
      a.idleSh = idleSh;
      a.idleEl._f = -1;
      applyFigBoxStyle(a.idleEl, idleSh, idleSh.fig, a.heroWrap);
      setSpriteFrame(a.idleEl, 0, idleSh.cols, idleSh.rows);
      a.idleEl.style.visibility = 'visible';
      a.actEl.style.display = 'none';
    }
  }

  function resizeCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const a of state.arenas) {
      const r = a.stageEl.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      if (a.canvas.width !== Math.round(w * dpr) || a.canvas.height !== Math.round(h * dpr)) {
        a.canvas.width = Math.round(w * dpr);
        a.canvas.height = Math.round(h * dpr);
      }
      a.dpr = dpr;
      a.w = w;
      a.h = h;
    }
  }

  /* ---------- Unit Coordinates & Authentic Combat UI Helpers ---------- */
  function unitAnchor(arena, side, idx, yFrac) {
    const sRect = arena.stageEl.getBoundingClientRect();
    const sel = side === 'enemy' ? `[data-ewrap="${idx}"]` : `[data-awrap="${idx}"]`;
    const wrap = arena.stageEl.querySelector(sel);
    if (!wrap) return { x: arena.w * 0.5, y: arena.h * 0.5, w: 60, h: 120 };
    const r = wrap.getBoundingClientRect();
    return {
      x: r.left - sRect.left + r.width * 0.5,
      y: r.top - sRect.top + r.height * (yFrac == null ? 0.45 : yFrac),
      top: r.top - sRect.top,
      bottom: r.bottom - sRect.top,
      w: r.width,
      h: r.height,
    };
  }

  function setBarPct(arena, side, idx, pct) {
    const bar = arena.stageEl.querySelector(side === 'enemy' ? `[data-ebar="${idx}"]` : `[data-abar="${idx}"]`);
    if (!bar) return;
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const cur = bar.querySelector('.cur');
    const lag = bar.querySelector('.lag');
    const txt = bar.querySelector('b');
    if (cur) cur.style.width = clamped + '%';
    if (lag) lag.style.width = clamped + '%';
    if (txt) txt.textContent = clamped + '%';
  }

  function setStatus(arena, side, idx, auraType, icons) {
    const wrap = arena.stageEl.querySelector(side === 'enemy' ? `[data-ewrap="${idx}"]` : `[data-awrap="${idx}"]`);
    const sts = arena.stageEl.querySelector(side === 'enemy' ? `[data-ests="${idx}"]` : `[data-asts="${idx}"]`);
    if (!wrap || !sts) return;
    wrap.classList.toggle('st-up', auraType === 'up');
    wrap.classList.toggle('st-down', auraType === 'down');
    sts.innerHTML = (icons || []).map(ic =>
      `<i class="${ic.bad ? 'bad' : 'good'}"><img src="assets/ui/i_${ic.k}.webp" alt="">${ic.n ? `<b>${ic.n}</b>` : ''}</i>`
    ).join('');
  }

  function setDecoys(arena, allyIdx, count, warm) {
    const layer = arena.stageEl.querySelector(`[data-adecoy="${allyIdx}"]`);
    if (!layer) return;
    const imgs = layer.querySelectorAll('.fox-decoy');
    imgs.forEach((im, i) => {
      im.classList.toggle('warm', !!warm);
      im.classList.toggle('active', i < count);
    });
  }

  function spawnFloatNum(arena, x, y, text, cls) {
    const d = document.createElement('div');
    d.className = 'num' + (cls ? ' ' + cls : '');
    d.style.left = `${x.toFixed(1)}px`;
    d.style.top = `${y.toFixed(1)}px`;
    d.textContent = text;
    arena.fxDom.appendChild(d);
    setTimeout(() => d.remove(), 1150);
  }

  function spawnSupBanner(arena, title, color) {
    const d = document.createElement('div');
    d.className = 'supname';
    d.style.setProperty('--fc', color || '#a8e4ff');
    d.textContent = title;
    arena.fxDom.appendChild(d);
    setTimeout(() => d.remove(), 1300);
  }

  function clearArenaState(arena) {
    for (const t of arena.timers) clearTimeout(t);
    arena.timers.length = 0;
    arena.particles.length = 0;
    arena.shots.length = 0;
    arena.lanterns.length = 0;
    arena.sunbeams.length = 0;
    arena.fxDom.innerHTML = '';
    arena.heroWrap.classList.remove('casting');
    arena.noteEl.classList.remove('show');
    for (let i = 0; i < 5; i++) {
      setBarPct(arena, 'enemy', i, 100);
      setStatus(arena, 'enemy', i, null, []);
      const ew = arena.stageEl.querySelector(`[data-ewrap="${i}"]`);
      if (ew) ew.classList.remove('hit-shake', 'heal-glow');
      setBarPct(arena, 'ally', i, 100);
      setStatus(arena, 'ally', i, null, []);
      setDecoys(arena, i, 0, false);
      const aw = arena.stageEl.querySelector(`[data-awrap="${i}"]`);
      if (aw) aw.classList.remove('hit-shake', 'heal-glow');
    }
  }

  function schedule(arena, ms, fn) {
    const id = setTimeout(fn, Math.max(0, ms));
    arena.timers.push(id);
  }

  /* ---------- Particle & Projectile Primitives ---------- */
  function addBurst(arena, x, y, opts) {
    const colCore = opts.core || '#bfe9ff';
    const colEdge = opts.edge || '#3a6aa8';
    const nTongues = opts.tongues ?? 7;
    const nSparks = opts.sparks ?? 8;
    const scale = opts.scale ?? 1;

    arena.particles.push({
      x, y, vx: 0, vy: 0, ay: 0, drag: 0,
      age: 0, life: 0.24, s0: 42 * scale, s1: 14 * scale,
      tex: TX.glow(colCore), alpha: 0.85, rot: 0, vr: 0,
    });
    arena.particles.push({
      x, y, vx: 0, vy: 0, ay: 0, drag: 0,
      age: 0, life: 0.22, s0: 26 * scale, s1: 8 * scale,
      tex: TX.star4('#ffffff'), alpha: 0.9, rot: (Math.random() - 0.5) * 0.8, vr: 1.5,
    });

    for (let i = 0; i < nTongues; i++) {
      arena.particles.push({
        x: x + (Math.random() - 0.5) * 18 * scale,
        y: y + (Math.random() - 0.5) * 10 * scale,
        vx: (Math.random() - 0.5) * 32,
        vy: -(45 + Math.random() * 55) * scale,
        ay: -35, drag: 1.6,
        age: 0, life: 0.32 + Math.random() * 0.2,
        s0: (14 + Math.random() * 7) * scale, s1: 3,
        tex: TX.tongue(colCore, colEdge), alpha: 0.9, rot: 0, vr: 0,
      });
    }
    for (let i = 0; i < nSparks; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 95;
      arena.particles.push({
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        ay: 20, drag: 2.8,
        age: 0, life: 0.25 + Math.random() * 0.22,
        s0: 10 * scale, s1: 2,
        tex: TX.glow('#ffffff'), alpha: 0.9, rot: 0, vr: 0,
      });
    }
    if (opts.leaf) {
      arena.particles.push({
        x, y: y - 8,
        vx: (Math.random() - 0.5) * 42, vy: -(35 + Math.random() * 30),
        ay: 115, drag: 1.1,
        age: 0, life: 0.85,
        s0: 13, s1: 10,
        tex: TX.leaf(opts.leafCol || '#9ac850'), alpha: 0.95,
        rot: Math.random() * 4, vr: (Math.random() - 0.5) * 7, normalBlend: true,
      });
    }
  }

  function launchFoxShot(arena, from, to, durSec, opts) {
    arena.shots.push({
      from, to,
      age: 0, dur: Math.max(0.16, durSec),
      arc: opts.arc ?? -24,
      wob: opts.wob ?? 14,
      wf: opts.wf ?? 2.2,
      r: opts.r ?? 9,
      core: opts.core || '#bfe9ff',
      edge: opts.edge || '#3a6aa8',
      onHit: opts.onHit,
    });
  }

  /* ---------- Orchestrate Skill FX per Arena (Live BT vs Upgraded Arenas 2 & 3) ---------- */
  function triggerSkillFX(arena, god, slot, relMs, playDurMs) {
    const heroBox = unitAnchor(arena, 'ally', 2, 0.42);
    const isLive = arena.key === 'live_bt';
    arena.heroWrap.classList.add('casting');

    if (isLive && (slot === 'sup' || slot === 'hyp')) {
      arena.noteEl.textContent = `В игре сейчас: играет лист обычной атаки atk (CLIP_MAP.${god.id})`;
      arena.noteEl.classList.add('show');
    }

    if (slot === 'atk') {
      // Both Live & New use SIG.kitsune.a (clean fox-fire shoulder lanterns -> wobbling wisp -> curse + 1 decoy)
      const lShoulder = { x: heroBox.x - heroBox.w * 0.34, y: heroBox.y - heroBox.h * 0.08 };
      const rShoulder = { x: heroBox.x + heroBox.w * 0.34, y: heroBox.y - heroBox.h * 0.08 };
      arena.lanterns.push(
        { x: lShoulder.x, y: lShoulder.y, age: 0, life: (relMs + 420) / 1000, core: '#d8f2ff', edge: '#6ec8ff', phase: 0 },
        { x: rShoulder.x, y: rShoulder.y, age: 0, life: relMs / 1000 + 0.05, core: '#d8f2ff', edge: '#6ec8ff', phase: 2.1 }
      );

      schedule(arena, relMs, () => {
        const tgtIdx = 1; // Strongest enemy
        const tgt = unitAnchor(arena, 'enemy', tgtIdx, 0.46);
        addBurst(arena, rShoulder.x, rShoulder.y, { scale: 0.65, tongues: 3, sparks: 4 });
        launchFoxShot(arena, rShoulder, tgt, 0.38, {
          arc: -24, wob: 16, r: 9.5, core: '#bfe9ff', edge: '#3a6aa8',
          onHit: () => {
            addBurst(arena, tgt.x, tgt.y, { scale: 1.1, tongues: 8, sparks: 9 });
            const ew = arena.stageEl.querySelector(`[data-ewrap="${tgtIdx}"]`);
            if (ew) { ew.classList.add('hit-shake'); setTimeout(() => ew.classList.remove('hit-shake'), 260); }
            setBarPct(arena, 'enemy', tgtIdx, 82);
            setStatus(arena, 'enemy', tgtIdx, 'down', [{ k: 'down', bad: true }]);
            spawnFloatNum(arena, tgt.x, tgt.y - 8, '−4,62M', 'crit');
            schedule(arena, 130, () => spawnFloatNum(arena, tgt.x, tgt.top + 8, 'Проклятие −70%', 'debuff'));
          },
        });

        // 20% passive decoy demonstration on Kitsune
        schedule(arena, 120, () => {
          setDecoys(arena, 2, 1, false);
          setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false }]);
          addBurst(arena, heroBox.x - heroBox.w * 0.38, heroBox.y, { scale: 0.85, tongues: 5, sparks: 5, leaf: true });
          spawnFloatNum(arena, heroBox.x, heroBox.top + 12, 'Обманка', 'buff');
        });
      });
    } else if (slot === 'sup') {
      spawnSupBanner(arena, 'Девять хвостов', '#a8e4ff');

      if (isLive) {
        // Arena 1: Exact live SIG.kitsune.s (2 shoulder lanterns + 5 wisps from 2 points)
        const lPt = { x: heroBox.x - heroBox.w * 0.34, y: heroBox.y - heroBox.h * 0.08 };
        const rPt = { x: heroBox.x + heroBox.w * 0.34, y: heroBox.y - heroBox.h * 0.08 };
        arena.lanterns.push(
          { x: lPt.x, y: lPt.y, age: 0, life: relMs / 1000 + 0.12, core: '#d8f2ff', edge: '#6ec8ff', phase: 0 },
          { x: rPt.x, y: rPt.y, age: 0, life: relMs / 1000 + 0.12, core: '#d8f2ff', edge: '#6ec8ff', phase: 2 }
        );
        schedule(arena, relMs, () => {
          for (let ei = 0; ei < 5; ei++) {
            const from = ei === 2 ? { x: heroBox.x, y: heroBox.y - 16 } : (ei % 2 === 0 ? lPt : rPt);
            const tgt = unitAnchor(arena, 'enemy', ei, 0.46);
            launchFoxShot(arena, from, tgt, 0.36 + ei * 0.02, {
              arc: -18, wob: 8, r: 7.5, core: '#bfe9ff', edge: '#3a6aa8',
              onHit: () => {
                addBurst(arena, tgt.x, tgt.y, { scale: 0.9, tongues: 6, sparks: 6 });
                setStatus(arena, 'enemy', ei, 'down', [{ k: 'down', bad: true }]);
                if (ei === 2) spawnFloatNum(arena, tgt.x, tgt.top + 8, 'Проклятие −70%', 'debuff');
              },
            });
          }
          setDecoys(arena, 2, 3, false);
          setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false, n: 3 }]);
          addBurst(arena, heroBox.x - heroBox.w * 0.36, heroBox.y, { scale: 0.85, leaf: true });
          addBurst(arena, heroBox.x + heroBox.w * 0.36, heroBox.y, { scale: 0.85, leaf: true });
          spawnFloatNum(arena, heroBox.x, heroBox.top + 10, 'Обманка ×3', 'buff');
        });
      } else {
        // Arenas 2 & 3: Upgraded 9-point Nine-Tails Crown Arc (9 distinct living fox-fire wisps rippling 1..9 -> sweeping volley across all 5 enemies + 3 decoys)
        const crownPts = [];
        const rx = heroBox.w * 0.62, ry = heroBox.h * 0.42;
        for (let i = 0; i < 9; i++) {
          const u = i / 8; // 0..1 from left tail tip to right tail tip
          const ang = Math.PI * (0.92 - u * 0.84);
          const pt = {
            x: heroBox.x + Math.cos(ang) * rx,
            y: (heroBox.top + heroBox.h * 0.48) - Math.sin(ang) * ry,
          };
          crownPts.push(pt);
          const delayMs = Math.round(80 + i * ((relMs - 140) / 9));
          schedule(arena, delayMs, () => {
            arena.lanterns.push({
              x: pt.x, y: pt.y, age: 0,
              life: Math.max(0.18, (relMs - delayMs) / 1000 + 0.08),
              core: '#e8fbff', edge: '#5cc4ff', phase: i * 0.8, scale: 1.15,
            });
            addBurst(arena, pt.x, pt.y, { scale: 0.42, tongues: 2, sparks: 3 });
          });
        }

        schedule(arena, relMs, () => {
          addBurst(arena, heroBox.x, heroBox.y - 8, { scale: 1.05, tongues: 7, sparks: 10 });
          const targetMap = [0, 0, 1, 1, 2, 3, 3, 4, 4]; // All 9 wisps strike across the 5 enemies!
          crownPts.forEach((from, wi) => {
            const ei = targetMap[wi];
            const tgt = unitAnchor(arena, 'enemy', ei, 0.45);
            launchFoxShot(arena, from, tgt, 0.34 + (wi % 3) * 0.04, {
              arc: (wi - 4) * 9, wob: 13, r: 8.5, core: '#d4f5ff', edge: '#5a8fff',
              onHit: () => {
                addBurst(arena, tgt.x, tgt.y, { scale: 0.88, tongues: 5, sparks: 6, core: '#d9b8ff', edge: '#6d3ab8' });
                const ew = arena.stageEl.querySelector(`[data-ewrap="${ei}"]`);
                if (ew) { ew.classList.add('hit-shake'); setTimeout(() => ew.classList.remove('hit-shake'), 240); }
                setStatus(arena, 'enemy', ei, 'down', [{ k: 'down', bad: true }]);
                if (wi === 0 || wi === 4 || wi === 8) {
                  spawnFloatNum(arena, tgt.x, tgt.top + 8, 'Проклятие −70%', 'debuff');
                }
              },
            });
          });

          setDecoys(arena, 2, 3, false);
          setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false, n: 3 }]);
          [-0.4, 0.4, -0.68].forEach((off, di) => {
            schedule(arena, di * 55, () => {
              addBurst(arena, heroBox.x + heroBox.w * off, heroBox.y + 4, { scale: 0.82, tongues: 4, sparks: 5, leaf: true });
            });
          });
          spawnFloatNum(arena, heroBox.x, heroBox.top + 10, 'Обманка ×3', 'buff');
        });
      }
    } else if (slot === 'hyp') {
      // Pre-damage allies to 58% HP so the massive 42.8% max HP heal visually refills their green HP bars to 100%!
      for (let ai = 0; ai < 5; ai++) setBarPct(arena, 'ally', ai, 58);

      if (isLive) {
        // Arena 1: Exact live SIG.kitsune.h (11 cold cyan lanterns overhead descending onto allies)
        spawnSupBanner(arena, 'Лисья свадьба', '#a8e4ff');
        const lanPts = [];
        for (let i = 0; i < 9; i++) {
          const lx = arena.w * (0.1 + (0.8 * i) / 8);
          const ly = heroBox.top - 42 - Math.sin((i / 8) * Math.PI) * 18;
          lanPts.push({ x: lx, y: ly });
          schedule(arena, 60 + i * 35, () => {
            arena.lanterns.push({ x: lx, y: ly, age: 0, life: relMs / 1000 + 0.12, core: '#d8f2ff', edge: '#6ec8ff', phase: i });
          });
        }
        schedule(arena, relMs, () => {
          for (let ai = 0; ai < 5; ai++) {
            const ally = unitAnchor(arena, 'ally', ai, 0.48);
            const from = lanPts[Math.min(8, ai * 2)];
            launchFoxShot(arena, from, ally, 0.34, {
              arc: 8, wob: 6, r: 7.5, core: '#bfe9ff', edge: '#3a6aa8',
              onHit: () => {
                addBurst(arena, ally.x, ally.y, { scale: 0.9, tongues: 5, sparks: 6, leaf: true });
                setBarPct(arena, 'ally', ai, 100);
                setDecoys(arena, ai, 1, false);
                setStatus(arena, 'ally', ai, 'up', [{ k: 'inv', bad: false }, { k: 'heal', bad: false }]);
                spawnFloatNum(arena, ally.x, ally.top + 14, '+89,4M', 'heal');
              },
            });
          }
          schedule(arena, 420, () => spawnFloatNum(arena, heroBox.x, heroBox.top - 4, 'Обманка отряду', 'buff'));
        });
      } else {
        // Arenas 2 & 3: Upgraded Kitsune no Yomeiri (Warm Golden-Emerald Sunshower Beams + 9 Warm Gold/Jade Wedding Lanterns + Emerald-Gold Heal & Warm Decoys)
        spawnSupBanner(arena, 'Лисья свадьба', '#ffe484');

        for (let bi = 0; bi < 5; bi++) {
          const ally = unitAnchor(arena, 'ally', bi, 0.5);
          arena.sunbeams.push({
            x: ally.x, topY: Math.max(8, heroBox.top - 95), botY: ally.bottom + 4,
            w: ally.w * 0.85, age: 0, life: (relMs + 650) / 1000, delay: bi * 0.05,
          });
        }

        const wedPts = [];
        for (let i = 0; i < 9; i++) {
          const lx = arena.w * (0.09 + (0.82 * i) / 8);
          const ly = heroBox.top - 46 - Math.sin((i / 8) * Math.PI) * 22;
          wedPts.push({ x: lx, y: ly });
          schedule(arena, 55 + Math.abs(i - 4) * 55, () => {
            arena.lanterns.push({
              x: lx, y: ly, age: 0, life: relMs / 1000 + 0.15,
              core: i % 2 === 0 ? '#fff2a6' : '#b8ffcf',
              edge: i % 2 === 0 ? '#e89a28' : '#2eb872',
              phase: i * 1.1, scale: 1.12,
            });
          });
        }

        schedule(arena, relMs, () => {
          addBurst(arena, heroBox.x, heroBox.y - 6, { scale: 1.15, tongues: 8, sparks: 12, core: '#ffe88a', edge: '#38c878' });
          for (let ai = 0; ai < 5; ai++) {
            const ally = unitAnchor(arena, 'ally', ai, 0.48);
            const l1 = wedPts[Math.min(8, ai * 2)];
            const l2 = wedPts[Math.min(8, ai * 2 + 1)] || l1;
            [l1, l2].forEach((from, j) => {
              launchFoxShot(arena, from, { x: ally.x + (j ? 8 : -8), y: ally.y }, 0.35 + j * 0.05, {
                arc: j ? 14 : -14, wob: 8, r: 8,
                core: j ? '#b8ffcf' : '#ffe88a',
                edge: j ? '#2aa866' : '#d88a24',
                onHit: () => {
                  if (j === 0) {
                    addBurst(arena, ally.x, ally.y, { scale: 0.98, tongues: 6, sparks: 8, core: '#c6ffab', edge: '#d89b28', leaf: true, leafCol: '#b8e868' });
                    const aw = arena.stageEl.querySelector(`[data-awrap="${ai}"]`);
                    if (aw) { aw.classList.add('heal-glow'); setTimeout(() => aw.classList.remove('heal-glow'), 520); }
                    setBarPct(arena, 'ally', ai, 100);
                    setDecoys(arena, ai, 1, true);
                    setStatus(arena, 'ally', ai, 'up', [{ k: 'inv', bad: false }, { k: 'heal', bad: false }]);
                    spawnFloatNum(arena, ally.x, ally.top + 14, '+89,4M', 'heal');
                  }
                },
              });
            });
          }
          schedule(arena, 420, () => spawnFloatNum(arena, heroBox.x, heroBox.top - 4, 'Обманка отряду', 'buff'));
        });
      }
    }

    schedule(arena, playDurMs + 950, () => {
      if (state.activeSlot === 'idle' && !state.autoCycle) {
        clearArenaState(arena);
      }
    });
  }

  /* ---------- Canvas FX Render Step ---------- */
  function stepArenaCanvas(arena, dt) {
    const g = arena.ctx;
    const dpr = arena.dpr || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, arena.w, arena.h);

    // 1. Warm sunshower beams (hyp on Arenas 2 & 3)
    for (let i = arena.sunbeams.length - 1; i >= 0; i--) {
      const b = arena.sunbeams[i];
      b.age += dt;
      if (b.age >= b.life) { arena.sunbeams.splice(i, 1); continue; }
      if (b.age < b.delay) continue;
      const t = (b.age - b.delay) / Math.max(0.1, b.life - b.delay);
      const al = Math.min(1, t / 0.18) * Math.min(1, (1 - t) / 0.28) * 0.28;
      g.save();
      g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(b.x, b.topY, b.x, b.botY);
      gr.addColorStop(0, 'rgba(255, 232, 135, 0)');
      gr.addColorStop(0.25, `rgba(255, 232, 135, ${al.toFixed(3)})`);
      gr.addColorStop(0.8, `rgba(130, 245, 175, ${(al * 0.85).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(130, 245, 175, 0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(b.x - b.w * 0.24, b.topY);
      g.lineTo(b.x + b.w * 0.24, b.topY);
      g.lineTo(b.x + b.w * 0.56, b.botY);
      g.lineTo(b.x - b.w * 0.56, b.botY);
      g.closePath();
      g.fill();
      g.restore();
    }

    // 2. Floating fox-fire lanterns
    for (let i = arena.lanterns.length - 1; i >= 0; i--) {
      const l = arena.lanterns[i];
      l.age += dt;
      if (l.age >= l.life) { arena.lanterns.splice(i, 1); continue; }
      const al = Math.min(1, l.age / 0.12) * Math.min(1, (l.life - l.age) / 0.14);
      const y = l.y + Math.sin(l.age * 5.5 + l.phase) * 3;
      const sc = (l.scale || 1) * (1 + 0.14 * Math.sin(l.age * 22 + l.phase));
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = al * 0.62;
      g.drawImage(TX.glow(l.edge), l.x - 18 * sc, y - 18 * sc, 36 * sc, 36 * sc);
      g.globalAlpha = al;
      g.drawImage(TX.tongue(l.core, l.edge), l.x - 8 * sc, y - 20 * sc, 16 * sc, 26 * sc);
      g.restore();
    }

    // 3. Curved wobbling fox-fire projectiles
    for (let i = arena.shots.length - 1; i >= 0; i--) {
      const s = arena.shots[i];
      s.age += dt;
      const u = Math.min(1, s.age / s.dur);
      const dx = s.to.x - s.from.x, dy = s.to.y - s.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const curve = Math.sin(u * Math.PI) * s.arc + Math.sin(u * Math.PI * s.wf * 2) * s.wob * (1 - u * 0.5);
      const x = s.from.x + dx * u + nx * curve;
      const y = s.from.y + dy * u + ny * curve;
      const ang = Math.atan2(dy, dx);

      if (Math.random() < 0.85) {
        arena.particles.push({
          x: x + (Math.random() - 0.5) * 4,
          y: y + (Math.random() - 0.5) * 4,
          vx: -Math.cos(ang) * 22 + (Math.random() - 0.5) * 16,
          vy: -Math.sin(ang) * 22 - 14,
          ay: -20, drag: 2.2,
          age: 0, life: 0.24, s0: s.r * 1.35, s1: 2,
          tex: TX.tongue(s.core, s.edge), alpha: 0.78, rot: 0, vr: 0,
        });
      }

      g.save();
      g.globalCompositeOperation = 'lighter';
      g.translate(x, y);
      g.globalAlpha = 0.68;
      g.drawImage(TX.glow(s.edge), -s.r * 2.2, -s.r * 2.2, s.r * 4.4, s.r * 4.4);
      g.rotate(ang + Math.PI / 2);
      g.globalAlpha = 1;
      g.drawImage(TX.tongue(s.core, s.edge), -s.r * 0.95, -s.r * 1.1, s.r * 1.9, s.r * 3.1);
      g.drawImage(TX.glow('#ffffff'), -s.r * 0.8, -s.r * 0.8, s.r * 1.6, s.r * 1.6);
      g.restore();

      if (u >= 1) {
        arena.shots.splice(i, 1);
        if (s.onHit) s.onHit(s.to.x, s.to.y);
      }
    }

    // 4. Particles
    for (let i = arena.particles.length - 1; i >= 0; i--) {
      const p = arena.particles[i];
      p.age += dt;
      if (p.age >= p.life) { arena.particles.splice(i, 1); continue; }
      const k = p.age / p.life;
      const damp = Math.exp(-(p.drag || 0) * dt);
      p.vx *= damp;
      p.vy = (p.vy + (p.ay || 0) * dt) * damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += (p.vr || 0) * dt;
      const sz = p.s0 + (p.s1 - p.s0) * k;
      const al = (p.alpha ?? 1) * (1 - k);

      g.save();
      g.globalCompositeOperation = p.normalBlend ? 'source-over' : 'lighter';
      g.globalAlpha = Math.max(0, al);
      g.translate(p.x, p.y);
      if (p.rot) g.rotate(p.rot);
      g.drawImage(p.tex, -sz / 2, -sz / 2, sz, sz);
      g.restore();
    }
  }

  /* ---------- Trigger Synchronous Playback Across All 3 Arenas ---------- */
  function triggerSlot(slot) {
    const god = window.GODS_MANIFEST.gods.find(g => g.id === state.godId);
    if (!god) return;

    state.activeSlot = slot;
    document.querySelectorAll('.skill-btn').forEach(b => b.classList.toggle('active', b.dataset.slot === slot));
    updateVerdictBlocks(god, slot);

    const now = performance.now();
    state.playStartMs = now;

    if (slot === 'idle') {
      state.actionMode = false;
      state.actionSlot = 'idle';
      for (const a of state.arenas) {
        clearArenaState(a);
        a.actEl.style.display = 'none';
        a.idleEl.style.visibility = 'visible';
      }
      return;
    }

    state.actionMode = true;
    state.actionSlot = slot;
    state.actionDurMs = 2850; // Clean 3s (25 frames) action playback across all 3 arenas

    for (const a of state.arenas) {
      clearArenaState(a);
      const sh = getSheetForSlot(a.pack, slot);
      const idleSh = getSheetForSlot(a.pack, 'idle');
      a.actSh = sh;
      a.actEl._f = -1;
      applyFigBoxStyle(a.actEl, sh, idleSh.fig, a.heroWrap);
      setSpriteFrame(a.actEl, 0, sh.cols, sh.rows);
      a.idleEl.style.visibility = 'hidden';
      a.actEl.style.display = 'block';

      const relFrac = sh.rel || 0.45;
      const relMs = Math.round(state.actionDurMs * relFrac);
      triggerSkillFX(a, god, slot, relMs, state.actionDurMs);
    }
  }

  /* ---------- Update Bottom Plain-Russian Blocks A & B ---------- */
  function updateVerdictBlocks(god, slot) {
    document.getElementById('btnAtkLabel').textContent = `Обычное: ${god.skills.atk.shortName}`;
    document.getElementById('btnSupLabel').textContent = `Супер: ${god.skills.sup.shortName}`;
    document.getElementById('btnHypLabel').textContent = `Ульта: ${god.skills.hyp.shortName}`;

    const sk = god.skills[slot];
    const fxBadge = document.getElementById('fxBadge');
    fxBadge.textContent = sk.fxBadge;
    fxBadge.className = 'status-pill ' + (sk.fxUpgraded ? 'upgrade' : 'keep');

    document.getElementById('fxBody').innerHTML =
      `<p><b>${sk.title}:</b> ${sk.descRu}</p>` +
      `<div class="fx-verdict-box"><b>Вердикт по FX:</b> ${sk.fxVerdictRu}</div>`;

    const balBadge = document.getElementById('balBadge');
    balBadge.textContent = god.balance.badge;
    balBadge.className = 'status-pill ' + god.balance.badgeClass;
    document.getElementById('balBody').innerHTML = god.balance.paragraphsRu.map(p => `<p>${p}</p>`).join('');
  }

  /* ---------- Single Master Loop (paused when document.hidden per PERFORMANCE.md) ---------- */
  let lastNow = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden) {
      lastNow = now;
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
    lastNow = now;

    const elapsed = now - state.playStartMs;
    let displayFrame = 0;

    if (state.actionMode) {
      const u = elapsed / state.actionDurMs;
      if (u >= 1) {
        // Smoothly return all 3 arenas to seamless idle!
        state.actionMode = false;
        state.playStartMs = now;
        for (const a of state.arenas) {
          a.actEl.style.display = 'none';
          a.idleEl.style.visibility = 'visible';
          a.heroWrap.classList.remove('casting');
        }
        if (!state.autoCycle) {
          document.querySelectorAll('.skill-btn').forEach(b => b.classList.toggle('active', b.dataset.slot === 'idle'));
        } else {
          state.autoTimer = now + 950;
        }
      } else {
        displayFrame = Math.min(24, Math.floor(u * 25));
        for (const a of state.arenas) {
          if (a.actSh) setSpriteFrame(a.actEl, displayFrame, a.actSh.cols, a.actSh.rows);
        }
      }
    } else {
      const idleDurMs = 2875;
      const u = (elapsed % idleDurMs) / idleDurMs;
      displayFrame = Math.min(24, Math.floor(u * 25));
      for (const a of state.arenas) {
        if (a.idleSh) setSpriteFrame(a.idleEl, displayFrame, a.idleSh.cols, a.idleSh.rows);
      }
      if (state.autoCycle && state.actionSlot !== 'idle' && state.autoTimer > 0 && now >= state.autoTimer) {
        state.autoTimer = 0;
        triggerSlot(state.actionSlot);
      }
    }

    const frEl = document.getElementById('frameReadout');
    if (frEl) frEl.textContent = `Кадр ${String(displayFrame + 1).padStart(2, '0')}/25`;

    for (const a of state.arenas) {
      stepArenaCanvas(a, dt);
    }
  }

  function rebuildAll() {
    const god = window.GODS_MANIFEST.gods.find(g => g.id === state.godId) || window.GODS_MANIFEST.gods[0];
    warmGodSheets(god);
    renderRoster();
    renderMetrics(god);
    buildArenasDOM(god);
    updateVerdictBlocks(god, state.activeSlot);
  }

  function bindControls() {
    document.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', () => triggerSlot(btn.dataset.slot));
    });

    document.querySelectorAll('.seg-btn[data-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tier = btn.dataset.tier;
        document.querySelectorAll('.seg-btn[data-tier]').forEach(b => b.classList.toggle('active', b === btn));
        const god = window.GODS_MANIFEST.gods.find(g => g.id === state.godId);
        renderMetrics(god);
        syncArenaIdleSheets(god);
        if (state.actionMode) triggerSlot(state.actionSlot);
      });
    });

    document.querySelectorAll('.seg-btn[data-res]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.supRes = btn.dataset.res;
        document.querySelectorAll('.seg-btn[data-res]').forEach(b => b.classList.toggle('active', b === btn));
        const god = window.GODS_MANIFEST.gods.find(g => g.id === state.godId);
        renderMetrics(god);
        triggerSlot('sup');
      });
    });

    const autoBtn = document.getElementById('btnAutoCycle');
    autoBtn.addEventListener('click', () => {
      state.autoCycle = !state.autoCycle;
      autoBtn.classList.toggle('active', state.autoCycle);
      autoBtn.textContent = state.autoCycle ? '↻ Автоповтор: Вкл' : '↻ Автоповтор: Выкл';
      if (state.autoCycle && state.activeSlot === 'idle') {
        triggerSlot('sup');
      }
    });

    document.getElementById('tabNew10').addEventListener('click', () => {
      alert('Секция «10 новых богов под ключ» (арт БТ + TI, геймдизайн 4 умений, бонусы прокачки, 80 листов анимаций, FX и баланс на капе) запланирована на Этап 4Б сразу после приёмки первых пятёрок существующих богов.');
    });

    window.addEventListener('resize', () => {
      resizeCanvases();
      const god = window.GODS_MANIFEST.gods.find(g => g.id === state.godId);
      if (god) syncArenaIdleSheets(god);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindControls();
    rebuildAll();
    requestAnimationFrame(tick);
  });
})();
