# fr.py out.jpg clip i0 i1 [step] : frames i0..i1 of work/frames_all/<clip> side by side at 420 px
import sys, os
from PIL import Image, ImageDraw
out,c=sys.argv[1:3]; i0,i1=int(sys.argv[3]),int(sys.argv[4]); st=int(sys.argv[5]) if len(sys.argv)>5 else 1
d=f'/home/claude/kl/work/frames_all/{c}'; fs=sorted(os.listdir(d)); idx=[i for i in range(i0,min(i1,len(fs)-1)+1,st)]
ims=[Image.open(f'{d}/{fs[i]}').convert('RGB') for i in idx]; W,H=ims[0].size
o=Image.new('RGB',(len(ims)*(W+2),H+14),(255,255,255)); dr=ImageDraw.Draw(o)
for j,(i,im) in enumerate(zip(idx,ims)): o.paste(im,(j*(W+2),14)); dr.text((j*(W+2)+2,1),f'{c if j==0 else ""} #{i}',fill=(0,0,0))
o.save(out,quality=85); print(out,o.size)
