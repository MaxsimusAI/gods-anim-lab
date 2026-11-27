# frames cut without / with gray_smoke: python3 gstest.py god slot out.jpg k1 k2 ...
import json, os, sys, numpy as np
sys.path.insert(0, '.')
from PIL import Image
from matte3 import parts, compose
from masks import mask_of
g_, s_, o_ = sys.argv[1:4]; ks = [int(x) for x in sys.argv[4:]]
M = json.load(open(f'v5/{g_}.json'))[s_]; clip = M['clip']; fs = sorted(os.listdir('fr/' + clip)); x0, y0, x1, y1 = M['crop']
O = json.load(open('cut3_opts.json')); o3 = {'ds': 1, 'g2': 0, **O.get(g_, {}).get('*', {}), **O.get(g_, {}).get(s_, {})}
g = np.array([125, 125, 125], np.float32); rows = []
for gs in (0, int(__import__('os').environ.get('GS','1'))):
    row = []
    for k in ks:
        i = M['idx'][k]; a = np.asarray(Image.open(f'fr/{clip}/{fs[i]}').convert('RGB')).astype(np.float32)
        fx, b = parts(a, mask_of(clip, i, a), g, desmoke=bool(o3['ds']), glow2=bool(o3['g2']), gray_smoke=gs)
        im = Image.fromarray(compose(a, g, fx, b), 'RGBA').crop((x0, y0, x1, y1)); B = Image.new('RGBA', im.size, (28, 24, 44, 255)); B.alpha_composite(im)
        row.append(B.convert('RGB').resize((im.width * 360 // im.height, 360)))
    rows.append(row)
w = rows[0][0].width; S = Image.new('RGB', ((w + 6) * len(ks), 726), (255, 255, 255))
for r, row in enumerate(rows):
    for j, im in enumerate(row): S.paste(im, (j * (w + 6), r * 366))
S.save(o_, quality=88)
