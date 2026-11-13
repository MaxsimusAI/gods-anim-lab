#!/bin/bash
# rv.sh clip [H] -> /tmp/rv_<clip>.jpg : frames 0..72 step 4 in two rows
c=$1; H=${2:-380}
python3 b3/strip.py /tmp/rv_${c}_a.jpg $H $c:0:36:4 >/dev/null && python3 b3/strip.py /tmp/rv_${c}_b.jpg $H $c:40:72:4 >/dev/null
python3 - "$c" <<'PY'
import sys
from PIL import Image
c=sys.argv[1]; a=Image.open(f'/tmp/rv_{c}_a.jpg'); b=Image.open(f'/tmp/rv_{c}_b.jpg')
o=Image.new('RGB',(max(a.width,b.width),a.height+b.height),(40,40,40)); o.paste(a,(0,0)); o.paste(b,(0,a.height)); o.save(f'/tmp/rv_{c}.jpg',quality=82); print(o.size)
PY
