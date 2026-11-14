# rvsheet.py clip... -> /tmp/rv/<clip>.jpg : all 25 frames of the fresh cut (workspace), 2 rows, x2 size, each inside its
# frame border (red) on gray, frame numbers - for the fresh-eyes reviewer (edges, body, effect, motion).
import sys, os
from PIL import Image, ImageDraw
K='/home/claude/kl'; os.makedirs('/tmp/rv',exist_ok=True)
for c in sys.argv[1:]:
    p=f"{K}/work/gods-anim-lab-repo/assets/sheets/{c.replace('_','-')}-mob.webp"
    if not os.path.exists(p): print(c,'MISSING'); continue
    im=Image.open(p).convert('RGBA'); w,h=im.width//5,im.height//5; S=1.6; W,H=int(w*S),int(h*S)
    o=Image.new('RGB',(13*(W+6),2*(H+6)),(120,120,120)); d=ImageDraw.Draw(o)
    for i in range(25):
        f=im.crop(((i%5)*w,(i//5)*h,(i%5+1)*w,(i//5+1)*h)).resize((W,H),Image.LANCZOS)
        x,y=(i%13)*(W+6)+3,(i//13)*(H+6)+3; o.paste(f,(x,y),f); d.rectangle([x-1,y-1,x+W,y+H],outline=(200,0,0)); d.text((x+3,y+3),str(i),fill=(255,255,0))
    o.save(f'/tmp/rv/{c}.jpg',quality=86); print(c,o.size,f'frame {w}x{h}')
