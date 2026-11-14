# dbg.py <port> <god> <slot> "<js expr evaluated after trigger, gets (D, ev) -> value>" [steps]
import asyncio, sys, json
from playwright.async_api import async_playwright
PORT, G, sl, expr = sys.argv[1:5]; steps = int(sys.argv[5]) if len(sys.argv) > 5 else 0
ver = sys.argv[6] if len(sys.argv) > 6 else 'now'
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-dev-shm-usage']); pg = await b.new_page(viewport={'width': 1920, 'height': 960})
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#' + G); await pg.wait_for_timeout(2500)
        if ver != 'now': await pg.click(f'.seg-btn[data-ver="{ver}"]'); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("""async ([sl, expr, steps]) => { const D = window.__STAND_DEBUG, S = window.SIM_STAND, tr0 = S.triggerSlot; const EV = {};
          D.state.paused = true;
          S.triggerSlot = function (B, u, s) { const ev = tr0.call(this, B, u, s); const A = D.getArenas().find(x => x.B === B); EV[A.key] = ev; return ev; };
          D.triggerSkill(sl); await new Promise(r => setTimeout(r, 600));
          const out = []; const fn = new Function('D', 'EV', 'i', 'return (' + expr + ')');
          out.push(fn(D, EV, -1));
          for (let i = 0; i < steps; i++) { D.stepManual(1 / 60); const v = fn(D, EV, i); if (v !== undefined) out.push(v); }
          return out; }""", [sl, expr, steps])
        await b.close()
    for x in r: print(json.dumps(x, ensure_ascii=False)[:1500])
    if errs: print('ERRS', errs[:5])
asyncio.run(main())
