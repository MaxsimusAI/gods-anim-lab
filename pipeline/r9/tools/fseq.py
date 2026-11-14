# fseq.py: deterministic frame series of one action on the stand (paused page + __STAND_DEBUG.stepManual).
# python3 fseq.py out.jpg <god> <slot> [n=12] [step_ms=90] [start_ms=0] [rows=MR] [scale=0.5] [crop=wide|col] [ver=now]
#   rows: any of L (live arena), M (new BT), R (new TI). Labels: game ms after the click + sheet frame index of the focus god.
#   Prints per arena: sheet duration D, release time, hold (script delay), first hit time, console errors.
# Server: cd /home/claude/fxwork && python3 -m http.server 8766
import asyncio, sys, io, json
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
a = sys.argv
out, G, sl = a[1:4]
n = int(a[4]) if len(a) > 4 else 12
step = int(a[5]) if len(a) > 5 else 90
start = int(a[6]) if len(a) > 6 else 0
rows = a[7] if len(a) > 7 else 'MR'
S = float(a[8]) if len(a) > 8 else 0.5
crop = a[9] if len(a) > 9 else 'wide'
ver = a[10] if len(a) > 10 else 'now'
PORT = 8766
HOOK = """() => {
  const D = window.__STAND_DEBUG, S = window.SIM_STAND, st0 = S.stepStandBattle;
  window.__log = [];
  S.stepStandBattle = function (B, dt) { const ev = st0.call(this, B, dt); const A = D.getArenas().find(x => x.B === B);
    for (const e of ev) if (e.type === 'hit' || e.type === 'heal' || e.type === 'superHit' || e.type === 'hyperHit') window.__log.push([A.key, e.type, Math.round((A.animClock - (window.__t0 || 0)) * 1000), e.src || '']);
    return ev; };
  D.state.paused = true;
}"""
INFO = """() => { const D = window.__STAND_DEBUG; return D.getArenas().map(a => { const u = a.focusUnit, el = u && u.fig && [...u.fig.querySelectorAll('.atk')].find(x => x.style.display === 'block' || x._active);
  const r = a.card.querySelector('.arena-stage').getBoundingClientRect();
  return { key: a.key, x: r.left, y: r.top, w: r.width, h: r.height, dur: el ? +el._dur.toFixed(3) : null, rel: el && el._A ? el._A.rel : null, impact: el && el._A ? el._A.impact : null, hold: +(a.holdTotal || 0).toFixed(3), newSheet: !!(el && el._A && el._A.isNewSheet), prev: !!(el && el._A && el._A.isPrevSheet) }; }); }"""
FRAME = """() => { const D = window.__STAND_DEBUG; return D.getArenas().map(a => { const u = a.focusUnit, el = u && u.fig && [...u.fig.querySelectorAll('.atk')].find(x => x.style.display === 'block');
  return el ? Math.min((el._A.frames || 25) - 1, Math.floor((a.animClock - el._startT) / el._dur * (el._A.frames || 25))) : -1; }); }"""
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1920, 'height': 960})
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(f'http://localhost:{PORT}/index.html#' + G); await pg.wait_for_timeout(2500)
        if ver != 'now': await pg.click(f'.seg-btn[data-ver="{ver}"]'); await pg.wait_for_timeout(1500)
        await pg.evaluate(HOOK)
        await pg.evaluate("sl => { const D = window.__STAND_DEBUG; window.__t0 = D.getArenas()[1].animClock; D.triggerSkill(sl); }", sl)
        await pg.wait_for_timeout(700)   # let the action sheets decode
        info = await pg.evaluate(INFO); shots = []
        if start: await pg.evaluate("ms => { for (let i = 0; i < ms; i += 15) window.__STAND_DEBUG.stepManual(Math.min(15, ms - i) / 1000); }", start)
        t = start
        for i in range(n):
            await pg.evaluate("ms => { for (let i = 0; i < ms; i += 15) window.__STAND_DEBUG.stepManual(Math.min(15, ms - i) / 1000); }", step); t += step
            fr = await pg.evaluate(FRAME)
            buf = await pg.screenshot(type='jpeg', quality=82)
            shots.append((t, fr, buf))
        log = await pg.evaluate("() => window.__log")
        await b.close()
    idx = {'L': 0, 'M': 1, 'R': 2}; use = [idx[c] for c in rows]
    A0 = info[0]; cw = int(A0['w']); ch = int(A0['h'])
    x_off, w = (0, cw) if crop == 'wide' else (int(cw / 2 - 110), 220)
    tw, th = int(w * S), int(ch * S); o = Image.new('RGB', (tw * len(shots), th * len(use)))
    for i, (t, fr, buf) in enumerate(shots):
        im = Image.open(io.BytesIO(buf))
        for r, k in enumerate(use):
            A = info[k]; c = im.crop((int(A['x']) + x_off, int(A['y']), int(A['x']) + x_off + w, int(A['y']) + ch)).resize((tw, th)); o.paste(c, (i * tw, r * th))
            d = ImageDraw.Draw(o); d.rectangle([i * tw, r * th, i * tw + 62, r * th + 11], fill=(0, 0, 0)); d.text((i * tw + 2, r * th), f"{t} f{fr[k]}", fill=(255, 255, 0))
    o.save(out, quality=80)
    print(o.size)
    for A in info:
        hits = sorted(set(x[2] for x in log if x[0] == A['key'] and x[1] == 'hit'))
        rel_t = round(A['dur'] * A['rel'] * 1000) if A['dur'] and A['rel'] else None
        print(f"{A['key']:8s} D={A['dur']} rel={A['rel']} impact=f{A['impact']} release@{rel_t}ms hold={A['hold']} new={A['newSheet']} prev={A['prev']} hits@{hits[:8]}")
    if errs: print('CONSOLE ERRORS:', errs[:5])
asyncio.run(main())
