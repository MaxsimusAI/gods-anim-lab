# one frame of every goddess's fight just after her release + 0.25 s: python3 fall.py out.jpg
import sys, json, asyncio, io
from playwright.async_api import async_playwright
from PIL import Image
R = json.load(open('rel.json'))
G = ['order','plague','fate','life','creation','oblivion','pride','sun','terra','flame','war','famine','eternity','retribution','void','chaos','mercy','death','destruction','wrath']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 1000}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/higher.html'); await pg.wait_for_timeout(2500)
        shots = []
        for g in G:
            el = await pg.query_selector(f'#{g} canvas[data-c=fight]'); await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(1500)
            t = 6 + R[g]['atk']['rel'] / 25 * 3 + 0.25
            await pg.evaluate(f'window.hgSeek({t})'); await pg.wait_for_timeout(250)
            shots.append(Image.open(io.BytesIO(await el.screenshot())))
        await b.close()
        w, h = shots[0].width // 2, shots[0].height // 2; S = Image.new('RGB', (w * 10 + 45, h * 2 + 5), (255, 255, 255))
        for i, s in enumerate(shots): S.paste(s.resize((w, h)), ((i % 10) * (w + 5), (i // 10) * (h + 5)))
        S.save(sys.argv[1], quality=85); print('errors', errs)
asyncio.run(main())
