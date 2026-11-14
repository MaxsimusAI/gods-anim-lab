# survey.py: timing table of every god x slot on the stand (no pictures). python3 survey.py out.json [god,god,...]
# Per arena: D (sheet duration), rel, release time, hold (script delay), hit times (ms after the click), console errors.
import asyncio, sys, json
from playwright.async_api import async_playwright
out = sys.argv[1]; only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
PORT = 8766
HOOK = """() => {
  const D = window.__STAND_DEBUG, S = window.SIM_STAND, st0 = S.stepStandBattle;
  window.__log = [];
  S.stepStandBattle = function (B, dt) { const ev = st0.call(this, B, dt); const A = D.getArenas().find(x => x.B === B);
    for (const e of ev) if (e.type === 'hit' || e.type === 'heal') window.__log.push([A.key, e.type, Math.round((A.animClock - (window.__t0 || 0)) * 1000)]);
    return ev; };
  D.state.paused = true;
}"""
RUN = """async ([g, sl]) => { const D = window.__STAND_DEBUG; if (D.state.godId !== g) { D.selectGod(g); await new Promise(r => setTimeout(r, 350)); }
  window.__log = []; window.__t0 = D.getArenas()[1].animClock; D.triggerSkill(sl);
  const info = D.getArenas().map(a => { const u = a.focusUnit, el = u && u.fig && [...u.fig.querySelectorAll('.atk')].find(x => x._active);
    return { key: a.key, dur: el ? +el._dur.toFixed(3) : null, rel: el && el._A ? el._A.rel : null, impact: el && el._A ? el._A.impact : null, ns: !!(el && el._A && el._A.isNewSheet), prev: !!(el && el._A && el._A.isPrevSheet) }; });
  for (let i = 0; i < 260; i++) D.stepManual(.0125);
  const A = D.getArenas();
  return info.map((x, i) => Object.assign(x, { exp: (() => { try { const k = sl, acts = A[i].fx2.W.acts.filter(q => q.vu && q.vu.gu === A[i].focusUnit && q.F.sheetT && q.F.sheetT[k]); return acts.length ? +acts[acts.length - 1].F.sheetT[k].exp.toFixed(3) : null; } catch (e) { return null; } })(), hold: +((A[i].holdTotal || 0).toFixed(3)), hits: [...new Set(window.__log.filter(l => l[0] === x.key && l[1] === 'hit').map(l => l[2]))].slice(0, 6), heals: [...new Set(window.__log.filter(l => l[0] === x.key && l[1] === 'heal').map(l => l[2]))].slice(0, 3) })); }"""
async def main():
    errs = []; res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1920, 'height': 960})
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html'); await pg.wait_for_timeout(2500)
        gods = await pg.evaluate("() => window.GODS_MANIFEST.gods.map(g => g.id)")
        await pg.evaluate(HOOK)
        for g in gods:
            if only and g not in only: continue
            for sl in ('atk', 'sup', 'hyp'):
                n0 = len(errs)
                try: r = await pg.evaluate(RUN, [g, sl])
                except Exception as e: r = [{'err': str(e)[:200]}]
                res[g + '_' + sl] = {'a': r, 'errs': errs[n0:][:3]}
        await b.close()
    json.dump(res, open(out, 'w'), indent=0)
    print(len(res), 'actions;', sum(1 for v in res.values() if v['errs']), 'with console errors')
asyncio.run(main())
