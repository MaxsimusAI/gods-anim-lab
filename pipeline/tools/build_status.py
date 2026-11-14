#!/usr/bin/env python3
"""build_status.py -> assets/status-data.js : one status per clip for the status map on the stand, plus a stamp per clip.
Sources, later ones win: work/status_first16.json (gods 1-16, from the records) < every pipeline/r<N>/ledger.json in the
order of N (fresh-eyes verdicts) < work/status_overrides.json (clips Maxim accepted, new takes he has not seen).
Codes: ok = accepted by Maxim | new = new take, waits for his look | look = questionable, his look decides |
       fine = the review found nothing | redo = fails the rules, to re-shoot | none = no clip.
A clip that has a published sheet but no record becomes 'look' (with a warning), never 'none'.
CLIP_STAMP = size of the published sheet in KB: Maxim's mark in the browser counts only for the take it was made on."""
import json, os, glob, re, collections
K = os.environ.get('KL_HERE', '/home/claude/kl/work'); R = os.environ.get('KL_REPO', '/home/claude/gods-anim-lab')
CODES = {'ok', 'new', 'look', 'fine', 'redo', 'none'}
gods = list(json.load(open(os.path.join(K, 'kling_done.json'), encoding='utf-8'))['gods'])
pub = json.load(open(os.path.join(K, 'metrics_pub.json'), encoding='utf-8'))
S = {g: {} for g in gods}
def put(clip, code, src):
    if clip.startswith('_'): return
    parts = clip.rsplit('_', 2)
    if len(parts) != 3 or parts[1] not in ('bt', 'ti') or parts[2] not in ('idle', 'atk', 'sup', 'hyp'):
        raise SystemExit(f'{src}: bad clip id {clip!r}')
    if code not in CODES: raise SystemExit(f'{src}: bad status {code!r} for {clip}')
    if parts[0] in S: S[parts[0]][parts[1] + '_' + parts[2]] = code
for g, v in json.load(open(os.path.join(K, 'status_first16.json'), encoding='utf-8')).items():
    if g.startswith('_'): continue
    for k, code in v.items(): put(g + '_' + k, code, 'status_first16.json')
ledgers = glob.glob(os.path.join(R, 'pipeline', 'r*', 'ledger.json'))
for lp in sorted(ledgers, key=lambda p: int(re.search(r'[/\\]r(\d+)[/\\]ledger\.json$', p).group(1))):
    for clip, v in json.load(open(lp, encoding='utf-8')).items():
        if clip.startswith('_'): continue
        take = (v[1].split() or ['?'])[0] if len(v) > 1 and isinstance(v[1], str) else '?'
        put(clip, {'PASS': 'fine', 'WATCH': 'look', 'FAIL': 'redo'}.get(take, 'look'), os.path.relpath(lp, R))
op = os.path.join(K, 'status_overrides.json')
if os.path.exists(op):
    for clip, code in json.load(open(op, encoding='utf-8')).items(): put(clip, code, 'status_overrides.json')
stamp = {}
for g in gods:
    for st in ('bt', 'ti'):
        for sl in ('idle', 'atk', 'sup', 'hyp'):
            k = st + '_' + sl; clip = g + '_' + k; has = clip in pub
            if k not in S[g]:
                S[g][k] = 'look' if has else 'none'
                if has: print('WARNING: published clip without a status record ->', clip, "shown as 'look'")
            if has and S[g][k] != 'none':
                stamp[clip] = int(round(float((pub[clip].get('mob') or {}).get('kb') or 0)))
out = os.path.join(R, 'assets', 'status-data.js')
open(out, 'w', encoding='utf-8').write('window.CLIP_STATUS = ' + json.dumps(S, ensure_ascii=False, separators=(',', ':')) + ';\n'
                                       'window.CLIP_STAMP = ' + json.dumps(stamp, separators=(',', ':')) + ';\n')
c = collections.Counter(x for g in S.values() for x in g.values()); print('status-data.js:', len(S), 'gods', dict(c), len(stamp), 'stamps')
