# python3 comp2.py out.jpg god shot,shot,...   -> 2 rows (bt, ti)
import sys
from PIL import Image, ImageDraw
out,god,shots=sys.argv[1],sys.argv[2],sys.argv[3].split(',')
o=Image.new('RGB',(470*len(shots),2*560))
for r,X0 in enumerate((650,1286)):
    for i,s in enumerate(shots):
        t=Image.open(f'/home/claude/kl/sh/{god}_{s}.png').crop((X0+75,170,X0+545,730)); o.paste(t,(i*470,r*560))
        ImageDraw.Draw(o).text((i*470+4,r*560+4),s,fill=(255,255,0))
o.save(out,quality=82); print(o.size)
