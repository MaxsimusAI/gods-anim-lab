# ftrace.py <port> job job ... ; job = god:slot[:steps=180[:ver=now]]
# Numbers only: for every arena the sheet frame of the focus god step by step (1/60 s), run-length coded as frame@first_ms, the kind of
# the sheet, the figure's leap offset (transform of the focus figure) and the sim's hits. Shows restarts, jumps back, idle gaps.
import asyncio, sys
from playwright.async_api import async_playwright
PORT = int(sys.argv[1]); jobs = [j.split(':') for j in sys.argv[2:]]
RUN = """async ([sl, steps]) => { const D = window.__STAND_DEBUG, S = window.SIM_STAND, st0 = S.stepStandBattle, tr0 = S.triggerSlot; const log = [];
  D.state.paused = true; let t0 = 0;
  const rec = (B, ev) => { const A = D.getArenas().find(x => x.B === B); if (!A) return; for (const e of ev) if (e.type === 'hit') log.push([A.key, Math.round((A.animClock - t0) * 1000)]); };
  S.stepStandBattle = function (B, dt) { const ev = st0.call(this, B, dt); rec(B, ev); return ev; };
  S.triggerSlot = function (B, u, s) { const ev = tr0.call(this, B, u, s); rec(B, ev); return ev; };
  t0 = D.getArenas()[1].animClock; D.triggerSkill(sl); await new Promise(r => setTimeout(r, 600));
  const tr = {};
  for (let i = 0; i < steps; i++) { D.stepManual(1 / 60);
    for (const a of D.getArenas()) { if (!a.B || !a.focusUnit) continue; const u = a.focusUnit, el = u.fig && [...u.fig.querySelectorAll('.atk')].find(x => x.style.display === 'block');
      const f = el ? Math.min((el._A.frames || 25) - 1, Math.floor((a.animClock - el._startT) / el._dur * (el._A.frames || 25))) : -1;
      const w = u.fig && (u.fig.closest('.figwrap') || u.fig), m = w && /translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px/.exec(w.style.transform || '');
      (tr[a.key] || (tr[a.key] = [])).push([Math.round((a.animClock - t0) * 1000), f, el ? el._kind : '', m ? Math.round(Math.hypot(+m[1], +m[2])) : 0, el ? +el._dur.toFixed(3) : 0]); } }
  return { tr, log }; }"""
async def one(b, job):
    G, sl = job[:2]; steps = int(job[2]) if len(job) > 2 else 180; ver = job[3] if len(job) > 3 else 'now'
    errs = []
    pg = await b.new_page(viewport={'width': 1920, 'height': 960})
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    await pg.goto(f'http://localhost:{PORT}/index.html#' + G); await pg.wait_for_timeout(2500)
    if ver != 'now': await pg.click(f'.seg-btn[data-ver="{ver}"]'); await pg.wait_for_timeout(1500)
    r = await pg.evaluate(RUN, [sl, steps]); await pg.close()
    print('==', G, sl, ver)
    for k, T in r['tr'].items():
        out = []; last = None; durs = []; away = [t for t, f, kd, d, du in T if d > 12]
        for t, f, kd, d, du in T:
            if f != last: out.append(f"{f}@{t}"); last = f
            if du and (not durs or durs[-1] != du): durs.append(du)
        hits = sorted(set(x[1] for x in r['log'] if x[0] == k))
        print(f"  {k:7s} D={durs} hits={hits[:10]} away={str(away[0]) + '-' + str(away[-1]) if away else '-'}")
        print('     ' + ' '.join(out))
    if errs: print('  CONSOLE ERRORS:', errs[:5])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-dev-shm-usage'])
        for j in jobs:
            try: await one(b, j)
            except Exception as e: print('JOB FAILED', j, str(e)[:300])
        await b.close()
asyncio.run(main())
