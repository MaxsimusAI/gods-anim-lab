(function () {
  'use strict';

  const SIM = window.SIM_STAND;
  if (!SIM || !window.GODS_MANIFEST || typeof window.__fx2Boot !== 'function') {
    console.error('Missing required stand bundles (GODS_MANIFEST / SIM_STAND / __fx2Boot)');
    return;
  }

  const ARENA_DEFS = [
    {
      key: 'live_bt',
      title: 'Сейчас в игре: Битва титанов',
      bg: 'assets/ui/arena-bt.webp',
      isProposed: false,
      isNewCard: false,
    },
    {
      key: 'new_bt',
      title: 'Новая: Битва титанов',
      bg: 'assets/ui/arena-bt.webp',
      isProposed: true,
      isNewCard: true,
    },
    {
      key: 'new_ti',
      title: 'Новая: Titan Idols',
      bg: 'assets/ui/arena-ti.webp',
      isProposed: true,
      isNewCard: true,
    },
  ];

  const state = {
    group: 'existing',
    elFilter: 'all',
    godId: 'kitsune',
    tier: 'mob',
    speed: 1,
    paused: false,
    activeSlot: 'idle',
    autoCycle: false,
    showcaseMode: false,
    showcaseIdx: 0,
    showcaseWait: 0,
    autoWait: 0,
    arenas: [],
    sheetWarm: {},
  };

  function getAllGods() {
    return window.GODS_MANIFEST.gods || [];
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

  function preloadImg(url) {
    if (!url || state.sheetWarm[url]) return;
    state.sheetWarm[url] = true;
    const im = new Image();
    im.src = url;
  }

  function warmGodAssets(god) {
    if (!god) return;
    for (const tier of ['mob', 'lite']) {
      for (const aKey of ['live_bt', 'new_bt', 'new_ti']) {
        const pack = god.arenas[aKey];
        if (!pack || !pack.sheets) continue;
        for (const sl of ['idle', 'atk', 'sup', 'hyp']) {
          const sh = pack.sheets[sl] && pack.sheets[sl][tier];
          if (sh && sh.src) preloadImg(sh.src);
        }
      }
    }
  }

  function fmtHpShort(val) {
    if (!Number.isFinite(val) || val <= 0) return '0';
    if (val >= 1e6) return (val / 1e6).toFixed(1).replace('.', ',') + 'M';
    if (val >= 1e3) return Math.round(val / 1e3) + 'K';
    return String(Math.round(val));
  }

  function getSheetForSlot(arenaPack, slot) {
    const mapped = (arenaPack.clipMap && arenaPack.clipMap[slot]) || slot;
    const slotObj = arenaPack.sheets[mapped] || arenaPack.sheets.idle;
    return slotObj[state.tier];
  }

  /* ============ 1. SPRITE SHEET APPLICATION & STEPPING ============ */
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

  function syncIdleSheet(arenaObj, u) {
    if (!u || !u.fig) return;
    const idleEl = u._idleEl;
    if (!idleEl) return;
    const fk = arenaObj.T.figKey(u, arenaObj.B);
    const sh = arenaObj.T.SHEETS[fk] || arenaObj.T.SHEETS[u.hid];
    if (!sh) return;
    if (idleEl.dataset.sheet === fk && idleEl._src === sh.src) return;

    preloadImg(sh.src);
    idleEl.dataset.sheet = fk;
    idleEl._src = sh.src;
    idleEl._sh = sh;
    idleEl._f = -1;
    idleEl.style.backgroundImage = `url(${sh.src})`;
    idleEl.style.backgroundSize = `${(sh.cols || 1) * 100}% ${(sh.rows || 1) * 100}%`;
    idleEl.style.aspectRatio = `${sh.w} / ${sh.h}`;

    const f = sh.fig;
    if (f) {
      const k = SIM.v2k(f);
      idleEl.style.height = `${(k * 100).toFixed(2)}%`;
      idleEl.style.translate = `${((0.5 - f.ax) * 100).toFixed(2)}% ${((1 - f.foot) * 100).toFixed(2)}%`;
    } else {
      idleEl.style.height = '100%';
      idleEl.style.translate = 'none';
    }
    const isSingle = (sh.frames || 1) <= 1;
    idleEl.classList.toggle('static-breath', isSingle);
    setSpriteFrame(idleEl, 0, sh.cols || 1, sh.rows || 1);
  }

  function playUnitAnim(arenaObj, u, kind, hitAt) {
    if (!u || !u.fig || (u.role === 'creature' && !u.hgGod)) return;
    const T = arenaObj.T;
    const tbl = kind === 'sup' ? T.SHEETS_SUP : kind === 'hyp' ? T.SHEETS_HYP : T.SHEETS_ATK;
    const A = T.animOf(tbl, u);
    if (!A) return;

    preloadImg(A.src);
    const PRI = { atk: 0, sup: 1, hyp: 2 };
    const existing = [...u.fig.querySelectorAll('.atk')].find(x => x.style.display === 'block');
    if (existing && PRI[existing._kind] > PRI[kind]) return;
    if (existing) existing.style.display = 'none';

    let el = u.fig.querySelector('.atk.k-' + kind);
    if (!el) {
      el = document.createElement('div');
      el.className = 'atk k-' + kind;
      el._kind = kind;
      (u.fig.querySelector('.figin') || u.fig).appendChild(el);
    }

    el._A = A;
    el._f = -1;
    el.style.backgroundImage = `url(${A.src})`;
    el.style.backgroundSize = `${(A.cols || 1) * 100}% ${(A.rows || 1) * 100}%`;
    el.style.height = `${(A.aH * 100).toFixed(2)}%`;
    el.style.aspectRatio = `${A.w} / ${A.h}`;
    el.style.bottom = `${(A.bA * 100).toFixed(2)}%`;

    const hPx = u.fig.offsetHeight || u.fig.getBoundingClientRect().height || 180;
    el.style.left = `calc(50% + ${(A.xA * hPx).toFixed(2)}px)`;

    const defaultPlay = kind === 'hyp' ? 2.4 : kind === 'sup' ? 2.2 : 1.75;
    const playSec = (hitAt && A.rel) ? Math.min(2.6, Math.max(0.42, hitAt / A.rel)) : (A.play || defaultPlay);
    el._startT = arenaObj.animClock;
    el._dur = playSec;
    el.style.display = 'block';

    if (u._idleEl) u._idleEl.style.visibility = 'hidden';
    u.fig.style.zIndex = kind === 'atk' ? '' : '3';
    setSpriteFrame(el, 0, A.cols || 1, A.rows || 1);
  }

  function stepArenaSprites(arenaObj) {
    if (!arenaObj.B) return;
    const allUnits = [...(arenaObj.B.heroes || []), ...(arenaObj.B.enemies || [])];
    const tNow = arenaObj.animClock;
    let focusReadout = null;

    for (const u of allUnits) {
      if (!u || !u.fig) continue;
      syncIdleSheet(arenaObj, u);
      u.fig.classList.toggle('dead', !u.alive);
      if (u._barWrap) u._barWrap.classList.toggle('gone', !u.alive);

      let activeAtk = null;
      const atkNodes = u.fig.querySelectorAll('.atk');
      for (let i = 0; i < atkNodes.length; i++) {
        const ax = atkNodes[i];
        if (ax.style.display !== 'block' || !ax._A) continue;
        const p = (tNow - ax._startT) / Math.max(0.05, ax._dur);
        if (p >= 1 || !u.alive) {
          ax.style.display = 'none';
          u.fig.style.zIndex = '';
        } else {
          activeAtk = ax;
          const nF = ax._A.frames || 1;
          const fi = nF > 1 ? Math.min(nF - 1, Math.max(0, Math.floor(p * nF))) : 0;
          setSpriteFrame(ax, fi, ax._A.cols || 1, ax._A.rows || 1);
          if (u === arenaObj.focusUnit) {
            focusReadout = { cur: fi + 1, tot: nF };
          }
        }
      }

      if (!activeAtk && u._idleEl) {
        u._idleEl.style.visibility = '';
        const sh = u._idleEl._sh;
        if (sh) {
          const nF = sh.frames || 1;
          if (nF > 1) {
            const dur = sh.dur || 2.65;
            const phase = ((tNow + (u._phaseOff || 0)) % dur) / dur;
            const fi = Math.min(nF - 1, Math.floor(phase * nF));
            setSpriteFrame(u._idleEl, fi, sh.cols || 1, sh.rows || 1);
            if (u === arenaObj.focusUnit) {
              focusReadout = { cur: fi + 1, tot: nF };
            }
          } else {
            setSpriteFrame(u._idleEl, 0, 1, 1);
            u._idleEl.style.animationPlayState = state.paused ? 'paused' : 'running';
            if (u === arenaObj.focusUnit) {
              focusReadout = { cur: 1, tot: 1 };
            }
          }
        }
      }

      updateUnitHud(arenaObj, u);
    }

    return focusReadout;
  }

  /* ============ 2. HUD BARS, STATUS ICONS & FLOATING COMBAT NUMBERS ============ */
  function updateUnitHud(arenaObj, u) {
    if (!u || !u._hpCur) return;
    const maxHp = Math.max(1, u.maxHp || 1);
    const hpPct = u.alive ? Math.max(0, Math.min(100, (u.hp / maxHp) * 100)) : 0;
    const shPct = u.alive && u.shield > 0 ? Math.max(0, Math.min(100, (u.shield / maxHp) * 100)) : 0;
    const pctStr = hpPct.toFixed(1) + '%';
    if (u._lastHpStr !== pctStr) {
      u._lastHpStr = pctStr;
      u._hpCur.style.width = pctStr;
      u._hpLag.style.width = pctStr;
      if (u._hpTxt) u._hpTxt.textContent = u.alive ? fmtHpShort(u.hp) : '0';
    }
    const shStr = shPct.toFixed(1) + '%';
    if (u._lastShStr !== shStr && u._shBar) {
      u._lastShStr = shStr;
      u._shBar.style.width = shStr;
      u.fig.classList.toggle('shielded', u.alive && u.shield > 0);
    }
    if (u._enBar) {
      const enPct = u.alive ? Math.max(0, Math.min(100, ((u.en || 0) / 100) * 100)) : 0;
      u._enBar.style.width = enPct.toFixed(0) + '%';
      u._enWrap.classList.toggle('full', enPct >= 99);
    }

    // Status icons (.sts2) & subtle foot auras
    const bt = arenaObj.B ? arenaObj.B.t : 0;
    const icons = [];
    let hasUp = false, hasDown = false;
    if (u.alive) {
      if (u.stunT > bt) { icons.push(['i_stun.webp', 'bad']); hasDown = true; }
      if (u.silT > bt) { icons.push(['i_silence.webp', 'bad']); hasDown = true; }
      if (u.antiHealT > bt) { icons.push(['i_bleed.webp', 'bad']); hasDown = true; }
      if (u.vulnT > bt || (u.defMod && u.defMod < 0) || u.weakT > bt || u.dmgDownT > bt) { icons.push(['i_down.webp', 'bad']); hasDown = true; }
      if (u.dots && u.dots.length > 0) { icons.push(['i_burn.webp', 'bad']); hasDown = true; }
      if (u.shield > 0) { icons.push(['i_shield.webp', 'good']); hasUp = true; }
      if (u.invT > bt) { icons.push(['i_inv.webp', 'good']); hasUp = true; }
      if (u.atkUpT > bt || u.hasteT > bt) { icons.push(['i_up.webp', 'good']); hasUp = true; }
    }
    u.fig.classList.toggle('st-up', hasUp);
    u.fig.classList.toggle('st-down', hasDown);
    u.fig.classList.toggle('invuln', !!(u.alive && u.invT > bt));

    const sig = icons.slice(0, 3).map(x => x[0]).join('|');
    if (u._stsEl && u._lastStsSig !== sig) {
      u._lastStsSig = sig;
      u._stsEl.innerHTML = icons.slice(0, 3).map(([fn, cls]) =>
        `<i class="${cls}"><img src="assets/ui/${fn}" alt=""></i>`
      ).join('');
    }
  }

  function unitRelPos(arenaObj, u, fy) {
    if (!u || !u.fig) return null;
    const fr = arenaObj.fxDomEl.getBoundingClientRect();
    const ur = u.fig.getBoundingClientRect();
    if (fr.width < 4 || ur.height < 4) return null;
    return {
      x: ur.left - fr.left + ur.width * 0.5,
      y: ur.top - fr.top + ur.height * fy,
    };
  }

  function spawnFloatText(arenaObj, u, text, cls, fy) {
    const p = unitRelPos(arenaObj, u, fy == null ? 0.34 : fy);
    if (!p) return;
    const el = document.createElement('div');
    el.className = 'num' + (cls ? ' ' + cls : '');
    const jx = (Math.random() - 0.5) * 14;
    el.style.left = `${(p.x + jx).toFixed(1)}px`;
    el.style.top = `${p.y.toFixed(1)}px`;
    el.textContent = text;
    arenaObj.fxDomEl.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 1150);
  }

  function spawnSkillBanner(arenaObj, name, col) {
    if (!name) return;
    const el = document.createElement('div');
    el.className = 'supname';
    if (col) el.style.setProperty('--fc', col);
    el.textContent = name;
    arenaObj.fxDomEl.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 1280);
  }

  function handleSimEvents(arenaObj, ev) {
    if (!ev || !ev.length || !arenaObj.fx2) return;
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      let q = 0;
      try {
        q = arenaObj.fx2.ev(e, ev) | 0;
      } catch (err) {
        console.error('fx2.ev error in ' + arenaObj.key, err);
      }
      if (q === 2) continue;

      switch (e.type) {
        case 'lunge':
        case 'shoot':
        case 'cast':
          if (q === 0 && e.u) playUnitAnim(arenaObj, e.u, 'atk', e.dur || 0.5);
          break;
        case 'super': {
          const sDef = SIM.SUPERS[e.u && e.u.hid];
          const hCol = (SIM.HEROES[e.u && e.u.hid] && SIM.HEROES[e.u.hid].fx) || '#ffe082';
          spawnSkillBanner(arenaObj, sDef && sDef.name, hCol);
          if (q === 0 && e.u) playUnitAnim(arenaObj, e.u, 'sup', e.dur || 0.9);
          break;
        }
        case 'hyper': {
          const hDef = SIM.HYPERS[e.u && e.u.hid];
          const hCol = (SIM.HEROES[e.u && e.u.hid] && SIM.HEROES[e.u.hid].fx) || '#a8e4ff';
          spawnSkillBanner(arenaObj, hDef && hDef.name, hCol);
          if (q === 0 && e.u) playUnitAnim(arenaObj, e.u, 'hyp', e.dur || 1.1);
          break;
        }
        case 'hit':
          if (e.miss) {
            spawnFloatText(arenaObj, e.u, 'Промах', 'debuff', 0.36);
          } else if (!e.quiet && e.dmg > 0) {
            spawnFloatText(arenaObj, e.u, '−' + fmtHpShort(e.dmg), e.crit ? 'crit' : '', 0.35);
          }
          break;
        case 'heal':
          if (e.amt > 0) {
            spawnFloatText(arenaObj, e.u, '+' + fmtHpShort(e.amt), 'heal', 0.32);
          }
          break;
        case 'shield':
          if (e.u && e.u.shield > 0 && e.on !== false) {
            spawnFloatText(arenaObj, e.u, 'Щит +' + fmtHpShort(e.u.shield), 'shield', 0.24);
          }
          break;
        case 'rise':
          if (e.u) {
            spawnFloatText(arenaObj, e.u, 'Воскрешение!', 'heal', 0.20);
          }
          break;
      }
    }
  }

  /* ============ 3. ARENA DOM CONSTRUCTION & FX2 BOOT ============ */
  function createBarCellHtml(withEn) {
    return (
      `<div class="bar"><div class="tracks">` +
      `<div class="track"><i class="lag"></i><i class="cur"></i><i class="shd"></i><b>100%</b></div>` +
      (withEn ? `<div class="enbar"><i></i></div>` : '') +
      `</div></div>`
    );
  }

  function createFigCellHtml(isHeroFocus) {
    return (
      `<div class="figcell${isHeroFocus ? ' hero-focus' : ''}">` +
      `<div class="figwrap">` +
      `<div class="aura up"></div><div class="aura down"></div>` +
      `<div class="figin"><div class="fig sprite"></div></div>` +
      `</div>` +
      `<div class="sts2"></div>` +
      `</div>`
    );
  }

  function buildArenasDom() {
    const grid = document.getElementById('arenasGrid');
    // Stop previous FX2 instances cleanly before rebuilding on tier toggle
    for (const oldA of state.arenas) {
      if (oldA.fx2) {
        try { oldA.fx2.stop(); } catch (_) {}
      }
    }
    grid.innerHTML = '';
    state.arenas = [];

    const lite = state.tier === 'lite';
    const simMap = window.GODS_MANIFEST.simGodDataMap;

    for (const cfg of ARENA_DEFS) {
      const card = document.createElement('section');
      card.className = 'arena-card' + (cfg.isNewCard ? ' is-new' : '');
      card.dataset.arena = cfg.key;

      card.innerHTML =
        `<div class="arena-head">` +
        `<span class="arena-title">${cfg.title}</span>` +
        `<span class="arena-tag"></span>` +
        `</div>` +
        `<div class="arena-stage" style="background-image:url('${cfg.bg}')">` +
        `<div class="arena-note-pill"></div>` +
        `<div class="newgod-live-banner" hidden><b>Новый бог — ещё не в живой игре</b>На Аренах 2 и 3 справа работает полный бой SIM + авторский FX2 «Кузница»</div>` +
        `<div class="battle-app">` +
        `<div class="battle-arena">` +
        `<div class="arena-bg" data-fxid="bg"></div>` +
        `<div class="row5 bars-row enemy-bars" data-fxid="ebars">${Array.from({ length: 5 }, () => createBarCellHtml(false)).join('')}</div>` +
        `<div class="row5 enemy-figs" data-fxid="efigs">${Array.from({ length: 5 }, () => createFigCellHtml(false)).join('')}</div>` +
        `<div class="field-mid" data-fxid="field"></div>` +
        `<div class="row5 bars-row ally-bars" data-fxid="hbars">${Array.from({ length: 5 }, () => createBarCellHtml(true)).join('')}</div>` +
        `<div class="row5 ally-figs" data-fxid="hfigs">${Array.from({ length: 5 }, (_, i) => createFigCellHtml(i === 2)).join('')}</div>` +
        `</div>` +
        `<div class="arena-fxdom"></div>` +
        `</div>` +
        `</div>`;

      grid.appendChild(card);

      const T = SIM.buildArenaSheets(cfg.key, simMap, lite);
      const battleAppEl = card.querySelector('.battle-app');
      const battleArenaEl = card.querySelector('.battle-arena');
      const fxDomEl = card.querySelector('.arena-fxdom');

      const arenaObj = {
        key: cfg.key,
        cfg,
        card,
        tagEl: card.querySelector('.arena-tag'),
        notePillEl: card.querySelector('.arena-note-pill'),
        newGodBannerEl: card.querySelector('.newgod-live-banner'),
        battleAppEl,
        battleArenaEl,
        fxDomEl,
        eBarsEls: [...card.querySelector('[data-fxid="ebars"]').children],
        eCellEls: [...card.querySelector('[data-fxid="efigs"]').children],
        hBarsEls: [...card.querySelector('[data-fxid="hbars"]').children],
        hCellEls: [...card.querySelector('[data-fxid="hfigs"]').children],
        T,
        B: null,
        focusUnit: null,
        animClock: 0,
        fx2: null,
      };

      const BR = {
        HEROES: SIM.HEROES,
        ROLES: SIM.ROLES,
        WEAPONS: SIM.WEAPONS,
        FXS: SIM.FXS,
        SUPERS: SIM.SUPERS,
        HYPERS: SIM.HYPERS,
        SHEETS: T.SHEETS,
        SHEETS_ATK: T.SHEETS_ATK,
        SHEETS_SUP: T.SHEETS_SUP,
        SHEETS_HYP: T.SHEETS_HYP,
        SHEETS_V2: T.SHEETS_V2,
        PH: {},
        SK: SIM.SK,
        CONFIG: SIM.CONFIG,
        HEAD_TOP: SIM.HEAD_TOP,
        GIANTS: SIM.GIANTS,
        FIG_HT: SIM.FIG_HT,
        HG_SHEET: SIM.HG_SHEET,
        HX_STRIKE: SIM.HX_STRIKE,
        hxShowSide: () => 'e',
        all: true,
        sil: false,
        only: null,
        LITE: lite,
        PC: true,
        isProposed: cfg.isProposed,
        appEl: battleAppEl,
        fxEl: fxDomEl,
        arena: battleArenaEl,
        dprx: () => Math.min(2, window.devicePixelRatio || 1),
        figKey: u => T.figKey(u, arenaObj.B),
        animOf: (tbl, u) => T.animOf(tbl, u, arenaObj.B),
        get B() { return arenaObj.B; },
        get vis() {
          const g = currentGod();
          return !(cfg.key === 'live_bt' && g && g.isNewGod);
        },
        playAnim: (u, kind, hitAt) => playUnitAnim(arenaObj, u, kind, hitAt),
        sound: () => {},
        foesOf: u => (arenaObj.B ? SIM.foesOf(arenaObj.B, u) : []),
        sideOf: u => (arenaObj.B ? SIM.sideOf(arenaObj.B, u) : []),
      };

      arenaObj.BR = BR;
      arenaObj.fx2 = window.__fx2Boot(BR);
      state.arenas.push(arenaObj);
    }
  }

  function bindUnitToCell(arenaObj, u, cellEl, barWrapEl, phaseIdx) {
    const figWrap = cellEl.querySelector('.figwrap');
    const idleEl = figWrap.querySelector('.fig.sprite');
    // Remove any previous .atk overlays from earlier god
    figWrap.querySelectorAll('.atk').forEach(n => n.remove());
    figWrap.className = 'figwrap';
    figWrap.style.transform = '';
    figWrap.style.zIndex = '';

    idleEl.dataset.sheet = '';
    idleEl._src = '';
    idleEl.style.visibility = '';

    u.fig = figWrap;
    u._idleEl = idleEl;
    u._stsEl = cellEl.querySelector('.sts2');
    if (u._stsEl) u._stsEl.innerHTML = '';
    u._lastStsSig = '';
    u._barWrap = barWrapEl;
    u._hpLag = barWrapEl.querySelector('.lag');
    u._hpCur = barWrapEl.querySelector('.cur');
    u._shBar = barWrapEl.querySelector('.shd');
    u._hpTxt = barWrapEl.querySelector('b');
    u._enWrap = barWrapEl.querySelector('.enbar');
    u._enBar = u._enWrap ? u._enWrap.querySelector('i') : null;
    u._lastHpStr = '';
    u._lastShStr = '';
    u._phaseOff = (phaseIdx || 0) * 0.37;

    syncIdleSheet(arenaObj, u);
    updateUnitHud(arenaObj, u);
  }

  function clearFloatingDom(arenaObj) {
    if (!arenaObj.fxDomEl) return;
    [...arenaObj.fxDomEl.children].forEach(ch => {
      if (!ch.classList.contains('fx2cv')) ch.remove();
    });
  }

  function mountGodIntoArenas(god) {
    warmGodAssets(god);
    for (const a of state.arenas) {
      if (a.fx2) {
        try { a.fx2.stop(); } catch (_) {}
      }
      clearFloatingDom(a);
      a.animClock = 0;
      a.pack = god.arenas[a.key];

      const isHiddenLive = (a.key === 'live_bt' && !!god.isNewGod);
      a.newGodBannerEl.hidden = !isHiddenLive;
      a.battleAppEl.style.opacity = isHiddenLive ? '0.18' : '1';

      const st = SIM.createStandBattle(god.id, 20261112);
      a.B = st.B;
      a.focusUnit = st.focusUnit;

      for (let i = 0; i < 5; i++) {
        if (a.B.enemies[i]) bindUnitToCell(a, a.B.enemies[i], a.eCellEls[i], a.eBarsEls[i], i + 5);
        if (a.B.heroes[i]) bindUnitToCell(a, a.B.heroes[i], a.hCellEls[i], a.hBarsEls[i], i);
      }

      // Prime FX2 W.B + measureLayout + syncUnits BEFORE any skill event is dispatched!
      if (!isHiddenLive && a.fx2) {
        try {
          a.fx2.frame(0.001, performance.now());
        } catch (err) {
          console.error('fx2 prime frame error in ' + a.key, err);
        }
      }
    }
  }

  /* ============ 4. HEADER, METRICS, TAGS & VERDICT CARDS ============ */
  function renderFilters() {
    const host = document.getElementById('elFilters');
    const allInGroup = getAllGods().filter(g => g.group === state.group);
    const vidCnt = allInGroup.filter(g => g.hasVideoAnim).length;
    const items = [{ k: 'all', lbl: `Все (${allInGroup.length})` }];
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
        selectGod(state.godId);
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
      const dot = g.hasVideoAnim ? `<i class="vid-dot" title="Проверенные 25-кадровые листы (${g.videoSlotsReady}/8)"></i>` : '';
      return `<button class="${cls}" data-god="${g.id}" type="button"><img src="${g.portrait}" alt=""><span>${idx + 1}. ${g.name}</span>${dot}</button>`;
    }).join('');

    host.querySelectorAll('button[data-god]').forEach(btn => {
      btn.addEventListener('click', () => selectGod(btn.dataset.god));
    });

    const activePill = host.querySelector('.god-pill.active');
    if (activePill && activePill.scrollIntoView) {
      activePill.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    const sel = document.getElementById('godQuickSelect');
    sel.innerHTML = gods.map((g, idx) =>
      `<option value="${g.id}"${g.id === state.godId ? ' selected' : ''}>${idx + 1}. ${g.name} (${g.elementIcon} ${g.roleRu})${g.videoSlotsReady ? ` · ${g.videoSlotsReady}/8 кд` : ''}</option>`
    ).join('');

    const god = currentGod();
    document.getElementById('btnConceptModal').hidden = !(god && god.conceptArts);
  }

  function updateArenaHeadersAndNotes(god, slot) {
    const sl = slot || state.activeSlot || 'idle';
    for (const a of state.arenas) {
      if (!a.tagEl || !a.pack) continue;
      if (a.key === 'live_bt' && god.isNewGod) {
        a.tagEl.textContent = 'Ещё не в живой игре';
        a.tagEl.classList.add('is-ref');
        a.notePillEl.classList.remove('show');
        continue;
      }
      const sh = getSheetForSlot(a.pack, sl);
      const sw = sh.sheetW || sh.w * sh.cols;
      const shH = sh.sheetH || sh.h * sh.rows;
      if (sh.isStaticRef) {
        a.tagEl.textContent = `⏳ Очередь 25 кд · Арт ${sh.w}×${sh.h} px`;
        a.tagEl.classList.add('is-ref');
      } else {
        a.tagEl.textContent = `🎬 ${sh.frames} кд · ${sh.w}×${sh.h} px (${sw}×${shH})`;
        a.tagEl.classList.remove('is-ref');
      }

      // Show CLIP_MAP fallback warning pill on Arena 1 if live game reuses another clip
      if (a.key === 'live_bt' && a.pack.clipMap && a.pack.clipMap[sl]) {
        a.notePillEl.textContent = `В игре повтор листа (${sl} → ${a.pack.clipMap[sl]})`;
        a.notePillEl.classList.add('show');
      } else {
        a.notePillEl.classList.remove('show');
      }
    }
  }

  function renderMetrics(god) {
    const sl = state.activeSlot || 'idle';
    const shLive = getSheetForSlot(god.arenas.live_bt, sl);
    const shBt = getSheetForSlot(god.arenas.new_bt, sl);
    const shTi = getSheetForSlot(god.arenas.new_ti, sl);
    const ceilTxt = state.tier === 'mob' ? '≤180×220' : '≤126×154';

    const sumPack = pack => {
      let kb = 0, ram = 0;
      const seen = new Set();
      for (const s of ['idle', 'atk', 'sup', 'hyp']) {
        const mapped = (pack.clipMap && pack.clipMap[s]) || s;
        const sh = pack.sheets[mapped] && pack.sheets[mapped][state.tier];
        if (sh && !seen.has(sh.src)) {
          seen.add(sh.src);
          kb += sh.kb || 0;
          ram += sh.ramMb || 0;
        }
      }
      return { kb: Math.round(kb), ram: ram.toFixed(1).replace('.', ',') };
    };

    const pLive = sumPack(god.arenas.live_bt);
    const pBt = sumPack(god.arenas.new_bt);
    const pTi = sumPack(god.arenas.new_ti);

    const liveTxt = god.isNewGod
      ? `Live БТ: <b>новый бог</b>`
      : `Live БТ (${sl}): <b>${shLive.w}×${shLive.h}px</b> (${pLive.kb} КБ · ${pLive.ram} МБ RAM)`;

    document.getElementById('metricsLine').innerHTML =
      `<span class="el-badge">${god.elementIcon} ${god.name} · ${god.roleRu}</span>` +
      `<span>${liveTxt}</span>` +
      `<span>Новая БТ (${sl}, ${ceilTxt}): <b>${shBt.w}×${shBt.h}px</b> (${pBt.kb} КБ · ${pBt.ram} МБ)</span>` +
      `<span>Titan Idols (${sl}, ${ceilTxt}): <b>${shTi.w}×${shTi.h}px</b> (${pTi.kb} КБ · ${pTi.ram} МБ)</span>` +
      `<span>Видео 25 кд: <b>${god.videoSlotsReady}/8</b></span>`;
  }

  function renderControlsAndVerdicts(god) {
    document.getElementById('btnAtkLabel').textContent = god.skills.atk.shortName || 'Обычное умение';
    document.getElementById('btnSupLabel').textContent = god.skills.sup.shortName || 'Суперумение';
    document.getElementById('btnHypLabel').textContent = god.skills.hyp.shortName || 'Ульта';

    document.querySelectorAll('.skill-btn[data-slot]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.slot === state.activeSlot);
    });

    const sk = god.skills[state.activeSlot] || god.skills.idle;
    document.getElementById('fxTitle').textContent = `Блок А — ${sk.title}`;
    const fxBadge = document.getElementById('fxBadge');
    fxBadge.textContent = sk.fxBadge;
    fxBadge.className = 'status-pill ' + (sk.fxUpgraded ? 'upgrade' : 'keep');
    document.getElementById('fxBody').innerHTML =
      `<p>${sk.descRu}</p>` +
      `<div class="fx-verdict-box"><b>Движок FX2 «Кузница»:</b> ${sk.fxVerdictRu}</div>`;

    const bal = god.balance;
    document.getElementById('balTitle').textContent = `Блок Б — Баланс на максимальной прокачке (XX★5): ${god.name}`;
    const balBadge = document.getElementById('balBadge');
    balBadge.textContent = bal.badge;
    balBadge.className = 'status-pill ' + bal.badgeClass;
    document.getElementById('balBody').innerHTML = bal.paragraphsRu.map(p => `<p>${p}</p>`).join('');
  }

  /* ============ 5. SYNCHRONOUS SKILL TRIGGERING & SHOWCASE ============ */
  function triggerSkill(slot, fromShowcase) {
    const god = currentGod();
    if (!god) return;
    if (!fromShowcase) {
      state.showcaseMode = false;
      document.getElementById('btnShowcase').classList.remove('active');
    }
    state.activeSlot = slot;
    renderControlsAndVerdicts(god);
    renderMetrics(god);
    updateArenaHeadersAndNotes(god, slot);

    if (slot === 'idle') {
      // Reset any active action overlays and lingering FX cleanly
      for (const a of state.arenas) {
        if (a.fx2) {
          try { a.fx2.stop(); } catch (_) {}
        }
        clearFloatingDom(a);
        if (a.focusUnit && a.focusUnit.fig) {
          a.focusUnit.fig.querySelectorAll('.atk').forEach(el => { el.style.display = 'none'; });
          if (a.focusUnit._idleEl) a.focusUnit._idleEl.style.visibility = '';
        }
      }
      return;
    }

    state.autoWait = slot === 'hyp' ? 3.3 : slot === 'sup' ? 2.9 : 2.3;

    for (const a of state.arenas) {
      if (a.key === 'live_bt' && god.isNewGod) continue;
      if (!a.B || !a.focusUnit) continue;
      // Clear any previous floating banners/numbers and reset lingering FX2 particles before new skill
      clearFloatingDom(a);
      if (a.fx2) {
        try {
          a.fx2.stop();
          a.fx2.frame(0.001, performance.now());
        } catch (_) {}
      }
      // Interrupt previous focusUnit .atk overlay so repeated clicks always fire crisply
      if (a.focusUnit.fig) {
        a.focusUnit.fig.querySelectorAll('.atk').forEach(el => { el.style.display = 'none'; });
        if (a.focusUnit._idleEl) a.focusUnit._idleEl.style.visibility = '';
      }
      const ev = SIM.triggerSlot(a.B, a.focusUnit, slot);
      handleSimEvents(a, ev);
    }
  }

  function selectGod(godId) {
    const target = getAllGods().find(g => g.id === godId) || getAllGods()[0];
    if (!target) return;
    state.godId = target.id;
    if (target.group !== state.group) {
      state.group = target.group;
      state.elFilter = 'all';
    }
    state.showcaseMode = false;
    document.getElementById('btnShowcase').classList.remove('active');

    renderRoster();
    mountGodIntoArenas(target);
    renderControlsAndVerdicts(target);
    renderMetrics(target);
    updateArenaHeadersAndNotes(target, state.activeSlot);

    if (state.activeSlot !== 'idle') {
      triggerSkill(state.activeSlot, false);
    }
  }

  /* ============ 6. CONCEPT ART 2K MODAL & UI BINDINGS ============ */
  function openConceptModal() {
    const god = currentGod();
    if (!god || !god.conceptArts) return;
    document.getElementById('conceptModalTitle').textContent =
      `${god.name} (${god.titleRu || god.roleRu}) — полноразмерные 2K-арты БТ и Titan Idols`;
    document.getElementById('conceptModalBody').innerHTML =
      `<div class="concept-col"><h4>Битва титанов (тёмное фэнтези)</h4><img src="${god.conceptArts.bt}" alt="${god.name} БТ"></div>` +
      `<div class="concept-col"><h4>Titan Idols (аниме-версия)</h4><img src="${god.conceptArts.ti}" alt="${god.name} TI"></div>`;
    document.getElementById('conceptModal').hidden = false;
  }

  function closeConceptModal() {
    document.getElementById('conceptModal').hidden = true;
  }

  function bindUiEvents() {
    document.getElementById('tabExisting').addEventListener('click', () => {
      if (state.group === 'existing') return;
      state.group = 'existing';
      state.elFilter = 'all';
      const first = getFilteredGods()[0];
      if (first) selectGod(first.id);
    });

    document.getElementById('tabNew10').addEventListener('click', () => {
      if (state.group === 'new10') return;
      state.group = 'new10';
      state.elFilter = 'all';
      const first = getFilteredGods()[0];
      if (first) selectGod(first.id);
    });

    document.getElementById('godQuickSelect').addEventListener('change', e => {
      selectGod(e.target.value);
    });

    const stepGod = dir => {
      const list = getFilteredGods();
      if (!list.length) return;
      const idx = list.findIndex(g => g.id === state.godId);
      const next = list[(idx + dir + list.length) % list.length];
      if (next) selectGod(next.id);
    };

    document.getElementById('btnPrevGod').addEventListener('click', () => stepGod(-1));
    document.getElementById('btnNextGod').addEventListener('click', () => stepGod(1));

    document.querySelectorAll('.skill-btn[data-slot]').forEach(btn => {
      btn.addEventListener('click', () => triggerSkill(btn.dataset.slot, false));
    });

    document.querySelectorAll('.seg-btn[data-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.tier === btn.dataset.tier) return;
        state.tier = btn.dataset.tier;
        document.querySelectorAll('.seg-btn[data-tier]').forEach(b => b.classList.toggle('active', b.dataset.tier === state.tier));
        buildArenasDom();
        const g = currentGod();
        mountGodIntoArenas(g);
        renderMetrics(g);
        updateArenaHeadersAndNotes(g, state.activeSlot);
        if (state.activeSlot !== 'idle') triggerSkill(state.activeSlot, false);
      });
    });

    document.querySelectorAll('.seg-btn[data-spd]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.speed = parseFloat(btn.dataset.spd) || 1;
        state.paused = false;
        document.getElementById('btnPause').classList.remove('active');
        document.getElementById('btnPause').textContent = '⏸ Пауза';
        document.querySelectorAll('.seg-btn[data-spd]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    document.getElementById('btnPause').addEventListener('click', () => {
      state.paused = !state.paused;
      const pBtn = document.getElementById('btnPause');
      pBtn.classList.toggle('active', state.paused);
      pBtn.textContent = state.paused ? '▶ Пуск' : '⏸ Пауза';
    });

    document.getElementById('btnAutoCycle').addEventListener('click', () => {
      state.autoCycle = !state.autoCycle;
      const btn = document.getElementById('btnAutoCycle');
      btn.classList.toggle('active', state.autoCycle);
      btn.textContent = state.autoCycle ? '↻ Автоповтор: Вкл' : '↻ Автоповтор: Выкл';
      if (state.autoCycle && state.activeSlot === 'idle') {
        triggerSkill('atk', false);
      }
    });

    document.getElementById('btnShowcase').addEventListener('click', () => {
      state.showcaseMode = !state.showcaseMode;
      const btn = document.getElementById('btnShowcase');
      btn.classList.toggle('active', state.showcaseMode);
      if (state.showcaseMode) {
        state.showcaseIdx = 0;
        state.showcaseWait = 2.6;
        triggerSkill('atk', true);
      }
    });

    document.getElementById('btnConceptModal').addEventListener('click', openConceptModal);
    document.getElementById('btnCloseConcept').addEventListener('click', closeConceptModal);
    document.getElementById('conceptBackdrop').addEventListener('click', closeConceptModal);

    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT')) return;
      if (e.key === 'Escape') { closeConceptModal(); return; }
      if (e.key === 'ArrowLeft') { stepGod(-1); return; }
      if (e.key === 'ArrowRight') { stepGod(1); return; }
      if (e.key === '1') triggerSkill('idle', false);
      if (e.key === '2') triggerSkill('atk', false);
      if (e.key === '3') triggerSkill('sup', false);
      if (e.key === '4') triggerSkill('hyp', false);
      if (e.key === ' ') {
        e.preventDefault();
        document.getElementById('btnPause').click();
      }
    });
  }

  /* ============ 7. UNIFIED ANIMATION LOOP ============ */
  let lastFrameMs = performance.now();
  const readoutEl = document.getElementById('frameReadout');

  function tick(nowMs) {
    const rawDt = Math.min(0.05, Math.max(0, (nowMs - lastFrameMs) / 1000));
    lastFrameMs = nowMs;
    const dt = state.paused ? 0 : rawDt * state.speed;
    const god = currentGod();

    let bestReadout = null;
    for (const a of state.arenas) {
      const hiddenLive = (a.key === 'live_bt' && god && god.isNewGod);
      if (hiddenLive || !a.B) continue;

      if (dt > 0) {
        a.animClock += dt;
        const stepEv = SIM.stepStandBattle(a.B, dt);
        if (stepEv.length) handleSimEvents(a, stepEv);
      }

      const r = stepArenaSprites(a);
      if (a.key === 'new_bt' && r) bestReadout = r;
      else if (!bestReadout && r) bestReadout = r;

      if (dt > 0 && a.fx2) {
        try {
          a.fx2.frame(dt, a.animClock * 1000);
        } catch (err) {
          console.error('fx2.frame error in ' + a.key, err);
        }
      }
    }

    if (bestReadout && readoutEl) {
      const cStr = String(bestReadout.cur).padStart(2, '0');
      const tStr = String(bestReadout.tot).padStart(2, '0');
      const txt = `Кадр ${cStr}/${tStr}`;
      if (readoutEl.textContent !== txt) readoutEl.textContent = txt;
    }

    if (dt > 0) {
      if (state.showcaseMode) {
        state.showcaseWait -= dt;
        if (state.showcaseWait <= 0) {
          const seq = ['atk', 'sup', 'hyp'];
          state.showcaseIdx = (state.showcaseIdx + 1) % seq.length;
          const nextSlot = seq[state.showcaseIdx];
          state.showcaseWait = nextSlot === 'hyp' ? 3.4 : nextSlot === 'sup' ? 3.0 : 2.5;
          triggerSkill(nextSlot, true);
        }
      } else if (state.autoCycle && state.activeSlot !== 'idle') {
        state.autoWait -= dt;
        if (state.autoWait <= 0) {
          triggerSkill(state.activeSlot, false);
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // Boot!
  buildArenasDom();
  bindUiEvents();
  const initialHash = (location.hash || '').replace(/^#/, '').trim();
  const startGod = getAllGods().find(g => g.id === initialHash) || getAllGods()[0];
  selectGod(startGod.id);
  requestAnimationFrame(tick);

  window.__STAND_DEBUG = {
    state,
    getArenas: () => state.arenas,
    selectGod,
    triggerSkill,
    stepManual(dtSec) {
      const god = currentGod();
      for (const a of state.arenas) {
        if (a.key === 'live_bt' && god && god.isNewGod) continue;
        a.animClock += dtSec;
        const ev = SIM.stepStandBattle(a.B, dtSec);
        if (ev.length) handleSimEvents(a, ev);
        stepArenaSprites(a);
        if (a.fx2) a.fx2.frame(dtSec, a.animClock * 1000);
      }
    },
  };
})();
