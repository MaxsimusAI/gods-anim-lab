# led.py: update pipeline/r9/fx_ledger.json. python3 led.py <clip[,clip...]> <done|partly|not done> "<what>" "<checked>"   |   python3 led.py _timing "<text>"   |   python3 led.py --stat
import json, sys, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fx_ledger.json')
L = json.load(open(P)) if os.path.exists(P) else {}
a = sys.argv[1:]
if a[0] == '--stat':
    c = {}
    for k, v in L.items():
        if k[0] != '_': c.setdefault(v['status'], []).append(k)
    for s, ks in c.items(): print(s, len(ks), ' '.join(sorted(ks)) if s != 'done' else '')
elif a[0][0] == '_': L[a[0]] = a[1]
else:
    for c in a[0].split(','):
        e = L.get(c, {}); e['status'] = a[1]
        e['what'] = (e['what'] + ' | ' if e.get('what') and len(a) > 4 else '') + a[2]
        e['checked'] = (e['checked'] + ' | ' if e.get('checked') and len(a) > 4 else '') + a[3]
        L[c] = e
json.dump(L, open(P, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
