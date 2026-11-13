# vstrip.py out.jpg clip [clip...] : 12 evenly spaced frames per clip from r4/mp4 (rows), for the video gate
import sys, subprocess, io
from PIL import Image, ImageDraw
out=sys.argv[1]; rows=[]
for c in sys.argv[2:]:
    p=f'/home/claude/kl/r4/rt1/{c}.mp4'; fr=[]
    for i in range(12):
        t=i*2.95/11
        b=subprocess.run(['ffmpeg','-v','error','-ss',f'{t:.2f}','-i',p,'-frames:v','1','-vf','scale=-2:300','-f','image2pipe','-vcodec','png','-'],capture_output=True).stdout
        fr.append(Image.open(io.BytesIO(b)).convert('RGB'))
    w=sum(f.width for f in fr); r=Image.new('RGB',(w,318),(0,0,0)); x=0
    for i,f in enumerate(fr): r.paste(f,(x,18)); ImageDraw.Draw(r).text((x+2,2),f'{c} {i*2.95/11:.2f}s',fill=(255,255,0)); x+=f.width
    rows.append(r)
W=max(r.width for r in rows); o=Image.new('RGB',(W,318*len(rows)))
for i,r in enumerate(rows): o.paste(r,(0,i*318))
o.save(out,quality=85); print(o.size)
