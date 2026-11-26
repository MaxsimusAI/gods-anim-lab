# matgrid.py out.jpg <png> [<png> ...] : matted clip frames on dark gray with a 20x20 grid, to pick boxes for effect pictures
import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; H=520; ims=[]
for f in sys.argv[2:]:
    a=Image.open(f).convert('RGBA'); w=round(a.width*H/a.height); a=a.resize((w,H)); bg=Image.new('RGBA',(w,H),(45,40,60,255)); bg.alpha_composite(a); d=ImageDraw.Draw(bg)
    for k in range(21):
        x=round(k*w/20); y=round(k*H/20); c=(255,255,0,140) if k%2==0 else (255,255,255,50)
        d.line([(x,0),(x,H)],fill=c); d.line([(0,y),(w,y)],fill=c)
        if k%2==0 and k<20: d.text((x+2,2),str(k*5),fill=(255,255,0)); d.text((2,y+2),str(k*5),fill=(0,255,255))
    d.text((4,H-14),f.split('/')[-1],fill=(255,255,255)); ims.append(bg.convert('RGB'))
W=sum(i.width for i in ims)+6*(len(ims)-1); S=Image.new('RGB',(W,H),(255,0,255)); x=0
for i in ims: S.paste(i,(x,0)); x+=i.width+6
S.save(out,quality=85)
