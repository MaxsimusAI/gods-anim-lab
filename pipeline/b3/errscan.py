# errscan.py: load the stand for each god, press every skill once, report page errors / console errors. Server on :8765.
import asyncio, sys
from playwright.async_api import async_playwright
gods=sys.argv[1:]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1920,'height':960}); E=[]
        pg.on('pageerror', lambda e: E.append(('pageerror',str(e)[:200])))
        pg.on('console', lambda m: m.type=='error' and E.append(('console',m.text[:200])))
        for G in gods:
            await pg.goto('http://localhost:8765/index.html#'+G); await pg.reload(); await pg.wait_for_timeout(2500)
            for sl in ('atk','sup','hyp'):
                try: await pg.click(f'.skill-btn[data-slot="{sl}"]', timeout=3000); await pg.wait_for_timeout(2600)
                except Exception as ex: E.append((G+' '+sl,'no button'))
            print(G, len(E)); 
        await b.close(); print(E[:20])
asyncio.run(main())
