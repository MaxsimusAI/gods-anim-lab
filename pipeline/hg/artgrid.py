# artgrid.py out.jpg god1 god2 ... : the accepted art on gray with a 20x20 grid (labels every 2 cells), to pick boxes for effect pictures
import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; gods=sys.argv[2:]; H=640; ims=[]
for g in gods:
    a=Image.open(f'src/{g}.webp').convert('RGBA'); bb=a.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox(); a=a.crop(bb)
    w=round(a.width*H/a.height); a=a.resize((w,H)); bg=Image.new('RGBA',(w,H),(110,110,110,255)); bg.alpha_composite(a); d=ImageDraw.Draw(bg)
    for k in range(21):
        x=round(k*w/20); y=round(k*H/20); c=(255,255,0,160) if k%2==0 else (255,255,255,60)
        d.line([(x,0),(x,H)],fill=c); d.line([(0,y),(w,y)],fill=c)
        if k%2==0 and k<20: d.text((x+2,2),str(k*5),fill=(255,255,0)); d.text((2,y+2),str(k*5),fill=(0,255,255))
    d.text((w//2-20,H-14),g,fill=(255,255,255)); ims.append(bg.convert('RGB'))
W=sum(i.width for i in ims)+6*(len(ims)-1); S=Image.new('RGB',(W,H),(255,0,255)); x=0
for i in ims: S.paste(i,(x,0)); x+=i.width+6
S.save(out,quality=85)
