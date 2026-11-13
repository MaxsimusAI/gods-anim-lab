# mmask.py clip... : silhouette motion: max % of fg-area pixels that changed fg/bg vs frame 0
import sys, subprocess, numpy as np
for c in sys.argv[1:]:
    p=c if c.endswith('.mp4') else f'b2/mp4/{c}.mp4'
    pr=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(pr[0]),int(pr[1]); W=180; H=int(round(h*W/w/2))*2
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    a=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.int16); bg=np.median(a[0,:5,:5].reshape(-1,3),axis=0)
    m=np.abs(a-bg).sum(-1)>45; area=m[0].sum()
    ch=[(m[i]^m[0]).sum()/area*100 for i in range(len(m))]
    print(f"{c.split('/')[-1]:24s} mask_max={max(ch):5.1f} mean={np.mean(ch):5.1f}",flush=True)
