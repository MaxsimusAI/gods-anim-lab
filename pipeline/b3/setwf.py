# setwf.py clip=x,y ... : set the effect origin (fraction of the sheet frame, read with b3/wfview.py) in the overrides AND in the
# metrics of an already cut sheet (same formula as the adapter), so no re-cut is needed. Never run while the adapter is running.
import sys, json
MP='/home/claude/kl/work/adapted_all_metrics.json'; OP='/home/claude/kl/work/impact_overrides.json'
M=json.load(open(MP)); O=json.load(open(OP))
for a in sys.argv[1:]:
    c,v=a.split('='); x,y=[float(t) for t in v.split(',')]
    O.setdefault(c,{})['wf']=[x,y]; m=M[c]; f=m['fig']; w,h=m['mob']['w'],m['mob']['h']; bh=max(24.0,(f['foot']-f['top'])*h)
    m['wf']=[round(x,3),round(y,3)]; m['wpt']=[round((x-f['ax'])*w/bh,3),round((y-f['foot'])*h/bh,3)]
    print(c,m['wf'],m['wpt'])
json.dump(M,open(MP,'w'),indent=2); json.dump(O,open(OP,'w'),indent=1)
