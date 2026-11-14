# setrel.py clip=release,x,y ... : set the release frame (sheet index) and the effect origin wf of an already cut sheet, read by
# eye by the stage-2 reviewer (skill: "release frame and wf set by eye"). No re-cut: only the metrics and the overrides change.
import sys, json
MP='/home/claude/kl/work/adapted_all_metrics.json'; OP='/home/claude/kl/work/impact_overrides.json'
M=json.load(open(MP)); O=json.load(open(OP))
for a in sys.argv[1:]:
    c,v=a.split('='); k,x,y=v.split(','); k=int(k); x=float(x); y=float(y)
    m=M[c]; f=m['fig']; w,h=m['mob']['w'],m['mob']['h']; bh=max(24.0,(f['foot']-f['top'])*h)
    m['impact']=k; m['rel']=round(k/24.0,3); m['wf']=[round(x,3),round(y,3)]; m['wpt']=[round((x-f['ax'])*w/bh,3),round((y-f['foot'])*h/bh,3)]
    O.setdefault(c,{})['wf']=[x,y]; O[c]['rel_by_eye']=k
    print(c,'impact',k,'rel',m['rel'],'wf',m['wf'])
json.dump(M,open(MP,'w'),indent=2); json.dump(O,open(OP,'w'),indent=1)
