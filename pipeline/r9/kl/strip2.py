import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; idx=[int(x) for x in sys.argv[2].split(',')]; bg=tuple(int(x) for x in sys.argv[3].split(',')); L=sys.argv[4:]
rows=[]
for n in L:
    p=n if n.endswith(('.webp','.png')) else f'/home/claude/gods-anim-lab/assets/sheets/{n.replace("_","-")}-mob.webp'
    im=Image.open(p).convert('RGBA'); fw,fh=im.width//5,im.height//5
    row=Image.new('RGB',(fw*len(idx),fh),bg)
    for j,i in enumerate(idx):
        f=im.crop(((i%5)*fw,(i//5)*fh,(i%5+1)*fw,(i//5+1)*fh)); row.paste(f,(j*fw,0),f)
        ImageDraw.Draw(row).text((j*fw+2,fh-12),str(i),fill=(255,255,255))
    ImageDraw.Draw(row).text((2,2),n.split('/')[-1],fill=(255,255,255)); rows.append(row)
W=max(r.width for r in rows); S=Image.new('RGB',(W,sum(r.height for r in rows)),(60,60,60)); y=0
for r in rows: S.paste(r,(0,y)); y+=r.height
sc=float(sys.argv[0] and 1)
if S.width<1200: S=S.resize((S.width*2,S.height*2),Image.LANCZOS)
if S.width>1990: S=S.resize((1990,int(S.height*1990/S.width)))
S.save(out,quality=85); print(S.size)
