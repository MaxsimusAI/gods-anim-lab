# frames whose solid content runs into a side edge of the video (only the short 28-px fade): python3 edges.py [dir]
import json, numpy as np, glob, os, sys
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else 'v5'
for jf in sorted(glob.glob(f'{D}/*.json')):
    g = os.path.basename(jf)[:-5]; M = json.load(open(jf))
    if 'idle' not in M: continue
    out = []
    for s in ('idle', 'app', 'atk'):
        m = M[s]; im = np.asarray(Image.open(f'{D}/{g}-bt-{s}.webp').convert('RGBA'))
        fw, fh = m['fw'], m['fh']; cols = im.shape[1] // fw; x0, y0, x1, y1 = m['crop']; sc = fw / (x1 - x0)
        c = int(round(30 * sc)) + 1; fr0 = sorted(os.listdir(f'fr/{m["clip"]}'))[0]; W = Image.open(f'fr/{m["clip"]}/{fr0}').width
        hits = []
        for k in range(25):
            r, cc = divmod(k, cols); a = im[r * fh:(r + 1) * fh, cc * fw:(cc + 1) * fw, 3]
            cut = lambda col: (col(c) > 200) & (col(c // 2) > 0.55 * 255 * (c // 2) / c) & (col(2) > 0.4 * 255 * 2 / c)
            L = cut(lambda k: a[:, k].astype(float)).sum() if x0 == 0 else 0
            R = cut(lambda k: a[:, fw - 1 - k].astype(float)).sum() if x1 >= W - 1 else 0
            if L > 6 or R > 6: hits.append(k)
        if hits: out.append(f"{s}:{len(hits)}fr {hits[0]}-{hits[-1]}")
    print(g, M.get('matte', 'old'), ' '.join(out))
