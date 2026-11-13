import json,sys
P=json.load(open('/home/claude/kl/b3/p7.json')); U=json.load(open('/home/claude/kl/tight/urls.json'))
ks=list(P)[int(sys.argv[1]):int(sys.argv[2])]
for k in ks:
    g,s=k.split('_')[:2]; print('##',k); print('URL',U[f'{g}_{s}']); print(P[k]); print()
