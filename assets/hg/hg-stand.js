/* Higher goddesses review page (higher.html): Kling clips next to the live game, and a small fight where the new game
   effect continues the strike from the release frame. Data: assets/hg/hg-data.js (HG). Effects are pure functions of
   time since the release, so every loop and every speed draws exactly the same picture. */
{
'use strict';
const SPEED = { v: 1 }, BG = { v: 'dark' };
const IMG = {};
function img(src) { if (!IMG[src]) { const i = new Image(); i.decoding = 'async'; i.onerror = () => { i.failed = true; }; i.src = src; IMG[src] = i; } return IMG[src]; }
function ready(sh) { const i = img(sh.src); return i.complete && i.naturalWidth > 0; }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
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
const CELL = { w: 330, h: 420, ax: 165, foot: 392, figH: 290 };   // a cell: larger figure; wide enough that no sheet (new or live) spills out
function setup(cv, W, H) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
}
function cellBg(ctx, W, H) {
  if (BG.v === 'gray') { ctx.fillStyle = '#7f7f7f'; ctx.fillRect(0, 0, W, H); return; }
  const g = ctx.createRadialGradient(W / 2, H * 0.72, 10, W / 2, H * 0.6, H * 0.8);
  g.addColorStop(0, '#2b2540'); g.addColorStop(1, '#0d0b14'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(W / 2, CELL.foot - 3, W * 0.3, H * 0.025, 0, 0, 7); ctx.fill();
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
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(txt, x, y - 26 * ease(t)); ctx.fillStyle = col; ctx.fillText(txt, x, y - 26 * ease(t)); ctx.restore();
}
function bez(a, c, b, t) { const u = 1 - t; return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }; }

