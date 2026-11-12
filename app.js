(function () {
  'use strict';

  const FIG_HT = 0.07;
  const ENEMY_IDS = ['hades', 'zeus', 'thor', 'ares', 'anubis'];
  const ALLY_LAYOUT = ['athena', 'artemis', '__HERO__', 'apollo', 'ra'];
  const SLOT_NAMES_RU = { idle: 'idle', atk: 'atk', sup: 'sup', hyp: 'hyp' };

  const state = {
    group: 'existing',
    elFilter: 'all',
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
    actionDurMs: 2850,
    autoTimer: 0,
  };

  function getAllGods() {
    return (window.GODS_MANIFEST && window.GODS_MANIFEST.gods) || [];
  }

  function getFilteredGods() {
    return getAllGods().filter(g => {
      if (g.group !== state.group) return false;
      if (state.elFilter === 'all') return true;
      if (state.elFilter === 'video') return !!g.hasVideoAnim;
      return g.element === state.elFilter;
    });
  }

  function currentGod() {
    return getAllGods().find(g => g.id === state.godId) || getAllGods()[0];
  }

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

  /* ---------- Crisp Phone-Readable FX Texture Cache (R-05 compliant, zero wide radial whiteout) ---------- */
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
        return make('dot:' + col, 32, 32, (g, w, h) => {
          const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.46);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(0.50, col);
          gr.addColorStop(1, col + '00');
          g.fillStyle = gr;
          g.beginPath();
          g.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
          g.fill();
        });
      },
      tongue(colCore, colEdge) {
        return make('tongue:' + colCore + ':' + colEdge, 48, 80, (g, w, h) => {
          const gr = g.createLinearGradient(w / 2, h * 0.88, w / 2, h * 0.04);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(0.38, colCore);
          gr.addColorStop(0.82, colEdge);
          gr.addColorStop(1, colEdge + '00');
          g.fillStyle = gr;
          g.beginPath();
          g.moveTo(w * 0.5, h * 0.04);
          g.bezierCurveTo(w * 0.88, h * 0.34, w * 0.86, h * 0.78, w * 0.5, h * 0.95);
          g.bezierCurveTo(w * 0.14, h * 0.78, w * 0.12, h * 0.34, w * 0.5, h * 0.04);
          g.fill();
          // Crisp bright inner core for phone readability
          g.fillStyle = '#ffffff';
          g.globalAlpha = 0.88;
          g.beginPath();
          g.ellipse(w * 0.5, h * 0.62, w * 0.16, h * 0.22, 0, 0, Math.PI * 2);
          g.fill();
        });
      },
      arrow(colCore, colEdge) {
        return make('arrow:' + colCore + ':' + colEdge, 40, 88, (g, w, h) => {
          // Glowing shaft
          const gr = g.createLinearGradient(w / 2, h * 0.05, w / 2, h * 0.95);
          gr.addColorStop(0, '#ffffff');
          gr.addColorStop(0.35, colCore);
          gr.addColorStop(0.85, colEdge);
          gr.addColorStop(1, colEdge + '00');
          g.strokeStyle = gr;
          g.lineWidth = 5;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(w * 0.5, h * 0.12);
          g.lineTo(w * 0.5, h * 0.92);
          g.stroke();
          // Crisp arrowhead
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.moveTo(w * 0.5, h * 0.02);
          g.lineTo(w * 0.80, h * 0.30);
          g.lineTo(w * 0.5, h * 0.22);
          g.lineTo(w * 0.20, h * 0.30);
          g.closePath();
          g.fill();
          g.strokeStyle = colEdge;
          g.lineWidth = 2;
          g.stroke();
        });
      },
      star8(col) {
        return make('star8:' + col, 44, 44, (g, w, h) => {
          const cx = w / 2, cy = h / 2;
          g.fillStyle = col;
          g.beginPath();
          for (let i = 0; i < 16; i++) {
            const r = i % 2 === 0 ? (i % 4 === 0 ? w * 0.46 : w * 0.32) : w * 0.10;
            const a = (i * Math.PI) / 8;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          g.closePath();
          g.fill();
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.arc(cx, cy, w * 0.13, 0, Math.PI * 2);
          g.fill();
        });
      },
      prism(colCore, colEdge) {
        return make('prism:' + colCore + ':' + colEdge, 44, 60, (g, w, h) => {
          g.fillStyle = colEdge + 'cc';
          g.strokeStyle = '#ffffff';
          g.lineWidth = 2.2;
          g.beginPath();
          g.moveTo(w * 0.5, h * 0.05);
          g.lineTo(w * 0.86, h * 0.45);
          g.lineTo(w * 0.5, h * 0.95);
          g.lineTo(w * 0.14, h * 0.45);
          g.closePath();
          g.fill();
          g.stroke();
          g.fillStyle = colCore;
          g.beginPath();
          g.moveTo(w * 0.5, h * 0.16);
          g.lineTo(w * 0.68, h * 0.45);
          g.lineTo(w * 0.5, h * 0.78);
          g.lineTo(w * 0.32, h * 0.45);
          g.closePath();
          g.fill();
        });
      },
      leaf(col) {
        return make('leaf:' + col, 26, 26, (g, w, h) => {
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
    if (cols <= 1 && rows <= 1) {
      if (el._f !== 0) {
        el._f = 0;
        el.style.backgroundPosition = '0% 0%';
      }
      return;
    }
    if (el._f === frameIdx) return;
    el._f = frameIdx;
    const c = frameIdx % cols;
    const r = Math.floor(frameIdx / cols);
    const px = cols > 1 ? (c / (cols - 1)) * 100 : 0;
    const py = rows > 1 ? (r / (rows - 1)) * 100 : 0;
    el.style.backgroundPosition = `${px.toFixed(3)}% ${py.toFixed(3)}%`;
  }

  /* ---------- Top Header, Tabs, Filters & Roster ---------- */
  function renderFilters() {
    const host = document.getElementById('elFilters');
    const allInGroup = getAllGods().filter(g => g.group === state.group);
    const vidCnt = allInGroup.filter(g => g.hasVideoAnim).length;
    const items = [
      { k: 'all', lbl: `Все (${allInGroup.length})` },
    ];
    if (vidCnt > 0) items.push({ k: 'video', lbl: `🎬 25 кд (${vidCnt})` });
    for (const [ek, elbl] of [['light', '⚡ Свет'], ['fire', '🔥 Огонь'], ['water', '💧 Вода'], ['earth', '🌿 Земля'], ['dark', '🌑 Тьма']]) {
      const cnt = allInGroup.filter(g => g.element === ek).length;
      if (cnt > 0) items.push({ k: ek, lbl: `${elbl} (${cnt})` });
    }
    host.innerHTML = items.map(it =>
      `<button class="el-btn${state.elFilter === it.k ? ' active' : ''}" data-ef="${it.k}" type="button">${it.lbl}</button>`
    ).join('');
    host.querySelectorAll('button[data-ef]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.elFilter = btn.dataset.ef;
        const list = getFilteredGods();
        if (list.length && !list.some(g => g.id === state.godId)) {
          state.godId = list[0].id;
        }
        rebuildAll();
      });
    });
  }

  function renderRoster() {
    document.getElementById('tabExisting').classList.toggle('active', state.group === 'existing');
    document.getElementById('tabNew10').classList.toggle('active', state.group === 'new10');
    renderFilters();

    const gods = getFilteredGods();
    const host = document.getElementById('godRoster');
    host.innerHTML = gods.map((g, idx) => {
      const cls = g.id === state.godId ? 'god-pill active' : 'god-pill';
      const dot = g.hasVideoAnim ? '<i class="vid-dot" title="25-кадровые видео-анимации готовы"></i>' : '';
      return `<button class="${cls}" data-god="${g.id}" type="button"><img src="${g.portrait}" alt=""><span>${idx + 1}. ${g.name}</span>${dot}</button>`;
    }).join('');

    host.querySelectorAll('button[data-god]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.godId = btn.dataset.god;
        rebuildAll();
      });
    });

    const activePill = host.querySelector('.god-pill.active');
    if (activePill && activePill.scrollIntoView) {
      activePill.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    const sel = document.getElementById('godQuickSelect');
    sel.innerHTML = gods.map((g, idx) =>
      `<option value="${g.id}"${g.id === state.godId ? ' selected' : ''}>${idx + 1}. ${g.name} (${g.elementIcon} ${g.roleRu})${g.hasVideoAnim ? ' ★25кд' : ''}</option>`
    ).join('');

    const god = currentGod();
    const cBtn = document.getElementById('btnConceptModal');
    if (god && god.conceptArts) {
      cBtn.hidden = false;
    } else {
      cBtn.hidden = true;
    }

    const supGroup = document.getElementById('supResGroup');
    const hasSup360 = !!(god && god.arenas.new_bt.sheets.sup_360p);
    supGroup.style.display = hasSup360 ? 'inline-flex' : 'none';
  }

  function getSheetForSlot(arenaPack, slot) {
    if (slot === 'sup' && state.supRes === '360p' && arenaPack.sheets.sup_360p) {
      return arenaPack.sheets.sup_360p[state.tier];
    }
    const mapped = (arenaPack.clipMap && arenaPack.clipMap[slot]) || slot;
    const slotObj = arenaPack.sheets[mapped] || arenaPack.sheets.idle;
    return slotObj[state.tier];
  }

  function updateArenaDimTags(god, slot) {
    const sl = slot || state.activeSlot || 'idle';
    for (const a of state.arenas) {
      if (!a.tagEl) continue;
      const sh = getSheetForSlot(a.pack, sl);
      const sw = sh.sheetW || sh.w * sh.cols;
      const shH = sh.sheetH || sh.h * sh.rows;
      if (sh.isConceptRef) {
        a.tagEl.textContent = `Концепт БТ ${sh.w}×${sh.h} px`;
        a.tagEl.classList.add('is-ref');
      } else if (sh.isStaticRef) {
        a.tagEl.textContent = `Арт ${sh.w}×${sh.h} px (≤180×220)`;
        a.tagEl.classList.add('is-ref');
      } else {
        a.tagEl.textContent = `Кадр ${sh.w}×${sh.h} px · лист ${sw}×${shH}`;
        a.tagEl.classList.remove('is-ref');
      }
    }
  }

  function renderMetrics(god) {
    const tier = state.tier;
    const sl = state.activeSlot || 'idle';
    const shLive = getSheetForSlot(god.arenas.live_bt, sl);
    const shBt = getSheetForSlot(god.arenas.new_bt, sl);
    const shTi = getSheetForSlot(god.arenas.new_ti, sl);

    const sumPack = (pack) => {
      let kb = 0, ram = 0;
      const seen = new Set();
      for (const s of ['idle', 'atk', 'sup', 'hyp']) {
        const sh = getSheetForSlot(pack, s);
        if (sh && !seen.has(sh.src)) {
          seen.add(sh.src);
          kb += sh.kb || 0;
          ram += sh.ramMb || 0;
        }
      }
      return { kb: kb.toFixed(0), ram: ram.toFixed(2), cnt: seen.size };
    };
    const mLive = sumPack(god.arenas.live_bt);
    const mBt = sumPack(god.arenas.new_bt);
    const mTi = sumPack(god.arenas.new_ti);

    document.getElementById('metricsLine').innerHTML =
      `<span class="el-badge">${god.elementIcon} ${god.elementRu} · ${god.roleRu}</span>` +
      `<span>Кадр <b>${SLOT_NAMES_RU[sl]}</b> (${tier}): Live <b>${shLive.w}×${shLive.h} px</b> · БТ <b>${shBt.w}×${shBt.h} px</b> · TI <b>${shTi.w}×${shTi.h} px</b></span>` +
      `<span>Память (${tier}): Live <b>${mLive.ram} МБ</b> · БТ <b>${mBt.ram} МБ</b> (${mBt.kb} КБ) · TI <b>${mTi.ram} МБ</b> (${mTi.kb} КБ)</span>`;

    updateArenaDimTags(god, sl);
  }

  function buildArenasDOM(god) {
    const grid = document.getElementById('arenasGrid');
    grid.innerHTML = '';
    state.arenas = [];

    const isNewGod = god.group === 'new10';
    const defs = [
      { key: 'live_bt', title: isNewGod ? 'Арена 1 — Эталон масштаба БТ (концепт)' : 'Арена 1 — Сейчас в игре (Битва титанов)', isNew: false, styleSet: 'bt', bg: 'assets/ui/arena-bt.webp' },
      { key: 'new_bt', title: isNewGod ? 'Арена 2 — Новый бог: Битва титанов' : 'Арена 2 — Новая: Битва титанов', isNew: true, styleSet: 'bt', bg: 'assets/ui/arena-bt.webp' },
      { key: 'new_ti', title: isNewGod ? 'Арена 3 — Новый бог: Titan Idols (Аниме)' : 'Арена 3 — Новая: Titan Idols (Аниме)', isNew: true, styleSet: 'ti', bg: 'assets/ui/arena-ti.webp' },
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

      state.arenas.push({
        key: d.key,
        pack,
        card,
        stageEl: card.querySelector('.arena-stage'),
        canvas: card.querySelector('.arena-fxc'),
        ctx: card.querySelector('.arena-fxc').getContext('2d'),
        fxDom: card.querySelector('.arena-fxdom'),
        heroWrap: card.querySelector('[data-hero="1"]'),
        idleEl: card.querySelector('[data-hero-idle="1"]'),
        actEl: card.querySelector('[data-hero-act="1"]'),
        noteEl: card.querySelector('[data-note="1"]'),
        tagEl: card.querySelector('[data-atag="1"]'),
        particles: [],
        shots: [],
        lanterns: [],
        rings: [],
        slashes: [],
        bolts: [],
        waves: [],
        shields: [],
        hazes: [],
        starLinks: [],
        timers: [],
      });
    }

    syncArenaIdleSheets();
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
      a.idleEl.classList.toggle('static-breath', !!idleSh.isStaticRef);
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
    if (!text) return;
    const d = document.createElement('div');
    d.className = 'num' + (cls ? ' ' + cls : '');
    d.style.left = `${x.toFixed(1)}px`;
    d.style.top = `${y.toFixed(1)}px`;
    d.textContent = text;
    arena.fxDom.appendChild(d);
    setTimeout(() => d.remove(), 1150);
  }

  function spawnSupBanner(arena, title, color) {
    if (!title) return;
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
    arena.rings.length = 0;
    arena.slashes.length = 0;
    arena.bolts.length = 0;
    arena.waves.length = 0;
    arena.shields.length = 0;
    arena.hazes.length = 0;
    arena.starLinks.length = 0;
    arena.fxDom.innerHTML = '';
    arena.noteEl.classList.remove('show');
    arena.heroWrap.style.transform = '';
    arena.actEl.classList.remove('static-cast');
    for (let i = 0; i < 5; i++) {
      setBarPct(arena, 'enemy', i, 100);
      setStatus(arena, 'enemy', i, null, []);
      const ew = arena.stageEl.querySelector(`[data-ewrap="${i}"]`);
      if (ew) ew.classList.remove('hit-shake', 'heal-glow', 'fallen');
      setBarPct(arena, 'ally', i, 100);
      setStatus(arena, 'ally', i, null, []);
      const aw = arena.stageEl.querySelector(`[data-awrap="${i}"]`);
      if (aw) aw.classList.remove('hit-shake', 'heal-glow', 'fallen');
    }
  }

  function schedule(arena, ms, fn) {
    const id = setTimeout(fn, Math.max(0, ms));
    arena.timers.push(id);
  }

  /* ---------- Phone-Readable FX Primitives (r=9.4..11.2, crisp hit rings, zero screen whiteout) ---------- */
  function addRing(arena, x, y, col, r0, r1, life, lineW) {
    arena.rings.push({ x, y, col, r0: r0 || 6, r1: r1 || 30, age: 0, life: life || 0.28, lw: lineW || 3.2 });
  }

  function addBurst(arena, x, y, opts) {
    const colCore = opts.core || '#bfe9ff';
    const colEdge = opts.edge || '#3a6aa8';
    const nTongues = opts.tongues ?? 4;
    const nSparks = opts.sparks ?? 6;
    const scale = opts.scale ?? 1.0;

    addRing(arena, x, y, colCore, 5 * scale, 28 * scale, 0.26, 2.8 * scale);

    arena.particles.push({
      x, y, vx: 0, vy: 0, ay: 0, drag: 0,
      age: 0, life: 0.20, s0: 22 * scale, s1: 6 * scale,
      tex: TX.star8('#ffffff'), alpha: 0.94, rot: (Math.random() - 0.5) * 0.8, vr: 1.6,
    });

    for (let i = 0; i < nTongues; i++) {
      arena.particles.push({
        x: x + (Math.random() - 0.5) * 14 * scale,
        y: y + (Math.random() - 0.5) * 8 * scale,
        vx: (Math.random() - 0.5) * 32,
        vy: -(34 + Math.random() * 38) * scale,
        ay: -20, drag: 2.0,
        age: 0, life: 0.26 + Math.random() * 0.14,
        s0: (13 + Math.random() * 5) * scale, s1: 3,
        tex: TX.tongue(colCore, colEdge), alpha: 0.92, rot: 0, vr: 0,
      });
    }
    for (let i = 0; i < nSparks; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 42 + Math.random() * 68;
      arena.particles.push({
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        ay: 18, drag: 3.0,
        age: 0, life: 0.22 + Math.random() * 0.14,
        s0: 8.5 * scale, s1: 2.0,
        tex: TX.dot(colCore), alpha: 0.92, rot: 0, vr: 0,
      });
    }
    if (opts.prism) {
      arena.particles.push({
        x, y: y - 4, vx: 0, vy: -8, ay: 0, drag: 1,
        age: 0, life: 0.52, s0: 32 * scale, s1: 26 * scale,
        tex: TX.prism(colCore, colEdge), alpha: 0.92, rot: 0, vr: 0,
      });
    }
    if (opts.leaf) {
      arena.particles.push({
        x, y: y - 4,
        vx: (Math.random() - 0.5) * 28, vy: -(26 + Math.random() * 20),
        ay: 95, drag: 1.3,
        age: 0, life: 0.65,
        s0: 13, s1: 9,
        tex: TX.leaf(opts.leafCol || '#9ac850'), alpha: 0.92,
        rot: Math.random() * 4, vr: (Math.random() - 0.5) * 6,
      });
    }
  }

  function launchShot(arena, from, to, durSec, opts) {
    arena.shots.push({
      from, to,
      age: 0, dur: Math.max(0.18, durSec),
      arc: opts.arc ?? -16,
      wob: opts.wob ?? 7,
      wf: opts.wf ?? 1.8,
      r: opts.r ?? 9.8, // Restored phone-readable ~20px head!
      kind: opts.kind || 'wisp', // 'wisp' | 'arrow' | 'star'
      core: opts.core || '#bfe9ff',
      edge: opts.edge || '#3a6aa8',
      trail: [],
      onHit: opts.onHit,
    });
  }

  function addLightningBolt(arena, fromX, fromY, toX, toY, colCore, colEdge) {
    const segs = 8;
    const pts = [{ x: fromX, y: fromY }];
    for (let i = 1; i < segs; i++) {
      const u = i / segs;
      const jx = (Math.random() - 0.5) * 26 * Math.sin(u * Math.PI);
      pts.push({ x: fromX + (toX - fromX) * u + jx, y: fromY + (toY - fromY) * u });
    }
    pts.push({ x: toX, y: toY });
    // Small side branch
    const bi = 3 + Math.floor(Math.random() * 3);
    const bp = pts[bi];
    const branch = [
      bp,
      { x: bp.x + (Math.random() < 0.5 ? -18 : 18), y: bp.y + 18 },
      { x: bp.x + (Math.random() < 0.5 ? -28 : 28), y: bp.y + 34 },
    ];
    arena.bolts.push({ pts, branch, core: colCore, edge: colEdge, age: 0, life: 0.30 });
  }

  function addSlashArc(arena, cx, cy, radius, startAng, sweepAng, colCore, colEdge, life) {
    arena.slashes.push({
      cx, cy, radius: radius || 36, startAng, sweepAng,
      core: colCore, edge: colEdge, age: 0, life: life || 0.28,
    });
  }

  function addShieldBracket(arena, x, y, w, h, colCore) {
    arena.shields.push({ x, y, w, h, col: colCore, age: 0, life: 0.85 });
  }

  function enemyHitOutcome(arena, ei, fx, hpAfter, showStatusText) {
    const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
    const sec = fx.sec || {};
    addBurst(arena, tgt.x, tgt.y, {
      scale: 0.95, core: fx.color, edge: fx.edge,
      prism: sec.cc === 'freeze' || sec.cc === 'stone',
    });
    const ew = arena.stageEl.querySelector(`[data-ewrap="${ei}"]`);
    if (ew) { ew.classList.add('hit-shake'); setTimeout(() => ew.classList.remove('hit-shake'), 240); }
    setBarPct(arena, 'enemy', ei, hpAfter);

    const icons = [];
    if (sec.cc === 'freeze') icons.push({ k: 'frost', bad: true });
    else if (sec.cc === 'stone') icons.push({ k: 'stone', bad: true });
    else if (sec.cc === 'stun') icons.push({ k: 'stun', bad: true });
    else if (sec.cc === 'sleep') icons.push({ k: 'sleep', bad: true });
    else if (sec.cc === 'sil') icons.push({ k: 'silence', bad: true });

    if (sec.debuff === 'down') icons.push({ k: 'down', bad: true });
    else if (sec.debuff === 'vuln') icons.push({ k: 'eye', bad: true });
    else if (sec.debuff === 'burn') icons.push({ k: 'burn', bad: true });
    else if (sec.debuff === 'poison') icons.push({ k: 'poison', bad: true });
    else if (sec.debuff === 'antiheal') icons.push({ k: 'bleed', bad: true });

    if (icons.length) setStatus(arena, 'enemy', ei, 'down', icons);
    if (fx.dmgText) spawnFloatNum(arena, tgt.x, tgt.y - 6, fx.dmgText, hpAfter <= 72 ? 'crit' : '');
    if (showStatusText && fx.statusText) {
      schedule(arena, 130, () => spawnFloatNum(arena, tgt.x, tgt.top + 8, fx.statusText, 'debuff'));
    }

    // Optional vampiric drain thread returning to hero!
    if (sec.drain && (ei === 1 || ei === 2)) {
      const hero = unitAnchor(arena, 'ally', 2, 0.48);
      launchShot(arena, tgt, hero, 0.34, {
        arc: 18, wob: 4, r: 7.8, core: '#9effb8', edge: '#1f9e58',
        onHit: () => {
          addRing(arena, hero.x, hero.y, '#9effb8', 6, 22, 0.24, 2.5);
          if (ei === 2 && fx.healText) spawnFloatNum(arena, hero.x, hero.top + 10, fx.healText, 'heal');
        },
      });
    }
  }

  function applySecondaryAllyShields(arena, fx) {
    const sec = fx.sec || {};
    if (!sec.grantShield) return;
    const indices = sec.grantShield === 'team' ? [0, 1, 2, 3, 4] : (sec.grantShield === 'ally_low' ? [1] : [2]);
    for (const ai of indices) {
      const al = unitAnchor(arena, 'ally', ai, 0.50);
      addShieldBracket(arena, al.x, al.y, al.w * 0.72, al.h * 0.68, fx.color);
      setStatus(arena, 'ally', ai, 'up', [{ k: 'shield', bad: false }]);
      if (ai === 2 && fx.shieldText) {
        spawnFloatNum(arena, al.x, al.top + 8, fx.shieldText, 'shield');
      }
    }
  }

  /* ---------- Orchestrate Skill FX Across All 62 Gods ---------- */
  function triggerSkillFX(arena, god, slot, relMs, playDurMs, actSh) {
    const heroBox = unitAnchor(arena, 'ally', 2, 0.48);
    const isLive = arena.key === 'live_bt';
    const sk = god.skills[slot];
    const fx = sk && sk.fxSpec;

    if (isLive && god.group === 'existing' && (slot === 'sup' || slot === 'hyp')) {
      const mapped = (arena.pack.clipMap && arena.pack.clipMap[slot]) || slot;
      if (mapped !== slot) {
        arena.noteEl.textContent = `В игре сейчас: играет лист ${mapped} (CLIP_MAP.${god.id})`;
        arena.noteEl.classList.add('show');
      }
    } else if (!isLive && actSh && actSh.isStaticRef) {
      arena.noteEl.textContent = 'Арт ≤180×220 готов · видео-слот в очереди Tier 1 (40/день)';
      arena.noteEl.classList.add('show');
      schedule(arena, Math.max(0, relMs - 180), () => {
        arena.actEl.classList.remove('static-cast');
        void arena.actEl.offsetWidth;
        arena.actEl.classList.add('static-cast');
      });
    }

    if (!fx) return;
    if (fx.banner) spawnSupBanner(arena, fx.banner, fx.bannerCol || fx.color);

    const castPt = { x: heroBox.x + heroBox.w * 0.14, y: heroBox.top + heroBox.h * 0.44 };
    const mode = fx.mode;

    // 1. KITSUNE SPECIAL SIGNATURE MODES (with restored phone-readable r=9.6..10.2 wisps!)
    if (mode === 'kitsune_atk') {
      arena.lanterns.push({ x: castPt.x, y: castPt.y, age: 0, life: relMs / 1000 + 0.06, core: '#e6f9ff', edge: '#4d9fff', phase: 0.4, scale: 1.05 });
      schedule(arena, relMs, () => {
        const tgtIdx = 1;
        const tgt = unitAnchor(arena, 'enemy', tgtIdx, 0.48);
        addBurst(arena, castPt.x, castPt.y, { scale: 0.78, tongues: 3, sparks: 5, core: fx.color, edge: fx.edge });
        launchShot(arena, castPt, tgt, 0.36, {
          arc: -16, wob: 9, r: 10.0, core: '#d6f5ff', edge: '#3f84e5',
          onHit: () => {
            addBurst(arena, tgt.x, tgt.y, { scale: 0.98, tongues: 4, sparks: 6, core: '#d6f5ff', edge: '#3f84e5' });
            const ew = arena.stageEl.querySelector(`[data-ewrap="${tgtIdx}"]`);
            if (ew) { ew.classList.add('hit-shake'); setTimeout(() => ew.classList.remove('hit-shake'), 220); }
            setBarPct(arena, 'enemy', tgtIdx, 82);
            setStatus(arena, 'enemy', tgtIdx, 'down', [{ k: 'down', bad: true }]);
            spawnFloatNum(arena, tgt.x, tgt.y - 6, fx.dmgText, 'crit');
            schedule(arena, 120, () => spawnFloatNum(arena, tgt.x, tgt.top + 8, fx.statusText, 'debuff'));
          },
        });
        schedule(arena, 110, () => {
          setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false }]);
          addBurst(arena, heroBox.x, heroBox.top + heroBox.h * 0.54, { scale: 0.65, tongues: 2, sparks: 4, leaf: true });
          spawnFloatNum(arena, heroBox.x, heroBox.top + 2, 'Обманка', 'buff');
        });
      });
    } else if (mode === 'kitsune_sup') {
      const tailPts = [];
      const count = isLive ? 2 : 9;
      for (let i = 0; i < count; i++) {
        const u = count === 2 ? i : i / 8;
        const ang = Math.PI * (0.94 - u * 0.88);
        const pt = {
          x: heroBox.x + Math.cos(ang) * (heroBox.w * 0.20),
          y: (heroBox.top + heroBox.h * 0.50) - Math.sin(ang) * (heroBox.h * 0.11),
        };
        tailPts.push(pt);
        const dMs = isLive ? 40 : Math.round(60 + i * ((relMs - 130) / 9));
        schedule(arena, dMs, () => {
          arena.lanterns.push({
            x: pt.x, y: pt.y, age: 0, life: Math.max(0.18, (relMs - dMs) / 1000 + 0.06),
            core: '#e8fbff', edge: '#4fa8ff', phase: i * 0.7, scale: 0.98,
          });
        });
      }
      schedule(arena, relMs, () => {
        for (let ei = 0; ei < 5; ei++) {
          const from = isLive ? tailPts[ei % 2] : tailPts[ei * 2];
          const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
          launchShot(arena, from, tgt, 0.34 + ei * 0.02, {
            arc: (ei - 2) * 7, wob: 7, r: 9.6, core: '#d8f6ff', edge: '#4988e8',
            onHit: () => {
              addBurst(arena, tgt.x, tgt.y, { scale: 0.90, tongues: 4, sparks: 5, core: '#dfc2ff', edge: '#6d3ab8' });
              const ew = arena.stageEl.querySelector(`[data-ewrap="${ei}"]`);
              if (ew) { ew.classList.add('hit-shake'); setTimeout(() => ew.classList.remove('hit-shake'), 220); }
              setStatus(arena, 'enemy', ei, 'down', [{ k: 'down', bad: true }]);
              if (ei === 0 || ei === 2 || ei === 4) spawnFloatNum(arena, tgt.x, tgt.top + 8, fx.statusText, 'debuff');
            },
          });
        }
        setStatus(arena, 'ally', 2, 'up', [{ k: 'inv', bad: false, n: 3 }]);
        addBurst(arena, heroBox.x, heroBox.top + heroBox.h * 0.54, { scale: 0.70, tongues: 2, sparks: 4, leaf: true });
        spawnFloatNum(arena, heroBox.x, heroBox.top + 2, 'Обманка ×3', 'buff');
      });
    } else if (mode === 'kitsune_hyp') {
      for (let ai = 0; ai < 5; ai++) setBarPct(arena, 'ally', ai, 58);
      schedule(arena, relMs, () => {
        for (let ai = 0; ai < 5; ai++) {
          schedule(arena, ai * 35, () => {
            const ally = unitAnchor(arena, 'ally', ai, 0.52);
            for (let m = 0; m < 4; m++) {
              const isJade = m % 2 === 1;
              arena.particles.push({
                x: ally.x + (m - 1.5) * (ally.w * 0.14),
                y: ally.y + (m % 2 === 0 ? 10 : -2),
                vx: (Math.random() - 0.5) * 10, vy: -(34 + m * 6),
                ay: -12, drag: 1.3, age: 0, life: 0.42, s0: 13.5, s1: 3.5,
                tex: TX.tongue(isJade ? '#b8ffcf' : '#fff0a6', isJade ? '#2aa866' : '#d88a24'),
                alpha: 0.94, rot: 0, vr: 0,
              });
            }
            addBurst(arena, ally.x, ally.y, { scale: 0.80, tongues: 3, sparks: 5, core: '#d4ffb8', edge: '#d89b28', leaf: true, leafCol: '#a6dc5c' });
            const aw = arena.stageEl.querySelector(`[data-awrap="${ai}"]`);
            if (aw) { aw.classList.add('heal-glow'); setTimeout(() => aw.classList.remove('heal-glow'), 420); }
            setBarPct(arena, 'ally', ai, 100);
            setStatus(arena, 'ally', ai, 'up', [{ k: 'inv', bad: false }, { k: 'heal', bad: false }]);
            spawnFloatNum(arena, ally.x, ally.top + 14, fx.healText, 'heal');
          });
        }
        schedule(arena, 380, () => spawnFloatNum(arena, heroBox.x, heroBox.top - 16, fx.statusText, 'buff'));
      });
    }

    // 2. MELEE MODES (Authentic task-039 single home-spot dark haze + lunge + glowing curved weapon slash!)
    else if (mode.startsWith('melee_')) {
      schedule(arena, Math.max(0, relMs - 140), () => {
        const tgtIdx = 2;
        const tgt = unitAnchor(arena, 'enemy', tgtIdx, 0.55);
        // Single dark home-spot haze on ally #2's starting spot (rule 039)
        arena.hazes.push({ x: heroBox.x, y: heroBox.bottom - 10, w: heroBox.w * 0.65, h: 20, age: 0, life: 0.62 });
        const dx = (tgt.x - heroBox.x) * 0.82;
        const dy = (tgt.bottom - heroBox.bottom) * 0.76;
        arena.heroWrap.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
        schedule(arena, 430, () => { arena.heroWrap.style.transform = ''; });
      });

      schedule(arena, relMs, () => {
        if (mode === 'melee_cleave') {
          const mid = unitAnchor(arena, 'enemy', 2, 0.48);
          addSlashArc(arena, mid.x, mid.y + 18, arena.w * 0.36, -Math.PI * 0.88, Math.PI * 0.76, fx.color, fx.edge, 0.34);
          for (let ei = 0; ei < 5; ei++) {
            schedule(arena, ei * 28, () => enemyHitOutcome(arena, ei, fx, 70, ei === 2));
          }
        } else if (mode === 'melee_multi') {
          const hits = [1, 2, 3];
          hits.forEach((ei, k) => {
            schedule(arena, k * 95, () => {
              const t = unitAnchor(arena, 'enemy', ei, 0.48);
              addSlashArc(arena, t.x, t.y, 34, k % 2 === 0 ? -2.3 : -0.8, k % 2 === 0 ? 1.9 : -1.9, fx.color, fx.edge, 0.26);
              enemyHitOutcome(arena, ei, fx, 72, k === 1);
            });
          });
        } else {
          const ei = 2;
          const t = unitAnchor(arena, 'enemy', ei, 0.48);
          addSlashArc(arena, t.x, t.y, mode === 'melee_heavy' ? 44 : 34, -2.35, 2.05, fx.color, fx.edge, 0.28);
          if (mode === 'melee_heavy') {
            addSlashArc(arena, t.x, t.y, 40, -0.75, -2.05, fx.color, fx.edge, 0.28);
          }
          enemyHitOutcome(arena, ei, fx, mode === 'melee_heavy' ? 64 : 82, true);
        }
        applySecondaryAllyShields(arena, fx);
      });
    }

    // 3. SKY LIGHTNING MODES (Jagged forked bolts + shock rings)
    else if (mode === 'lightning_single' || mode === 'lightning_aoe') {
      schedule(arena, relMs, () => {
        addBurst(arena, castPt.x, castPt.y, { scale: 0.75, tongues: 2, sparks: 5, core: fx.color, edge: fx.edge });
        const targets = mode === 'lightning_aoe' ? [0, 1, 2, 3, 4] : [2];
        targets.forEach((ei, idx) => {
          schedule(arena, idx * 45, () => {
            const t = unitAnchor(arena, 'enemy', ei, 0.48);
            addLightningBolt(arena, t.x + (ei - 2) * 6, 4, t.x, t.y, '#ffffff', fx.color);
            enemyHitOutcome(arena, ei, fx, mode === 'lightning_aoe' ? 68 : 78, ei === 2);
          });
        });
        applySecondaryAllyShields(arena, fx);
      });
    }

    // 4. CONSTELLATION / CELESTIAL STARFALL (Artemis, Apollo, Ishtar, Amaterasu)
    else if (mode === 'constellation_aoe') {
      const starPts = [];
      for (let i = 0; i < 5; i++) {
        const t = unitAnchor(arena, 'enemy', i, 0.20);
        starPts.push({ x: t.x, y: Math.max(14, t.top - 6 - (i % 2) * 10) });
      }
      starPts.forEach((sp, i) => {
        schedule(arena, Math.max(20, relMs - 240 + i * 40), () => {
          arena.particles.push({
            x: sp.x, y: sp.y, vx: 0, vy: 0, ay: 0, drag: 0,
            age: 0, life: 0.45, s0: 22, s1: 14, tex: TX.star8(fx.color), alpha: 0.95, rot: 0, vr: 1.5,
          });
        });
      });
      schedule(arena, Math.max(40, relMs - 80), () => {
        arena.starLinks.push({ pts: starPts, col: fx.color, age: 0, life: 0.38 });
      });
      schedule(arena, relMs, () => {
        for (let ei = 0; ei < 5; ei++) {
          const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
          launchShot(arena, starPts[ei], tgt, 0.22 + ei * 0.02, {
            arc: 0, wob: 0, r: 10.2, kind: 'arrow', core: fx.color, edge: fx.edge,
            onHit: () => enemyHitOutcome(arena, ei, fx, 69, ei === 2),
          });
        }
        applySecondaryAllyShields(arena, fx);
      });
    }

    // 5. TRAVELING ELEMENTAL WAVE / QUAKE / TIDE (Poseidon, Ao Guang, Surt, Atlas, Heracles)
    else if (mode === 'wave_aoe') {
      schedule(arena, relMs, () => {
        const midE = unitAnchor(arena, 'enemy', 2, 0.52);
        arena.waves.push({
          x0: heroBox.x, y0: heroBox.top + 10,
          x1: midE.x, y1: midE.y,
          w0: heroBox.w * 1.1, w1: arena.w * 0.86,
          core: fx.color, edge: fx.edge, age: 0, dur: 0.38,
        });
        schedule(arena, 280, () => {
          for (let ei = 0; ei < 5; ei++) {
            enemyHitOutcome(arena, ei, fx, 68, ei === 2);
          }
          applySecondaryAllyShields(arena, fx);
        });
      });
    }

    // 6. RANGED ARROWS & ELEMENTAL PROJECTILES (Single / Heavy / Multi / AoE)
    else if (mode.startsWith('proj_')) {
      arena.lanterns.push({ x: castPt.x, y: castPt.y, age: 0, life: relMs / 1000 + 0.05, core: fx.color, edge: fx.edge, phase: 0, scale: 1.0 });
      schedule(arena, relMs, () => {
        addBurst(arena, castPt.x, castPt.y, { scale: 0.76, tongues: 2, sparks: 5, core: fx.color, edge: fx.edge });
        const isArrow = mode.includes('arrow');
        const shotKind = isArrow ? 'arrow' : 'wisp';

        if (mode.endsWith('_aoe') || mode.endsWith('_volley')) {
          for (let ei = 0; ei < 5; ei++) {
            const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
            launchShot(arena, castPt, tgt, 0.33 + ei * 0.025, {
              arc: (ei - 2) * 8, wob: isArrow ? 0 : 6, r: 9.8, kind: shotKind, core: fx.color, edge: fx.edge,
              onHit: () => enemyHitOutcome(arena, ei, fx, 71, ei === 2),
            });
          }
        } else if (mode === 'proj_multi') {
          [1, 2, 3].forEach((ei, k) => {
            schedule(arena, k * 80, () => {
              const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
              launchShot(arena, castPt, tgt, 0.32, {
                arc: (k - 1) * 12, wob: 6, r: 10.2, kind: shotKind, core: fx.color, edge: fx.edge,
                onHit: () => enemyHitOutcome(arena, ei, fx, 73, k === 1),
              });
            });
          });
        } else {
          const isHeavy = mode.endsWith('_heavy');
          const tgt = unitAnchor(arena, 'enemy', 2, 0.48);
          launchShot(arena, castPt, tgt, 0.34, {
            arc: isArrow ? -8 : -16, wob: isArrow ? 0 : 7, r: isHeavy ? 11.4 : 10.0,
            kind: shotKind, core: fx.color, edge: fx.edge,
            onHit: () => enemyHitOutcome(arena, 2, fx, isHeavy ? 64 : 82, true),
          });
        }
        applySecondaryAllyShields(arena, fx);
      });
    }

    // 7. ALLY HEALS, BUFFS, SHIELDS & RESURRECT
    else if (mode === 'ally_heal_single' || mode === 'ally_heal_all') {
      const indices = mode === 'ally_heal_all' ? [0, 1, 2, 3, 4] : [1];
      for (const ai of indices) setBarPct(arena, 'ally', ai, 56);
      schedule(arena, relMs, () => {
        indices.forEach((ai, k) => {
          schedule(arena, k * 35, () => {
            const ally = unitAnchor(arena, 'ally', ai, 0.50);
            for (let m = 0; m < 4; m++) {
              arena.particles.push({
                x: ally.x + (m - 1.5) * (ally.w * 0.14), y: ally.y + 8,
                vx: 0, vy: -(34 + m * 6), ay: -10, drag: 1.2,
                age: 0, life: 0.42, s0: 13.5, s1: 3.5,
                tex: TX.tongue('#c8ffad', '#249e54'), alpha: 0.94, rot: 0, vr: 0,
              });
            }
            addBurst(arena, ally.x, ally.y, { scale: 0.78, tongues: 3, sparks: 4, core: '#c8ffad', edge: '#249e54', leaf: true });
            setBarPct(arena, 'ally', ai, 100);
            setStatus(arena, 'ally', ai, 'up', [{ k: 'heal', bad: false }]);
            spawnFloatNum(arena, ally.x, ally.top + 12, fx.healText, 'heal');
          });
        });
      });
    } else if (mode === 'ally_buff_single' || mode === 'ally_buff_all' || mode === 'ally_shield_all' || mode === 'hybrid_shield_curse') {
      schedule(arena, relMs, () => {
        const indices = mode === 'ally_buff_single' ? [1] : (mode === 'hybrid_shield_curse' ? [2] : [0, 1, 2, 3, 4]);
        indices.forEach((ai, k) => {
          schedule(arena, k * 30, () => {
            const al = unitAnchor(arena, 'ally', ai, 0.50);
            if (mode === 'ally_shield_all' || mode === 'hybrid_shield_curse' || (fx.sec && fx.sec.grantShield)) {
              addShieldBracket(arena, al.x, al.y, al.w * 0.74, al.h * 0.70, fx.color);
              setStatus(arena, 'ally', ai, 'up', [{ k: 'shield', bad: false }, { k: 'up', bad: false }]);
              if (ai === 2 || indices.length === 1) spawnFloatNum(arena, al.x, al.top + 10, fx.shieldText, 'shield');
            } else {
              addBurst(arena, al.x, al.y, { scale: 0.76, tongues: 3, sparks: 5, core: fx.color, edge: fx.edge });
              setStatus(arena, 'ally', ai, 'up', [{ k: 'up', bad: false }]);
              if (ai === 2 || indices.length === 1) spawnFloatNum(arena, al.x, al.top + 10, fx.statusText, 'buff');
            }
          });
        });
        if (mode === 'hybrid_shield_curse') {
          for (let ei = 0; ei < 5; ei++) {
            const tgt = unitAnchor(arena, 'enemy', ei, 0.48);
            launchShot(arena, castPt, tgt, 0.32 + ei * 0.02, {
              arc: (ei - 2) * 6, wob: 5, r: 9.2, core: fx.color, edge: fx.edge,
              onHit: () => {
                addBurst(arena, tgt.x, tgt.y, { scale: 0.78, core: fx.color, edge: fx.edge });
                setStatus(arena, 'enemy', ei, 'down', [{ k: 'down', bad: true }]);
                if (ei === 2) spawnFloatNum(arena, tgt.x, tgt.top + 8, fx.statusText, 'debuff');
              },
            });
          }
        }
      });
    } else if (mode === 'ally_resurrect') {
      // Ally #0 starts fallen at 0% HP and rises back to 100% HP on impact!
      const fallenWrap = arena.stageEl.querySelector('[data-awrap="0"]');
      if (fallenWrap) fallenWrap.classList.add('fallen');
      setBarPct(arena, 'ally', 0, 0);

      schedule(arena, relMs, () => {
        const fallen = unitAnchor(arena, 'ally', 0, 0.50);
        launchShot(arena, castPt, fallen, 0.34, {
          arc: -24, wob: 6, r: 10.8, core: fx.color, edge: fx.edge,
          onHit: () => {
            if (fallenWrap) fallenWrap.classList.remove('fallen');
            setBarPct(arena, 'ally', 0, 100);
            addBurst(arena, fallen.x, fallen.y, { scale: 1.15, tongues: 5, sparks: 8, core: fx.color, edge: fx.edge });
            addShieldBracket(arena, fallen.x, fallen.y, fallen.w * 0.78, fallen.h * 0.74, fx.color);
            setStatus(arena, 'ally', 0, 'up', [{ k: 'heal', bad: false }, { k: 'shield', bad: false }]);
            spawnFloatNum(arena, fallen.x, fallen.top + 6, 'Воскрешение +100%!', 'heal');
          },
        });
        applySecondaryAllyShields(arena, fx);
      });
    }

    schedule(arena, playDurMs + 950, () => {
      if (state.activeSlot === 'idle' && !state.autoCycle) {
        clearArenaState(arena);
      }
    });
  }

  /* ---------- Canvas FX Render Step (Crisp Phone-Readable Rendering) ---------- */
  function stepArenaCanvas(arena, dt) {
    const g = arena.ctx;
    const dpr = arena.dpr || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, arena.w, arena.h);

    // 0. Task-039 single home-spot dark haze during melee jumps
    for (let i = arena.hazes.length - 1; i >= 0; i--) {
      const hz = arena.hazes[i];
      hz.age += dt;
      if (hz.age >= hz.life) { arena.hazes.splice(i, 1); continue; }
      const al = Math.sin((hz.age / hz.life) * Math.PI) * 0.65;
      g.save();
      g.globalAlpha = al;
      g.fillStyle = '#140e1c';
      g.beginPath();
      g.ellipse(hz.x, hz.y, hz.w * 0.5, hz.h * 0.5, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // 1. Local caster embers
    for (let i = arena.lanterns.length - 1; i >= 0; i--) {
      const l = arena.lanterns[i];
      l.age += dt;
      if (l.age >= l.life) { arena.lanterns.splice(i, 1); continue; }
      const al = Math.min(1, l.age / 0.09) * Math.min(1, (l.life - l.age) / 0.11);
      const y = l.y + Math.sin(l.age * 6 + l.phase) * 2.5;
      const sc = (l.scale || 1.0) * (1 + 0.12 * Math.sin(l.age * 20 + l.phase));
      g.save();
      g.globalAlpha = al * 0.94;
      g.drawImage(TX.tongue(l.core, l.edge), l.x - 9 * sc, y - 15 * sc, 18 * sc, 29 * sc);
      g.restore();
    }

    // 2. Constellation links
    for (let i = arena.starLinks.length - 1; i >= 0; i--) {
      const sl = arena.starLinks[i];
      sl.age += dt;
      if (sl.age >= sl.life) { arena.starLinks.splice(i, 1); continue; }
      const al = 1 - sl.age / sl.life;
      g.save();
      g.globalAlpha = al * 0.88;
      g.strokeStyle = sl.col;
      g.lineWidth = 2.2;
      g.beginPath();
      sl.pts.forEach((p, idx) => idx === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y));
      g.stroke();
      g.restore();
    }

    // 3. Traveling crescent waves
    for (let i = arena.waves.length - 1; i >= 0; i--) {
      const wv = arena.waves[i];
      wv.age += dt;
      const u = Math.min(1, wv.age / wv.dur);
      const cx = wv.x0 + (wv.x1 - wv.x0) * u;
      const cy = wv.y0 + (wv.y1 - wv.y0) * u;
      const hw = (wv.w0 + (wv.w1 - wv.w0) * u) * 0.5;
      const al = Math.sin(u * Math.PI);
      g.save();
      g.globalAlpha = Math.max(0, al * 0.92);
      g.strokeStyle = wv.edge;
      g.lineWidth = 10;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx - hw, cy + 16);
      g.quadraticCurveTo(cx, cy - 22, cx + hw, cy + 16);
      g.stroke();
      g.strokeStyle = '#ffffff';
      g.lineWidth = 3.5;
      g.stroke();
      g.restore();
      if (u >= 1) arena.waves.splice(i, 1);
    }

    // 4. Phone-readable flying projectiles + smooth ribbon trails
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

      const prev = s.trail.length ? s.trail[s.trail.length - 1] : s.from;
      const ang = Math.atan2(y - prev.y, x - prev.x);
      s.trail.push({ x, y });
      if (s.trail.length > 8) s.trail.shift();

      // Draw crisp tapered ribbon trail
      if (s.trail.length >= 2) {
        g.save();
        g.lineCap = 'round';
        for (let ti = 1; ti < s.trail.length; ti++) {
          const tf = ti / s.trail.length;
          g.strokeStyle = ti >= s.trail.length - 2 ? '#ffffff' : s.core;
          g.globalAlpha = tf * 0.78;
          g.lineWidth = Math.max(2, s.r * 0.95 * tf);
          g.beginPath();
          g.moveTo(s.trail[ti - 1].x, s.trail[ti - 1].y);
          g.lineTo(s.trail[ti].x, s.trail[ti].y);
          g.stroke();
        }
        g.restore();
      }

      if (Math.random() < 0.7) {
        arena.particles.push({
          x: x + (Math.random() - 0.5) * 5,
          y: y + (Math.random() - 0.5) * 5,
          vx: -Math.cos(ang) * 22 + (Math.random() - 0.5) * 14,
          vy: -Math.sin(ang) * 22 - 8,
          ay: -10, drag: 2.5,
          age: 0, life: 0.20, s0: s.r * 1.15, s1: 2.0,
          tex: TX.dot(s.core), alpha: 0.80, rot: 0, vr: 0,
        });
      }

      g.save();
      g.translate(x, y);
      g.rotate(ang + Math.PI / 2);
      g.globalAlpha = 0.98;
      if (s.kind === 'arrow') {
        g.drawImage(TX.arrow(s.core, s.edge), -s.r * 1.05, -s.r * 2.1, s.r * 2.1, s.r * 4.2);
      } else {
        g.drawImage(TX.tongue(s.core, s.edge), -s.r * 1.05, -s.r * 1.45, s.r * 2.1, s.r * 3.1);
      }
      g.restore();

      if (u >= 1) {
        arena.shots.splice(i, 1);
        if (s.onHit) s.onHit(s.to.x, s.to.y);
      }
    }

    // 5. Melee curved weapon slashes
    for (let i = arena.slashes.length - 1; i >= 0; i--) {
      const sl = arena.slashes[i];
      sl.age += dt;
      if (sl.age >= sl.life) { arena.slashes.splice(i, 1); continue; }
      const u = sl.age / sl.life;
      const a0 = sl.startAng + sl.sweepAng * Math.max(0, u - 0.45);
      const a1 = sl.startAng + sl.sweepAng * Math.min(1, u * 1.35);
      g.save();
      g.globalAlpha = (1 - u * 0.75) * 0.96;
      g.lineCap = 'round';
      g.strokeStyle = sl.edge;
      g.lineWidth = 10 * (1 - u * 0.4);
      g.beginPath();
      g.arc(sl.cx, sl.cy, sl.radius, a0, a1, sl.sweepAng < 0);
      g.stroke();
      g.strokeStyle = '#ffffff';
      g.lineWidth = 3.8 * (1 - u * 0.4);
      g.beginPath();
      g.arc(sl.cx, sl.cy, sl.radius, a0, a1, sl.sweepAng < 0);
      g.stroke();
      g.restore();
    }

    // 6. Forked sky lightning bolts
    for (let i = arena.bolts.length - 1; i >= 0; i--) {
      const b = arena.bolts[i];
      b.age += dt;
      if (b.age >= b.life) { arena.bolts.splice(i, 1); continue; }
      const al = 1 - b.age / b.life;
      const drawPoly = (pts, wOuter, wInner) => {
        g.strokeStyle = b.edge;
        g.lineWidth = wOuter;
        g.beginPath();
        pts.forEach((p, idx) => idx === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y));
        g.stroke();
        g.strokeStyle = '#ffffff';
        g.lineWidth = wInner;
        g.stroke();
      };
      g.save();
      g.globalAlpha = al;
      g.lineJoin = 'round';
      g.lineCap = 'round';
      drawPoly(b.pts, 8.5, 3.2);
      if (b.branch) drawPoly(b.branch, 4.5, 1.8);
      g.restore();
    }

    // 7. Crisp shield rune brackets around allies
    for (let i = arena.shields.length - 1; i >= 0; i--) {
      const sh = arena.shields[i];
      sh.age += dt;
      if (sh.age >= sh.life) { arena.shields.splice(i, 1); continue; }
      const al = Math.min(1, sh.age / 0.12) * Math.min(1, (sh.life - sh.age) / 0.25);
      g.save();
      g.globalAlpha = al * 0.88;
      g.strokeStyle = sh.col;
      g.lineWidth = 2.6;
      g.beginPath();
      g.ellipse(sh.x, sh.y, sh.w * 0.5, sh.h * 0.5, 0, -Math.PI * 0.82, -Math.PI * 0.18);
      g.stroke();
      g.beginPath();
      g.ellipse(sh.x, sh.y, sh.w * 0.5, sh.h * 0.5, 0, Math.PI * 0.18, Math.PI * 0.82);
      g.stroke();
      g.restore();
    }

    // 8. Crisp expanding hit rings
    for (let i = arena.rings.length - 1; i >= 0; i--) {
      const rg = arena.rings[i];
      rg.age += dt;
      if (rg.age >= rg.life) { arena.rings.splice(i, 1); continue; }
      const u = rg.age / rg.life;
      const r = rg.r0 + (rg.r1 - rg.r0) * (1 - Math.pow(1 - u, 2));
      g.save();
      g.globalAlpha = (1 - u) * 0.90;
      g.strokeStyle = rg.col;
      g.lineWidth = rg.lw * (1 - u * 0.6);
      g.beginPath();
      g.arc(rg.x, rg.y, r, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }

    // 9. Particles
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
    const god = currentGod();
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

      const relFrac = sh.rel || 0.42;
      const relMs = Math.round(state.actionDurMs * relFrac);
      triggerSkillFX(a, god, slot, relMs, state.actionDurMs, sh);
    }
  }

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
          const god = currentGod();
          if (god) renderMetrics(god);
        } else {
          state.autoTimer = now + 900;
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
    const god = currentGod();
    state.group = god.group;
    warmGodSheets(god);
    renderRoster();
    buildArenasDOM(god);
    renderMetrics(god);
    updateVerdictBlocks(god, state.activeSlot);
  }

  function stepGod(delta) {
    const list = getFilteredGods();
    if (!list.length) return;
    const idx = list.findIndex(g => g.id === state.godId);
    const next = list[(idx + delta + list.length) % list.length];
    state.godId = next.id;
    state.activeSlot = 'idle';
    state.actionMode = false;
    rebuildAll();
  }

  function openConceptModal() {
    const god = currentGod();
    if (!god || !god.conceptArts) return;
    document.getElementById('conceptModalTitle').textContent =
      `${god.name} — ${god.titleRu || god.roleRu} (эталонный 2K-арт БТ vs Titan Idols)`;
    document.getElementById('conceptModalBody').innerHTML =
      `<div class="concept-col"><h4>Битва титанов (тёмное фэнтези)</h4><img src="${god.conceptArts.bt}" alt="${god.name} BT"></div>` +
      `<div class="concept-col"><h4>Titan Idols (аниме-версия)</h4><img src="${god.conceptArts.ti}" alt="${god.name} TI"></div>`;
    document.getElementById('conceptModal').hidden = false;
  }

  function closeConceptModal() {
    document.getElementById('conceptModal').hidden = true;
  }

  function bindControls() {
    document.querySelectorAll('.stage-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const grp = tab.dataset.group;
        if (!grp || grp === state.group) return;
        state.group = grp;
        state.elFilter = 'all';
        const first = getFilteredGods()[0];
        if (first) state.godId = first.id;
        state.activeSlot = 'idle';
        state.actionMode = false;
        rebuildAll();
      });
    });

    document.getElementById('btnPrevGod').addEventListener('click', () => stepGod(-1));
    document.getElementById('btnNextGod').addEventListener('click', () => stepGod(1));
    document.getElementById('godQuickSelect').addEventListener('change', (e) => {
      state.godId = e.target.value;
      state.activeSlot = 'idle';
      state.actionMode = false;
      rebuildAll();
    });

    document.getElementById('btnConceptModal').addEventListener('click', openConceptModal);
    document.getElementById('btnCloseConcept').addEventListener('click', closeConceptModal);
    document.getElementById('conceptBackdrop').addEventListener('click', closeConceptModal);

    document.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', () => triggerSlot(btn.dataset.slot));
    });

    document.querySelectorAll('.seg-btn[data-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tier = btn.dataset.tier;
        document.querySelectorAll('.seg-btn[data-tier]').forEach(b => b.classList.toggle('active', b === btn));
        const god = currentGod();
        renderMetrics(god);
        syncArenaIdleSheets();
        if (state.actionMode) triggerSlot(state.actionSlot);
      });
    });

    document.querySelectorAll('.seg-btn[data-res]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.supRes = btn.dataset.res;
        document.querySelectorAll('.seg-btn[data-res]').forEach(b => b.classList.toggle('active', b === btn));
        const god = currentGod();
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

    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT')) return;
      if (e.key === 'Escape') closeConceptModal();
      else if (e.key === 'ArrowLeft') stepGod(-1);
      else if (e.key === 'ArrowRight') stepGod(1);
      else if (e.key === '1') triggerSlot('idle');
      else if (e.key === '2') triggerSlot('atk');
      else if (e.key === '3') triggerSlot('sup');
      else if (e.key === '4') triggerSlot('hyp');
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
