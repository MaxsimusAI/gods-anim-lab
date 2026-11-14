# holes.py clip... : see-through body check, old (site) vs new (workspace) sheet. Per frame: share of the filled silhouette
# (alpha>128, closed, holes filled) that is translucent (alpha<128). Prints the worst frames where the NEW cut is clearly
# worse than the old one (a robe the colour of the gray background loses its matting). Invisible on gray review images.
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ni
K='/home/claude/kl'; R='/home/claude/gods-anim-lab'
def shares(p):
    im=np.array(Image.open(p).convert('RGBA'))[...,3]; h,w=im.shape[0]//5,im.shape[1]//5; out=[]
    for i in range(25):
        a=im[(i//5)*h:(i//5+1)*h,(i%5)*w:(i%5+1)*w]; s=a>128
        f=ni.binary_fill_holes(ni.binary_closing(s,iterations=2)); n=f.sum()
        out.append(float(((a<128)&f).sum())/n if n else 0.0)
    return out
for c in sys.argv[1:]:
    s=c.replace('_','-'); po=f'{R}/assets/sheets/{s}-mob.webp'; pn=f'{K}/work/gods-anim-lab-repo/assets/sheets/{s}-mob.webp'
    if not (os.path.exists(po) and os.path.exists(pn)): continue
    o,n=shares(po),shares(pn); bad=[(i,round(o[i]*100,1),round(n[i]*100,1)) for i in range(25) if n[i]>0.04 and n[i]>o[i]+0.03]
    print(c,'max old %.1f%% new %.1f%%'%(max(o)*100,max(n)*100),'WORSE (frame, old%, new%):' if bad else 'ok',bad[:6] if bad else '')
