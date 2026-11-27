# copy finished v3 cuts into v5/ (old v5 kept in v5_prev/) when every slot uses the clip the goddess should use now
import json, shutil, os, sys
os.makedirs('v5_prev', exist_ok=True)
for g in sys.argv[1:]:
    if not os.path.exists(f'sheets3/{g}.json'): print(g, 'not cut'); continue
    n = json.load(open(f'sheets3/{g}.json')); o = json.load(open(f'v5/{g}.json'))
    bad = [s for s in ('idle', 'app', 'atk') if n[s]['clip'] != o[s]['clip'] and n.get('matte') != o.get('matte')]
    if bad: print(g, 'clip differs', bad, [(n[s]['clip'], o[s]['clip']) for s in bad]); continue
    if o.get('matte') != 'v3':
        for f in [f'{g}.json'] + [f'{g}-bt-{s}.webp' for s in ('idle', 'app', 'atk')]: shutil.copy(f'v5/{f}', f'v5_prev/{f}')
    for f in [f'{g}.json'] + [f'{g}-bt-{s}.webp' for s in ('idle', 'app', 'atk')]: shutil.copy(f'sheets3/{f}', f'v5/{f}')
    print(g, 'synced')
