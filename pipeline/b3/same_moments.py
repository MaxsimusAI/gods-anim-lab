# same_moments.py clip... : is the fresh cut in the workspace the same 25 moments as the sheet now served on the site?
# Per frame: IoU of the silhouettes (alpha bbox -> 64x64). Also prints the best-matching old frame when it is not the same
# index (a shift = different moments). Writes /tmp/sm/<clip>.jpg: old (top) and new (bottom) rows, frames 0..24, for the eyes.
import sys, os, json, numpy as np
from PIL import Image, ImageDraw
K='/home/claude/kl'; R='/home/claude/gods-anim-lab'; os.makedirs('/tmp/sm',exist_ok=True)
def frames(p):
    im=Image.open(p).convert('RGBA'); w,h=im.width//5,im.height//5
    return [im.crop(((i%5)*w,(i//5)*h,(i%5+1)*w,(i//5+1)*h)) for i in range(25)]
def sil(f):
    a=np.array(f)[...,3]>60; ys,xs=np.nonzero(a)
    if len(ys)<20: return np.zeros((64,64),bool)
    return np.array(Image.fromarray((a[ys.min():ys.max()+1,xs.min():xs.max()+1]*255).astype(np.uint8)).resize((64,64)))>127
def iou(a,b): u=(a|b).sum(); return float((a&b).sum())/u if u else 1.0
res={}
for c in sys.argv[1:]:
    s=c.replace('_','-'); po=f'{R}/assets/sheets/{s}-mob.webp'; pn=f'{K}/work/gods-anim-lab-repo/assets/sheets/{s}-mob.webp'
    if not os.path.exists(po) or not os.path.exists(pn): print(c,'MISSING old' if not os.path.exists(po) else 'MISSING new'); continue
    fo,fn=frames(po),frames(pn); so=[sil(f) for f in fo]; sn=[sil(f) for f in fn]
    same=[iou(so[i],sn[i]) for i in range(25)]
    shift=[i for i in range(25) if max(range(25),key=lambda j: iou(so[j],sn[i]))!=i and same[i]<0.9*max(iou(so[j],sn[i]) for j in range(25))]
    res[c]={'min':round(float(min(same)),3),'mean':round(float(np.mean(same)),3),'shift':shift,'old':fo[0].size,'new':fn[0].size}
    print(c,res[c])
    H=220; tw=lambda f: int(f.width*H/f.height)
    W=max(sum(tw(f)+2 for f in fo[::2]),sum(tw(f)+2 for f in fn[::2]))
    o=Image.new('RGB',(W,2*H+6),(128,128,128)); d=ImageDraw.Draw(o)
    for r,fs in enumerate((fo,fn)):
        x=0
        for i in range(0,25,2):
            t=fs[i].resize((tw(fs[i]),H),Image.LANCZOS); o.paste(t,(x,r*(H+6)),t); d.text((x+2,r*(H+6)+2),str(i),fill=(255,255,0)); x+=t.width+2
    o.save(f'/tmp/sm/{c}.jpg',quality=88)
json.dump(res,open('/tmp/sm/_last.json','w'),indent=0)
