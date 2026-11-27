# whole 5x5 sheet on the dark fight background: python3 sheetview.py sheet.webp out.jpg [maxW]
import sys
from PIL import Image
s = Image.open(sys.argv[1]).convert('RGBA'); mw = int(sys.argv[3]) if len(sys.argv) > 3 else 2000
bg = Image.new('RGBA', s.size, (32, 26, 48, 255)); bg.alpha_composite(s)
if bg.width > mw: bg = bg.resize((mw, round(bg.height * mw / bg.width)), Image.LANCZOS)
bg.convert('RGB').save(sys.argv[2], quality=88)
