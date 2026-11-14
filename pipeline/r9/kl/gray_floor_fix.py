# gray_floor_fix.py <clip> <row share from which to clean, e.g. 0.68> : sheet-level removal of gray smoke patches at the feet
# that the matting kept (Persephone TI ult, Maxim 14.11 «Плохо убрана пустота в кадрах»). In the lower part of every frame,
# unsaturated mid-gray pixels (not skin, not dark stockings, not coloured effect) become transparent. Same 25 moments.
import sys, os, json, numpy as np, webp
from PIL import Image
from scipy import ndimage as ni
clip, y0 = sys.argv[1], float(sys.argv[2]); K='/home/claude/kl'; s=clip.replace('_','-'); W=K+'/work/gods-anim-lab-repo/assets/sheets/'
def enc(img, q, path):
    cfg = webp.WebPConfig.new(quality=q, method=6); p = cfg.ptr
    p.filter_strength = 20; p.filter_sharpness = 3; p.sns_strength = 60; p.alpha_quality = min(95, int(q) + 10); p.alpha_filtering = 2
    open(path, 'wb').write(bytes(webp.WebPPicture.from_pil(img).encode(cfg).buffer())); return os.path.getsize(path)
for t in ('mob','lite'):
    p=W+f'{s}-{t}.webp'; im=np.asarray(Image.open(p).convert('RGBA')).astype(np.float32); fh,fw=im.shape[0]//5,im.shape[1]//5
    c=im[...,:3]; a=im[...,3]; sat=c.max(-1)-c.min(-1); mx=c.max(-1)
    rows=(np.arange(im.shape[0])%fh)>=int(fh*y0)
    gray=((sat<26)|((sat<62)&(c[...,2]>c[...,1]+4)&(c[...,0]>c[...,1]+15)))&(mx>105)&(mx<225)&(a>0)&rows[:,None]   # gray smoke, also tinted pink by the glow
    gray=ni.binary_opening(gray,iterations=1)|((a<140)&(sat<40)&(a>0)&rows[:,None]&ni.binary_dilation(gray,iterations=2))
    o=im.copy(); o[...,3]=np.where(gray,0,a); img=Image.fromarray(o.astype(np.uint8),'RGBA'); cap=os.path.getsize(p); lo,hi,best=40,95,None
    while hi-lo>1:
        m=(lo+hi)//2
        if enc(img,m,p+'.tmp')<=cap: lo,best=m,m
        else: hi=m
    kb=enc(img,best or lo,p)/1024; os.remove(p+'.tmp'); print(t,'removed px',int(gray.sum()),'kb',round(kb,1))
    A=json.load(open(K+'/work/adapted_all_metrics.json')); A[clip][t]['kb']=round(kb,1); json.dump(A,open(K+'/work/adapted_all_metrics.json','w'),indent=1)
