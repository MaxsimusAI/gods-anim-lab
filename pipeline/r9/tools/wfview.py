# wfview.py out.jpg clip... : release frame (and release+3) of each cut sheet, x2.2, with a 10% grid to read the wf point [x,y]
# red cross = current wf of the metrics. Use it to SET wf by looking (playbook step E).
import sys, json
from PIL import Image, ImageDraw
M=json.load(open('/home/claude/kl/work/adapted_all_metrics.json')); out=sys.argv[1]; S=2.2; cells=[]
for c in sys.argv[2:]:
    m=M[c]; w,h=m['mob']['w'],m['mob']['h']; k=m['impact']
    sh=Image.open('/home/claude/kl/work/gods-anim-lab-repo/assets/sheets/'+m['mob']['file']).convert('RGBA')
    for kk in (k, min(24,k+3)):
        fr=sh.crop(((kk%5)*w,(kk//5)*h,(kk%5)*w+w,(kk//5)*h+h)); W,H=int(w*S),int(h*S)
        cell=Image.new('RGBA',(W,H),(40,46,62,255)); cell.alpha_composite(fr.resize((W,H),Image.LANCZOS)); cell=cell.convert('RGB'); d=ImageDraw.Draw(cell)
        for i in range(1,10):
            d.line([(W*i/10,0),(W*i/10,H)],fill=(90,90,110) if i!=5 else (150,150,90)); d.line([(0,H*i/10),(W,H*i/10)],fill=(90,90,110) if i!=5 else (150,150,90))
            d.text((W*i/10+1,1),str(i),fill=(255,255,120)); d.text((1,H*i/10+1),str(i),fill=(255,255,120))
        if kk==k:
            x,y=m['wf'][0]*W,m['wf'][1]*H; d.line([(x-6,y),(x+6,y)],fill=(255,60,60),width=2); d.line([(x,y-6),(x,y+6)],fill=(255,60,60),width=2)
        d.text((3,H-12),f"{c} f{kk} {w}x{h}",fill=(255,255,255)); cells.append(cell)
Hm=max(c.height for c in cells); o=Image.new('RGB',(sum(c.width+4 for c in cells),Hm),(255,255,255)); x=0
for c in cells: o.paste(c,(x,0)); x+=c.width+4
o.save(out,quality=85); print(out,o.size)
