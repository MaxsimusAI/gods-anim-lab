import json,sys
p=json.load(open('/home/claude/kl/b3/p8.json')); u=json.load(open('/home/claude/kl/tight/urls.json'))
ks=list(p)[int(sys.argv[1]):int(sys.argv[2])]
for k in ks:
    g=k.rsplit('_',1)[0]; print('##',k); print('URL',u[g]); print(p[k]); print()
