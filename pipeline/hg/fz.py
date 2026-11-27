# zoom some frames of a sheet on the dark background: python3 fz.py god slot out.jpg k1 k2 ...
import json, sys
from PIL import Image
g, s, o = sys.argv[1:4]; ks = [int(x) for x in sys.argv[4:]]
m = json.load(open(f'v5/{g}.json'))[s]; im = Image.open(f'v5/{g}-bt-{s}.webp').convert('RGBA')
fw, fh = m['fw'], m['fh']; cols = im.width // fw; z = 2 if len(ks) <= 3 else 1.5
S = Image.new('RGBA', (int(fw * z) * len(ks) + 8 * len(ks), int(fh * z)), (255, 255, 255, 255))
for j, k in enumerate(ks):
    r, c = divmod(k, cols); f = im.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh)).resize((int(fw * z), int(fh * z)))
    B = Image.new('RGBA', f.size, (28, 24, 44, 255)); B.alpha_composite(f); S.alpha_composite(B, (j * (int(fw * z) + 8), 0))
S.convert('RGB').save(o, quality=88); print(m['crop'])
