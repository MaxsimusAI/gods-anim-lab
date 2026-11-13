# time series of one action on the stand: python3 seq.py out.jpg god slot [n=12] [step_ms=90] [speed=1 | 0.5 | 0.25] [start_game_ms=0]
# with speed<1 the labels are GAME ms (wall ms x speed)
# rows: new BT arena, new TI arena; label = ms after the click. Server must run on :8765.
import asyncio, sys, time, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
out,G,sl=sys.argv[1:4]; n=int(sys.argv[4]) if len(sys.argv)>4 else 12; step=int(sys.argv[5]) if len(sys.argv)>5 else 90; spd=sys.argv[6] if len(sys.argv)>6 else '1'; t_start=float(sys.argv[7])/1000.0/float(spd) if len(sys.argv)>7 else 0.0
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1920,'height':960})
        await pg.goto('http://localhost:8765/index.html#'+G); await pg.reload(); await pg.wait_for_timeout(3200)
        if spd!='1': await pg.click(f'.seg-btn[data-spd="{spd}"]'); await pg.wait_for_timeout(300)
        await pg.click(f'.skill-btn[data-slot="{sl}"]'); t0=time.monotonic(); shots=[]
        for i in range(n):
            tgt=t0+t_start+(i+1)*step/1000.0; d=tgt-time.monotonic()
            if d>0: await asyncio.sleep(d)
            ts=time.monotonic()-t0
            buf=await pg.screenshot(clip={'x':725,'y':170,'width':1106,'height':560},type='jpeg',quality=80)
            shots.append((round(ts*1000*float(spd)),buf))
        await b.close()
    S=0.5; tw,th=int(470*S),int(560*S); o=Image.new('RGB',(tw*len(shots),th*2))
    for i,(ts,buf) in enumerate(shots):
        im=Image.open(io.BytesIO(buf))
        for r,x0 in enumerate((0,636)):
            t=im.crop((x0,0,x0+470,560)).resize((tw,th)); o.paste(t,(i*tw,r*th))
        ImageDraw.Draw(o).text((i*tw+3,3),str(ts),fill=(255,255,0))
    o.save(out,quality=84); print(o.size,[s[0] for s in shots])
asyncio.run(main())
