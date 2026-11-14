# relview.py out.jpg <god_style_slot>... [--s=1.0] [--d=3]: frames impact-d, impact, impact+d of each published sheet; red cross = wf
import sys, json
from PIL import Image, ImageDraw
args = [a for a in sys.argv[2:] if not a.startswith('--')]; opt = dict(a[2:].split('=') for a in sys.argv[2:] if a.startswith('--'))
S = float(opt.get('s', 1)); dd = int(opt.get('d', 3)); out = sys.argv[1]
s = open('/home/claude/fxwork/assets/gods-data.js').read(); D = json.loads(s[s.find('{'):s.rfind('}') + 1]); cells = []
for c in args:
    g, st, sl = c.split('_'); m = dict(D['simGodDataMap'][g]['newBt' if st == 'bt' else 'newTi']['slots'][sl]); m.update(m['mob'])
    sh = Image.open('/home/claude/fxwork/assets/sheets/' + m['file'].split('?')[0]).convert('RGBA'); w, h, k = m['w'], m['h'], m['impact']
    for kk in (max(0, k - dd), k, min(24, k + dd)):
        fr = sh.crop(((kk % 5) * w, (kk // 5) * h, (kk % 5) * w + w, (kk // 5) * h + h)); W, H = int(w * S), int(h * S)
        cell = Image.new('RGBA', (W, H), (40, 46, 62, 255)); cell.alpha_composite(fr.resize((W, H))); cell = cell.convert('RGB'); d = ImageDraw.Draw(cell)
        if kk == k and m.get('wf'):
            x, y = m['wf'][0] * W, m['wf'][1] * H; d.line([(x - 6, y), (x + 6, y)], fill=(255, 60, 60), width=2); d.line([(x, y - 6), (x, y + 6)], fill=(255, 60, 60), width=2)
        d.text((2, 1), f"{g[:6]} {st} f{kk}", fill=(255, 255, 0)); cells.append(cell)
    print(c, 'impact', k, 'rel', m['rel'], 'wf', m.get('wf'), 'ho', json.dumps(m.get('ho'))[:80] if m.get('ho') else None)
Hm = max(c.height for c in cells); o = Image.new('RGB', (sum(c.width + 3 for c in cells), Hm), (255, 255, 255)); x = 0
for c in cells: o.paste(c, (x, 0)); x += c.width + 3
o.save(out, quality=82); print(o.size)
