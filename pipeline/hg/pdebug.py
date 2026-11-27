# stages of parts() for one frame: python3 pdebug.py god slot k out.jpg  (gray = no; white = yes) panels: frame | mask m | content | glow | body1 | matter-grown | holes | final body
import json, os, sys, numpy as np
sys.path.insert(0, '.')
from PIL import Image
from scipy import ndimage as ndi
import matte3
from masks import mask_of
g_, s_, k_, o_ = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
M = json.load(open(f'v5/{g_}.json'))[s_]; clip = M['clip']; fs = sorted(os.listdir('fr/' + clip)); i = M['idx'][k_]
O = json.load(open('cut3_opts.json')); o3 = {'ds': 1, 'g2': 0, **O.get(g_, {}).get('*', {}), **O.get(g_, {}).get(s_, {})}
a = np.asarray(Image.open(f'fr/{clip}/{fs[i]}').convert('RGB')).astype(np.float32); g = np.array([125, 125, 125], np.float32)
m = mask_of(clip, i, a)
src = open('matte3.py').read(); body_src = src[src.index('def parts'):src.index('def fill_ok')]
# instrument: record intermediate arrays
body_src = body_src.replace("    body = np.clip(m, 0, 1) * content * ~glow * ~smoke\n", "    body = np.clip(m, 0, 1) * content * ~glow * ~smoke\n    DBG['content']=content; DBG['glow']=glow; DBG['body1']=body.copy()\n")
body_src = body_src.replace("    holes = ndi.binary_fill_holes(solid)", "    DBG['matter']=body.copy()\n    holes = ndi.binary_fill_holes(solid)")
body_src = body_src.replace("    body = np.where(holes, np.maximum(body, content), body)\n", "    DBG['holes']=holes.copy()\n    body = np.where(holes, np.maximum(body, content), body)\n")
NS = {'np': np, 'ndi': ndi, 'smooth': matte3.smooth, 'DBG': {}}; exec(body_src, NS)
fx, b = NS['parts'](a, m, g, desmoke=bool(o3['ds']), glow2=bool(o3['g2'])); D = NS['DBG']
pan = [a, m, D['content'], D['glow'].astype(float), D['body1'], D['matter'], D['holes'].astype(float), b]
ims = []
for p in pan:
    if p.ndim == 2: p = np.dstack([np.clip(p, 0, 1) * 255] * 3)
    ims.append(Image.fromarray(p.astype(np.uint8)).resize((a.shape[1] // 4, a.shape[0] // 4)))
S = Image.new('RGB', (ims[0].width * 4 + 12, ims[0].height * 2 + 4), (255, 0, 0))
for j, im in enumerate(ims): S.paste(im, ((j % 4) * (ims[0].width + 4), (j // 4) * (ims[0].height + 4)))
S.save(o_)
