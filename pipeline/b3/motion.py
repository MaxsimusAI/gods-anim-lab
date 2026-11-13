import sys, subprocess, numpy as np
def load(c):
    p=subprocess.run(['ffmpeg','-v','error','-i',f'b2/mp4/{c}.mp4','-vf','scale=160:-2,format=gray','-f','rawvideo','-'],capture_output=True).stdout
    pr=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',f'b2/mp4/{c}.mp4'],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(pr[0]),int(pr[1]); hh=int(round(h*160/w/2))*2
    a=np.frombuffer(p,np.uint8).reshape(-1,hh,160).astype(np.float32); return a
for c in sys.argv[1:]:
    a=load(c); d0=np.abs(a-a[0]).mean(axis=(1,2)); dd=np.abs(a[1:]-a[:-1]).mean(axis=(1,2))
    # split in 6 segments, mean inter-frame motion per segment
    seg=[dd[i*12:(i+1)*12].mean() for i in range(6)]
    print(f"{c:22s} maxd0={d0.max():5.2f} meand0={d0.mean():5.2f} seg="+" ".join(f"{s:4.2f}" for s in seg))
