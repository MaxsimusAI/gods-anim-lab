# compare the old cut with matte v3 on chosen frames: python3 m3test.py <god> <slot> <out.jpg> [k0 k1 ...] (k = sheet frame 0..24)
import sys, os, json, numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/hgk')
from matte3 import bg_gray, parts, temporal_fill, compose
from masks import mask_of
god, slot, out = sys.argv[1], sys.argv[2], sys.argv[3]
M = json.load(open(f'v5/{god}.json'))[slot]; clip, idx = M['clip'], M['idx']
ks = [int(k) for k in sys.argv[4:]] or list(range(25))
fs = sorted(os.listdir(f'fr/{clip}'))
need = sorted(set(k2 for k in ks for k2 in (k - 1, k, k + 1) if 0 <= k2 < 25))
A = {k: np.asarray(Image.open(f'fr/{clip}/{fs[idx[k]]}').convert('RGB')).astype(np.float32) for k in need}
g = bg_gray([A[k] for k in need]); print('bg', g)
P = {k: parts(A[k], mask_of(clip, idx[k], A[k]), g, desmoke=os.environ.get('DS') == '1', glow2=os.environ.get('G2') == '1') for k in need}
bodies = {k: P[k][1] for k in need}
rows = []
for k in ks:
    b = bodies[k]
    if k - 1 in bodies and k + 1 in bodies:
        from matte3 import fill_ok
        b = np.maximum(b, np.minimum(bodies[k - 1], bodies[k + 1]) * fill_ok(A[k], g))
    new = compose(A[k], g, P[k][0], b)
    old = M['file']
    sh = Image.open(f'v5/{god}-bt-{slot}.webp').convert('RGBA'); fw, fh = M['fw'], M['fh']
    oldf = sh.crop(((k % 5) * fw, (k // 5) * fh, (k % 5 + 1) * fw, (k // 5 + 1) * fh))
    x0, y0, x1, y1 = M['crop']; nf = Image.fromarray(new, 'RGBA').crop((x0, y0, x1, y1)).resize((fw, fh), Image.LANCZOS)
    pair = []
    for im in (oldf, nf):
        bg = Image.new('RGBA', im.size, (32, 26, 48, 255)); bg.alpha_composite(im); pair.append(bg.convert('RGB'))
    rows.append(pair)
w, h = rows[0][0].size; S = Image.new('RGB', (w * len(rows), h * 2), (0, 0, 0))
for i, (o, n) in enumerate(rows): S.paste(o, (i * w, 0)); S.paste(n, (i * w, h))
S.save(out, quality=88); print('top = now, bottom = v3')
