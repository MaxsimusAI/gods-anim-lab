# strip.py out.jpg clip... : one row per clip, 7 frames (0..~72), red frame borders, label
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw
out=sys.argv[1]; clips=sys.argv[2:]; Hh=150; rows=[]
for c in clips:
    p=f'b2/mp4/{c}.mp4'
    pr=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(pr[0]),int(pr[1]); W=int(round(w*Hh/h/2))*2
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-vf',f'scale={W}:{Hh}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    a=np.frombuffer(raw,np.uint8).reshape(-1,Hh,W,3); n=len(a)
    idx=[0,int(n*.15),int(n*.3),int(n*.45),int(n*.6),int(n*.8),n-1]
    row=Image.new('RGB',(len(idx)*(W+4)+150,Hh+4),(255,255,255)); d=ImageDraw.Draw(row)
    d.text((4,Hh//2),c,fill=(0,0,0))
    for j,i in enumerate(idx):
        x=150+j*(W+4); row.paste(Image.fromarray(a[i]),(x+2,2)); d.rectangle([x+1,1,x+W+2,Hh+2],outline=(255,0,0))
    rows.append(row)
Wm=max(r.width for r in rows); im=Image.new('RGB',(Wm,sum(r.height for r in rows)),(255,255,255)); y=0
for r in rows: im.paste(r,(0,y)); y+=r.height
im.save(out,quality=80); print(out,im.size)
