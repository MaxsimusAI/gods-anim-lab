# livecut.py god... : the live game's phone sheets of a higher goddess (idolrpg art/mob/hg, 5x5) for the «В игре сейчас» cell.
# Frame size = sheet / 5; durations from src/ui/sheets.js (idle dur, atk play); figure box measured on frame 0 (alpha > 128).
# HG_USE_INV goddesses (sheets.js): the game plays the invoke sheet in the strike slot, so the cell shows that one.
import sys, re, json, shutil, numpy as np
from PIL import Image
G = '/home/claude/idolrpg'; R = '/home/claude/gods-anim-lab'
src = open(f'{G}/src/ui/sheets.js', encoding='utf-8').read()
def meta(god, slot):
    a = src.index(f"'hg:{god}'"); b = src.index(f'{slot}:', a); line = src[b:src.index('\n', b)]
    return float(re.search(r'(?:dur|play):([\d.]+)', line).group(1))
INV = set(re.search(r"HG_USE_INV = new Set\(\[([^\]]*)\]", src).group(1).replace("'", '').replace(' ', '').split(','))
for god in sys.argv[1:]:
    out = {}
    for slot in ('idle', 'atk'):
        gs = 'inv' if slot == 'atk' and god in INV else slot
        p = f'{G}/art/mob/hg/{god}-' + ('invoke' if gs == 'inv' else slot) + '.webp'; im = Image.open(p).convert('RGBA'); fw, fh = im.width // 5, im.height // 5
        a = np.asarray(im.crop((0, 0, fw, fh)))[..., 3] > 128; ys = np.where(a.any(1))[0]; xs = np.where(a.any(0))[0]
        fig = {'top': round(ys.min() / fh, 4), 'foot': round((ys.max() + 1) / fh, 4), 'ax': round((xs.min() + xs.max()) / 2 / fw, 4)}
        dst = f'assets/hg/live/{god}-{slot}.webp'; shutil.copy(p, f'{R}/{dst}')
        out[slot] = {'src': dst, 'cols': 5, 'rows': 5, 'n': 25, 'fw': fw, 'fh': fh, 'dur': meta(god, gs), 'fig': fig}
    json.dump(out, open(f'live_{god}.json', 'w')); print(god, out['idle']['fw'], out['idle']['fh'], out['idle']['dur'], out['atk']['dur'], out['idle']['fig'])
