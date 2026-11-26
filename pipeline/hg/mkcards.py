# Writes cards/higher/<god>.md for the 16 goddesses of 27.11 from the pipeline data.
import json, sys, importlib.util, os
spec = importlib.util.spec_from_file_location('hgd', 'hgdata.py'); src = open('hgdata.py').read()
NEW = eval(src[src.index('NEW = [') + 6: src.index('\n]', src.index('NEW = [')) + 2])
P = json.load(open('picks_v5b.json')); R = json.load(open('rel.json')); N = json.load(open('notes.json'))
O = json.load(open('cut_opts.json'))
out = sys.argv[1]
for gid, ru, skill, desc, fx in NEW:
    p = P[gid]; r = R.get(gid, {}).get('atk', {}); m = json.load(open(f'v5/{gid}.json'))
    def take(s):
        v = p[s]; return f"v5{v}" + (" (retake 1)" if v.startswith('r') else '')
    L = [f"# {gid.capitalize()} ({ru}) — higher goddess, BT", '',
         f"Skill «{skill}»: {desc}", '',
         'Made 27.11 after Maxim 01:29 «Давай теперь делай всех богов, пока только для битвы титанов». Kling 4.0, 3 s, 720p,',
         '2 variants per job; prompts `pipeline/hg/prompts/' + gid + '_bt_{idle,app,atk}_v5*.txt`; job ids `pipeline/hg/kling_tasks_2611.json`.',
         'Status of all three clips and the game effect: published 27.11, waits for his look.', '']
    for s, ru_s in (('idle', 'idle'), ('app', 'entrance'), ('atk', 'skill')):
        k = m[s]; opt = O.get(gid, {}).get(s)
        L.append(f"clip: {gid}_bt_{s} — take {take(s)}; sheet {k['fw']}×{k['fh']}" + (f"; cut with {opt}" if opt else ''))
    if r:
        L.append('')
        L.append(f"release: sheet frame {r['rel']}; wf {r['wf']}" + (f"; frame {r.get('rel2', r['rel'])} wf2 {r['wf2']}" if 'wf2' in r else '')
                 + (f"; frame {r.get('rel3', r['rel'])} wf3 {r['wf3']}" if 'wf3' in r else ''))
    L += ['', 'game_fx (as on the stand, Russian):', fx, '', 'notes on the stand (Russian):']
    L += ['- ' + x for x in N.get(gid, [])]
    open(os.path.join(out, gid + '.md'), 'w').write('\n'.join(L) + '\n')
    print(gid, end=' ')
