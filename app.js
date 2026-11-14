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
    alt: {},      // 14.11 Maxim: near-miss takes per slot ("версия 2, 3…"); {slot: n}, n>=2 picks god.arenas[key+'_alt'][slot][n] (take vN); only with ver 'now'
    ver: 'now',   // 13.11 Maxim: middle + right arenas switch between 'prev' (yesterday's sheets) and 'now'
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
    marks: {},        // 14.11: Maxim's own marks per clip, {god_style_slot: 'ok|<stamp>' | 'redo|<stamp>'}, kept in localStorage
    notes: {},        // 14.11: Maxim's comments per clip, {god_style_slot: {t, s}}, kept in localStorage
    mapFilter: null,  // status code picked in the legend of the status map
  };

  function getAllGods() {
    return window.GODS_MANIFEST.gods || [];
  }

  /* ============ 0. STATUS MAP (14.11 Maxim: «как мне на сайте понять, у какого бога какое состояние?») ============
     One status per clip (assets/status-data.js, built by pipeline/tools/build_status.py) + Maxim's own marks, kept in this
     browser (localStorage) and copied to the chat with one button. A mark wins over the recorded status on the map. */
  const ST_ORDER = ['new', 'look', 'redo', 'fine', 'ok', 'none'];
  const ST_RU = {
    new: 'Новый ролик — ждёт вашего взгляда',
    look: 'Спорный — посмотрите',
    redo: 'Не проходит правила — на пересъёмку',
    fine: 'Проверка замечаний не нашла',
    ok: 'Принято вами',
    none: 'Ролика нет',
  };
  const ST_SHORT = { new: 'новый', look: 'посмотрите', redo: 'на пересъёмку', fine: 'без замечаний', ok: 'принято', none: 'нет ролика' };
  const MAP_SLOTS = ['idle', 'atk', 'sup', 'hyp'];
  const MAP_SLOT_RU = { idle: 'стойка', atk: 'удар', sup: 'супер', hyp: 'ульта' };
  const MAP_STYLES = ['bt', 'ti'];
  const MAP_STYLE_RU = { bt: 'Титан', ti: 'Аниме' };
  const MARKS_KEY = 'gal_marks_v1';
  const NOTES_KEY = 'gal_notes_v1';   // 14.11 (21:37) Maxim: «ещё поле, чтобы я мог комментарии оставить. Каждой из анимаций»
  const NOTE_MAX = 600;

  function loadMarks() {
    try {
      const m = JSON.parse(localStorage.getItem(MARKS_KEY) || '{}');
      return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
    } catch (_) { return {}; }
  }
  function saveMarks() {
    try { localStorage.setItem(MARKS_KEY, JSON.stringify(state.marks)); } catch (_) {}
  }
  // Maxim's comments per clip: {god_style_slot: {t: text, s: stamp of the take it was written about}}
  function loadNotes() {
    try {
      const m = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
      return m && typeof m === 'object' && !Array.isArray(m) ? m : {};
    } catch (_) { return {}; }
  }
  function saveNotes() {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes)); } catch (_) {}
  }
  function cutText(t, max) {   // by whole characters, so an emoji is never cut in half
    const a = Array.from(String(t));
    return a.length > max ? a.slice(0, max).join('') : String(t);
  }
  function noteOf(godId, key) {
    if (recStatus(godId, key) === 'none') return '';
    const n = state.notes[godId + '_' + key];
    return n && typeof n === 'object' && typeof n.t === 'string' ? cutText(n.t, NOTE_MAX) : '';
  }
  // which version he was looking at when he wrote the comment: '' = the current one («новое», version 1)
  function noteCtx(godId, key) {
    const n = state.notes[godId + '_' + key];
    return n && typeof n === 'object' && typeof n.c === 'string' ? n.c.slice(0, 20) : '';
  }
  // true when the comment was written about an earlier take of this clip
  function noteIsOld(godId, key) {
    const n = state.notes[godId + '_' + key];
    return !!(n && typeof n === 'object' && String(n.s == null ? '' : n.s) !== clipStamp(godId, key));
  }
  function setNote(godId, key, text) {
    const id = godId + '_' + key, t = cutText(text, NOTE_MAX);
    const slot = key.split('_')[1], alt = state.alt[slot] | 0;
    const c = state.ver === 'prev' ? 'вчера' : alt >= 2 ? 'дубль ' + alt : '';
    if (t.trim()) state.notes[id] = { t, s: clipStamp(godId, key), c }; else delete state.notes[id];
    saveNotes();
  }
  function notesCount() {
    let n = 0;
    for (const g of mapGods()) for (const st of MAP_STYLES) for (const sl of MAP_SLOTS) if (noteOf(g.id, st + '_' + sl).trim()) n++;
    return n;
  }
  function recStatus(godId, key) {
    const g = (window.CLIP_STATUS || {})[godId];
    const c = g && g[key];
    return typeof c === 'string' && Object.prototype.hasOwnProperty.call(ST_RU, c) ? c : 'none';
  }
  // stamp of the take now on the stand (size of its sheet): a mark made on an older take stops counting
  function clipStamp(godId, key) {
    const v = (window.CLIP_STAMP || {})[godId + '_' + key];
    return v == null ? '' : String(v);
  }
  // a mark is stored as "ok|<stamp>" / "redo|<stamp>"
  function markOf(godId, key) {
    const raw = state.marks[godId + '_' + key];
    if (typeof raw !== 'string' || recStatus(godId, key) === 'none') return '';
    const i = raw.indexOf('|'), m = i < 0 ? raw : raw.slice(0, i), stamp = i < 0 ? '' : raw.slice(i + 1);
    if (m !== 'ok' && m !== 'redo') return '';
    return stamp === clipStamp(godId, key) ? m : '';
  }
  // what the map shows: Maxim's mark if there is one, otherwise the recorded status
  function shownStatus(godId, key) {
    return recStatus(godId, key) === 'none' ? 'none' : (markOf(godId, key) || recStatus(godId, key));
  }
  // clips that still wait for his look: new or questionable, not marked by him yet
  function godTodoCount(godId) {
    let n = 0;
    for (const st of MAP_STYLES) for (const sl of MAP_SLOTS) {
      const k = st + '_' + sl, r = recStatus(godId, k);
      if ((r === 'new' || r === 'look') && !markOf(godId, k)) n++;
    }
    return n;
  }
  function mapGods() {
    return getAllGods().filter(g => g.group === 'existing' && (window.CLIP_STATUS || {})[g.id]);
  }
  function escHtml(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderMapButton() {
    const el = document.getElementById('mapTodoCount');
    if (!el) return;
    let n = 0;
    for (const g of mapGods()) n += godTodoCount(g.id);
    el.textContent = n ? String(n) : '';
    el.title = n ? 'Роликов ждут вашего взгляда: ' + n : '';
  }

  let resetArmedAt = 0;
  function renderStatusMap() {
    resetArmedAt = 0;
    const gods = mapGods();
    const cnt = {}; ST_ORDER.forEach(c => { cnt[c] = 0; });
    let marked = 0;
    for (const g of gods) for (const st of MAP_STYLES) for (const sl of MAP_SLOTS) {
      cnt[shownStatus(g.id, st + '_' + sl)]++;
      if (markOf(g.id, st + '_' + sl)) marked++;
    }
    const noted = notesCount(), mine = marked + noted;
    const f = state.mapFilter;
    document.getElementById('statusLegend').innerHTML =
      ST_ORDER.map(c => `<button class="st-chip${f === c ? ' active' : ''}" data-stf="${c}" type="button" title="Показать только такие"><i class="st-dot st-${c}"></i>${escHtml(ST_RU[c])} <b>${cnt[c]}</b></button>`).join('') +
      `<span class="st-legend-gap"></span>` +
      `<span class="st-mine"><i class="st-dot st-ok st-marked"></i>в белой рамке — ваша отметка (${marked})</span>` +
      `<span class="st-mine"><i class="st-dot st-fine st-noted"></i>с точкой — ваш комментарий (${noted})</span>` +
      `<button class="st-act" id="btnCopyMarks" type="button"${mine ? '' : ' disabled'} title="Скопировать список ваших отметок и комментариев, чтобы вставить его в чат">Скопировать мои отметки</button>` +
      `<button class="st-act st-act-dim" id="btnResetMarks" type="button"${mine ? '' : ' disabled'} title="Стереть все ваши отметки и комментарии в этом браузере">Сбросить отметки и комментарии</button>`;

    const head = `<div class="st-row st-head"><span class="st-god"></span>` +
      MAP_STYLES.map(st => `<span class="st-grp"><em>${MAP_STYLE_RU[st]}</em>${MAP_SLOTS.map(sl => `<span class="st-col">${MAP_SLOT_RU[sl]}</span>`).join('')}</span>`).join('') +
      `</div>`;
    const rows = gods.map((g, idx) => {
      const cells = MAP_STYLES.map(st => `<span class="st-grp">` + MAP_SLOTS.map(sl => {
        const k = st + '_' + sl, c = shownStatus(g.id, k), mk = markOf(g.id, k);
        const dim = f && f !== c ? ' st-dim' : '';
        const nt = noteOf(g.id, k).trim();
        const ntShort = Array.from(nt).length > 200 ? cutText(nt, 200) + '…' : nt;
        const tip = `${g.name} — ${MAP_STYLE_RU[st]}, ${MAP_SLOT_RU[sl]}: ${ST_RU[c]}${mk ? ' (ваша отметка)' : ''}${nt ? ' · Комментарий: ' + ntShort : ''}`;
        return c === 'none'
          ? `<span class="st-cell st-none${dim}" title="${escHtml(tip)}"></span>`
          : `<button class="st-cell st-${c}${mk ? ' st-marked' : ''}${nt ? ' st-noted' : ''}${dim}" data-god="${g.id}" data-slot="${sl}" type="button" title="${escHtml(tip)}"></button>`;
      }).join('') + `</span>`).join('');
      const hide = f && !MAP_STYLES.some(st => MAP_SLOTS.some(sl => shownStatus(g.id, st + '_' + sl) === f));
      return `<div class="st-row${g.id === state.godId ? ' st-cur' : ''}"${hide ? ' hidden' : ''}><span class="st-god"><img src="${g.portrait}" alt=""><span>${idx + 1}. ${escHtml(g.name)}</span></span>${cells}</div>`;
    }).join('');
    // the column captions live outside the scrolling list (one per column), so they never cover a row
    document.getElementById('statusHead').innerHTML = head + head;
    const body = document.getElementById('statusBody');
    body.innerHTML = rows;
    const visible = body.querySelectorAll('.st-row:not([hidden])').length;
    body.style.gridTemplateRows = 'repeat(' + Math.max(1, Math.ceil(visible / 2)) + ', auto)';
  }

  function openStatusMap() {
    renderStatusMap();
    document.getElementById('statusModal').hidden = false;
    const cur = document.querySelector('#statusBody .st-cur');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
  }
  function closeStatusMap() {
    const m = document.getElementById('statusModal');
    if (m) m.hidden = true;
  }

  // the strip under the skill buttons: status of the two clips of the current slot + Maxim's two buttons
  function renderMarkBar(god) {
    const bar = document.getElementById('markBar');
    if (!bar) return;
    if (!god || god.group !== 'existing' || !(window.CLIP_STATUS || {})[god.id]) {
      if (bar._html !== '') { bar.innerHTML = ''; bar._html = ''; }
      bar.hidden = true; return;
    }
    bar.hidden = false;
    const sl = state.activeSlot;
    // a mark always means the take that is «новое», version 1: no marking while yesterday's sheet or a spare take is shown
    const locked = state.ver === 'prev' ? 'Отметки ставятся на «новое» — переключите «Новые арены» с «вчера»'
      : (state.alt[sl] | 0) >= 2 ? 'Отметки ставятся на «Версию 1» — про дубль напишите в чат' : '';
    const html = `<span class="mk-slot">${MAP_SLOT_RU[sl]}</span>` + MAP_STYLES.map(st => {
      const k = st + '_' + sl, r = recStatus(god.id, k), mk = markOf(god.id, k);
      if (r === 'none') return `<span class="mk-item"><span class="mk-style">${MAP_STYLE_RU[st]}</span><i class="st-dot st-none"></i><span class="mk-text">${ST_SHORT.none}</span></span>`;
      const dis = locked ? ` disabled title="${escHtml(locked)}"` : '';
      return `<span class="mk-item"><span class="mk-style">${MAP_STYLE_RU[st]}</span><i class="st-dot st-${r}"></i><span class="mk-text">${ST_SHORT[r]}</span>` +
        `<button class="mk-btn mk-ok${mk === 'ok' ? ' active' : ''}" data-mark="ok" data-key="${k}" type="button"${dis || ' title="Ролик меня устраивает"'}>✓ принять</button>` +
        `<button class="mk-btn mk-redo${mk === 'redo' ? ' active' : ''}" data-mark="redo" data-key="${k}" type="button"${dis || ' title="Ролик нужно переснять"'}>✗ переснять</button>` +
        `<input class="mk-note" type="text" data-note="${k}" maxlength="${NOTE_MAX}" autocomplete="off" spellcheck="false" placeholder="комментарий к ролику: ${MAP_STYLE_RU[st].toLowerCase()}, ${MAP_SLOT_RU[sl]}" aria-label="Комментарий: ${MAP_STYLE_RU[st]}, ${MAP_SLOT_RU[sl]}"></span>`;
    }).join('') + (locked ? `<span class="mk-lock">${escHtml(locked)}</span>` : '');
    // auto-play re-renders this strip every few seconds: keep the same buttons and fields when nothing changed, so a click
    // is never lost and typing is never interrupted (the comment text itself is not part of the signature)
    const sig = god.id + '|' + html;
    if (bar._html !== sig) {
      bar.innerHTML = html; bar._html = sig;
      bar.querySelectorAll('input[data-note]').forEach(inp => {
        inp.value = noteOf(god.id, inp.dataset.note);
        inp.dataset.god = god.id;
        const old = inp.value.trim() && noteIsOld(god.id, inp.dataset.note);
        inp.classList.toggle('mk-note-old', !!old);
        inp.title = old ? 'Комментарий написан к прежней версии этого ролика' : 'Ваш комментарий к этому ролику — попадёт в «Скопировать мои отметки»';
      });
    }
  }

  function updatePillTodo(godId) {
    const pill = document.querySelector('#godRoster button[data-god="' + godId + '"]');
    if (!pill) return;
    const n = godTodoCount(godId);
    let b = pill.querySelector('.pill-todo');
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('b'); b.className = 'pill-todo'; pill.appendChild(b); }
    b.textContent = String(n); b.title = 'Роликов ждут вашего взгляда: ' + n;
  }

  function setMark(godId, key, val) {
    if (state.ver === 'prev' || (state.alt[state.activeSlot] | 0) >= 2) return;
    const id = godId + '_' + key;
    if (markOf(godId, key) === val) delete state.marks[id]; else state.marks[id] = val + '|' + clipStamp(godId, key);
    saveMarks();
    renderMarkBar(currentGod());
    updatePillTodo(godId);   // not renderRoster(): it scrolls the page to the roster
    renderMapButton();
  }

  function marksText() {
    const by = { ok: [], redo: [] };
    for (const g of mapGods()) {
      const parts = { ok: [], redo: [] };
      for (const st of MAP_STYLES) for (const sl of MAP_SLOTS) {
        const mk = markOf(g.id, st + '_' + sl);
        if (mk) parts[mk].push(MAP_STYLE_RU[st].toLowerCase() + ' ' + MAP_SLOT_RU[sl]);
      }
      for (const m of ['ok', 'redo']) if (parts[m].length) by[m].push(g.name + ' — ' + parts[m].join(', '));
    }
    const notes = [];
    for (const g of mapGods()) for (const st of MAP_STYLES) for (const sl of MAP_SLOTS) {
      const k = st + '_' + sl, t = noteOf(g.id, k).trim();
      const ctx = noteCtx(g.id, k);
      if (t) notes.push(g.name + ' — ' + MAP_STYLE_RU[st].toLowerCase() + ' ' + MAP_SLOT_RU[sl] + (ctx ? ' (смотрел: ' + ctx + ')' : '') + (noteIsOld(g.id, k) ? ' (к прежней версии ролика)' : '') + ': ' + t.replace(/\s+/g, ' '));
    }
    return 'Мои отметки по анимациям на сайте.\n' +
      'ПРИНЯТЬ:\n' + (by.ok.length ? by.ok.join('\n') : '—') + '\n' +
      'ПЕРЕСНЯТЬ:\n' + (by.redo.length ? by.redo.join('\n') : '—') + '\n' +
      'КОММЕНТАРИИ:\n' + (notes.length ? notes.join('\n') : '—') + '\n';
  }
  function copyMarks(btn) {
    const text = marksText();
    const done = ok => {
      btn.textContent = ok ? 'Скопировано — вставьте в чат' : 'Выделите текст ниже и скопируйте';
      setTimeout(() => { if (btn.isConnected) btn.textContent = 'Скопировать мои отметки'; }, 2500);
      if (!ok) {   // the browser refused the clipboard: show the text so it can be copied by hand
        const legend = document.getElementById('statusLegend');
        let box = document.getElementById('marksTextBox');
        if (!box && legend) { box = document.createElement('textarea'); box.id = 'marksTextBox'; box.className = 'st-textbox'; box.readOnly = true; legend.appendChild(box); }
        if (box) { box.value = text; box.focus(); box.select(); }
      }
    };
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      ta.remove(); done(ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback);
    else fallback();
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
    if (!url) return null;
    if (state.sheetWarm[url]) return state.sheetWarm[url];
    const im = new Image();
    im.src = url;
    state.sheetWarm[url] = im;
    return im;
  }

  function warmGodAssets(god) {
    if (!god) return;
    for (const tier of ['mob', 'lite']) {
      for (const aKey of ['live_bt', 'new_bt', 'new_ti']) {
        const pack = packOf(god, aKey);   // "вчера" falls back to the current pack when a god has no yesterday sheet
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

  // the pack an arena shows: the left arena (live game) always one version; the proposed arenas follow state.ver
  function altTakes(god, slot) {
    // alternative takes of this slot in both proposed arenas: [{label, n}] where n = 2, 3, … (version 1 = the published one)
    const by = {};
    for (const key of ['new_bt', 'new_ti']) {
      const L = god && god.arenas[key + '_alt'] && god.arenas[key + '_alt'][slot];
      if (L) for (const [n, e] of Object.entries(L)) (by[n] = by[n] || { n: +n, labels: [] }).labels.push((key === 'new_bt' ? 'Битва титанов: ' : 'Titan Idols: ') + e.label);
    }
    return Object.values(by).sort((a, b) => a.n - b.n);
  }

  function packOf(god, key) {
    if (state.ver === 'prev' && key !== 'live_bt' && god.arenas[key + '_prev']) return god.arenas[key + '_prev'];
    const base = god.arenas[key];
    const altL = state.ver === 'now' && key !== 'live_bt' && god.arenas[key + '_alt'];
    if (!altL) return base;
    let pack = null;
    for (const slot of Object.keys(state.alt)) {
      const n = state.alt[slot] | 0, e = n >= 2 && altL[slot] && altL[slot][n];
      if (!e) continue;
      if (!pack) pack = Object.assign({}, base, { sheets: Object.assign({}, base.sheets) });
      pack.sheets[slot] = e.sheet;
    }
    return pack || base;
  }

  function renderAltBar(god) {
    const bar = document.getElementById('altBar');
    if (!bar) return;
    const slot = state.activeSlot, takes = state.ver === 'now' ? altTakes(god, slot) : [];
    if (!takes.length) { bar.hidden = true; bar.innerHTML = ''; return; }
    const cur = state.alt[slot] | 0 || 1;
    bar.hidden = false;
    bar.innerHTML = '<span class="alt-cap">Дубли:</span>' +
      `<button class="alt-btn${cur === 1 ? ' active' : ''}" data-alt="1" type="button" title="Тот, что сейчас на стенде">Версия 1</button>` +
      takes.map(t => `<button class="alt-btn${cur === t.n ? ' active' : ''}" data-alt="${t.n}" type="button" title="${t.labels.join(' · ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}">Версия ${t.n}</button>`).join('');
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

  function playUnitAnim(arenaObj, u, kind, hitAt, wait) {   // wait (r9, new arenas only): the sheet starts that many seconds later
    if (!u || !u.fig || (u.role === 'creature' && !u.hgGod)) return;
    const T = arenaObj.T;
    const tbl = kind === 'sup' ? T.SHEETS_SUP : kind === 'hyp' ? T.SHEETS_HYP : T.SHEETS_ATK;
    const A = T.animOf(tbl, u);
    if (!A) return;

    const im = preloadImg(A.src);
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
    el.style.backgroundImage = `url("${A.src}")`;
    el.style.backgroundSize = `${(A.cols || 1) * 100}% ${(A.rows || 1) * 100}%`;
    el.style.height = `${(A.aH * 100).toFixed(2)}%`;
    el.style.aspectRatio = `${A.w} / ${A.h}`;
    el.style.bottom = `${(A.bA * 100).toFixed(2)}%`;

    const hPx = u.fig.offsetHeight || u.fig.getBoundingClientRect().height || 180;
    el.style.left = `calc(50% + ${(A.xA * hPx).toFixed(2)}px)`;

    const defaultPlay = kind === 'hyp' ? 2.4 : kind === 'sup' ? 2.2 : 1.75;
    const playSec = (hitAt && A.rel) ? Math.min(2.6, Math.max(0.42, hitAt / A.rel)) : (A.play || defaultPlay);
    el._startT = arenaObj.animClock + (wait > 0 ? wait : 0);
    el._dur = playSec;
    el._active = true;
    el._wait = wait > 0;
    u.fig.style.zIndex = kind === 'atk' ? '' : '3';
    setSpriteFrame(el, 0, A.cols || 1, A.rows || 1);

    if (el._wait) {
      // r9: delayed start - the idle figure stays until stepArenaSprites reaches el._startT
      el.style.display = 'none';
      if (u._idleEl) u._idleEl.style.visibility = '';
    } else if (!im || (im.complete && im.naturalWidth > 0)) {
      el.style.display = 'block';
      if (u._idleEl) u._idleEl.style.visibility = 'hidden';
    } else {
      // Keep idle figure visible until action sheet finishes downloading over network (zero blank flash)
      el.style.display = 'none';
      if (u._idleEl) u._idleEl.style.visibility = '';
      im.addEventListener('load', () => {
        if (el._active && !el._wait && el._A === A && arenaObj.animClock < el._startT + el._dur) {
          el.style.display = 'block';
          if (u._idleEl) u._idleEl.style.visibility = 'hidden';
        }
      }, { once: true });
    }
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
        if (ax._wait && ax._active && ax._A && tNow >= ax._startT) {   // r9: a delayed sheet starts now
          ax._wait = false;
          const im2 = preloadImg(ax._A.src);
          if (!im2 || (im2.complete && im2.naturalWidth > 0)) { ax.style.display = 'block'; if (u._idleEl) u._idleEl.style.visibility = 'hidden'; }
          else im2.addEventListener('load', () => { if (ax._active && !ax._wait && arenaObj.animClock < ax._startT + ax._dur) { ax.style.display = 'block'; if (u._idleEl) u._idleEl.style.visibility = 'hidden'; } }, { once: true });
        }
        if (ax.style.display !== 'block' || !ax._A) continue;
        const p = (tNow - ax._startT) / Math.max(0.05, ax._dur);
        if (p >= 1 || !u.alive) {
          ax._active = false;
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

      const T = SIM.buildArenaSheets(cfg.key, simMap, lite, state.ver, state.ver === 'now' ? { godId: state.godId, slots: state.alt } : null);
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
        playAnim: (u, kind, hitAt, wait) => playUnitAnim(arenaObj, u, kind, hitAt, cfg.isProposed ? wait : 0),
        // r9: a new sheet that plays at its floor speed reaches its release frame later than the action's script expects;
        // fx2 asks the stand to hold the script (sim + game effects) of this arena for that long while the sheet plays.
        hold: cfg.isProposed ? (sec => { if (sec > 0) { arenaObj.hold = Math.max(arenaObj.hold || 0, sec); arenaObj.holdTotal = (arenaObj.holdTotal || 0) + sec; } }) : null,
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
      a.hold = 0;
      a.pack = packOf(god, a.key);

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
    if (vidCnt > 0) items.push({ k: 'video', lbl: `🎬 Kling готов (${vidCnt})` });
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
      const dot = g.hasVideoAnim ? `<i class="vid-dot" title="Kling готов (${g.videoSlotsReady}/8)"></i>` : '';
      const todoN = g.group === 'existing' ? godTodoCount(g.id) : 0;
      const todo = todoN ? `<b class="pill-todo" title="Роликов ждут вашего взгляда: ${todoN}">${todoN}</b>` : '';
      return `<button class="${cls}" data-god="${g.id}" type="button"><img src="${g.portrait}" alt=""><span>${idx + 1}. ${g.name}</span>${dot}${todo}</button>`;
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
      `<option value="${g.id}"${g.id === state.godId ? ' selected' : ''}>${idx + 1}. ${g.name} (${g.elementIcon} ${g.roleRu})${g.videoSlotsReady ? ` · Kling ${g.videoSlotsReady}/8` : ''}</option>`
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
        a.tagEl.textContent = `⏳ Kling ещё не сделан · фигура ${sh.w}×${sh.h} px`;
        a.tagEl.classList.add('is-ref');
      } else {
        a.tagEl.textContent = (a.key === 'live_bt' || a.id === 'live_bt' ? `В игре · ${sh.frames} кадров · ${sh.w}×${sh.h} px` : `🎬 ${state.ver === 'prev' && currentGod() && currentGod().hasPrev ? 'ВЧЕРА · ' : ''}${state.ver === 'now' && (state.alt[sl] | 0) >= 2 && currentGod() && currentGod().arenas[(a.key || a.id) + '_alt'] && currentGod().arenas[(a.key || a.id) + '_alt'][sl] && currentGod().arenas[(a.key || a.id) + '_alt'][sl][state.alt[sl]] ? 'ВЕРСИЯ ' + state.alt[sl] + ' · ' : ''}Kling · ${sh.frames} кадров · ${sh.w}×${sh.h} px`);
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
    const shBt = getSheetForSlot(packOf(god, 'new_bt'), sl);
    const shTi = getSheetForSlot(packOf(god, 'new_ti'), sl);
    const ceilTxt = state.tier === 'mob' ? '≤180×220' : '≤126×154';

    // 13.11 Maxim (playbook L1/D9): weight is compared PER ANIMATION - the sheet of this slot against the live sheet the game
    // uses for this slot (own sheet or the repeated one), never the god's total.
    const num = v => String(v).replace('.', ',');
    const body = sh => (sh && sh.fig && sh.h) ? Math.round((sh.fig.foot - sh.fig.top) * sh.h) : null;
    const one = (sh, ref) => {
      if (!sh) return '—';
      const pct = (v, r) => (ref && r) ? ` (${Math.round(100 * v / r)}%)` : '';
      const b = body(sh);
      return `<b>${sh.w}×${sh.h}px</b>` + (b ? ` · тело ${b}px` : '') + ` · ${Math.round(sh.kb || 0)} КБ${pct(sh.kb, ref && ref.kb)} · ${num((sh.ramMb || 0).toFixed(1))} МБ${pct(sh.ramMb, ref && ref.ramMb)}`;
    };
    const liveTxt = god.isNewGod
      ? `В игре: <b>новый бог</b>`
      : `В игре (${sl}): ${one(shLive, null)}`;
    const ref = god.isNewGod ? null : shLive;

    document.getElementById('metricsLine').innerHTML =
      `<span class="el-badge">${god.elementIcon} ${god.name} · ${god.roleRu}</span>` +
      `<span>${liveTxt}</span>` +
      `<span>Новая БТ (${sl}, ${ceilTxt}): ${one(shBt, ref)}</span>` +
      `<span>Titan Idols (${sl}, ${ceilTxt}): ${one(shTi, ref)}</span>` +
      `<span>Kling: <b>${god.videoSlotsReady}/8</b></span>`;
  }

  function renderControlsAndVerdicts(god) {
    document.getElementById('btnAtkLabel').textContent = god.skills.atk.shortName || 'Обычное умение';
    document.getElementById('btnSupLabel').textContent = god.skills.sup.shortName || 'Суперумение';
    document.getElementById('btnHypLabel').textContent = god.skills.hyp.shortName || 'Ульта';

    document.querySelectorAll('.skill-btn[data-slot]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.slot === state.activeSlot);
      // 14.11: a badge on the slot button when this slot has near-miss takes ("версия 2, 3…")
      const nAlt = state.ver === 'now' ? altTakes(god, btn.dataset.slot).length : 0;
      let badge = btn.querySelector('.alt-count');
      if (nAlt && !badge) { badge = document.createElement('span'); badge.className = 'alt-count'; btn.appendChild(badge); }
      if (badge) { badge.hidden = !nAlt; badge.textContent = nAlt ? '+' + nAlt : ''; badge.title = nAlt ? 'Есть дубли: ' + nAlt + ' — выберите умение, кнопки «Версия» появятся ниже' : ''; }
    });
    renderAltBar(god);
    renderMarkBar(god);

    const sk = god.skills[state.activeSlot] || god.skills.idle;
    document.getElementById('fxTitle').textContent = `Блок А — ${sk.title}`;
    const fxBadge = document.getElementById('fxBadge');
    fxBadge.textContent = sk.fxBadge;
    fxBadge.className = 'status-pill ' + (sk.fxUpgraded ? 'upgrade' : 'keep');
    document.getElementById('fxBody').innerHTML =
      `<p>${sk.descRu}</p>` +
      (sk.animRu ? `<div class="fx-verdict-box"><b>Анимация Kling:</b> ${sk.animRu}</div>` : '') +
      (sk.todoRu ? `<div class="fx-verdict-box" style="border-left-color:#e0903a"><b>Что доработать (ваши замечания и проверка свежим взглядом):</b> ${sk.todoRu}</div>` : '') +
      (sk.balRu ? `<div class="fx-verdict-box" style="border-left-color:#6ec8ff"><b>Баланс — предложение (не внедрено, мин. → макс. прокачка):</b> ${sk.balRu}</div>` : '') +
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
        a.hold = 0;
        if (a.focusUnit && a.focusUnit.fig) {
          a.focusUnit.fig.querySelectorAll('.atk').forEach(el => { el._active = false; el.style.display = 'none'; });
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
      a.hold = 0;
      a.holdTotal = 0;
      if (a.fx2) {
        try {
          a.fx2.stop();
          a.fx2.frame(0.001, performance.now());
        } catch (_) {}
      }
      // Interrupt previous focusUnit .atk overlay so repeated clicks always fire crisply
      if (a.focusUnit.fig) {
        a.focusUnit.fig.querySelectorAll('.atk').forEach(el => { el._active = false; el.style.display = 'none'; });
        if (a.focusUnit._idleEl) a.focusUnit._idleEl.style.visibility = '';
      }
      const ev = SIM.triggerSlot(a.B, a.focusUnit, slot);
      handleSimEvents(a, ev);
    }
    // r9: the auto-repeat waits for the held script as well
    state.autoWait += Math.max(0, ...state.arenas.map(a => a.hold || 0));
  }

  function selectGod(godId) {
    const target = getAllGods().find(g => g.id === godId) || getAllGods()[0];
    if (!target) return;
    if (state.godId !== target.id && Object.keys(state.alt).length) { state.alt = {}; buildArenasDom(); }
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

  function bindStatusUi() {
    const need = ['btnStatusMap', 'btnCloseStatus', 'statusBackdrop', 'statusBody', 'statusLegend', 'statusHead', 'markBar'];
    if (need.some(id => !document.getElementById(id))) return;   // a stale cached index.html: the stand must still boot
    document.getElementById('btnStatusMap').addEventListener('click', openStatusMap);
    document.getElementById('btnCloseStatus').addEventListener('click', closeStatusMap);
    document.getElementById('statusBackdrop').addEventListener('click', closeStatusMap);
    document.getElementById('statusBody').addEventListener('click', e => {
      const cell = e.target.closest('button.st-cell[data-god]');
      if (!cell) return;
      const target = getAllGods().find(g => g.id === cell.dataset.god);
      if (!target) return;
      closeStatusMap();
      if (target.group !== state.group) { state.group = target.group; state.elFilter = 'all'; }
      if (!getFilteredGods().some(g => g.id === target.id)) state.elFilter = 'all';   // an element filter would hide the god
      state.activeSlot = cell.dataset.slot;
      selectGod(target.id);
      if (cell.dataset.slot === 'idle') triggerSkill('idle', false);
    });
    document.getElementById('statusLegend').addEventListener('click', e => {
      const chip = e.target.closest('[data-stf]');
      if (chip) { state.mapFilter = state.mapFilter === chip.dataset.stf ? null : chip.dataset.stf; renderStatusMap(); return; }
      const copy = e.target.closest('#btnCopyMarks');
      if (copy) { copyMarks(copy); return; }
      const reset = e.target.closest('#btnResetMarks');
      if (reset) {
        // no browser dialog: the first click arms the button for 4 s, the second one clears
        if (resetArmedAt && Date.now() - resetArmedAt < 4000) {
          state.marks = {}; saveMarks();
          state.notes = {}; saveNotes();
          const mb = document.getElementById('markBar'); if (mb) mb._html = null;   // force the fields to be redrawn empty
          renderStatusMap(); renderMarkBar(currentGod()); renderRoster(); renderMapButton();
        } else {
          resetArmedAt = Date.now(); reset.textContent = 'Стереть отметки и комментарии? Нажмите ещё раз';
          setTimeout(() => { if (reset.isConnected && Date.now() - resetArmedAt >= 3900) { resetArmedAt = 0; reset.textContent = 'Сбросить отметки и комментарии'; } }, 4000);
        }
      }
    });
    document.getElementById('markBar').addEventListener('click', e => {
      const b = e.target.closest('button[data-mark]');
      const god = currentGod();
      if (b && !b.disabled && god) setMark(god.id, b.dataset.key, b.dataset.mark);
    });
    // comments: saved on every keystroke under the god and clip the field was drawn for
    document.getElementById('markBar').addEventListener('input', e => {
      const inp = e.target.closest('input[data-note]');
      if (!inp || !inp.dataset.god) return;
      setNote(inp.dataset.god, inp.dataset.note, inp.value);
      inp.classList.remove('mk-note-old');
      inp.title = 'Ваш комментарий к этому ролику — попадёт в «Скопировать мои отметки»';
    });
    // Enter or Escape leaves the field, so the stand's keys (arrows, 1-4, space) work again
    document.getElementById('markBar').addEventListener('keydown', e => {
      const inp = e.target.closest('input[data-note]');
      if (inp && (e.key === 'Enter' || e.key === 'Escape')) { e.stopPropagation(); inp.blur(); }
    });
    // while he types, the stand must not switch to another skill under the field
    document.getElementById('markBar').addEventListener('focusin', e => {
      if (!e.target.closest('input[data-note]')) return;
      if (state.showcaseMode) { state.showcaseMode = false; const sb = document.getElementById('btnShowcase'); if (sb) sb.classList.remove('active'); }
    });
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

    document.querySelectorAll('.seg-btn[data-ver]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.ver === btn.dataset.ver) return;
        state.ver = btn.dataset.ver;
        document.querySelectorAll('.seg-btn[data-ver]').forEach(b => b.classList.toggle('active', b.dataset.ver === state.ver));
        buildArenasDom();
        const g = currentGod();
        mountGodIntoArenas(g);
        renderMetrics(g);
        renderControlsAndVerdicts(g);
        updateArenaHeadersAndNotes(g, state.activeSlot);
        if (state.activeSlot !== 'idle') triggerSkill(state.activeSlot, false);
      });
    });

    document.getElementById('altBar').addEventListener('click', (ev) => {
      const btn = ev.target.closest('.alt-btn');
      if (!btn) return;
      const n = parseInt(btn.dataset.alt, 10) || 1, slot = state.activeSlot;
      if ((state.alt[slot] | 0 || 1) === n) return;
      if (n === 1) delete state.alt[slot]; else state.alt[slot] = n;
      buildArenasDom();
      const g = currentGod();
      mountGodIntoArenas(g);
      renderMetrics(g);
      updateArenaHeadersAndNotes(g, slot);
      renderControlsAndVerdicts(g);
      if (slot !== 'idle') triggerSkill(slot, false);
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
      const typing = e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT');
      // Escape closes the windows from anywhere but a select / comment field (so also from the copy-by-hand text box)
      if (e.key === 'Escape' && !typing) { closeConceptModal(); closeStatusMap(); return; }
      if (typing || (e.target && e.target.tagName === 'TEXTAREA')) return;
      const sm = document.getElementById('statusModal');
      if (sm && !sm.hidden) return;   // the map is open: no god switching or skills behind it
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

  // r9: while an arena holds its script (see BR.hold) only the sprites advance; returns the part of dt the script may use.
  function scriptDt(a, dt) {
    if (!(a.hold > 0) || !(dt > 0)) return dt;
    const h = Math.min(a.hold, dt);
    a.hold -= h;
    return dt - h;
  }

  function tick(nowMs) {
    const rawDt = Math.min(0.05, Math.max(0, (nowMs - lastFrameMs) / 1000));
    lastFrameMs = nowMs;
    const dt = state.paused ? 0 : rawDt * state.speed;
    const god = currentGod();

    let bestReadout = null;
    for (const a of state.arenas) {
      const hiddenLive = (a.key === 'live_bt' && god && god.isNewGod);
      if (hiddenLive || !a.B) continue;

      const sdt = scriptDt(a, dt);   // r9: dt minus the part spent holding the script (always dt in the live arena)
      if (dt > 0) {
        a.animClock += dt;
        if (sdt > 0) {
          const stepEv = SIM.stepStandBattle(a.B, sdt);
          if (stepEv.length) handleSimEvents(a, stepEv);
        }
      }

      const r = stepArenaSprites(a);
      if (a.key === 'new_bt' && r) bestReadout = r;
      else if (!bestReadout && r) bestReadout = r;

      if (sdt > 0 && a.fx2) {
        try {
          a.fx2.frame(sdt, a.animClock * 1000);
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
  state.marks = loadMarks();
  state.notes = loadNotes();
  buildArenasDom();
  bindUiEvents();
  bindStatusUi();
  const initialHash = (location.hash || '').replace(/^#/, '').trim();
  const startGod = getAllGods().find(g => g.id === initialHash) || getAllGods()[0];
  selectGod(startGod.id);
  renderMapButton();
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
        const sdt = scriptDt(a, dtSec);
        a.animClock += dtSec;
        if (sdt > 0) {
          const ev = SIM.stepStandBattle(a.B, sdt);
          if (ev.length) handleSimEvents(a, ev);
        }
        stepArenaSprites(a);
        if (sdt > 0 && a.fx2) a.fx2.frame(sdt, a.animClock * 1000);
      }
    },
  };
})();
