# strip2.py out.jpg n clip... : one row per clip, n evenly spaced frames from work/frames_all (420 px), frame index labels
import sys, os
from PIL import Image, ImageDraw
out=sys.argv[1]; n=int(sys.argv[2]); clips=sys.argv[3:]; Hh=200; rows=[]
for c in clips:
    d=f'/home/claude/kl/work/frames_all/{c}'; fs=sorted(os.listdir(d)); N=len(fs)
    idx=[round(i*(N-1)/(n-1)) for i in range(n)]
    ims=[Image.open(f'{d}/{fs[i]}').convert('RGB') for i in idx]; W=round(ims[0].width*Hh/ims[0].height)
    row=Image.new('RGB',(n*(W+2),Hh+14),(255,255,255)); dr=ImageDraw.Draw(row)
    for j,(i,im) in enumerate(zip(idx,ims)):
        row.paste(im.resize((W,Hh)),(j*(W+2),14)); dr.text((j*(W+2)+2,1),f'{c if j==0 else ""} #{i}',fill=(0,0,0))
    rows.append(row)
Wm=max(r.width for r in rows); im=Image.new('RGB',(Wm,sum(r.height for r in rows)),(255,255,255)); y=0
for r in rows: im.paste(r,(0,y)); y+=r.height
im.save(out,quality=82); print(out,im.size)
