/* Higher goddesses review page (higher.html): Kling clips next to the live game, and a small fight where the new game
   effect continues the strike from the release frame. Data: assets/hg/hg-data.js (HG). Effects are pure functions of
   time since the release, so every loop and every speed draws exactly the same picture. */
{
'use strict';
const SPEED = { v: 1 }, BG = { v: 'dark' };
const IMG = {};
function img(src) { if (!IMG[src]) { const i = new Image(); i.decoding = 'async'; i.onerror = () => { i.failed = true; }; i.src = src; IMG[src] = i; } return IMG[src]; }
const herPics = G => [...Object.values(G.nu).map(s => s.src), ...(FX[G.fx].pics || []), ...(G.live ? Object.values(G.live).map(s => s.src) : [])];
function dropImg(src) { const i = IMG[src]; if (i) { i.onerror = null; i.removeAttribute('src'); delete IMG[src]; } }   // frees the decoded picture (a phone keeps ~20 goddesses × 3–5 sheets otherwise)
function ready(sh) { const i = img(sh.src); return i.complete && i.naturalWidth > 0; }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const inFlight = (u, f) => u <= 0 || u >= 1 ? -1 : f(u);   // a shaped flight that ends at the target (shot() draws nothing outside 0..1)
function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296; }

/* ---------- sprites ---------- */
function place(sh, ax, footY, figH) {   // where a sheet frame goes so that its figure stands on footY with height figH
  const f = sh.fig, sc = figH / ((f.foot - f.top) * sh.fh);
  return { sc, x0: ax - f.ax * sh.fw * sc, y0: footY - f.foot * sh.fh * sc, w: sh.fw * sc, h: sh.fh * sc };
}
function drawFrame(ctx, sh, i, P, alpha) {
  if (!ready(sh)) {
    if (img(sh.src).failed) { ctx.save(); ctx.fillStyle = '#e8675f'; ctx.font = '600 22px "Golos Text",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('лист не загрузился', P.x0 + P.w / 2, P.y0 + P.h / 2); ctx.restore(); }
    return;
  }
  i = clamp(Math.floor(i), 0, sh.n - 1);
  ctx.save(); if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.drawImage(img(sh.src), (i % sh.cols) * sh.fw, Math.floor(i / sh.cols) * sh.fh, sh.fw, sh.fh, P.x0, P.y0, P.w, P.h);
  ctx.restore();
}
const frameAt = (sh, t) => clamp(Math.floor(t / sh.dur * sh.n), 0, sh.n - 1);
const pt = (P, p) => ({ x: P.x0 + p[0] * P.w, y: P.y0 + p[1] * P.h });

/* ---------- canvases ---------- */
const CELL = { w: 330, h: 370, m: 6 };   // a cell canvas; the goddess is scaled per goddess to fill it (fitCell)
function fitCell(G) {   // the largest figure at which every sheet of this goddess (new and live) fits the cell: no empty band above her
  let L = 0, R = 0, T = 0, B = 0;
  const all = [...Object.values(G.nu), ...(G.live ? Object.values(G.live) : [])];
  for (const sh of all) {
    const f = sh.fig, s1 = 1 / ((f.foot - f.top) * sh.fh), w1 = sh.fw * s1, h1 = sh.fh * s1;
    L = Math.min(L, -f.ax * w1); R = Math.max(R, (1 - f.ax) * w1); T = Math.min(T, -f.foot * h1); B = Math.max(B, (1 - f.foot) * h1);
  }
  const iw = CELL.w - 2 * CELL.m, ih = CELL.h - 2 * CELL.m, figH = Math.min(iw / (R - L), ih / (B - T));
  return { figH, ax: CELL.m - L * figH + (iw - (R - L) * figH) / 2, foot: CELL.h - CELL.m - B * figH };
}
function setup(cv, W, H) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
}
function cellBg(ctx, W, H, foot) {
  if (BG.v === 'gray') { ctx.fillStyle = '#7f7f7f'; ctx.fillRect(0, 0, W, H); return; }
  const g = ctx.createRadialGradient(W / 2, H * 0.72, 10, W / 2, H * 0.6, H * 0.8);
  g.addColorStop(0, '#2b2540'); g.addColorStop(1, '#0d0b14'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(W / 2, foot - 3, W * 0.3, H * 0.025, 0, 0, 7); ctx.fill();
}

/* ---------- effect helpers: soft light and pictures cut from the goddess's own art and clips ---------- */
function glow(ctx, x, y, r, c0, c1, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c0); g.addColorStop(0.35, c1); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
}
function sprite(ctx, src, x, y, h, rot, a, add) {   // a picture centred on x, y, h px tall
  const i = img(src); if (!(i.complete && i.naturalWidth) || a <= 0.01) return;
  const w = h * i.naturalWidth / i.naturalHeight;
  ctx.save(); ctx.globalCompositeOperation = add ? 'lighter' : 'source-over'; ctx.globalAlpha = clamp(a, 0, 1);
  ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.drawImage(i, -w / 2, -h / 2, w, h); ctx.restore();
}
function number(ctx, x, y, txt, col, t) {   // a damage number that rises and fades
  if (t < 0 || t > 1) return;
  ctx.save(); ctx.globalAlpha = 1 - Math.pow(t, 2); ctx.font = '700 15px "Golos Text",system-ui,sans-serif'; ctx.textAlign = 'center';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; const yy = Math.max(14, y - 20 * ease(t)); ctx.strokeText(txt, x, yy); ctx.fillStyle = col; ctx.fillText(txt, x, yy); ctx.restore();
}
function clearArc(S, T, others, dxs, lift) {   // the control point (offsets from the middle) whose arc S→T keeps most room past others
  let best = null;
  for (const dx of dxs) {
    const c = { x: (S.x + T.x) / 2 + dx, y: Math.min(S.y, T.y) - lift }; let m = Infinity;
    for (let k = 0; k <= 32; k++) { const p = bez(S, c, T, k / 32); for (const o of others) m = Math.min(m, Math.hypot(p.x - o.x, p.y - o.y)); }
    if (!best || m > best.m + 4) best = { m, c };   // the first candidate wins unless another gives clearly more room
  }
  return best.c;
}
function bez(a, c, b, t) { const u = 1 - t; return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }; }
/* shared pieces of the 27.11 goddesses: every flying thing is a picture of her own (art or clip), with a trail of the same picture */
function add(ctx, f) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; f(); ctx.restore(); }
function shot(ctx, pic, S, c, T, u, h, o = {}) {   // a picture on the arc S→c→T at u (0..1); o.dir: turn along the path; o.spin: radians over the flight; o.trail: copies behind
  if (u <= 0 || u >= 1) return;
  const at = v => bez(S, c, T, v), dir = v => { const p = at(v), q = at(Math.max(0, v - 0.02)); return Math.atan2(p.y - q.y, p.x - q.x) + Math.PI / 2; };
  const n = o.trail ?? 8, R = rnd(o.seed || 7), turn = v => o.dir ? dir(v) : (o.rot || 0) + (o.spin || 0) * v;   // head and trail turn alike; spin = radians over the whole flight
  for (let s = n; s >= 1; s--) {
    const v = u - s * (o.gap || 0.03); if (v <= 0) continue;
    const p = at(v); sprite(ctx, pic, p.x + (R() - 0.5) * 4, p.y + (R() - 0.5) * 4, h * (1 - s / (n + 3)), turn(v), (1 - s / (n + 1)) * (o.ta ?? 0.35), true);
  }
  const p = at(u);
  if (o.c0) add(ctx, () => glow(ctx, p.x, p.y, h * 0.55, o.c0, o.c1, 0.7));
  sprite(ctx, pic, p.x, p.y, h, turn(u), 1, !!o.addHead);
}
function impact(ctx, T, h, c0, c1, r0 = 16) {   // the soft light where something lands: it ramps in (no flash), grows and fades
  if (h <= 0 || h >= 0.6) return;
  add(ctx, () => glow(ctx, T.x, T.y, r0 + 16 * ease(h / 0.45), c0, c1, clamp(h / 0.09, 0, 1) * clamp(1 - h / 0.55, 0, 1)));
}
function film(ctx, A, a, r, rgb, ring) {   // a lasting film of light round a unit: a shield, a buff, a curse; rgb = 'r,g,b'
  if (a <= 0.01) return;
  const g = ctx.createRadialGradient(A.x, A.y, r * 0.5, A.x, A.y, r);
  g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.82, `rgba(${rgb},${0.3 * a})`); g.addColorStop(1, `rgba(${rgb},${0.5 * a})`);
  ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(A.x, A.y, r, 0, 7); ctx.fill();
  if (ring) { ctx.strokeStyle = `rgba(${ring},${0.5 * a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(A.x, A.y, r, 0, 7); ctx.stroke(); }
  ctx.restore();
}
const life = (k, len, fin = 0.25, fout = 0.4) => k <= 0 || k >= len ? 0 : clamp(k / fin, 0, 1) * clamp((len - k) / fout, 0, 1);
const arcUp = (S, T, lift, dx = 0) => ({ x: (S.x + T.x) / 2 + dx, y: Math.min(S.y, T.y) - lift });
const arcLow = (S, T, drop, k = 0.25) => ({ x: (S.x + T.x) / 2 + (T.x - S.x) * k, y: Math.max(S.y, T.y) + drop });

/* ---------- the game effects, by goddess. t = seconds since the release frame; F.end = when the goddess leaves ---------- */
const FX = {};
FX.order = { // «Закон защиты»: the light of the spear leaves the top of the clip and goes on as two lances to two enemies; her own shield flies to every ally
  dur: 2.2,
  pics: ['assets/hg/new/order-shield.webp', 'assets/hg/new/order-lance.webp'],
  hits(F) { return [1, 3].map((e, k) => ({ who: 'e', i: e, at: F.lag2 + 0.04 + k * 0.09 + 0.32, n: '-2 480', c: '#bfe3ff' })); },
  draw(ctx, F, t) {
    const tip = F.wf, sh = F.wf2, SH = this.pics[0], LA = this.pics[1];
    [1, 3].forEach((e, k) => {   // lances: her own blade in blue flame, cut from the clip, with a trail of the same flame
      const T = F.enemies[e], t0 = F.lag2 + 0.04 + k * 0.09, fl = 0.32, u = (t - t0) / fl, c = clearArc(tip, T, F.enemies.filter((x, j) => j !== e), [k ? 26 : -26, k ? 60 : -60, 0, k ? -40 : 40, k ? 95 : -95], 18);
      if (u > 0 && u < 1) {
        const R = rnd(71 + k), path = v => bez(tip, c, T, v * v * (3 - 2 * v) * 0.35 + v * 0.65);
        for (let s = 16; s >= 1; s--) {
          const v = Math.max(0, u - s * 0.012), p = path(v), q = path(Math.max(0, v - 0.01)), ang = Math.atan2(p.y - q.y, p.x - q.x) + Math.PI / 2;
          sprite(ctx, LA, p.x + (R() - 0.5) * 5, p.y + (R() - 0.5) * 5, 40 - s * 1.6, ang + (R() - 0.5) * 0.3, (1 - s / 17) * 0.28, true);
        }
        const p = path(u), q = path(Math.max(0, u - 0.02)), ang = Math.atan2(p.y - q.y, p.x - q.x) + Math.PI / 2;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, p.x, p.y, 18, 'rgba(170,215,255,.5)', 'rgba(50,120,255,.25)', 0.7); ctx.restore();
        sprite(ctx, LA, p.x, p.y, 46, ang, 1, false);
      }
      const h = t - (t0 + fl);   // the blade sinks into the enemy and its flame burns out on him
      if (h > 0 && h < 0.6) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        glow(ctx, T.x, T.y, 16 + 14 * ease(h / 0.4), 'rgba(170,215,255,.45)', 'rgba(50,120,255,.25)', clamp(h / 0.09, 0, 1) * clamp(1 - h / 0.45, 0, 1));
        ctx.restore();
        sprite(ctx, LA, T.x, T.y - 6 - 10 * ease(h / 0.6), 46 * (1 + 0.3 * ease(h / 0.6)), 0, clamp(1 - h / 0.6, 0, 1) * 0.8, true);
      }
    });
    F.allies.forEach((A, i) => {   // her own shield flies to every ally and stays on him as a film of light
      const t0 = 0.08 + i * 0.05, fl = 0.42, u = (t - t0) / fl, c = { x: (sh.x + A.x) / 2 + (A.x - sh.x) * 0.25, y: Math.max(sh.y, A.y) + 26 };
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (u > 0 && u < 1) {
        const p = bez(sh, c, A, ease(u));
        for (let s = 1; s < 6; s++) { const q = bez(sh, c, A, ease(Math.max(0, u - s * 0.05))); glow(ctx, q.x, q.y, 9, 'rgba(160,210,255,.6)', 'rgba(50,120,255,.3)', 0.5 - s * 0.08); }
        glow(ctx, p.x, p.y, 26, 'rgba(150,205,255,.55)', 'rgba(40,110,255,.3)', 0.9);
        sprite(ctx, SH, p.x, p.y, 36 - 6 * u, (A.x - sh.x) * 0.0015 * (1 - u), 1, false);
      }
      const h = t - (t0 + fl), end = F.end - F.rel;
      if (h > 0 && t < end) {
        const a = clamp(h / 0.2, 0, 1) * clamp((end - t) / 0.4, 0, 1), r = 26 * (0.8 + 0.2 * ease(h / 0.25));
        if (h < 0.45) sprite(ctx, SH, A.x, A.y, 30 * (1 + 0.25 * ease(h / 0.45)), 0, 1 - h / 0.45, false);   // the shield sinks into the film
        const g = ctx.createRadialGradient(A.x, A.y, r * 0.5, A.x, A.y, r);
        g.addColorStop(0, 'rgba(60,140,255,0)'); g.addColorStop(0.82, `rgba(90,170,255,${0.3 * a})`); g.addColorStop(1, `rgba(170,220,255,${0.5 * a})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(A.x, A.y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = `rgba(255,215,130,${0.45 * a})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(A.x, A.y, r, 0, 7); ctx.stroke();
        if (h < 0.5) glow(ctx, A.x, A.y, r + 6, 'rgba(200,235,255,.45)', 'rgba(80,160,255,.22)', 0.55 * (1 - h / 0.5));
      }
      ctx.restore();
    });
  },
};
FX.plague = { // «Печать чумы»: clots of her green fire fly from where her fountain of fire ends to every enemy and burn on each for 4 s
  dur: 5.3,
  pics: ['assets/hg/new/plague-fire.webp'],
  hits(F) {
    const out = [];
    F.enemies.forEach((E, i) => { const at = i * 0.02 + 0.6; out.push({ who: 'e', i, at, n: '-1 860', c: '#c8ff9a' }); for (let k = 1; k <= 4; k++) out.push({ who: 'e', i, at: at + k, n: '-310', c: '#9cff4a', small: 1 }); });
    return out;
  },
  draw(ctx, F, t) {
    const S = F.wf, FI = this.pics[0];
    F.enemies.forEach((E, i) => {
      const t0 = i * 0.02, fl = 0.6, u = (t - t0) / fl, c = { x: (S.x + E.x) / 2 + (E.x - S.x) * 0.25, y: Math.min(S.y, E.y) - 40 };
      if (u > 0 && u < 1) {   // the clot: her fire, a burning head and a continuous trail of the same fire
        const R = rnd(13 + i);
        for (let s = 26; s >= 1; s--) {
          const v = Math.max(0, u - s * 0.011), p = bez(S, c, E, v);
          sprite(ctx, FI, p.x + (R() - 0.5) * 7, p.y + (R() - 0.5) * 7, 34 - s * 0.9, R() * 6.28 + t * 3, (1 - s / 27) * 0.2, true);
        }
        const p = bez(S, c, E, u);
        sprite(ctx, FI, p.x, p.y, 40 * (0.9 + 0.1 * Math.sin(t * 23 + i)), t * 7 + i, 0.75, true);
        sprite(ctx, FI, p.x, p.y, 30, -t * 9 + i * 2, 0.6, true);
      }
      const h = t - (t0 + fl);
      if (h > 0 && h < 4.6) {
        if (h < 0.45) sprite(ctx, FI, E.x, E.y - 2, 34 + 34 * ease(h / 0.45), h * 2, 0.5 * (1 - h / 0.45), true);   // the clot bursts on him (soft, no flash)
        const k = h % 1, pulse = h > 0.95 ? Math.max(0, 1 - k / 0.25) : 0, a = clamp(h / 0.25, 0, 1) * clamp((4.5 - h) / 0.4, 0, 1);
        for (let j = 0; j < 3; j++) {   // her fire keeps burning on him, licking upward, flaring at every tick
          const ph = (h * 1.6 + j / 3) % 1, hh = (32 + 14 * pulse) * (0.7 + 0.5 * ph), y = E.y + 4 - 26 * ph - 4 * pulse;
          sprite(ctx, FI, E.x + (j - 1) * 7 + Math.sin(h * 6 + j) * 2, y, hh, j * 2.1 + h * 1.5, a * (0.6 + 0.3 * pulse) * Math.sin(Math.PI * ph), true);
        }
        if (pulse > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, E.x, E.y - 6, 24, 'rgba(200,255,140,.5)', 'rgba(70,190,30,.25)', pulse * 0.55); ctx.restore(); }
      }
    });
  },
};

FX.fate = { // «Неизбежность»: her own golden arrow leaves the clip where the shot of light does and strikes the most dangerous enemy; golden threads of fate run from him to every enemy and bind each one for 6 s
  dur: 6.9,
  pics: ['assets/hg/new/fate-arrow.webp', 'assets/hg/new/fate-thread.webp'],
  target: 2, fl: 0.36,
  arc(S, T, enemies) {   // the control point of the arrow's arc: the most room past every other enemy on the path really drawn
    const y = Math.min(S.y, T.y) - 120, others = enemies.filter((e, i) => i !== this.target);
    let best = null;
    for (let dx = -120; dx <= 120; dx += 15) {
      const c = { x: S.x + dx, y }, d = Math.atan2(T.y - c.y, T.x - c.x), E0 = { x: T.x - Math.cos(d) * 18, y: T.y - Math.sin(d) * 18 };
      let m = Infinity;
      for (let k = 0; k <= 48; k++) {
        const v = k / 48, p = bez(S, c, E0, v);
        for (const e of others) m = Math.min(m, Math.hypot(p.x - e.x, p.y - e.y));
        if (v < 0.7) m = Math.min(m, Math.hypot(p.x - T.x, p.y - T.y) + 6);   // not through the target itself on the way
      }
      if (!best || m > best.m) best = { m, c };
    }
    return best.c;
  },
  hits(F) { return [{ who: 'e', i: this.target, at: this.fl, n: '-7 900', c: '#ffe2a0' }]; },
  draw(ctx, F, t) {
    const S = F.wf, T = F.enemies[this.target], AR = this.pics[0], TH = this.pics[1], fl = this.fl;
    // the arrow goes on up where the beam left the clip, turns above the row of enemies and falls on its target from above
    const c = this.arc(S, T, F.enemies), din = Math.atan2(T.y - c.y, T.x - c.x), back = 18;
    const E0 = { x: T.x - Math.cos(din) * back, y: T.y - Math.sin(din) * back };   // the flight ends where the stuck arrow stays: head in the target
    const dirAt = v => { const p = bez(S, c, E0, v), q = bez(S, c, E0, Math.max(0, v - 0.02)); return Math.atan2(p.y - q.y, p.x - q.x); };
    const u = t / fl, fade = clamp(1 - (u - 1) * fl / 0.15, 0, 1);
    if (u > 0 && fade > 0) {
      for (let k = 6; k >= 1; k--) {   // the trail: her own golden thread along the path; it fades 0.15 s after the hit
        const v = u - k * 0.05; if (v <= 0 || v >= 1) continue;
        const r = bez(S, c, E0, v);
        sprite(ctx, TH, r.x, r.y, 30, dirAt(Math.max(0.02, v)) + Math.PI / 2, (1 - k / 7) * 0.7 * fade, true);
      }
    }
    if (u > 0 && u < 1) {
      const p = bez(S, c, E0, u);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, p.x, p.y, 18, 'rgba(255,240,190,.5)', 'rgba(255,190,70,.25)', 0.7); ctx.restore();
      sprite(ctx, AR, p.x, p.y, 56, dirAt(u) + Math.PI / 2, 1, false);
    }
    const h = t - fl;
    if (h > 0 && h < 0.7) {   // the arrow sinks into him head first, in a soft gold glow that rises and fades
      const d = dirAt(1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, T.x, T.y, 18 + 18 * ease(h / 0.5), 'rgba(255,235,170,.55)', 'rgba(255,170,50,.3)', clamp(h / 0.09, 0, 1) * clamp(1 - h / 0.6, 0, 1)); ctx.restore();
      sprite(ctx, AR, E0.x, E0.y, 56, d + Math.PI / 2, clamp(1 - h / 0.7, 0, 1), false);
    }
    F.enemies.forEach((E, i) => {   // the thread of fate: it runs from him to every enemy and winds round each one
      const dd = Math.abs(i - this.target), t0 = fl + 0.12 + dd * 0.1, tl = dd ? 0.32 : 0, v = tl ? (t - t0) / tl : -1;
      if (v > 0 && v < 1) {
        const w = ease(v), p = { x: T.x + (E.x - T.x) * w, y: T.y + (E.y - T.y) * w - 16 * Math.sin(Math.PI * v) };
        sprite(ctx, TH, p.x, p.y, 38, Math.atan2(E.y - T.y, E.x - T.x) + Math.PI / 2, 0.9, true);
      }
      const k = t - (t0 + tl), life = 6.0;
      if (k > 0 && k < life) {
        const a = clamp(k / 0.25, 0, 1) * clamp((life - k) / 0.5, 0, 1), R = 23, th = k * 1.3;
        for (let j = 0; j < 2; j++) { const q = th + j * Math.PI; sprite(ctx, TH, E.x + Math.cos(q) * R, E.y + Math.sin(q) * R, 40, q, a * 0.85, true); }
      }
    });
  },
};
FX.life = { // «Дар жизни»: golden petals pour from the opened flower of her spear onto every enemy; the white flower of her palm sends a blossom of healing to every ally
  dur: 2.8, allyHp0: 0.62,
  pics: ['assets/hg/new/life-petal.webp', 'assets/hg/new/life-petal2.webp', 'assets/hg/new/life-bloom.webp'],
  hits(F) {
    const out = [];
    F.enemies.forEach((E, i) => out.push({ who: 'e', i, at: 0.55 + i * 0.05, n: '-2 100', c: '#ffe9a0' }));
    F.allies.forEach((A, i) => out.push({ who: 'a', i, at: F.lag2 + 0.6 + i * 0.05, n: '+3 400', c: '#b9ff9a', heal: 0.38 }));
    return out;
  },
  draw(ctx, F, t) {
    const S = F.wf, P2 = F.wf2 || F.wf, PE = [this.pics[0], this.pics[1]], BL = this.pics[2];
    F.enemies.forEach((E, i) => {   // a stream of her petals to each enemy
      const R = rnd(31 + i), dd = Math.hypot(E.x - S.x, E.y - S.y) || 1, S0 = { x: S.x + (E.x - S.x) / dd * 28, y: S.y + (E.y - S.y) / dd * 28 }, c = { x: (S0.x + E.x) / 2 + (E.x - S0.x) * 0.35, y: Math.min(S0.y, E.y) - 20 };
      for (let k = 0; k < 7; k++) {
        const t0 = i * 0.05 + k * 0.035, fl = 0.5, u = (t - t0) / fl, ox = (R() - 0.5) * 18, oy = (R() - 0.5) * 14, spin = (R() - 0.5) * 12, a0 = (R() - 0.5) * 6.28, pic = PE[k % 2];
        const s0 = 13 + 3 * (k % 3);
        if (u > 0 && u < 1) { const p = bez(S0, c, E, u * u * (3 - 2 * u)); sprite(ctx, pic, p.x + ox * Math.sin(Math.PI * u), p.y + oy * Math.sin(Math.PI * u), s0, spin * u + k, 0.95, false); }
        const h = t - (t0 + fl);   // on landing the petal keeps turning and shrinks smoothly while it scatters
        if (h > 0 && h < 0.6) sprite(ctx, pic, E.x + Math.cos(a0 + k) * 22 * ease(h / 0.6), E.y + Math.sin(a0 + k) * 16 * ease(h / 0.6) + 10 * h, s0 + (12 - s0) * ease(Math.min(1, h / 0.2)), spin * (1 + h) + k, 0.95 * (1 - h / 0.6), false);
      }
      const h = t - (i * 0.05 + 0.5);
      if (h > 0 && h < 0.55) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, E.x, E.y, 16 + 14 * ease(h / 0.4), 'rgba(255,240,170,.5)', 'rgba(210,190,60,.25)', clamp(h / 0.09, 0, 1) * clamp(1 - h / 0.5, 0, 1)); ctx.restore(); }
    });
    F.allies.forEach((A, i) => {   // a blossom of her palm flower drifts down to each ally and opens into green healing light
      const t0 = F.lag2 + i * 0.05, fl = 0.6, u = (t - t0) / fl, c = { x: (P2.x + A.x) / 2, y: Math.max(P2.y, A.y) - 10 };
      if (u > 0 && u < 1) {
        const p = bez(P2, c, A, ease(u));
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, p.x, p.y, 14, 'rgba(220,255,190,.5)', 'rgba(110,210,80,.25)', 0.7); ctx.restore();
        sprite(ctx, BL, p.x, p.y, 16 + 4 * u, Math.sin(u * 6 + i) * 0.3, 1, false);
      }
      const h = t - (t0 + fl);
      if (h > 0 && h < 0.9) {
        sprite(ctx, BL, A.x, A.y - 4 - 10 * ease(h / 0.9), 20 * (1 + 0.5 * ease(h / 0.9)), 0, clamp(1 - h / 0.9, 0, 1), false);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, A.x, A.y, 18 + 12 * ease(h / 0.6), 'rgba(210,255,180,.5)', 'rgba(90,200,70,.28)', clamp(h / 0.1, 0, 1) * clamp(1 - h / 0.8, 0, 1)); ctx.restore();
      }
    });
  },
};

/* ---------- 27.11: the other higher goddesses. Pictures: assets/hg/new/<god>-*.webp, cut from her art or her clip ---------- */
const NEW = n => `assets/hg/new/${n}.webp?v=${typeof HG_V === 'undefined' ? 0 : HG_V}`;   // stamped: a re-cut under the same name reaches the viewers
const dmg = (i, at, n, c, extra) => ({ who: 'e', i, at, n, c, ...extra });
FX.creation = { // «Возведение»: plates of her golden wall fly to every ally and stay on him 8 s; the two orbs of her staff and palm fly at two enemies
  dur: 2.6, pics: [NEW('creation-sphere'), NEW('creation-hex')], tg: [1, 3], fl: 0.42,
  hits(F) { return this.tg.map((e, k) => dmg(e, F.lag2 + k * 0.08 + this.fl, '-2 600', '#ffe7a8')); },
  draw(ctx, F, t) {
    const [SP, HX] = this.pics, W = F.wf, end = F.end - F.rel;
    this.tg.forEach((e, k) => {   // the armillary orbs: one from the staff, one from the open palm
      const S = (k ? F.wf3 : F.wf2) || F.wf, T = F.enemies[e], t0 = F.lag2 + k * 0.08, u = (t - t0) / this.fl, c = clearArc(S, T, F.enemies.filter((x, j) => j !== e), [k ? 40 : -40, 0, k ? 90 : -90], 60);
      shot(ctx, SP, S, c, T, ease(u) * 0.7 + u * 0.3, 34, { spin: 9, trail: 7, c0: 'rgba(255,235,170,.55)', c1: 'rgba(255,180,60,.25)', seed: 3 + k });
      const h = t - t0 - this.fl; impact(ctx, T, h, 'rgba(255,236,170,.55)', 'rgba(255,170,40,.28)');
      if (h > 0 && h < 0.5) sprite(ctx, SP, T.x, T.y - 8 * ease(h / 0.5), 34 * (1 + 0.4 * ease(h / 0.5)), h * 4, 1 - h / 0.5, true);
    });
    F.allies.forEach((A, i) => {   // a plate of her wall to every ally
      const t0 = 0.05 + i * 0.05, fl = 0.45, u = (t - t0) / fl;
      shot(ctx, HX, W, arcLow(W, A, 24), A, ease(u), 30, { trail: 5, rot: (A.x - W.x) * 0.002, c0: 'rgba(255,232,160,.5)', c1: 'rgba(255,190,70,.22)' });
      const h = t - t0 - fl, a = life(h, end - t0 - fl);
      if (h > 0 && h < 0.45) sprite(ctx, HX, A.x, A.y, 30 * (1 + 0.3 * ease(h / 0.45)), 0, 1 - h / 0.45, false);
      film(ctx, A, a, 25, '255,205,90', '255,240,190');
    });
  },
};
FX.oblivion = { // «Безмолвие»: the silver moon of her staff flies to every enemy; small moons circle over each one while he is stunned 3 s
  dur: 4.2, pics: [NEW('oblivion-moon')], fl: 0.5,
  hits(F) { return F.enemies.map((E, i) => dmg(i, this.fl + Math.abs(i - 2) * 0.05, '-1 950', '#e3c9ff')); },
  draw(ctx, F, t) {
    const MO = this.pics[0], S = F.wf;
    F.enemies.forEach((E, i) => {
      const t0 = Math.abs(i - 2) * 0.05, u = (t - t0) / this.fl;
      shot(ctx, MO, S, arcUp(S, E, 50, (E.x - S.x) * 0.2), E, ease(u), 40, { spin: 4, trail: 8, c0: 'rgba(225,200,255,.5)', c1: 'rgba(150,90,255,.25)', seed: 11 + i });
      const h = t - t0 - this.fl; impact(ctx, E, h, 'rgba(225,200,255,.55)', 'rgba(140,80,255,.3)');
      const a = life(h, 3.0);
      if (a > 0) {   // stunned: her moons circle over his head, the violet film of silence holds him
        film(ctx, E, a * 0.8, 24, '170,120,255', '230,210,255');
        for (let j = 0; j < 3; j++) { const q = h * 2.4 + j * 2.09; sprite(ctx, MO, E.x + Math.cos(q) * 19, E.y - 24 + Math.sin(q) * 5, 19, 0, a * 0.95, false); }
      }
    });
  },
};
FX.pride = { // «Непреклонность»: two mirror shards of her scepter strike two enemies; her mirror rises over every ally and leaves him in a golden light until the first ally falls
  dur: 2.6, pics: [NEW('pride-shard'), NEW('pride-mirror')], tg: [0, 4], fl: 0.4,
  hits(F) { return this.tg.map((e, k) => dmg(e, k * 0.07 + this.fl, '-2 900', '#ffe2a0')); },
  draw(ctx, F, t) {
    const [SH, MI] = this.pics, end = F.end - F.rel;
    this.tg.forEach((e, k) => {
      const S = k ? (F.wf2 || F.wf) : F.wf, T = F.enemies[e], t0 = k * 0.07, u = (t - t0) / this.fl, c = clearArc(S, T, F.enemies.filter((x, j) => j !== e), [k ? 50 : -50, 0], 40);
      shot(ctx, SH, S, c, T, inFlight(u, v => v * v * (3 - 2 * v)), 50, { dir: 1, trail: 9, ta: 0.3, c0: 'rgba(255,240,190,.5)', c1: 'rgba(255,190,70,.25)', seed: 5 + k });
      impact(ctx, T, t - t0 - this.fl, 'rgba(255,238,180,.55)', 'rgba(255,180,50,.28)');
    });
    F.allies.forEach((A, i) => {
      const t0 = F.lag2 + 0.1 + i * 0.05, h = t - t0, a = life(h, end - t0);
      if (h > 0 && h < 0.8) sprite(ctx, MI, A.x, A.y - 30 - 10 * ease(h / 0.8), 30, 0, Math.sin(Math.PI * h / 0.8), false);   // her mirror over him
      if (h > 0.3) film(ctx, A, a * clamp((h - 0.3) / 0.3, 0, 1), 24, '255,200,80', '255,235,170');
    });
  },
};
FX.sun = { // «Зенит»: little suns of her spear fall on every enemy; a soft film of her sunlight blinds each one
  dur: 4.4, pics: [NEW('sun-disc')], fl: 0.45,
  hits(F) { return F.enemies.map((E, i) => dmg(i, this.fl + i * 0.04, '-2 050', '#fff0b0')); },
  draw(ctx, F, t) {
    const [DI] = this.pics, S = F.wf;
    F.enemies.forEach((E, i) => {
      const t0 = i * 0.04, u = (t - t0) / this.fl;
      shot(ctx, DI, S, arcUp(S, E, 70, (E.x - S.x) * 0.15), E, ease(u), 38, { trail: 7, c0: 'rgba(255,245,200,.5)', c1: 'rgba(255,200,80,.25)', seed: 21 + i });
      const h = t - t0 - this.fl; impact(ctx, E, h, 'rgba(255,246,200,.55)', 'rgba(255,200,70,.28)');
      const a = life(h - 0.1, 3.4);
      if (a > 0) film(ctx, E, a * 0.85, 22, '255,200,90', '255,240,190');   // blinded: a soft film of her sunlight, no rays (check A3)
    });
  },
};
FX.terra = { // «Твердь»: the two amber crystals of her pillar fall on the two nearest enemies and pin them; a slab of her stone flies to every ally as a shield
  dur: 3.0, pics: [NEW('terra-crystal2'), NEW('terra-slab')], tg: [2, 1], fl: 0.4,
  hits(F) { return this.tg.map((e, k) => dmg(e, k * 0.1 + this.fl, '-2 400', '#ffd27a')); },
  draw(ctx, F, t) {
    const [CR, SL] = this.pics, end = F.end - F.rel;
    this.tg.forEach((e, k) => {
      const S = k ? (F.wf2 || F.wf) : F.wf, T = F.enemies[e], t0 = k * 0.1, u = (t - t0) / this.fl;
      shot(ctx, CR, S, arcUp(S, T, 30, k ? -30 : 30), T, inFlight(u, v => v * v), 44, { dir: 1, trail: 6, c0: 'rgba(255,215,130,.5)', c1: 'rgba(255,150,30,.25)', seed: 31 + k });
      const h = t - t0 - this.fl; impact(ctx, T, h, 'rgba(255,220,140,.55)', 'rgba(255,150,30,.3)');
      const a = life(h, 2.2, 0.08);   // pinned: the crystal stands in him while he is stunned
      if (a > 0) sprite(ctx, CR, T.x, T.y - 12, 36, 0, a, false);
    });
    F.allies.forEach((A, i) => {
      const t0 = 0.15 + i * 0.05, fl = 0.45, S = F.wf3 || F.wf, u = (t - t0) / fl;   // a slab of her stone pillar
      shot(ctx, SL, S, arcLow(S, A, 20), A, ease(u), 40, { trail: 4, rot: 0.2, c0: 'rgba(255,200,120,.4)', c1: 'rgba(200,120,30,.2)' });
      const h = t - t0 - fl, a = life(h, end - t0 - fl);
      if (h > 0 && h < 0.4) sprite(ctx, SL, A.x, A.y, 40 * (1 + 0.3 * ease(h / 0.4)), 0.2, 1 - h / 0.4, false);
      film(ctx, A, a, 25, '220,160,70', '160,210,110');
    });
  },
};
FX.flame = { // «Пожар»: fire of her halberd's arc flies to every enemy and keeps burning on each, flaring on every tick
  dur: 4.0, pics: [NEW('flame-fire')], fl: 0.45,
  hits(F) { const out = []; F.enemies.forEach((E, i) => { const at = this.fl + i * 0.03; out.push(dmg(i, at, '-1 900', '#ffc07a')); for (let k = 1; k <= 3; k++) out.push(dmg(i, at + k, '-280', '#ff9a4a', { small: 1 })); }); return out; },
  draw(ctx, F, t) {
    const FI = this.pics[0], S = F.wf;
    F.enemies.forEach((E, i) => {
      const t0 = i * 0.03, u = (t - t0) / this.fl;
      shot(ctx, FI, S, arcUp(S, E, 40, (E.x - S.x) * 0.25), E, u, 46, { spin: 6, trail: 14, gap: 0.02, ta: 0.3, seed: 41 + i });
      const h = t - t0 - this.fl;
      if (h > 0 && h < 0.4) sprite(ctx, FI, E.x, E.y - 2, 30 + 30 * ease(h / 0.4), h * 3, 0.55 * (1 - h / 0.4), true);
      if (h > 0 && h < 3.4) {   // the burn: her fire licks up on him and flares at every tick
        const k = h % 1, pulse = h > 0.95 ? Math.max(0, 1 - k / 0.25) : 0, a = life(h, 3.4, 0.25, 0.4);
        for (let j = 0; j < 3; j++) { const ph = (h * 1.7 + j / 3) % 1; sprite(ctx, FI, E.x + (j - 1) * 8, E.y + 6 - 26 * ph - 4 * pulse, (44 + 14 * pulse) * (0.7 + 0.5 * ph), j * 2 + h, a * (0.6 + 0.3 * pulse) * Math.sin(Math.PI * ph), true); }
      }
    });
  },
};
FX.war = { // «Зов войны»: three red arcs of her greatsword fly at three enemies; the red light of her blade rises on every ally for 8 s
  dur: 2.4, pics: [NEW('war-arc'), NEW('war-blade')], tg: [0, 2, 4], fl: 0.38,
  hits(F) { return this.tg.map((e, k) => dmg(e, k * 0.06 + this.fl, '-2 300', '#ffb0a0')); },
  draw(ctx, F, t) {
    const [AR, BL] = this.pics, end = F.end - F.rel;
    this.tg.forEach((e, k) => {
      const S = k ? F.wf : (F.wf2 || F.wf), T = F.enemies[e], t0 = k * 0.06, u = (t - t0) / this.fl;   // the two crescents of the clip: the near one goes first
      shot(ctx, AR, S, arcUp(S, T, 20, (T.x - S.x) * 0.3), T, u, 44, { dir: 1, trail: 6, ta: 0.3, c0: 'rgba(255,170,150,.45)', c1: 'rgba(220,30,20,.25)', seed: 51 + k });
      impact(ctx, T, t - t0 - this.fl, 'rgba(255,180,160,.55)', 'rgba(220,30,20,.3)');
    });
    F.allies.forEach((A, i) => {
      const t0 = F.lag2 + 0.2 + i * 0.04, h = t - t0, a = life(h, end - t0);
      if (h > 0 && h < 0.9) sprite(ctx, BL, A.x, A.y + 10 - 30 * ease(h / 0.9), 34, 0, Math.sin(Math.PI * h / 0.9), true);   // her blade's light rises through him
      film(ctx, A, a * clamp(h / 0.5, 0, 1), 24, '230,50,40', '255,170,140');
    });
  },
};
FX.famine = { // «Истощение»: the pale whirl of her shield flies at every enemy; its withered chaff keeps circling round each one, slowing him 6 s
  dur: 6.9, pics: [NEW('famine-swirl'), NEW('famine-chaff')], fl: 0.55,
  hits(F) { return F.enemies.map((E, i) => dmg(i, this.fl + i * 0.04, '-1 800', '#efe0b0')); },
  draw(ctx, F, t) {
    const [SW, CH] = this.pics, S = F.wf;
    F.enemies.forEach((E, i) => {
      const t0 = i * 0.04, u = (t - t0) / this.fl;
      shot(ctx, SW, S, arcUp(S, E, 30, (E.x - S.x) * 0.3), E, ease(u), 34, { spin: -6, trail: 6, ta: 0.25, seed: 61 + i });
      const h = t - t0 - this.fl, a = life(h, 6.0);
      if (h > 0 && h < 0.5) sprite(ctx, SW, E.x, E.y, 34 * (1 + 0.5 * ease(h / 0.5)), -h * 6, 0.8 * (1 - h / 0.5), true);
      if (a > 0) for (let j = 0; j < 3; j++) { const q = -h * 1.3 + j * 2.09; sprite(ctx, CH, E.x + Math.cos(q) * 22, E.y + Math.sin(q) * 10 + 6, 18, q, a * 0.85, true); }   // slowed: her chaff whirls round him
    });
  },
};
FX.eternity = { // «За гранью смерти»: blue star shards of her orb strike every enemy; her orb flies to every ally and closes him in a shell of starlight for 3 s
  dur: 3.8, pics: [NEW('eternity-star'), NEW('eternity-orb')], fl: 0.42,
  hits(F) { return F.enemies.map((E, i) => dmg(i, this.fl + Math.abs(i - 2) * 0.04, '-2 000', '#b9d3ff')); },
  draw(ctx, F, t) {
    const [STR, ORB] = this.pics, S = F.wf;
    F.enemies.forEach((E, i) => {
      const t0 = Math.abs(i - 2) * 0.04, u = (t - t0) / this.fl;
      shot(ctx, STR, S, arcUp(S, E, 40, (E.x - S.x) * 0.2), E, ease(u), 38, { spin: 8, trail: 8, c0: 'rgba(190,215,255,.5)', c1: 'rgba(60,110,255,.25)', seed: 71 + i });
      impact(ctx, E, t - t0 - this.fl, 'rgba(200,220,255,.55)', 'rgba(60,110,255,.3)');
    });
    F.allies.forEach((A, i) => {
      const t0 = 0.1 + i * 0.05, fl = 0.4, u = (t - t0) / fl, S2 = F.wf2 || F.wf;
      shot(ctx, ORB, S2, arcLow(S2, A, 20), A, ease(u), 30, { trail: 5, c0: 'rgba(170,200,255,.5)', c1: 'rgba(50,90,255,.25)' });
      const h = t - t0 - fl, a = life(h, 3.0);
      if (a > 0) { film(ctx, A, a, 26, '90,140,255', '220,230,255'); for (let j = 0; j < 2; j++) { const q = h * 2 + j * Math.PI; sprite(ctx, STR, A.x + Math.cos(q) * 24, A.y + Math.sin(q) * 24, 15, q, a * 0.9, true); } }
    });
  },
};
FX.retribution = { // «Воздаяние»: the arc of red runes from her blade flies at the enemy who hurt the guards most (her scales stay on her chest in the clip; no symbol over the fight, checks 35/45)
  dur: 2.2, pics: [NEW('retribution-arc')], target: 3, fl: 0.36,
  hits() { return [dmg(this.target, this.fl, '-8 400', '#ffb4a8')]; },
  draw(ctx, F, t) {
    const [AR] = this.pics, S = F.wf, T = F.enemies[this.target], u = t / this.fl;
    shot(ctx, AR, S, clearArc(S, T, F.enemies.filter((x, j) => j !== this.target), [40, 0, 90, -40], 30), T, inFlight(u, v => v * v), 72, { dir: 1, trail: 7, ta: 0.3, c0: 'rgba(255,170,160,.5)', c1: 'rgba(220,20,30,.28)' });
    const h = t - this.fl; impact(ctx, T, h, 'rgba(255,180,170,.6)', 'rgba(220,20,30,.32)', 24);
    if (h > 0 && h < 0.5) sprite(ctx, AR, T.x, T.y - 4, 60 * (1 + 0.4 * ease(h / 0.5)), 0.6, 0.8 * (1 - h / 0.5), true);   // the rune arc breaks on him
  },
};
FX.void = { // «Поглощение»: black spheres of her palm sink into every enemy and keep sucking their strength 8 s; a ribbon of starlight guards the most hurt ally from one blow
  dur: 2.6, pics: [NEW('void-sphere'), NEW('void-ribbon')], fl: 0.5, ward: 3, allyHp0: [1, 1, 1, 0.55, 1],
  hits(F) { return F.enemies.map((E, i) => dmg(i, this.fl + i * 0.04, '-1 900', '#d7b8ff')); },
  draw(ctx, F, t) {
    const [SP, RB] = this.pics, S = F.wf, end = F.end - F.rel;
    F.enemies.forEach((E, i) => {
      const t0 = i * 0.04, u = (t - t0) / this.fl;
      shot(ctx, SP, S, arcUp(S, E, 40, (E.x - S.x) * 0.2), E, ease(u), 28, { trail: 6, ta: 0.25, c0: 'rgba(200,150,255,.45)', c1: 'rgba(110,40,200,.25)', seed: 81 + i });
      const h = t - t0 - this.fl; impact(ctx, E, h, 'rgba(210,170,255,.5)', 'rgba(110,40,200,.3)');
      const a = life(h, end - t0 - this.fl);
      if (a > 0) { film(ctx, E, a * 0.7, 23, '120,50,210', '200,160,255'); sprite(ctx, SP, E.x + 16, E.y - 16, 12 + Math.sin(h * 4 + i), 0, a, false); }
    });
    const A = F.allies[this.ward], S2 = F.wf2 || F.wf, fl2 = 0.45, u2 = (t - F.lag2) / fl2;
    shot(ctx, RB, S2, arcLow(S2, A, 24), A, ease(u2), 40, { trail: 5, ta: 0.3, c0: 'rgba(200,160,255,.4)', c1: 'rgba(110,40,200,.2)', seed: 89 });
    const t0 = F.lag2 + fl2, h = t - t0, a = life(h, end - t0);
    if (a > 0) { film(ctx, A, a, 26, '150,90,255', '220,200,255'); sprite(ctx, RB, A.x, A.y, 46, h * 1.5, a * 0.9, true); }
  },
};
FX.chaos = { // «Разлад»: her three slashes (pink, black, white) leave the clip where each one is cut and fly at three random enemies; then her harlequin diamonds fall over every enemy and throw their attacks back
  dur: 3.4, pics: [NEW('chaos-arc1'), NEW('chaos-arc2'), NEW('chaos-arc3'), NEW('chaos-diamond')], tg: [3, 0, 2], fl: 0.32,
  t0(F, k) { return [0, F.lag2, F.lag3][k]; },
  hits(F) { return this.tg.map((e, k) => dmg(e, this.t0(F, k) + this.fl, '-1 700', ['#ffb6e0', '#e6e6e6', '#ffffff'][k])); },
  draw(ctx, F, t) {
    const DI = this.pics[3];
    this.tg.forEach((e, k) => {
      const S = [F.wf, F.wf2 || F.wf, F.wf3 || F.wf][k], T = F.enemies[e], t0 = this.t0(F, k), u = (t - t0) / this.fl;
      shot(ctx, this.pics[k], S, arcUp(S, T, 30, k === 1 ? -60 : 60), T, u, 50, { dir: 1, trail: 6, gap: 0.025, ta: 0.22, seed: 91 + k });
      impact(ctx, T, t - t0 - this.fl, ['rgba(255,170,220,.55)', 'rgba(220,220,220,.4)', 'rgba(255,255,255,.5)'][k], 'rgba(200,40,140,.25)');
    });
    F.enemies.forEach((E, i) => {   // the diamonds fall over each enemy and spin out
      const h = t - F.lag3 - 0.45 - i * 0.04;
      if (h > 0 && h < 1.0) for (let j = 0; j < 3; j++) sprite(ctx, DI, E.x + (j - 1) * 14, E.y - 30 + 34 * ease(h) + j * 3, 18, h * 5 + j, Math.sin(Math.PI * h), false);
    });
  },
};
FX.mercy = { // «Милосердие»: her rose petals fly to every enemy; the heart of her staff flies to every ally, heals him and stays on him as a rose-pink shield
  dur: 2.8, pics: [NEW('mercy-petal'), NEW('mercy-heart')], fl: 0.5, allyHp0: 0.62,
  hits(F) {
    const out = F.enemies.map((E, i) => dmg(i, this.fl + i * 0.05, '-1 600', '#ffc0d8'));
    F.allies.forEach((A, i) => out.push({ who: 'a', i, at: F.lag2 + 0.55 + i * 0.05, n: '+3 100', c: '#b9ff9a', heal: 0.36 }));
    return out;
  },
  draw(ctx, F, t) {
    const [PE, HE] = this.pics, S = F.wf, end = F.end - F.rel;
    F.enemies.forEach((E, i) => {
      const R = rnd(101 + i), c = arcUp(S, E, 20, (E.x - S.x) * 0.3);
      for (let k = 0; k < 6; k++) {
        const t0 = i * 0.05 + k * 0.035, u = (t - t0) / this.fl, ox = (R() - 0.5) * 18, sp = (R() - 0.5) * 10;
        if (u > 0 && u < 1) { const p = bez(S, c, E, u * u * (3 - 2 * u)); sprite(ctx, PE, p.x + ox * Math.sin(Math.PI * u), p.y, 20 + 4 * (k % 3), sp * u + k, 0.95, false); }
      }
      impact(ctx, E, t - i * 0.05 - this.fl, 'rgba(255,200,225,.5)', 'rgba(230,80,150,.25)');
    });
    F.allies.forEach((A, i) => {
      const t0 = F.lag2 + i * 0.05, fl = 0.55, u = (t - t0) / fl, P2 = F.wf2 || F.wf;
      shot(ctx, HE, P2, arcLow(P2, A, 10), A, ease(u), 24, { trail: 5, c0: 'rgba(255,200,225,.5)', c1: 'rgba(240,90,160,.25)' });
      const h = t - t0 - fl, a = life(h, end - t0 - fl);
      if (h > 0 && h < 0.7) { sprite(ctx, HE, A.x, A.y - 6 - 12 * ease(h / 0.7), 24 * (1 + 0.4 * ease(h / 0.7)), 0, 1 - h / 0.7, false); add(ctx, () => glow(ctx, A.x, A.y, 18 + 12 * ease(h / 0.6), 'rgba(210,255,180,.5)', 'rgba(90,200,70,.28)', clamp(h / 0.1, 0, 1) * clamp(1 - h / 0.7, 0, 1))); }
      film(ctx, A, a, 25, '255,120,180', '255,210,230');
    });
  },
};
FX.death = { // «Последняя жатва»: the black-and-gold fire of her flail's skull leaves it and flies at the most wounded enemy (the skull stays on the chain in the clip)
  dur: 2.2, pics: [NEW('death-flame')], target: 3, fl: 0.45, enemyHp0: [1, 1, 1, 0.42, 1],
  hits() { return [dmg(this.target, this.fl, '-9 800', '#f4e0a0')]; },
  draw(ctx, F, t) {
    const [FL] = this.pics, S = F.wf, T = F.enemies[this.target], u = t / this.fl, c = clearArc(S, T, F.enemies.filter((x, j) => j !== this.target), [60, 0, -60, 110], 40);
    shot(ctx, FL, S, c, T, ease(u), 62, { dir: 1, trail: 6, gap: 0.03, ta: 0.3, seed: 111, c0: 'rgba(255,225,150,.5)', c1: 'rgba(200,140,30,.25)' });   // the golden comet of the clip, black smoke behind
    const h = t - this.fl; impact(ctx, T, h, 'rgba(250,235,190,.6)', 'rgba(150,110,30,.32)', 28);
    if (h > 0 && h < 0.7) sprite(ctx, FL, T.x, T.y - 10 - 12 * ease(h / 0.7), 50, -Math.PI / 2, 0.75 * (1 - h / 0.7), true);   // the black-gold fire licks up off him; no skull over the fight (check 45)
  },
};
FX.destruction = { // «Раскол»: the blow of her hammer first breaks every enemy's shield, then the burning stones of the blast hit every enemy
  dur: 2.4, pics: [NEW('destruction-rock')], fl: 0.45,
  hits(F) { return F.enemies.map((E, i) => dmg(i, this.fl + 0.12 + i * 0.03, '-2 200', '#ffc690')); },
  pre(ctx, F, t) {   // the enemies come with shields; each one cracks and falls apart when the blow of the hammer lands
    F.enemies.forEach((E, i) => {
      const k = t - (0.08 + i * 0.03);
      if (k < 0) film(ctx, E, 0.9, 24, '120,190,255', '200,230,255');
      else if (k < 0.35) { ctx.save(); ctx.translate(E.x, E.y); for (let j = 0; j < 6; j++) { const q = j * 1.047 + 0.3, d = 6 + 26 * ease(k / 0.35); ctx.strokeStyle = `rgba(200,230,255,${0.6 * (1 - k / 0.35)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Math.cos(q) * d * 0.4, Math.sin(q) * d * 0.4, 24, q - 0.45, q + 0.45); ctx.stroke(); } ctx.restore(); }
    });
  },
  draw(ctx, F, t) {
    const [RK] = this.pics, S = F.wf;
    F.enemies.forEach((E, i) => {
      const R = rnd(121 + i);
      for (let k = 0; k < 4; k++) {   // burning stones of the blast, each with the orange glow of the cracks
        const t0 = 0.12 + i * 0.03 + k * 0.03, u = (t - t0) / this.fl, c = arcUp(S, E, 20 + R() * 40, (R() - 0.5) * 60), sz = 14 + R() * 10;
        shot(ctx, RK, S, c, E, u, sz, { spin: 5 + k, trail: 4, ta: 0.25, c0: 'rgba(255,190,110,.55)', c1: 'rgba(255,90,10,.3)', seed: 130 + i * 4 + k });
      }
      const h = t - 0.12 - i * 0.03 - this.fl; impact(ctx, E, h, 'rgba(255,200,140,.55)', 'rgba(255,110,20,.3)');
      if (h > 0 && h < 0.5) for (let k = 0; k < 3; k++) { const q = -Math.PI / 2 + (k - 1) * 0.9, d = 26 * ease(h / 0.5); sprite(ctx, RK, E.x + Math.cos(q) * d, E.y + 4 + Math.sin(q) * d * 0.6 + 30 * h * h, 12, h * 8 + k, 1 - h / 0.5, false); }   // the stones break on him and fall apart
    });
  },
};
FX.wrath = { // «Кара пламени»: crescents of her axe's fire sweep at every enemy and burst into flame on each
  dur: 2.4, pics: [NEW('wrath-fire')], fl: 0.4,
  hits(F) { return F.enemies.map((E, i) => dmg(i, this.fl + Math.abs(i - 2) * 0.05, '-2 400', '#ffb070')); },
  draw(ctx, F, t) {
    const FI = this.pics[0], S = F.wf;
    F.enemies.forEach((E, i) => {
      const t0 = Math.abs(i - 2) * 0.05, u = (t - t0) / this.fl;
      shot(ctx, FI, S, arcUp(S, E, 20, (E.x - S.x) * 0.35), E, u, 44, { dir: 1, trail: 7, gap: 0.025, ta: 0.22, c0: 'rgba(255,190,120,.4)', c1: 'rgba(255,70,20,.2)', seed: 141 + i });
      const h = t - t0 - this.fl;
      if (h > 0 && h < 0.6) { sprite(ctx, FI, E.x, E.y - 6 - 10 * ease(h / 0.6), 34 * (1 + 0.4 * ease(h / 0.6)), 0, 0.7 * (1 - h / 0.6), true); impact(ctx, E, h, 'rgba(255,200,140,.55)', 'rgba(255,80,20,.3)'); }
    });
  },
};

