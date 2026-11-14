# arr.py <port> job job ... ; job = god:slot[:steps=150[:ver=now[:minDur_ms=0]]]
# Numbers only (no pictures): for the new arenas prints, in ms after the click (arena clock, holds included):
#   sheet D / release / hold, every F.slashWave and F.obj started by the action (start -> start + duration), the sim's hits per target.
# Used to prove "the projectile arrives before the damage" (r9Link) and the order of a script.
import asyncio, sys, json
from playwright.async_api import async_playwright
PORT = int(sys.argv[1]); jobs = [j.split(':') for j in sys.argv[2:]]
HOOK = """() => {
  const D = window.__STAND_DEBUG, S = window.SIM_STAND, st0 = S.stepStandBattle, tr0 = S.triggerSlot;
  window.__log = []; window.__cur = '';
  const ms = A => Math.round((A.animClock - (window.__t0 || 0)) * 1000);
  const rec = (B, ev) => { const A = D.getArenas().find(x => x.B === B); if (!A) return;
    for (const e of ev) if (e.type === 'hit' || e.type === 'heal') window.__log.push([A.key, e.type, ms(A), (e.u && (e.u.hid || e.u.id || e.u.name)) || '', e.src || '', Math.round(e.dmg || e.amount || 0)]); };
  S.stepStandBattle = function (B, dt) { const ev = st0.call(this, B, dt); rec(B, ev); return ev; };
  S.triggerSlot = function (B, u, sl) { const ev = tr0.call(this, B, u, sl); rec(B, ev); return ev; };
  for (const A of D.getArenas()) { if (!A.fx2) continue; const f0 = A.fx2.frame, e0 = A.fx2.ev;
    A.fx2.frame = function (...a) { window.__cur = A; try { return f0.apply(this, a); } finally { window.__cur = ''; } };
    A.fx2.ev = function (...a) { window.__cur = A; try { return e0.apply(this, a); } finally { window.__cur = ''; } }; }
  D.state.paused = true;
}"""
PATCH = """() => { const D = window.__STAND_DEBUG; let n = 0; const seen = new Set();
  for (const A of D.getArenas()) for (const act of (A.fx2 && A.fx2.W ? A.fx2.W.acts : [])) { let p = Object.getPrototypeOf(act.F);
    while (p && p !== Object.prototype) { if (!seen.has(p)) { seen.add(p);
      for (const m of ['slashWave', 'obj']) if (Object.prototype.hasOwnProperty.call(p, m) && !p[m].__w) { const f0 = p[m];
        p[m] = function (...a) { const A = window.__cur; if (A && A.focusUnit && this.u && this.u.gu === A.focusUnit) window.__log.push([A.key, m, Math.round((A.animClock - (window.__t0 || 0)) * 1000), Math.round((m === 'obj' ? a[0] : a[2]) * 1000)]); return f0.apply(this, a); };
        p[m].__w = true; n++; } }
      p = Object.getPrototypeOf(p); } }
  return n; }"""
INFO = """() => { const D = window.__STAND_DEBUG; return D.getArenas().map(a => { const u = a.focusUnit, el = u && u.fig && [...u.fig.querySelectorAll('.atk')].find(x => x._active);
  return { key: a.key, dur: el ? +el._dur.toFixed(3) : null, st: el ? Math.round((el._startT - window.__t0) * 1000) : null, rel: el && el._A ? el._A.rel : null, hold: Math.round((a.holdTotal || 0) * 1000) }; }); }"""
async def one(b, job):
    G, sl = job[:2]; steps = int(job[2]) if len(job) > 2 else 150; ver = job[3] if len(job) > 3 else 'now'; mind = int(job[4]) if len(job) > 4 else 0
    errs = []
    pg = await b.new_page(viewport={'width': 1920, 'height': 960})
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    await pg.goto(f'http://localhost:{PORT}/index.html#' + G); await pg.wait_for_timeout(2500)
    if ver != 'now': await pg.click(f'.seg-btn[data-ver="{ver}"]'); await pg.wait_for_timeout(1500)
    await pg.evaluate(HOOK)
    await pg.evaluate("sl => window.__STAND_DEBUG.triggerSkill(sl)", sl); await pg.wait_for_timeout(700)
    await pg.evaluate("() => { for (let i = 0; i < 30; i++) window.__STAND_DEBUG.stepManual(1 / 60); }")
    n = await pg.evaluate(PATCH)
    await pg.evaluate("() => { const D = window.__STAND_DEBUG; D.triggerSkill('idle'); for (let i = 0; i < 240; i++) D.stepManual(1 / 60); }")
    await pg.evaluate("sl => { const D = window.__STAND_DEBUG; window.__log = []; window.__t0 = D.getArenas()[1].animClock; D.triggerSkill(sl); }", sl)
    await pg.wait_for_timeout(500)
    info = await pg.evaluate(INFO)
    await pg.evaluate("n => { for (let i = 0; i < n; i++) window.__STAND_DEBUG.stepManual(1 / 60); }", steps)
    log = await pg.evaluate("() => window.__log")
    await pg.close()
    print('==', G, sl, ver, 'patched', n)
    for A in info:
        if A['key'] == 'live_bt': continue
        k = A['key']; rel_t = round(A['st'] + A['dur'] * A['rel'] * 1000) if A['dur'] and A['rel'] is not None else None
        hits = [(x[2], x[3], x[4]) for x in log if x[0] == k and x[1] == 'hit']
        waves = [f"{x[2]}->{x[2] + x[3]}" for x in log if x[0] == k and x[1] == 'slashWave']
        objs = [f"{x[2]}->{x[2] + x[3]}" for x in log if x[0] == k and x[1] == 'obj' and x[3] >= mind]
        print(f"  {k:7s} D={A['dur']} start@{A['st']} release@{rel_t} hold={A['hold']}")
        print(f"     hits: {' '.join(f'{t}:{u}' + (':' + s if s else '') for t, u, s in hits[:14])}")
        if waves: print(f"     waves: {' '.join(waves[:14])}")
        if objs: print(f"     objs: {' '.join(objs[:24])}")
    if errs: print('  CONSOLE ERRORS:', errs[:5])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-dev-shm-usage'])
        for j in jobs:
            try: await one(b, j)
            except Exception as e: print('JOB FAILED', j, str(e)[:300])
        await b.close()
asyncio.run(main())
