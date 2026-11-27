# keep the release points on the same spot of the video when a skill sheet's crop moved: python3 remapwf.py old_crops.json
import json, sys
C0 = json.load(open(sys.argv[1])); R = json.load(open('rel.json'))
for g, c0 in C0.items():
    c1 = json.load(open(f'v5/{g}.json'))['atk']['crop']; r = R.get(g, {}).get('atk')
    if not r or c1 == c0: continue
    for k in ('wf', 'wf2', 'wf3'):
        if k in r:
            vx = c0[0] + r[k][0] * (c0[2] - c0[0]); vy = c0[1] + r[k][1] * (c0[3] - c0[1])
            r[k] = [round((vx - c1[0]) / (c1[2] - c1[0]), 3), round((vy - c1[1]) / (c1[3] - c1[1]), 3)]
    print(g, c0, '->', c1, r)
json.dump(R, open('rel.json', 'w'), indent=1)