/* ---------- fight layout ---------- */
const FW = 360, FH = 560;
function layout() {
  const enemies = [], allies = [];
  for (let i = 0; i < 5; i++) { enemies.push({ x: 44 + i * 68, y: 76 }); allies.push({ x: 44 + i * 68, y: 508 }); }
  return { enemies, allies, ax: 180, foot: 446, figH: 282 };   // the lowest frame edge (Order's entrance) stays above the allies' bars
}
function token(ctx, p, col, hp) {
  ctx.save();
  const g = ctx.createRadialGradient(p.x, p.y - 6, 2, p.x, p.y, 22); g.addColorStop(0, '#3a3450'); g.addColorStop(1, '#16131f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 21, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
  ctx.fillStyle = 'rgba(200,190,220,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y - 6, 6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 11, 7, 0, Math.PI, 0); ctx.fill();
  ctx.restore();
}
function hpBar(ctx, p, col, hp) {
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(p.x - 20, p.y - 32, 40, 5); ctx.fillStyle = col; ctx.fillRect(p.x - 20, p.y - 32, 40 * hp, 5); ctx.restore();
}
function arenaBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, FH); g.addColorStop(0, '#1d1630'); g.addColorStop(0.5, '#2a2142'); g.addColorStop(1, '#151020');
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
  ctx.strokeStyle = 'rgba(216,177,96,.12)'; ctx.lineWidth = 1; for (let y = 160; y < 460; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FW, y); ctx.stroke(); }
}

