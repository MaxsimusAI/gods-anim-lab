(function () {
  'use strict';

  const FIG_HT = 0.07;
  const ENEMY_IDS = ['hades', 'zeus', 'thor', 'ares', 'anubis'];
  const ALLY_LAYOUT = ['athena', 'artemis', '__HERO__', 'apollo', 'ra'];
  const SLOT_NAMES_RU = { idle: 'idle', atk: 'atk', sup: 'sup', hyp: 'hyp' };

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

  /* ---------- Compact Crisp FX Texture Cache (No wide radial blooms; R-05 compliant) ---------- */
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
      dot(col) {
        return make('dot:' + col, 24, 24, (g, w, h) => {
          const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.46);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(0.45, col);
          gr.addColorStop(1, col + '00');
          g.fillStyle = gr;
          g.beginPath();
          g.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
          g.fill();
        });
      },
      tongue(colCore, colEdge) {
        return make('tongue:' + colCore + ':' + colEdge, 36, 60, (g, w, h) => {
          const gr = g.createLinearGradient(w / 2, h * 0.88, w / 2, h * 0.06);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(0.36, colCore);
          gr.addColorStop(0.82, colEdge);
          gr.addColorStop(1, colEdge + '00');
          g.fillStyle = gr;
          g.beginPath();
          g.moveTo(w * 0.5, h * 0.05);
          g.bezierCurveTo(w * 0.84, h * 0.36, w * 0.84, h * 0.78, w * 0.5, h * 0.94);
          g.bezierCurveTo(w * 0.16, h * 0.78, w * 0.16, h * 0.36, w * 0.5, h * 0.05);
          g.fill();
        });
      },
      star4(col) {
        return make('star4:' + col, 36, 36, (g, w, h) => {
          const cx = w / 2, cy = h / 2;
          g.fillStyle = col;
          g.beginPath();
          for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? w * 0.45 : w * 0.11;
            const a = (i * Math.PI) / 4;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          g.closePath();
          g.fill();
        });
      },
      leaf(col) {
        return make('leaf:' + col, 24, 24, (g, w, h) => {
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(w * 0.16, h * 0.84);
          g.quadraticCurveTo(w * 0.22, h * 0.2, w * 0.84, h * 0.16);
          g.quadraticCurveTo(w * 0.8, h * 0.78, w * 0.16, h * 0.84);
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

  function updateArenaDimTags(god, slot) {
    const sl = slot || state.activeSlot || 'idle';
    for (const a of state.arenas) {
      if (!a.tagEl) continue;
      const sh = getSheetForSlot(a.pack, sl);
      const sw = sh.sheetW || sh.w * sh.cols;
      const shH = sh.sheetH || sh.h * sh.rows;
      a.tagEl.textContent = `Кадр ${sh.w}×${sh.h} px · лист ${sw}×${shH}`;
    }
  }

  function renderMetrics(god) {
    const tier = state.tier;
    const sl = state.activeSlot || 'idle';
    const shLive = getSheetForSlot(god.arenas.live_bt, sl);
    const shBt = getSheetForSlot(god.arenas.new_bt, sl);
    const shTi = getSheetForSlot(god.arenas.new_ti, sl);

    const liveIdle = god.arenas.live_bt.sheets.idle[tier];
    const liveAtk = god.arenas.live_bt.sheets.atk[tier];
    const liveRam = (liveIdle.ramMb + liveAtk.ramMb).toFixed(2);

    const sum4 = (pack) => {
      const slots = ['idle', 'atk', state.supRes === '360p' && pack.sheets.sup_360p ? 'sup_360p' : 'sup', 'hyp'];
      let kb = 0, ram = 0;
      for (const s of slots) {
        kb += pack.sheets[s][tier].kb;
        ram += pack.sheets[s][tier].ramMb;
      }
      return { kb: kb.toFixed(0), ram: ram.toFixed(2) };
    };
    const nBt = sum4(god.arenas.new_bt);
    const nTi = sum4(god.arenas.new_ti);

    document.getElementById('metricsLine').innerHTML =
      `<span class="el-badge">🔥 ${god.elementRu} · ${god.roleRu}</span>` +
      `<span>Кадр <b>${SLOT_NAMES_RU[sl]}</b> (${tier}): Live БТ <b>${shLive.w}×${shLive.h} px</b> · Новая БТ <b>${shBt.w}×${shBt.h} px</b> · Новая TI <b>${shTi.w}×${shTi.h} px</b></span>` +
      `<span>Память (${tier}): Live 2 листа <b>${liveRam} МБ</b> · Новая БТ 4 листа <b>${nBt.ram} МБ</b> (${nBt.kb} КБ) · Новая TI 4 листа <b>${nTi.ram} МБ</b> (${nTi.kb} КБ)</span>`;

    updateArenaDimTags(god, sl);
  }

  function buildArenasDOM(god) {
    const grid = document.getElementById('arenasGrid');
    grid.innerHTML = '';
    state.arenas = [];

    const defs = [
      { key: 'live_bt', title: 'Арена 1 — Сейчас в игре (Битва титанов)', isNew: false, styleSet: 'bt', bg: 'assets/ui/arena-bt.webp' },
      { key: 'new_bt', title: 'Арена 2 — Новая: Битва титанов', isNew: true, styleSet: 'bt', bg: 'assets/ui/arena-bt.webp' },
      { key: 'new_ti', title: 'Арена 3 — Новая: Titan Idols (Аниме)', isNew: true, styleSet: 'ti', bg: 'assets/ui/arena-ti.webp' },
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
            `<div class="figwrap" data-awrap="${i}" data-hero="1">` +
              `<i class="aura up"></i><i class="aura down"></i>` +
              `<div class="fig sprite" data-hero-idle="1"></div>` +
              `<div class="atk sprite" data-hero-act="1"></div>` +
              `<span class="sts2" data-asts="${i}"></span>` +
            `</div>` +
          `</div>`;
        }
        return `<div class="figcell" data-acell="${i}">` +
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
          `<span class="arena-tag" data-atag="1"></span>` +
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
      const tagEl = card.querySelector('[data-atag="1"]');

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
        tagEl,
        particles: [],
        shots: [],
        lanterns: [],
        timers: [],
      };
      state.arenas.push(arenaObj);
    }

    syncArenaIdleSheets(god);
    updateArenaDimTags(god, state.activeSlot);
    resizeCanvases();
  }

  function syncArenaIdleSheets() {
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
    if (!wrap) return { x: arena.w * 0.5, y: arena.h * 0.5, top: arena.h * 0.3, bottom: arena.h * 0.7, w: 60, h: 120 };
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
    arena.fxDom.innerHTML = '';
    arena.noteEl.classList.remove('show');
    for (let i = 0; i < 5; i++) {
      setBarPct(arena, 'enemy', i, 100);
      setStatus(arena, 'enemy', i, null, []);
      const ew = arena.stageEl.querySelector(`[data-ewrap="${i}"]`);
      if (ew) ew.classList.remove('hit-shake', 'heal-glow');
      setBarPct(arena, 'ally', i, 100);
      setStatus(arena, 'ally', i, null, []);
      const aw = arena.stageEl.querySelector(`[data-awrap="${i}"]`);
      if (aw) aw.classList.remove('hit-shake', 'heal-glow');
    }
  }

  function schedule(arena, ms, fn) {
    const id = setTimeout(fn, Math.max(0, ms));
    arena.timers.push(id);
  }

  /* ---------- Compact Particle & Projectile Primitives (Zero screen-filling glows!) ---------- */
  function addBurst(arena, x, y, opts) {
    const colCore = opts.core || '#bfe9ff';
    const colEdge = opts.edge || '#3a6aa8';
    const nTongues = opts.tongues ?? 3;
    const nSparks = opts.sparks ?? 4;
    const scale = opts.scale ?? 0.7;

    arena.particles.push({
      x, y, vx: 0, vy: 0, ay: 0, drag: 0,
      age: 0, life: 0.16, s0: 13 * scale, s1: 4 * scale,
      tex: TX.star4('#ffffff'), alpha: 0.85, rot: (Math.random() - 0.5) * 0.8, vr: 1.4,
    });

    for (let i = 0; i < nTongues; i++) {
      arena.particles.push({
        x: x + (Math.random() - 0.5) * 10 * scale,
        y: y + (Math.random() - 0.5) * 6 * scale,
        vx: (Math.random() - 0.5) * 20,
        vy: -(24 + Math.random() * 28) * scale,
        ay: -18, drag: 2.0,
        age: 0, life: 0.22 + Math.random() * 0.12,
        s0: (8 + Math.random() * 4) * scale, s1: 2,
        tex: TX.tongue(colCore, colEdge), alpha: 0.88, rot: 0, vr: 0,
      });
    }
    for (let i = 0; i < nSparks; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 28 + Math.random() * 48;
      arena.particles.push({
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        ay: 16, drag: 3.2,
        age: 0, life: 0.18 + Math.random() * 0.12,
        s0: 5 * scale, s1: 1.5,
        tex: TX.dot(colCore), alpha: 0.85, rot: 0, vr: 0,
      });
    }
    if (opts.leaf) {
      arena.particles.push({
        x, y: y - 4,
        vx: (Math.random() - 0.5) * 26, vy: -(22 + Math.random() * 18),
        ay: 95, drag: 1.3,
        age: 0, life: 0.62,
        s0: 10, s1: 8,
        tex: TX.leaf(opts.leafCol || '#9ac850'), alpha: 0.9,
        rot: Math.random() * 4, vr: (Math.random() - 0.5) * 6,
      });
    }
  }

  function launchFoxShot(arena, from, to, durSec, opts) {
    arena.shots.push({
      from, to,
      age: 0, dur: Math.max(0.16, durSec),
      arc: opts.arc ?? -14,
      wob: opts.wob ?? 8,
      wf: opts.wf ?? 2.0,
      r: opts.r ?? 4.5,
      core: opts.core || '#bfe9ff',
      edge: opts.edge || '#3a6aa8',
      onHit: opts.onHit,
    });
  }

  /* ---------- Orchestrate Compact Skill FX (10-God Fight Discipline: Strictly Local & Crisp) ---------- */
  function triggerSkillFX(arena, god, slot, relMs, playDurMs) {
    const heroBox = unitAnchor(arena, 'ally', 2, 0.48);
    const isLive = arena.key === 'live_bt';

    if (isLive && (slot === 'sup' || slot === 'hyp')) {
      arena.noteEl.textContent = `В игре сейчас: играет лист обычной атаки atk (CLIP_MAP.${god.id})`;
      arena.noteEl.classList.add('show');
    }

    if (slot === 'atk') {
      // Compact hand/shoulder ember strictly inside Kitsune's silhouette -> 1 small wisp -> curse + status icon
      const castPt = { x: heroBox.x + heroBox.w * 0.16, y: heroBox.top + heroBox.h * 0.45 };
      arena.lanterns.push({
        x: castPt.x, y: castPt.y, age: 0, life: relMs / 1000 + 0.04,
        core: '#d8f2ff', edge: '#5cb8ff', phase: 0.4, scale: 0.72,
      });

      schedule(arena, relMs, () => {
        const tgtIdx = 1;
        const tgt = unitAnchor(arena, 'enemy', tgtIdx, 0.48);
        addBurst(arena, castPt.x, castPt.y, { scale: 0.55, tongues: 2, sparks: 3 });
        launchFoxShot(arena, castPt, tgt, 0.36, {
          arc: -14, wob: 9, r: 4.6, core: '#bfe9ff', edge: '#3a6aa8',
          onHit: () => {
            addBurst(arena, tgt.x, tgt.y, { scale: 0.72, tongues: 3, sparks: 4 });
            const ew = arena.stageEl.querySelector(`[data-ewrap="${tgtIdx}"]`);
            if (ew) { ew.classList.add('hit-shake'); setTimeout(() => ew.classList.remove('hit-shake'), 220); }
            setBarPct(arena, 'enemy', tgtIdx, 82);
            setStatus(arena, 'enemy', tgtIdx, 'down', [{ k: 'down', bad: true }]);
            spawnFloatNum(arena, tgt.x, tgt.y - 6, '−4,62M', 'crit');
            schedule(arena, 120, () => spawnFloatNum(arena, tgt.x, tgt.top + 8, 'Проклятие −70%', 'debuff'));
          },
        });

        // 20% passive decoy: clean status icon + tiny leaf pop (no ghost body copies!)
        schedule(arena, 110, () => {
          setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false }]);
          addBurst(arena, heroBox.x, heroBox.top + heroBox.h * 0.55, { scale: 0.5, tongues: 2, sparks: 3, leaf: true });
          spawnFloatNum(arena, heroBox.x, heroBox.top + 2, 'Обманка', 'buff');
        });
      });
    } else if (slot === 'sup') {
      spawnSupBanner(arena, 'Девять хвостов', '#a8e4ff');

      if (isLive) {
        // Arena 1: Compact 2-shoulder embers right next to body -> 5 small wisps
        const lPt = { x: heroBox.x - heroBox.w * 0.16, y: heroBox.top + heroBox.h * 0.45 };
        const rPt = { x: heroBox.x + heroBox.w * 0.16, y: heroBox.top + heroBox.h * 0.45 };
        arena.lanterns.push(
          { x: lPt.x, y: lPt.y, age: 0, life: relMs / 1000 + 0.08, core: '#d8f2ff', edge: '#5cb8ff', phase: 0, scale: 0.7 },
          { x: rPt.x, y: rPt.y, age: 0, life: relMs / 1000 + 0.08, core: '#d8f2ff', edge: '#5cb8ff', phase: 2, scale: 0.7 }
        );
        schedule(arena, relMs, () => {
          for (let ei = 0; ei < 5; ei++) {
            const from = ei === 2 ? { x: heroBox.x, y: heroBox.top + heroBox.h * 0.42 } : (ei % 2 === 0 ? lPt : rPt);
            const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
            launchFoxShot(arena, from, tgt, 0.35 + ei * 0.02, {
              arc: (ei - 2) * 5, wob: 6, r: 4.2, core: '#bfe9ff', edge: '#3a6aa8',
              onHit: () => {
                addBurst(arena, tgt.x, tgt.y, { scale: 0.62, tongues: 3, sparks: 3 });
                setStatus(arena, 'enemy', ei, 'down', [{ k: 'down', bad: true }]);
                if (ei === 2) spawnFloatNum(arena, tgt.x, tgt.top + 8, 'Проклятие −70%', 'debuff');
              },
            });
          }
          setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false, n: 3 }]);
          addBurst(arena, heroBox.x, heroBox.top + heroBox.h * 0.54, { scale: 0.52, tongues: 2, sparks: 3, leaf: true });
          spawnFloatNum(arena, heroBox.x, heroBox.top + 2, 'Обманка ×3', 'buff');
        });
      } else {
        // Arenas 2 & 3: 9 tiny embers TIGHTLY hugging Kitsune's own tail/shoulder contour (strictly inside her unit box, far from enemies!)
        const tailPts = [];
        const rx = heroBox.w * 0.21;
        const ry = heroBox.h * 0.12;
        const cy = heroBox.top + heroBox.h * 0.50;
        for (let i = 0; i < 9; i++) {
          const u = i / 8;
          const ang = Math.PI * (0.94 - u * 0.88);
          const pt = {
            x: heroBox.x + Math.cos(ang) * rx,
            y: cy - Math.sin(ang) * ry,
          };
          tailPts.push(pt);
          const delayMs = Math.round(70 + i * ((relMs - 140) / 9));
          schedule(arena, delayMs, () => {
            arena.lanterns.push({
              x: pt.x, y: pt.y, age: 0,
              life: Math.max(0.16, (relMs - delayMs) / 1000 + 0.05),
              core: '#e8fbff', edge: '#5cc4ff', phase: i * 0.7, scale: 0.62,
            });
          });
        }

        schedule(arena, relMs, () => {
          // 5 compact crisp wisps (one per enemy) launched directly from her tight tail contour
          const launchIndices = [0, 2, 4, 6, 8];
          for (let ei = 0; ei < 5; ei++) {
            const from = tailPts[launchIndices[ei]];
            const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
            launchFoxShot(arena, from, tgt, 0.34 + ei * 0.02, {
              arc: (ei - 2) * 5, wob: 6, r: 4.3, core: '#d4f5ff', edge: '#5a8fff',
              onHit: () => {
                addBurst(arena, tgt.x, tgt.y, { scale: 0.64, tongues: 3, sparks: 4, core: '#d9b8ff', edge: '#6d3ab8' });
                const ew = arena.stageEl.querySelector(`[data-ewrap="${ei}"]`);
                if (ew) { ew.classList.add('hit-shake'); setTimeout(() => ew.classList.remove('hit-shake'), 220); }
                setStatus(arena, 'enemy', ei, 'down', [{ k: 'down', bad: true }]);
                if (ei === 0 || ei === 2 || ei === 4) {
                  spawnFloatNum(arena, tgt.x, tgt.top + 8, 'Проклятие −70%', 'debuff');
                }
              },
            });
          }

          setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false, n: 3 }]);
          addBurst(arena, heroBox.x, heroBox.top + heroBox.h * 0.54, { scale: 0.55, tongues: 2, sparks: 3, leaf: true });
          spawnFloatNum(arena, heroBox.x, heroBox.top + 2, 'Обманка ×3', 'buff');
        });
      }
    } else if (slot === 'hyp') {
      // Pre-damage allies to 58% HP so 42.8% max HP heal refills green bars cleanly
      for (let ai = 0; ai < 5; ai++) setBarPct(arena, 'ally', ai, 58);

      if (isLive) {
        // Arena 1: Compact local cyan motes just above each ally's head
        spawnSupBanner(arena, 'Лисья свадьба', '#a8e4ff');
        schedule(arena, relMs, () => {
          for (let ai = 0; ai < 5; ai++) {
            const ally = unitAnchor(arena, 'ally', ai, 0.50);
            const from = { x: ally.x, y: ally.top + 8 };
            launchFoxShot(arena, from, ally, 0.24, {
              arc: 4, wob: 3, r: 4.0, core: '#bfe9ff', edge: '#3a6aa8',
              onHit: () => {
                addBurst(arena, ally.x, ally.y, { scale: 0.58, tongues: 2, sparks: 3, leaf: true });
                setBarPct(arena, 'ally', ai, 100);
                setStatus(arena, 'ally', ai, 'up', [{ k: 'inv', bad: false }, { k: 'heal', bad: false }]);
                spawnFloatNum(arena, ally.x, ally.top + 14, '+89,4M', 'heal');
              },
            });
          }
          schedule(arena, 360, () => spawnFloatNum(arena, heroBox.x, heroBox.top - 18, 'Обманка отряду', 'buff'));
        });
      } else {
        // Arenas 2 & 3: Strictly local warm gold/emerald heal motes inside each ally's own cell (zero beams, zero mid-field garlands!)
        spawnSupBanner(arena, 'Лисья свадьба', '#ffe484');
        schedule(arena, relMs, () => {
          for (let ai = 0; ai < 5; ai++) {
            schedule(arena, ai * 35, () => {
              const ally = unitAnchor(arena, 'ally', ai, 0.52);
              for (let m = 0; m < 4; m++) {
                const ox = (m - 1.5) * (ally.w * 0.13);
                const oy = (m % 2 === 0 ? 8 : -2);
                const isJade = m % 2 === 1;
                arena.particles.push({
                  x: ally.x + ox,
                  y: ally.y + oy,
                  vx: (Math.random() - 0.5) * 8,
                  vy: -(26 + m * 5),
                  ay: -10, drag: 1.4,
                  age: 0, life: 0.36,
                  s0: 8.5, s1: 2.5,
                  tex: TX.tongue(isJade ? '#b8ffcf' : '#fff0a6', isJade ? '#2aa866' : '#d88a24'),
                  alpha: 0.9, rot: 0, vr: 0,
                });
              }
              addBurst(arena, ally.x, ally.y, {
                scale: 0.56, tongues: 2, sparks: 3,
                core: '#d4ffb8', edge: '#d89b28', leaf: true, leafCol: '#a6dc5c',
              });
              const aw = arena.stageEl.querySelector(`[data-awrap="${ai}"]`);
              if (aw) { aw.classList.add('heal-glow'); setTimeout(() => aw.classList.remove('heal-glow'), 420); }
              setBarPct(arena, 'ally', ai, 100);
              setStatus(arena, 'ally', ai, 'up', [{ k: 'inv', bad: false }, { k: 'heal', bad: false }]);
              spawnFloatNum(arena, ally.x, ally.top + 14, '+89,4M', 'heal');
            });
          }
          schedule(arena, 380, () => spawnFloatNum(arena, heroBox.x, heroBox.top - 18, 'Обманка отряду', 'buff'));
        });
      }
    }

    schedule(arena, playDurMs + 950, () => {
      if (state.activeSlot === 'idle' && !state.autoCycle) {
        clearArenaState(arena);
      }
    });
  }

  /* ---------- Canvas FX Render Step (Crisp Source-Over Rendering — No Additive Whiteout) ---------- */
  function stepArenaCanvas(arena, dt) {
    const g = arena.ctx;
    const dpr = arena.dpr || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, arena.w, arena.h);

    // 1. Tight local fox-fire embers (no radial glow circle)
    for (let i = arena.lanterns.length - 1; i >= 0; i--) {
      const l = arena.lanterns[i];
      l.age += dt;
      if (l.age >= l.life) { arena.lanterns.splice(i, 1); continue; }
      const al = Math.min(1, l.age / 0.1) * Math.min(1, (l.life - l.age) / 0.12);
      const y = l.y + Math.sin(l.age * 5.5 + l.phase) * 2;
      const sc = (l.scale || 0.7) * (1 + 0.1 * Math.sin(l.age * 20 + l.phase));
      g.save();
      g.globalAlpha = al * 0.92;
      g.drawImage(TX.tongue(l.core, l.edge), l.x - 6 * sc, y - 11 * sc, 12 * sc, 19 * sc);
      g.restore();
    }

    // 2. Compact crisp fox-fire wisps
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

      if (Math.random() < 0.65) {
        arena.particles.push({
          x: x + (Math.random() - 0.5) * 3,
          y: y + (Math.random() - 0.5) * 3,
          vx: -Math.cos(ang) * 16 + (Math.random() - 0.5) * 10,
          vy: -Math.sin(ang) * 16 - 8,
          ay: -12, drag: 2.5,
          age: 0, life: 0.16, s0: s.r * 1.15, s1: 1.5,
          tex: TX.dot(s.core), alpha: 0.72, rot: 0, vr: 0,
        });
      }

      g.save();
      g.translate(x, y);
      g.rotate(ang + Math.PI / 2);
      g.globalAlpha = 0.95;
      g.drawImage(TX.tongue(s.core, s.edge), -s.r * 0.95, -s.r * 1.15, s.r * 1.9, s.r * 2.9);
      g.restore();

      if (u >= 1) {
        arena.shots.splice(i, 1);
        if (s.onHit) s.onHit(s.to.x, s.to.y);
      }
    }

    // 3. Compact particles
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
    renderMetrics(god);
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
    state.actionDurMs = 2850;

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
        state.actionMode = false;
        state.playStartMs = now;
        for (const a of state.arenas) {
          a.actEl.style.display = 'none';
          a.idleEl.style.visibility = 'visible';
        }
        if (!state.autoCycle) {
          state.activeSlot = 'idle';
          document.querySelectorAll('.skill-btn').forEach(b => b.classList.toggle('active', b.dataset.slot === 'idle'));
          const god = window.GODS_MANIFEST.gods.find(g => g.id === state.godId);
          if (god) renderMetrics(god);
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
    buildArenasDOM(god);
    renderMetrics(god);
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
        syncArenaIdleSheets();
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
      syncArenaIdleSheets();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindControls();
    rebuildAll();
    requestAnimationFrame(tick);
  });
})();
