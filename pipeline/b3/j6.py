# python3 b3/j4.py key=id key=id ...  -> jobs_batch6.json
import sys,json,os
p='/home/claude/kl/jobs_batch6.json'; j=json.load(open(p)) if os.path.exists(p) else {}
for a in sys.argv[1:]:
    k,v=a.split('=',1); j[k]=v
json.dump(j,open(p,'w'),indent=1); print(len(j))
