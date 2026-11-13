# hcmp.py out.jpg god... : idle screenshot of each god, the three focus heroes cropped side by side with guide lines every 20 px
# (gate D14: new god's height on the stand = live height +-3 %). Server on :8765.
import asyncio, sys, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
out=sys.argv[1]; gods=sys.argv[2:]
async def main():
    rows=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1920,'height':960})
        for g in gods:
            await pg.goto('http://localhost:8765/index.html#'+g); await pg.reload(); await pg.wait_for_timeout(3000)
            im=Image.open(io.BytesIO(await pg.screenshot(type='png'))).convert('RGB')
            row=Image.new('RGB',(3*260,300),(0,0,0))
            for i,cx in enumerate((325,960,1595)):
                row.paste(im.crop((cx-130,440,cx+130,740)),(i*260,0))
            d=ImageDraw.Draw(row)
            for y in range(0,300,20): d.line([(0,y),(780,y)],fill=(255,255,0) if y%100==0 else (90,90,90))
            d.text((4,4),g,fill=(255,255,255)); rows.append(row)
        await b.close()
    o=Image.new('RGB',(780*min(2,len(rows)),300*((len(rows)+1)//2)))
    for i,r in enumerate(rows): o.paste(r,((i%2)*780,(i//2)*300))
    o.save(out,quality=88); print(out,o.size)
asyncio.run(main())
