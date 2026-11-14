# note.py : add Russian notes for the owner to the stand (kling_done.json todo per slot) and set clip statuses.
# usage: python3 note.py <status|-> clip "text" [clip "text" ...]
import json,sys
K='/home/claude/kl/work/'; d=json.load(open(K+'kling_done.json')); ov=json.load(open(K+'status_overrides.json'))
st=sys.argv[1]; a=sys.argv[2:]
for c,t in zip(a[0::2],a[1::2]):
    g,s,sl=c.split('_'); G=d['gods'][g]; todo=G.setdefault('todo',{})
    line=('Титан' if s=='bt' else 'Аниме')+', 15.11: '+t
    todo[sl]=(todo.get(sl,'')+' '+line).strip()
    if st!='-': ov[c]=st
json.dump(d,open(K+'kling_done.json','w',encoding='utf-8'),ensure_ascii=False,indent=1); json.dump(ov,open(K+'status_overrides.json','w'),ensure_ascii=False,indent=0)
print(len(a)//2,'notes')
