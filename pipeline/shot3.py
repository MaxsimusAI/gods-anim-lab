import asyncio, sys
from playwright.async_api import async_playwright
GODS=sys.argv[1:]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1920,'height':960})
        errs=[]; bad=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        pg.on('console', lambda m: errs.append(m.text[:300]) if m.type=='error' else None)
        pg.on('response', lambda r: bad.append(f'{r.status} {r.url[-60:]}') if r.status>=400 else None)
        for G in GODS:
            await pg.goto('http://localhost:8765/index.html#'+G); await pg.reload(); await pg.wait_for_timeout(3200)
            await pg.screenshot(path=f'/home/claude/kl/sh/{G}_idle.png')
            for sl,ts in [('atk',[420,330,400]),('sup',[640,260,300,400]),('hyp',[640,260,300,400])]:
                await pg.click(f'.skill-btn[data-slot="{sl}"]')
                for i,t in enumerate(ts):
                    await pg.wait_for_timeout(t); await pg.screenshot(path=f'/home/claude/kl/sh/{G}_{sl}_{i}.png')
                await pg.wait_for_timeout(2600)
        print('errors:', errs[:6]); print('bad:', bad[:6])
        await b.close()
asyncio.run(main())