/* ---------- the game effects, by goddess. t = seconds since the release frame; F.end = when the goddess leaves ---------- */
const FX = {};
FX.order = { // «Закон защиты»: the light of the spear leaves the top of the clip and goes on as two lances to two enemies; her own shield flies to every ally
  dur: 2.2,
  pics: ['assets/hg/new/order-shield.webp', 'assets/hg/new/order-lance.webp'],
  hits(F) { return [1, 3].map((e, k) => ({ who: 'e', i: e, at: F.lag2 + 0.04 + k * 0.09 + 0.32, n: '-2 480', c: '#bfe3ff' })); },
  draw(ctx, F, t) {
    const tip = F.wf, sh = F.wf2, SH = this.pics[0], LA = this.pics[1];
    [1, 3].forEach((e, k) => {   // lances: her own blade in blue flame, cut from the clip, with a trail of the same flame
      const T = F.enemies[e], t0 = F.lag2 + 0.04 + k * 0.09, fl = 0.32, u = (t - t0) / fl, c = { x: (tip.x + T.x) / 2 + (k ? 26 : -26), y: Math.min(tip.y, T.y) - 18 };
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
        glow(ctx, T.x, T.y, 16 + 14 * ease(h / 0.4), 'rgba(170,215,255,.45)', 'rgba(50,120,255,.25)', clamp(1 - h / 0.45, 0, 1));
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
    F.enemies.forEach((E, i) => { const at = i * 0.06 + 0.6; out.push({ who: 'e', i, at, n: '-1 860', c: '#c8ff9a' }); for (let k = 1; k <= 4; k++) out.push({ who: 'e', i, at: at + k, n: '-310', c: '#9cff4a', small: 1 }); });
    return out;
  },
  draw(ctx, F, t) {
    const S = F.wf, FI = this.pics[0];
    F.enemies.forEach((E, i) => {
      const t0 = i * 0.06, fl = 0.6, u = (t - t0) / fl, c = { x: (S.x + E.x) / 2 + (E.x - S.x) * 0.25, y: Math.min(S.y, E.y) - 40 };
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
  hits(F) { return [{ who: 'e', i: this.target, at: this.fl, n: '-7 900', c: '#ffe2a0' }]; },
  draw(ctx, F, t) {
    const S = F.wf, T = F.enemies[this.target], AR = this.pics[0], TH = this.pics[1], fl = this.fl;
    // the arrow goes on up where the beam left the clip, turns above the row of enemies and falls on its target from above
    const c = { x: S.x + 5, y: Math.min(S.y, T.y) - 120 }, dirAt = v => { const p = bez(S, c, T, v), q = bez(S, c, T, Math.max(0, v - 0.02)); return Math.atan2(p.y - q.y, p.x - q.x); };
    const u = t / fl;
    if (u > 0 && u < 1) {
      for (let k = 6; k >= 1; k--) {   // the trail: her own golden thread along the path
        const v = Math.max(0, u - k * 0.05), r = bez(S, c, T, v);
        sprite(ctx, TH, r.x, r.y, 30, dirAt(Math.max(0.02, v)) + Math.PI / 2, (1 - k / 7) * 0.7, true);
      }
      const p = bez(S, c, T, u);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, p.x, p.y, 18, 'rgba(255,240,190,.5)', 'rgba(255,190,70,.25)', 0.7); ctx.restore();
      sprite(ctx, AR, p.x, p.y, 56, dirAt(u) + Math.PI / 2, 1, false);
    }
    const h = t - fl;
    if (h > 0 && h < 0.7) {   // the arrow sinks into him head first, in a soft gold glow that rises and fades
      const d = dirAt(1), back = 18;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, T.x, T.y, 18 + 18 * ease(h / 0.5), 'rgba(255,235,170,.55)', 'rgba(255,170,50,.3)', clamp(h / 0.09, 0, 1) * clamp(1 - h / 0.6, 0, 1)); ctx.restore();
      sprite(ctx, AR, T.x - Math.cos(d) * back, T.y - Math.sin(d) * back, 56, d + Math.PI / 2, clamp(1 - h / 0.7, 0, 1), false);
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
      const R = rnd(31 + i), c = { x: (S.x + E.x) / 2 + (E.x - S.x) * 0.2, y: Math.min(S.y, E.y) - 34 };
      for (let k = 0; k < 7; k++) {
        const t0 = i * 0.05 + k * 0.035, fl = 0.5, u = (t - t0) / fl, ox = (R() - 0.5) * 18, oy = (R() - 0.5) * 14, spin = (R() - 0.5) * 12, a0 = (R() - 0.5) * 6.28, pic = PE[k % 2];
        if (u > 0 && u < 1) { const p = bez(S, c, E, ease(u)); sprite(ctx, pic, p.x + ox * Math.sin(Math.PI * u), p.y + oy * Math.sin(Math.PI * u), 13 + 3 * (k % 3), spin * u + k, 0.95, false); }
        const h = t - (t0 + fl);
        if (h > 0 && h < 0.6) sprite(ctx, pic, E.x + Math.cos(a0 + k) * 22 * ease(h / 0.6), E.y + Math.sin(a0 + k) * 16 * ease(h / 0.6) + 10 * h, 12, spin * h, 1 - h / 0.6, false);
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

/* ---------- fight layout ---------- */
const FW = 360, FH = 560;
function layout() {
  const enemies = [], allies = [];
  for (let i = 0; i < 5; i++) { enemies.push({ x: 44 + i * 68, y: 92 }); allies.push({ x: 44 + i * 68, y: 508 }); }
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
    ['live', 'В игре сейчас', G.live ? '<div class="row"><button class="btn" type="button" data-live="idle" aria-pressed="true">стойка</button><button class="btn" type="button" data-live="atk" aria-pressed="false">удар</button></div>' : '<div class="sub">В папке игры её листов нет — сравнивать не с чем.</div>'],
    ['idle', 'Ожидание', '<div class="sub">первый кадр = последний</div>'],
    ['app', 'Появление', '<div class="sub">первого кадра нет, кончается картинкой</div>'],
    ['atk', 'Умение', (G.nu.atk2 ? '<div class="row"><button class="btn" type="button" data-var="atk" aria-pressed="true">вариант 1</button><button class="btn" type="button" data-var="atk2" aria-pressed="false">вариант 2</button></div>' : '') + '<div class="sub">первый кадр = последний</div>'],
  ].map(c => `<div class="cell ${c[0] === 'live' ? 'live' : ''}"><h3>${c[1]}</h3><canvas data-c="${c[0]}" width="${CELL.w}" height="${CELL.h}" aria-label="${G.name}: ${c[1]}"></canvas>${c[2]}</div>`).join('');
  sec.innerHTML = `<div class="ghead"><h2>${G.name}</h2><p><b>${G.skill}.</b> ${G.desc}</p></div>
    <div class="grid"><div><div class="cells">${cellsHtml}</div><div class="notes"><b>Что смотреть</b><ul>${G.notes.map(n => `<li>${n}</li>`).join('')}</ul></div></div>
    <div class="fight"><div class="row"><h3>В бою: появление → умение → эффект игры → уход</h3><button class="btn" type="button" data-again>Ещё раз</button></div>
    <canvas data-c="fight" width="360" height="560" aria-label="${G.name}: бой"></canvas><div class="sub" style="font-size:12.5px;color:var(--mute)">${G.fxNote}</div></div></div>`;
  document.getElementById('gods').appendChild(sec);
  const st = { live: 'idle', atk: 'atk', t0: performance.now() / 1000, simT: 0, fightT0: 0 };
  sec.querySelectorAll('[data-var]').forEach(b => b.addEventListener('click', () => { st.atk = b.dataset.var; st.fightT0 = st.simT; sec.querySelectorAll('[data-var]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  sec.querySelectorAll('[data-live]').forEach(b => b.addEventListener('click', () => { st.live = b.dataset.live; st.liveT = st.simT; sec.querySelectorAll('[data-live]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  sec.querySelector('[data-again]').addEventListener('click', () => { st.fightT0 = st.simT; });
  const C = {}; sec.querySelectorAll('canvas').forEach(cv => { C[cv.dataset.c] = { cv, ctx: cv.dataset.c === 'fight' ? setup(cv, FW, FH) : setup(cv, CELL.w, CELL.h) }; });
  Object.values(G.nu).forEach(s => img(s.src)); (FX[G.fx].pics || []).forEach(img); if (G.live) Object.values(G.live).forEach(s => img(s.src)); if (G.still) img(G.still.src);
  st.liveT = 0; st.vis = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { st.vis = es[es.length - 1].isIntersecting; }, { rootMargin: '200px' }).observe(sec);
  return { G, C, st };
}

function drawCell(ctx, sh, t, mode) {   // mode: loop | once (entrance: holds the last frame) | strike (holds frame 0 between plays)
  cellBg(ctx, CELL.w, CELL.h);
  const P = place(sh, CELL.ax, CELL.foot, CELL.figH);
  let i;
  if (mode === 'loop') i = frameAt(sh, t % sh.dur);
  else if (mode === 'once') { const L = sh.dur + 1.2, u = t % L; i = u < sh.dur ? frameAt(sh, u) : sh.n - 1; }
  else { const L = sh.dur + 1.0, u = (t % L) - 0.5; i = u < 0 || u >= sh.dur ? 0 : frameAt(sh, u); }
  drawFrame(ctx, sh, i, P);
}
function drawLive(V, t) {
  const { G, C, st } = V, ctx = C.live.ctx; cellBg(ctx, CELL.w, CELL.h);
  if (!G.live) { if (G.still && ready(G.still)) { const s = G.still, P = place(s, CELL.ax, CELL.foot, CELL.figH); drawFrame(ctx, s, 0, P); } return; }
  const sh = G.live[st.live] || G.live.idle, P = place(sh, CELL.ax, CELL.foot, CELL.figH), u = t - st.liveT;
  drawFrame(ctx, sh, sh === G.live.idle ? frameAt(sh, u % sh.dur) : (u % (sh.dur + 0.8) < sh.dur ? frameAt(sh, u % (sh.dur + 0.8)) : 0), P);
}

/* the fight: entrance, short idle, strike with the game effect from the release frame, idle, fade out, again */
function drawFight(V, t) {
  const { G, C } = V, ctx = C.fight.ctx, L = layout(), N = { ...G.nu, atk: G.nu[V.st.atk] || G.nu.atk }, fx = FX[G.fx];
  arenaBg(ctx);
  const I = N.idle.dur, A = N.app.dur, S = A + I, D = N.atk.dur, rel = S + N.atk.rel / N.atk.n * D;
  const end = S + D + I * Math.max(1, Math.ceil((rel + fx.dur - (S + D)) / I)), X = A / 1.5, T = end + X + 0.6;
  const u = t % T, P = place(N.idle, L.ax, L.foot, L.figH), PA = place(N.atk, L.ax, L.foot, L.figH);
  const F = { enemies: L.enemies, allies: L.allies, wf: pt(PA, N.atk.wf), wf2: N.atk.wf2 ? pt(PA, N.atk.wf2) : null, rel, end, lag2: ((N.atk.rel2 ?? N.atk.rel) - N.atk.rel) / N.atk.n * D };
  const hits = fx.hits(F), hp = { e: [1, 1, 1, 1, 1], a: Array(5).fill(fx.allyHp0 || 1) };   // a healer's allies come in hurt, so the heal shows on their bars
  hits.forEach(h => { if (u >= rel + h.at) hp[h.who][h.i] += h.heal ? h.heal : -(h.small ? 0.02 : 0.16); });
  L.enemies.forEach((p, i) => token(ctx, p, '#e8675f', clamp(hp.e[i], 0, 1)));
  L.allies.forEach((p, i) => token(ctx, p, '#5cc591', clamp(hp.a[i], 0, 1)));
  if (u < A) drawFrame(ctx, N.app, frameAt(N.app, u), place(N.app, L.ax, L.foot, L.figH));
  else if (u >= S && u < S + D) drawFrame(ctx, N.atk, frameAt(N.atk, u - S), place(N.atk, L.ax, L.foot, L.figH));
  else if (u >= end && u < end + X) drawFrame(ctx, N.app, N.app.n - 1 - frameAt(N.app, (u - end) * 1.5), place(N.app, L.ax, L.foot, L.figH));
  else if (u < end) drawFrame(ctx, N.idle, frameAt(N.idle, (u < S ? u - A : u - S - D) % I), P);
  if (u >= rel) fx.draw(ctx, F, u - rel);
  L.enemies.forEach((p, i) => hpBar(ctx, p, '#e8675f', clamp(hp.e[i], 0, 1))); L.allies.forEach((p, i) => hpBar(ctx, p, '#5cc591', clamp(hp.a[i], 0, 1)));
  hits.forEach(h => { const p = (h.who === 'e' ? L.enemies : L.allies)[h.i]; number(ctx, p.x, p.y - 40, h.n, h.c, (u - rel - h.at) / (h.small ? 0.7 : 0.9)); });
}

const VIEWS = HG.map(build);
let last = performance.now() / 1000, sim = 0;
function frame() {
  const now = performance.now() / 1000; if (!window.hgHold) sim += Math.min(0.1, now - last) * SPEED.v; last = now;
  for (const V of VIEWS) {
    V.st.simT = sim; if (!V.st.vis) continue; const N = V.G.nu;
    try {
      drawLive(V, sim);
      drawCell(V.C.idle.ctx, N.idle, sim, 'loop');
      drawCell(V.C.app.ctx, N.app, sim, 'once');
      drawCell(V.C.atk.ctx, N[V.st.atk] || N.atk, sim, 'strike');
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
