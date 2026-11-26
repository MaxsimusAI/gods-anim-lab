import sys, json
from PIL import Image, ImageDraw
sheet, meta, slot, a, b, out = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
m = json.load(open(meta))[slot]; fw, fh = m['fw'], m['fh']; S = Image.open(sheet)
n = b - a + 1; O = Image.new('RGB', (fw * n, fh), (0, 0, 0))
for k, i in enumerate(range(a, b + 1)):
    f = S.crop(((i % 5) * fw, (i // 5) * fh, (i % 5 + 1) * fw, (i // 5 + 1) * fh)); bg = Image.new('RGBA', (fw, fh), (30, 28, 40, 255)); bg.alpha_composite(f); d = ImageDraw.Draw(bg)
    for g in range(1, 10):
        d.line([(0, g * fh / 10), (fw, g * fh / 10)], fill=(80, 80, 80, 255)); d.line([(g * fw / 10, 0), (g * fw / 10, fh)], fill=(80, 80, 80, 255))
    d.text((4, 4), str(i), fill=(255, 255, 0, 255)); O.paste(bg.convert('RGB'), (k * fw, 0))
O.save(out, quality=88)
