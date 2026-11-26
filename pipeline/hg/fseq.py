# frames of the fight (and the cells) at given moments: python3 fseq.py out.jpg god t1 t2 ...
import sys, asyncio
from playwright.async_api import async_playwright
from PIL import Image
import io
out, god, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3:]]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 1000}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.goto('http://localhost:8765/higher.html'); await pg.wait_for_timeout(2500)
        el = await pg.query_selector(f'#{god} canvas[data-c=fight]')
        shots = []
        for t in ts:
            await pg.evaluate(f'window.hgSeek({t})'); await pg.wait_for_timeout(250)
            shots.append(Image.open(io.BytesIO(await el.screenshot())))
        await b.close()
        W = sum(s.width for s in shots) + 6 * len(shots); S = Image.new('RGB', (W, shots[0].height), (0, 0, 0)); x = 0
        for s in shots: S.paste(s, (x, 0)); x += s.width + 6
        S.save(out, quality=88); print('errors:', errs)
asyncio.run(main())
