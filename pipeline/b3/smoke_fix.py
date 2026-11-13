# smoke_fix.py sheet.webp... : remove pale translucent smoke columns in the lower 55 % of each frame (low saturation,
# alpha < 215, not on the solid figure). Warm glow and the figure stay. Re-encodes under the file's own size.
import sys, numpy as np, os, webp
from PIL import Image, ImageFilter
for p in sys.argv[1:]:
    im=Image.open(p).convert('RGBA'); A=np.asarray(im).astype(int); H,W=A.shape[:2]; h=H//5
    rgb=A[...,:3]; a=A[...,3]; sat=rgb.max(-1)-rgb.min(-1); lum=rgb.mean(-1)
    solid=np.asarray(Image.fromarray(((a>200)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))>0
    low=((np.arange(H)%h)>=h*0.45)[:,None]
    kill=low&~solid&(a>0)&(a<215)&(sat<40)&(lum>55)
    A[...,3]=np.where(kill,0,a); img=Image.fromarray(A.astype(np.uint8),'RGBA'); cap=os.path.getsize(p)
    def enc(q):
        c=webp.WebPConfig.new(quality=q,method=6); pp=c.ptr; pp.filter_strength=20; pp.filter_sharpness=3; pp.sns_strength=60; pp.alpha_quality=min(95,q+10); pp.alpha_filtering=2
        return bytes(webp.WebPPicture.from_pil(img).encode(c).buffer())
    lo,hi,best=30,95,None
    while hi-lo>1:
        m=(lo+hi)//2
        if len(enc(m))<=cap: lo,best=m,m
        else: hi=m
    open(p,'wb').write(enc(best or lo)); print(os.path.basename(p),'smoke px',int(kill.sum()),'q',best)
