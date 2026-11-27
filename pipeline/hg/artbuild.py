# artbuild.py <out dir>: the files of the Claude artifact «Высшие богини · анимации Kling» (higher.html as index.html, the data,
# the stand and every picture they use), with the ?v= stamps taken out (the artifact serves each version whole).
import json, os, re, shutil, sys
REPO = '/home/claude/gods-anim-lab'; out = sys.argv[1]
s = open(f'{REPO}/assets/hg/hg-data.js').read(); i = s.index('const HG = ') + len('const HG = ')
arr, _ = json.JSONDecoder().raw_decode(s[i:]); st = open(f'{REPO}/assets/hg/hg-stand.js').read()
used = {sh['src'].split('?')[0] for G in arr for grp in ('nu', 'live') for sh in (G.get(grp) or {}).values()}
used |= {f'assets/hg/new/{n}.webp' for n in re.findall(r"NEW\('([^']+)'\)", st)}
used |= set(re.findall(r'assets/hg/new/[\w-]+\.webp', st))   # the effect pictures of Order, Plague, Fate, Life are written out in full
for u in sorted(used): os.makedirs(os.path.dirname(f'{out}/{u}'), exist_ok=True); shutil.copy(f'{REPO}/{u}', f'{out}/{u}')
open(f'{out}/assets/hg/hg-data.js', 'w').write(re.sub(r'\.webp\?v=\d+', '.webp', s))
st2 = st.replace("`assets/hg/new/${n}.webp?v=${typeof HG_V === 'undefined' ? 0 : HG_V}`", "`assets/hg/new/${n}.webp`")
assert st2 != st; open(f'{out}/assets/hg/hg-stand.js', 'w').write(st2)
h = open(f'{REPO}/higher.html').read(); h = re.sub(r'(assets/hg/hg-(?:data|stand)\.js)\?v=\d+', r'\1', h)
open(f'{out}/index.html', 'w').write(h)
files = [{'as': 'index.html', 'path': f'{out}/index.html'}, {'as': 'assets/hg/hg-data.js', 'path': f'{out}/assets/hg/hg-data.js'},
         {'as': 'assets/hg/hg-stand.js', 'path': f'{out}/assets/hg/hg-stand.js'}] + [{'as': u, 'path': f'{out}/{u}'} for u in sorted(used)]
json.dump(files, open(f'{out}/files.json', 'w')); print(len(files), 'files', round(sum(os.path.getsize(f['path']) for f in files) / 1048576, 1), 'MB')
