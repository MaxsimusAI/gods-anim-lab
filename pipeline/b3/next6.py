import json,os,sys
n=int(sys.argv[1]) if len(sys.argv)>1 else 4
d=json.load(open('/home/claude/kl/jobs_batch6.json'))
bad=set(open('/home/claude/kl/b3/fail6.txt').read().split()) if os.path.exists('/home/claude/kl/b3/fail6.txt') else set()
left=[k for k in d if not os.path.exists(f'/home/claude/kl/b3/prev/{k}.done') and k not in bad]
print(len(left),'left')
for k in left[:n]: print(k,d[k])
