# fxframe.py <clip> <video frame> [ds g2 gs kp] : one matted full-size clip frame (matte v3, as hgcut3) -> fxsrc/<clip>_<n>.png
import sys, os, numpy as np
from PIL import Image
from matte3 import bg_gray, parts, compose
from masks import mask_of
clip, n = sys.argv[1], int(sys.argv[2]); o = [int(x) for x in sys.argv[3:7]] if len(sys.argv) > 6 else [1, 0, 0, 0]
d = f'fr/{clip}'; fs = sorted(os.listdir(d))
A = np.asarray(Image.open(f'{d}/{fs[n]}').convert('RGB')).astype(np.float32)
g = bg_gray([np.asarray(Image.open(f'{d}/{fs[i]}').convert('RGB')).astype(np.float32) for i in range(0, len(fs), 12)])
fx, body = parts(A, mask_of(clip, n, A), g, desmoke=bool(o[0]), glow2=bool(o[1]), gray_smoke=o[2], keep_pieces=bool(o[3]))
out = compose(A, g, fx, body); os.makedirs('fxsrc', exist_ok=True); os.makedirs('fxcut', exist_ok=True)
p = f'fxsrc/{clip}_{n:03d}.png'; Image.fromarray(out.astype(np.uint8), 'RGBA').save(p); print(p, out.shape)