/* ---------- one goddess: cells + fight ---------- */
function build(G) {
  const sec = document.createElement('section'); sec.className = 'god'; sec.id = G.id;
  const cellsHtml = [
    ...(G.live ? [['live', 'В игре сейчас', '<div class="row"><button class="btn" type="button" data-live="idle" aria-pressed="true">стойка</button><button class="btn" type="button" data-live="atk" aria-pressed="false">удар</button></div>']] : []),
    ['idle', 'Ожидание', '<div class="sub">первый кадр = последний</div>'],
    ['app', 'Появление', (G.nu.app2 ? '<div class="row"><button class="btn" type="button" data-v="app:app" aria-pressed="true">новое</button><button class="btn" type="button" data-v="app:app2" aria-pressed="false">прежнее</button></div>' : '') + '<div class="sub">первого кадра нет, кончается картинкой</div>'],
    ['atk', 'Умение', (G.nu.atk2 ? '<div class="row"><button class="btn" type="button" data-v="atk:atk" aria-pressed="true">вариант 1</button><button class="btn" type="button" data-v="atk:atk2" aria-pressed="false">вариант 2</button></div>' : '') + '<div class="sub">первый кадр = последний</div>'],
  ].map(c => `<div class="cell ${c[0] === 'live' ? 'live' : ''}"><h3>${c[1]}</h3><canvas data-c="${c[0]}" width="${CELL.w}" height="${CELL.h}" aria-label="${G.name}: ${c[1]}"></canvas>${c[2]}</div>`).join('');
  sec.innerHTML = `<div class="ghead"><h2>${G.name}</h2><p><b>${G.skill}.</b> ${G.desc}</p></div>
    <div class="grid"><div>${G.live ? '' : '<p class="nolive">В игре её листов нет — сравнивать не с чем.</p>'}<div class="cells${G.live ? '' : ' three'}">${cellsHtml}</div><div class="notes"><b>Что смотреть</b><ul>${G.notes.map(n => `<li>${n}</li>`).join('')}</ul></div></div>
    <div class="fight"><div class="row"><h3>В бою: появление → умение → эффект игры → уход</h3><button class="btn" type="button" data-again>Ещё раз</button></div>
    <canvas data-c="fight" width="360" height="560" aria-label="${G.name}: бой"></canvas><div class="sub" style="font-size:12.5px;color:var(--mute)">${G.fxNote}</div></div></div>`;
  document.getElementById('gods').appendChild(sec);
  const st = { live: 'idle', atk: 'atk', app: 'app', t0: performance.now() / 1000, simT: 0, fightT0: 0, cellT0: { app: 0, atk: 0 } };
  sec.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => {   // a take switch inside one cell: slot:key
    const [slot, key] = b.dataset.v.split(':'); if (st[slot] === key) return;
    st[slot] = key; st.fightT0 = st.simT; st.cellT0[slot] = st.simT;   // the cell and the fight start the chosen take from its beginning
    sec.querySelectorAll(`[data-v^="${slot}:"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
  sec.querySelectorAll('[data-live]').forEach(b => b.addEventListener('click', () => { st.live = b.dataset.live; st.liveT = st.simT; sec.querySelectorAll('[data-live]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  sec.querySelector('[data-again]').addEventListener('click', () => { st.fightT0 = st.simT; });
  const C = {}; sec.querySelectorAll('canvas').forEach(cv => { C[cv.dataset.c] = { cv, ctx: cv.dataset.c === 'fight' ? setup(cv, FW, FH) : setup(cv, CELL.w, CELL.h) }; });
  st.liveT = 0; st.vis = false; st.loaded = false;   // her sheets load when she first comes into view (20 goddesses on one page)
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { st.vis = es[es.length - 1].isIntersecting; }, { rootMargin: '300px' }).observe(sec); else st.vis = true;
  st.near = true;   // far from the screen (two screens away) her pictures are let go and load again when she comes back
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { st.near = es[es.length - 1].isIntersecting; }, { rootMargin: '2000px 0px' }).observe(sec);
  return { G, C, st, cell: fitCell(G) };
}

function drawCell(ctx, sh, t, mode, cell) {   // mode: loop | once (entrance: holds the last frame) | strike (holds frame 0 between plays)
  cellBg(ctx, CELL.w, CELL.h, cell.foot);
  const P = place(sh, cell.ax, cell.foot, cell.figH);
  let i;
  if (mode === 'loop') i = frameAt(sh, t % sh.dur);
  else if (mode === 'once') { const L = sh.dur + 1.2, u = t % L; i = u < sh.dur ? frameAt(sh, u) : sh.n - 1; }
  else { const L = sh.dur + 1.0, u = (t % L) - 0.5; i = u < 0 || u >= sh.dur ? 0 : frameAt(sh, u); }
  drawFrame(ctx, sh, i, P);
}
function drawLive(V, t) {
  const { G, C, st } = V; if (!C.live) return; const ctx = C.live.ctx, K = V.cell; cellBg(ctx, CELL.w, CELL.h, K.foot);
  if (!G.live) { if (G.still && ready(G.still)) { const s = G.still, P = place(s, K.ax, K.foot, K.figH); drawFrame(ctx, s, 0, P); } return; }
  const sh = G.live[st.live] || G.live.idle, P = place(sh, K.ax, K.foot, K.figH), u = t - st.liveT;
  drawFrame(ctx, sh, sh === G.live.idle ? frameAt(sh, u % sh.dur) : (u % (sh.dur + 0.8) < sh.dur ? frameAt(sh, u % (sh.dur + 0.8)) : 0), P);
}

/* the fight: entrance, short idle, strike with the game effect from the release frame, idle, fade out, again */
function drawFight(V, t) {
  const { G, C } = V, ctx = C.fight.ctx, L = layout(), N = { ...G.nu, atk: G.nu[V.st.atk] || G.nu.atk, app: G.nu[V.st.app] || G.nu.app }, fx = FX[G.fx];
  arenaBg(ctx);
  const I = N.idle.dur, A = N.app.dur, S = A + I, D = N.atk.dur, rel = S + N.atk.rel / N.atk.n * D;
  const end = S + D + I * Math.max(1, Math.ceil((rel + fx.dur - (S + D)) / I)), X = A / 1.5, T = end + X + 0.6;
  const u = t % T, P = place(N.idle, L.ax, L.foot, L.figH), PA = place(N.atk, L.ax, L.foot, L.figH);
  const F = { enemies: L.enemies, allies: L.allies, wf: pt(PA, N.atk.wf), wf2: N.atk.wf2 ? pt(PA, N.atk.wf2) : null, wf3: N.atk.wf3 ? pt(PA, N.atk.wf3) : null, rel, end, lag2: ((N.atk.rel2 ?? N.atk.rel) - N.atk.rel) / N.atk.n * D, lag3: ((N.atk.rel3 ?? N.atk.rel) - N.atk.rel) / N.atk.n * D };
  const hits = fx.hits(F), hp0 = (v, d) => Array.isArray(v) ? [...v] : Array(5).fill(v || d);
  const hp = { e: hp0(fx.enemyHp0, 1), a: hp0(fx.allyHp0, 1) };   // a healer's allies come in hurt, so the heal shows on their bars; Death's target comes in wounded
  hits.forEach(h => { if (u >= rel + h.at) hp[h.who][h.i] += h.heal ? h.heal : -(h.small ? 0.02 : 0.16); });
  L.enemies.forEach((p, i) => token(ctx, p, '#e8675f', clamp(hp.e[i], 0, 1)));
  L.allies.forEach((p, i) => token(ctx, p, '#5cc591', clamp(hp.a[i], 0, 1)));
  if (fx.pre) fx.pre(ctx, F, u - rel);   // what the enemies carry before the blow (Destruction: their shields)
  if (u < A) drawFrame(ctx, N.app, frameAt(N.app, u), place(N.app, L.ax, L.foot, L.figH));
  else if (u >= S && u < S + D) drawFrame(ctx, N.atk, frameAt(N.atk, u - S), place(N.atk, L.ax, L.foot, L.figH));
  else if (u >= end && u < end + X) drawFrame(ctx, N.app, N.app.n - 1 - frameAt(N.app, (u - end) * 1.5), place(N.app, L.ax, L.foot, L.figH));
  else if (u < end) drawFrame(ctx, N.idle, frameAt(N.idle, (u < S ? u - A : u - S - D) % I), P);
  if (u >= rel) fx.draw(ctx, F, u - rel);
  L.enemies.forEach((p, i) => hpBar(ctx, p, '#e8675f', clamp(hp.e[i], 0, 1))); L.allies.forEach((p, i) => hpBar(ctx, p, '#5cc591', clamp(hp.a[i], 0, 1)));
  hits.forEach(h => { const p = (h.who === 'e' ? L.enemies : L.allies)[h.i]; number(ctx, p.x, p.y - 36, h.n, h.c, (u - rel - h.at) / (h.small ? 0.7 : 0.9)); });
}

const VIEWS = HG.map(build);
{ const toc = document.getElementById('toc'); if (toc) toc.innerHTML = HG.map(G => `<a href="#${G.id}"${G.accepted ? ' class="ok" title="принята"' : ''}>${G.name}</a>`).join(''); }
let last = performance.now() / 1000, sim = 0;
function frame() {
  const now = performance.now() / 1000; if (!window.hgHold) sim += Math.min(0.1, now - last) * SPEED.v; last = now;
  for (const V of VIEWS) {
    V.st.simT = sim;
    try {
      if (V.st.loaded && !V.st.near) { herPics(V.G).forEach(dropImg); V.st.loaded = false; V.st.back = true; }
      if (!V.st.vis) continue;
      if (!V.st.loaded) { V.st.loaded = true; herPics(V.G).forEach(img); }
      if (V.st.back) {   // coming back after her pictures were let go: keep the last drawn picture until they are decoded again
        if (!herPics(V.G).every(src => { const i = img(src); return i.failed || (i.complete && i.naturalWidth > 0); })) continue;
        V.st.back = false;
      }
      const N = V.G.nu;
      drawLive(V, sim);
      drawCell(V.C.idle.ctx, N.idle, sim, 'loop', V.cell);
      drawCell(V.C.app.ctx, N[V.st.app] || N.app, sim - V.st.cellT0.app, 'once', V.cell);
      drawCell(V.C.atk.ctx, N[V.st.atk] || N.atk, sim - V.st.cellT0.atk, 'strike', V.cell);
      drawFight(V, sim - V.st.fightT0);
    } catch (e) { if (!V.err) { V.err = 1; console.error(V.G.id, e); } }
  }
  requestAnimationFrame(frame);
}
document.querySelectorAll('[data-spd]').forEach(b => b.addEventListener('click', () => { SPEED.v = +b.dataset.spd; document.querySelectorAll('[data-spd]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
document.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => { BG.v = b.dataset.bg; document.querySelectorAll('[data-bg]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
window.hgSeek = t => { window.hgHold = true; sim = t; };   // review tool: freeze the page at a moment (screenshots of the fight)
requestAnimationFrame(frame);
}
