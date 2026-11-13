import json,os,sys
p='/home/claude/kl/jobs_rt9.json'
d=json.load(open(p)) if os.path.exists(p) else {}
for l in sys.stdin:
    l=l.split()
    if len(l)==2: d[l[0]]=l[1]
json.dump(d,open(p,'w'),indent=0); print(len(d))
