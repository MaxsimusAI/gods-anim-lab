# the same frames from two sheet folders, one row each: python3 fz2.py god slot out.jpg dirA dirB k1 k2 ...
import json, sys
from PIL import Image
g, s, o, A, B = sys.argv[1:6]; ks = [int(x) for x in sys.argv[6:]]
rows = []
for D in (A, B):
    m = json.load(open(f'{D}/{g}.json'))[s]; im = Image.open(f'{D}/{g}-bt-{s}.webp').convert('RGBA'); fw, fh = m['fw'], m['fh']; cols = im.width // fw
    row = []
    for k in ks:
        r, c = divmod(k, cols); f = im.crop((c * fw, r * fh, (c + 1) * fw, (r + 1) * fh)).resize((int(fw * 1.4), int(fh * 1.4)))
        Bg = Image.new('RGBA', f.size, (28, 24, 44, 255)); Bg.alpha_composite(f); row.append(Bg.convert('RGB'))
    rows.append(row)
w, h = rows[0][0].width, rows[0][0].height; S = Image.new('RGB', ((w + 6) * len(ks), (h + 6) * 2), (255, 255, 255))
for r, row in enumerate(rows):
    for j, im in enumerate(row): S.paste(im.resize((w, h)), (j * (w + 6), r * (h + 6)))
S.save(o, quality=88)
