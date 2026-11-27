# Appends the 27.11 (Maxim 04:08) section to cards/higher/<god>.md: the take per slot now, the cut, release points, notes.
import json, os
R = json.load(open('rel.json')); N = json.load(open('notes.json')); O = json.load(open('cut3_opts.json'))
CARDS = '/home/claude/gods-anim-lab/cards/higher'
for f in sorted(os.listdir(CARDS)):
    g = f[:-3]; p = os.path.join(CARDS, f); s = open(p).read()
    mark = '\n## 27.11 — after Maxim 04:08'
    if mark in s: s = s[:s.index(mark)]
    m = json.load(open(f'v5/{g}.json')); r = R.get(g, {}).get('atk', {})
    L = [mark.strip(), '', 'This section is current; where the text above differs (takes, release points, game_fx), it describes the work before', 'his remarks of 04:08.', '', 'All three sheets re-cut with matte v3 (`pipeline/hg/matte3.py`, `hgcut3.py`; anything that runs out of a side of the',
         'video dissolves over 6 % of the width).' + (' Protected take (accepted 01:29): re-cut only, the same 25 moments.' if g in ('order', 'plague', 'fate', 'life') else ''), '']
    for s_, ru in (('idle', 'idle'), ('app', 'entrance'), ('atk', 'skill')):
        k = m[s_]; o = {**O.get(g, {}).get('*', {}), **O.get(g, {}).get(s_, {})}
        L.append(f"- {ru}: take `{k['clip']}`; sheet {k['fw']}×{k['fh']}, {k['kb']} KB, {k['ramMB']} MB" + (f"; options {o}" if o else ''))
    if r:
        L.append(f"- release: frame {r['rel']} wf {r['wf']}" + (f"; frame {r.get('rel2', r['rel'])} wf2 {r['wf2']}" if 'wf2' in r else '')
                 + (f"; frame {r.get('rel3', r['rel'])} wf3 {r['wf3']}" if 'wf3' in r else ''))
    if N.get(g): L += ['', 'Notes on the stand now (Russian):'] + ['- ' + x for x in N[g]]
    open(p, 'w').write(s.rstrip('\n') + '\n\n' + '\n'.join(L) + '\n')
    print(g, end=' ')
