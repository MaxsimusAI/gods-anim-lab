# Soft-fade hard cuts at the sheet-frame edges of already built sheets (no re-matting).
# python3 softcut.py clip...   (edits <repo>/assets/sheets/<god>-<bt|ti>-<slot>-{mob,lite}.webp in place)
import sys, json, os, io
import numpy as np
from PIL import Image
M=json.load(open('/home/claude/kl/work/adapted_all_metrics.json'))
D='/home/claude/gods-anim-lab/assets/sheets/'
for c in sys.argv[1:]:
    m=M[c]; rep=[]
    for var in ('mob','lite'):
        f=D+m[var]['file']; w,h=m[var]['w'],m[var]['h']; size0=os.path.getsize(f)
        a=np.array(Image.open(f).convert('RGBA')).astype(np.float32)
        cells=[a[r*h:(r+1)*h, q*w:(q+1)*w] for r in range(5) for q in range(5)]
        al=np.stack([x[...,3] for x in cells])
        touch={'l':(al[:,:,0]>150).sum(), 'r':(al[:,:,-1]>150).sum(), 't':(al[:,0,:]>150).sum()}
        cw=max(3.0,0.04*w); ch=max(3.0,0.035*h); xx=np.arange(w,dtype=np.float32); yy=np.arange(h,dtype=np.float32)
        cut=np.ones((h,w),np.float32); ed=''
        if touch['l']>3*h*0.02: cut*=np.clip(xx/cw,0,1)[None,:]; ed+='L'
        if touch['r']>3*h*0.02: cut*=np.clip((w-1-xx)/cw,0,1)[None,:]; ed+='R'
        if touch['t']>3*w*0.02: cut*=np.clip(yy/ch,0,1)[:,None]; ed+='T'
        if not ed: rep.append(f'{var}:-'); continue
        for x in cells: x[...,3]*=cut
        im=Image.fromarray(np.clip(a,0,255).astype(np.uint8),'RGBA')
        for q in (82,78,74,70,66,62):
            b=io.BytesIO(); im.save(b,'WEBP',quality=q,method=6)
            if b.tell()<=size0*1.01: break
        open(f,'wb').write(b.getvalue()); rep.append(f'{var}:{ed} q{q} {size0//1024}->{b.tell()//1024}KB')
    print(c,' '.join(rep))
