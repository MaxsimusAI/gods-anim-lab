# need_idx.py clip raw_dir -> comma list of the video frames the cutter will use (0 + the 25 moments), or nothing when the
# choice is automatic (then every frame is prepared). Used by sharp_batch.sh to prepare only the frames that are cut.
import sys, os, json, numpy as np
c, d = sys.argv[1:3]; n = len([f for f in os.listdir(d) if f.endswith('.png')])
o = json.load(open('/home/claude/kl/work/impact_overrides.json')).get(c, {})
if c.endswith('_idle') or n <= 26: idx = np.linspace(0, n - 1, 25).round().astype(int).tolist()
elif 'idx' in o: idx = [min(n - 1, max(0, int(x))) for x in o['idx']]
elif 'imp' in o:
    v0 = int(o.get('v0', 0)); v1 = int(o.get('v1', n - 1)); k = int(o['k']); imp = int(o['imp'])
    pre = list(range(v0, imp + 1)); post = list(range(imp, v1 + 1))
    a = [pre[int(round(t))] for t in np.linspace(0, len(pre) - 1, k + 1)]; b = [post[int(round(t))] for t in np.linspace(0, len(post) - 1, 25 - k)]
    idx = [min(n - 1, max(0, x)) for x in a + b[1:]]
else: idx = None
if idx is not None: print(','.join(str(x) for x in sorted(set([0] + idx))))
