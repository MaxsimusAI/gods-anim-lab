# fsb.py <port> job job ... ; job = out:god:slot:n:step:start:rows:scale:crop:ver[:spd]   (batch variant of fseq.py, one browser)
# crop: wide | col | x0-x1 (fractions of arena width) ; adds y crop via crop like x0-x1-y0-y1
import asyncio, sys, io, json
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
PORT = int(sys.argv[1]); jobs = [j.split(':') for j in sys.argv[2:]]
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
  return { key: a.key, x: r.left, y: r.top, w: r.width, h: r.height, dur: el ? +el._dur.toFixed(3) : null, st: el ? +(el._startT - window.__t0).toFixed(3) : null, rel: el && el._A ? el._A.rel : null, impact: el && el._A ? el._A.impact : null, hold: +(a.holdTotal || 0).toFixed(3), newSheet: !!(el && el._A && el._A.isNewSheet), prev: !!(el && el._A && el._A.isPrevSheet) }; }); }"""
FRAME = """() => { const D = window.__STAND_DEBUG; return D.getArenas().map(a => { const u = a.focusUnit, el = u && u.fig && [...u.fig.querySelectorAll('.atk')].find(x => x.style.display === 'block');
  return el ? Math.min((el._A.frames || 25) - 1, Math.floor((a.animClock - el._startT) / el._dur * (el._A.frames || 25))) : -1; }); }"""
STEP = "ms => { for (let i = 0; i < ms; i += 15) window.__STAND_DEBUG.stepManual(Math.min(15, ms - i) / 1000); }"
async def one(b, job):
    out, G, sl, n, step, start, rows, S, crop, ver = job[:10]; n = int(n); step = int(step); start = int(start); S = float(S)
    errs = []
    pg = await b.new_page(viewport={'width': 1920, 'height': 960})
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    await pg.goto(f'http://localhost:{PORT}/index.html#' + G); await pg.wait_for_timeout(2500)
    if ver != 'now': await pg.click(f'.seg-btn[data-ver="{ver}"]'); await pg.wait_for_timeout(1500)
    await pg.evaluate(HOOK)
    await pg.evaluate("sl => { const D = window.__STAND_DEBUG; window.__t0 = D.getArenas()[1].animClock; D.triggerSkill(sl); }", sl)
    await pg.wait_for_timeout(700)
    info = await pg.evaluate(INFO); shots = []
    if start: await pg.evaluate(STEP, start)
    t = start
    for i in range(n):
        await pg.evaluate(STEP, step); t += step
        fr = await pg.evaluate(FRAME)
        buf = await pg.screenshot(type='jpeg', quality=85)
        shots.append((t, fr, buf))
    log = await pg.evaluate("() => window.__log")
    info2 = await pg.evaluate(INFO)
    await pg.close()
    idx = {'L': 0, 'M': 1, 'R': 2}; use = [idx[c] for c in rows]
    A0 = info[0]; cw = int(A0['w']); ch = int(A0['h'])
    y0, y1 = 0, ch
    if crop == 'wide': x_off, w = 0, cw
    elif crop == 'col': x_off, w = int(cw / 2 - 110), 220
    else:
        q = [float(v) for v in crop.split('-')]; x_off = int(cw * q[0]); w = int(cw * (q[1] - q[0]))
        if len(q) > 3: y0 = int(ch * q[2]); y1 = int(ch * q[3])
    hh = y1 - y0
    tw, th = int(w * S), int(hh * S); o = Image.new('RGB', (tw * len(shots), th * len(use)))
    for i, (t, fr, buf) in enumerate(shots):
        im = Image.open(io.BytesIO(buf))
        for r, k in enumerate(use):
            A = info[k]; c = im.crop((int(A['x']) + x_off, int(A['y']) + y0, int(A['x']) + x_off + w, int(A['y']) + y1)).resize((tw, th)); o.paste(c, (i * tw, r * th))
            d = ImageDraw.Draw(o); d.rectangle([i * tw, r * th, i * tw + 62, r * th + 11], fill=(0, 0, 0)); d.text((i * tw + 2, r * th), f"{t} f{fr[k]}", fill=(255, 255, 0))
    o.save(out, quality=82)
    print('==', G, sl, ver, o.size)
    for A, A2 in zip(info, info2):
        hits = sorted(set(x[2] for x in log if x[0] == A['key'] and x[1] == 'hit'))
        rel_t = round(A['dur'] * A['rel'] * 1000) if A['dur'] and A['rel'] else None
        print(f"  {A['key']:8s} D={A['dur']} st={A['st']} rel={A['rel']} imp=f{A['impact']} rel@{rel_t} hold={A['hold']}/{A2['hold']} new={A['newSheet']} prev={A['prev']} hits@{hits[:8]}")
    if errs: print('  CONSOLE ERRORS:', errs[:5])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-dev-shm-usage'])
        for j in jobs:
            try: await one(b, j)
            except Exception as e: print('JOB FAILED', j, str(e)[:200])
        await b.close()
asyncio.run(main())
