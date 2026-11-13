# gsheet.py god [H] -> /tmp/g_<god>.jpg : 8 rows (bt/ti x idle/atk/sup/hyp), 9 frames each (0..72 step 9), red frame border
import sys, subprocess, numpy as np, os
from PIL import Image, ImageDraw
g=sys.argv[1]; H=int(sys.argv[2]) if len(sys.argv)>2 else 150
rows=[f'{g}_{s}_{a}' for s in ('bt','ti') for a in ('idle','atk','sup','hyp')]
FR=list(range(0,73,9)); tiles=[]
for c in rows:
    p=f'b2/mp4/{c}.mp4'
    if not os.path.exists(p): tiles.append(None); continue
    pr=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(pr[0]),int(pr[1]); W=int(round(w*H/h/2))*2
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    a=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3); tiles.append([Image.fromarray(a[min(f,len(a)-1)]) for f in FR])
W=max(t[0].width for t in tiles if t); LW=70
o=Image.new('RGB',(LW+len(FR)*(W+3),len(rows)*(H+3)),(25,25,25)); d=ImageDraw.Draw(o)
for r,(c,t) in enumerate(zip(rows,tiles)):
    y=r*(H+3); d.text((2,y+H//2),c.split('_',1)[1],fill=(255,255,0))
    if not t: d.text((LW,y+H//2),'MISSING',fill=(255,0,0)); continue
    for i,im in enumerate(t):
        x=LW+i*(W+3); o.paste(im,(x,y)); d.rectangle([x-1,y-1,x+im.width,y+im.height],outline=(200,0,0))
o.save(f'/tmp/g_{g}.jpg',quality=80); print(o.size)
