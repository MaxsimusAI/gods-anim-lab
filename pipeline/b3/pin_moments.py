# pin_moments.py clip... : before a sharp re-cut of a PUBLISHED take that has no manual frame override, pin its 25 moments:
# the automatic choice is repeated the old way (frames 420 px high, no denoise) and written to impact_overrides.json as
# "idx" (25 video frames) + "k" (the published release frame) + "fit" (whole window, largest scale that fits; skill B3).
# Clips that already have imp/k/v0/v1 only get "fit". Idles are skipped (always an even spread).
import sys, os, json, subprocess, tempfile, shutil, importlib.util
K='/home/claude/kl'; os.environ.setdefault('KL_HERE', K+'/work')
spec=importlib.util.spec_from_file_location('ab', K+'/tools/adapt_batch.py'); ab=importlib.util.module_from_spec(spec)
sys.modules['ab']=ab; av=sys.argv; sys.argv=['adapt_batch.py']; spec.loader.exec_module(ab); sys.argv=av
P=K+'/work/impact_overrides.json'; O=json.load(open(P)); M=json.load(open(K+'/work/metrics_pub.json'))
for c in sys.argv[1:]:
    if c.endswith('_idle'): continue
    o=O.setdefault(c,{})
    if 'imp' not in o and 'idx' not in o:
        d=tempfile.mkdtemp()
        subprocess.run(['ffmpeg','-v','error','-y','-i',f'{K}/b2/mp4/{c}.mp4','-vf','scale=-2:420:flags=lanczos',d+'/f_%03d.png'],check=True)
        fs=sorted(f for f in os.listdir(d) if f.endswith('.png'))
        ab.OVR.pop(c,None)
        o['idx']=[int(x) for x in ab.select_25_indices(fs,d,is_idle=False,clip_id=c)]
        shutil.rmtree(d)
        if c in M and 'impact' in M[c]: o['k']=int(M[c]['impact'])
    o['fit']=True
    print(c,o)
json.dump(O,open(P,'w'),indent=1)
