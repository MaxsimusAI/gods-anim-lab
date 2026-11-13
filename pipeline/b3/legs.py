# legs.py clip... : do the FEET move? Per frame: silhouette (non-glow) of the lowest 14 % of the figure -> left edge, right edge,
# centroid. Prints max shift vs frame 0 in % of the figure height. Glued feet (G1.10): feet_max < ~2.5 % and hips_max < ~4 %.
import sys, subprocess, numpy as np
for c in sys.argv[1:]:
    p=c if c.endswith('.mp4') else f'/home/claude/kl/b2/mp4/{c}.mp4'
    pr=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(pr[0]),int(pr[1]); W=240; H=int(round(h*W/w/2))*2
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    a=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.int16); bg=np.median(a[0,:5,:5].reshape(-1,3),axis=0)
    sat=a.max(-1)-a.min(-1); glow=(a.max(-1)>185)&((a[...,2]>a[...,0]+25)|(sat>70))
    m=(np.abs(a-bg).sum(-1)>55)&~glow
    ys=np.nonzero(m[0].sum(1)>2)[0]; top,bot=ys[0],ys[-1]; fh=bot-top
    def band(f,lo,hi):
        r=m[f,int(top+lo*fh):int(top+hi*fh)+1]; xs=np.nonzero(r.sum(0)>1)[0]
        if len(xs)<3: return None
        return xs[0],xs[-1],(np.nonzero(r)[1]).mean()
    out={}
    for name,(lo,hi) in {'feet':(.86,1.0),'hips':(.45,.6)}.items():
        b0=band(0,lo,hi); mx=0
        for f in range(len(m)):
            b=band(f,lo,hi)
            if b and b0: mx=max(mx,max(abs(b[0]-b0[0]),abs(b[1]-b0[1]),abs(b[2]-b0[2])))
        out[name]=100*mx/fh
    print(f"{c.split('/')[-1]:22s} feet_max={out['feet']:5.1f}% hips_max={out['hips']:5.1f}%",flush=True)
