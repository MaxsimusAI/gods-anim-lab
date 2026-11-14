# mk.py : builds prompts by the grammar of the skill (section 7) from short per-clip entries -> prompts.json + <clip>.txt
# entry: {sex: m|f, look, story (three labelled beats, or the idle story), fit (0-2 sentences), items ("the staff"), feel, smoke: bool}
import json, sys
E = json.load(open('entries.json')); P = {}
for c, e in E.items():
    slot = c.split('_')[2]; f = e.get('sex', 'm') == 'f'
    He, he, his, him, man = ('She', 'she', 'her', 'her', 'woman') if f else ('He', 'he', 'his', 'him', 'man')
    Her = his.capitalize()
    op = {'idle': '2D game character idle loop animation, full body, front view.',
          'atk': '2D game character attack animation, full body, front view. Make every motion big, bold and exaggerated, with strong clear poses that read instantly even on a tiny phone screen.',
          'sup': '2D game character skill animation, full body, front view.', 'hyp': '2D game character skill animation, full body, front view.'}[slot]
    if slot == 'atk' and e.get('calm'): op = '2D game character attack animation, full body, front view.'
    bg = 'no floor, no shadow, no dust' if e.get('smoke') else 'no floor, no shadow, no smoke, no dust'
    tail = (f"{He} moves like a living {man}, with natural weight shifts, bending knees and a supple spine; {he} never rotates rigidly like a figurine on a stand. "
            f"{e.get('face', f'{He} always faces the viewer and never shows {his} back.')} {He} never moves toward or away from the camera and {his} size in the frame stays the same. "
            f"{Her} whole body{', ' + e['items'] if e.get('items') else ''} stay inside the frame at all times. {Her} body stays solid and fully visible in every frame. "
            f"Static locked-off camera: no zoom, no pan, no shake. Keep the character design exactly identical in every frame. "
            f"Plain flat solid gray background exactly as in the input image, unchanged for the whole video: {bg}. "
            f"Smooth, {e.get('feel', 'weighty')}, high-quality game animation; the last frame matches the first frame.")
    P[c] = ' '.join(x.strip() for x in (op, e['look'], e['story'], e.get('fit', ''), tail) if x.strip())
    open(c + '.txt', 'w').write(P[c])
json.dump(P, open('prompts.json', 'w'), indent=1); print(len(P), 'prompts')
