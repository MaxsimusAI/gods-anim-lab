import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; step=int(sys.argv[2]); L=sys.argv[3:]
rows=[]
for n in L:
    p=n if n.endswith('.webp') else f'/home/claude/gods-anim-lab/assets/sheets/{n.replace("_","-")}-mob.webp'
    im=Image.open(p).convert('RGBA'); fw,fh=im.width//5,im.height//5
    idx=list(range(0,25,step)); row=Image.new('RGB',(fw*len(idx),fh),(110,110,110))
    for j,i in enumerate(idx):
        f=im.crop(((i%5)*fw,(i//5)*fh,(i%5+1)*fw,(i//5+1)*fh)); row.paste(f,(j*fw,0),f)
        ImageDraw.Draw(row).text((j*fw+2,fh-12),str(i),fill=(255,255,0))
    ImageDraw.Draw(row).text((2,2),n.split('/')[-1],fill=(255,255,0)); rows.append(row)
W=max(r.width for r in rows); S=Image.new('RGB',(W,sum(r.height for r in rows)),(60,60,60)); y=0
for r in rows: S.paste(r,(0,y)); y+=r.height
if S.width>1990: S=S.resize((1990,int(S.height*1990/S.width)))
S.save(out,quality=80); print(S.size)
