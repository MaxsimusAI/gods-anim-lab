import sys,subprocess,os
from PIL import Image,ImageDraw
clip=sys.argv[1]; n=int(sys.argv[2]) if len(sys.argv)>2 else 12
d=f'fr/{clip}'; os.makedirs(d,exist_ok=True)
if not os.listdir(d): subprocess.run(['ffmpeg','-v','error','-i',f'mp4/{clip}.mp4',f'{d}/%03d.png'],check=True)
fs=sorted(os.listdir(d)); N=len(fs); idx=[round(i*(N-1)/(n-1)) for i in range(n)]
h=300; ims=[]
for i in idx:
    im=Image.open(f'{d}/{fs[i]}').convert('RGB'); im=im.resize((round(im.width*h/im.height),h))
    ImageDraw.Draw(im).text((4,4),str(i),fill=(255,255,0)); ims.append(im)
cols=6; rows=(n+cols-1)//cols; W=ims[0].width
S=Image.new('RGB',(W*cols,h*rows),(0,0,0))
for k,im in enumerate(ims): S.paste(im,((k%cols)*W,(k//cols)*h))
S.save(f'strip_{clip}.jpg',quality=85); print(clip,N,'frames')
