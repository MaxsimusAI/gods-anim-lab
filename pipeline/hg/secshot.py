# screenshot of whole goddess sections: python3 secshot.py out.jpg t god...
import sys, asyncio, io
from playwright.async_api import async_playwright
from PIL import Image
out, t, gods = sys.argv[1], float(sys.argv[2]), sys.argv[3:]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 1000}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/higher.html'); await pg.wait_for_timeout(2500)
        shots = []
        for g in gods:
            el = await pg.query_selector(f'section#{g}')
            await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(2000)
            await pg.evaluate(f'window.hgSeek({t})'); await pg.wait_for_timeout(300)
            im = Image.open(io.BytesIO(await el.screenshot())); im.thumbnail((1280, 700)); shots.append(im)
        await b.close()
        H = sum(s.height for s in shots) + 6 * len(shots); S = Image.new('RGB', (max(s.width for s in shots), H)); y = 0
        for s in shots: S.paste(s, (0, y)); y += s.height + 6
        S.save(out, quality=85); print('errors:', errs)
asyncio.run(main())
