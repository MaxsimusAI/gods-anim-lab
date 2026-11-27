#!/bin/bash
# three sheets of a goddess side by side on the dark background: tri.sh god out.jpg
g=$1; o=$2
for s in idle app atk; do python3 sheetview.py v5/$g-bt-$s.webp /tmp/_tri_$s.jpg 700 >/dev/null; done
python3 -c "
from PIL import Image
ims=[Image.open(f'/tmp/_tri_{s}.jpg') for s in ('idle','app','atk')]
S=Image.new('RGB',(sum(i.width for i in ims)+20,max(i.height for i in ims)),(255,255,255)); x=0
for i in ims: S.paste(i,(x,0)); x+=i.width+10
S.save('$o',quality=85)"
