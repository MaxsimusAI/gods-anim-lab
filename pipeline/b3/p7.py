# Retake prompts (review 7). base = p6.json (batch 6) or EXTRA below; modifiers inserted after the camera sentence.
import json,re
P6=json.load(open('/home/claude/kl/b3/p6.json'))
CAM="Fixed camera, the flat gray background stays exactly the same, no camera movement, no zoom. "
END=(" Rich, clearly visible {col}, medium brightness, in both the effect and the glow on the body. All moves are smooth and continuous, no sudden jumps, no flicker. No white-out, no lens flare, no starburst, no star-shaped or cross-shaped glint, no full-frame flash, the background never brightens; no glow and no rings on the ground; no threads or lines of light in the air, nothing flies in from the edges; nothing is aimed or thrown to the left or to the right; effects stay close to the body and do not touch the left and right edges of the frame. The end pose equals the start pose.")
IDLE=("Idle loop with clear continuous motion the whole time, {he} is never still: {he} slowly sways {his} torso and shoulders, shifts {his} weight from one leg to the other, takes a slow small step to the side with one foot and a slow step back, bends and straightens {his} knees a little, turns {his} head to the left and then to the right, breathes so {his} chest rises and falls; {extra}. {keep} {His} hips and chest always face the viewer: the body never turns or spins like a figurine on a stand, any shift happens through the feet stepping. All moves are slow and smooth, no dancing, no fast or sharp gestures. No other magic effects. The end pose equals the start pose.")
M=dict(he='he',his='his',He='He',His='His'); F=dict(he='she',his='her',He='She',His='Her')
MOD={
 'EDGE':"Everything stays compact and inside the middle of the frame: the weapon, its swing and every trail of light stay close to the body, short and tight, far from the left and right edges of the frame. ",
 'SIDE':"Nothing is fired, thrown or pointed to the left or to the right; anything that flies away goes straight up and leaves through the top edge. ",
 'BACK':"{He} faces the viewer the whole time, chest toward the viewer; {he} never turns {his} back or {his} side to the viewer. ",
 'ZOOM':"The camera never zooms in or out and {his} size on screen never changes. ",
 'BG':"The gray background never changes color or brightness, it never goes dark or bright. ",
 'STAR':"No starburst, no rays, no shards or sparks bursting outward. ",
 'BODY':"{His} body stays fully visible and solid the whole time, nothing hides or replaces it. ",
 'MOVE':"The idle motion is clearly visible from far away: the sway, the weight shift and the small steps are noticeable, not tiny. ",
}
# god sex for pronouns
SEX={g:F for g in ['sting','aphrodite','llorona','hecate','kali','persephone','lilith','sekhmet']}
EXTRA={
 'sting_ti_hyp': CAM+"The masked kunoichi in black and red with a long ponytail and a small crossbow keeps the same size, feet planted on the same spot. Ultimate skill 'Rain of Kunai'. In the first second she raises the crossbow above her head with both hands, elbows bent, and red-orange fire gathers on it while fiery seal circles glow tightly around her body. At about one second and a half she shoots a burning bolt straight up, it leaves through the top edge of the frame, and three small fiery kunai rise after it straight up. Then the fire fades and she returns to the starting pose."+END.format(col='orange-red fire effects'),
 'lubu_bt_atk': CAM+"The armored Chinese warlord in red and bronze armor with long pheasant feathers on his helmet, holding a tall halberd, keeps the same size, feet planted on the same spot. Basic attack, a heavy melee strike. In the first third of a second he lifts the halberd to his shoulder with both hands, red fire running along the blade. Then he chops it down steeply in front of his body, the blade stopping in front of his knees, leaving a short red trail of fire hugging the blade; the halberd never reaches out to the sides, no step, no lunge. Then the fire fades and he returns to the starting pose."+END.format(col='crimson fire effects'),
 'houyi_bt_hyp': CAM+"The heavenly archer in red and gold armor with a long golden bow keeps the same size, feet planted on the same spot, standing upright the whole time, no kneeling. Ultimate skill 'Fall of the Sun'. In the first second he raises the bow and points it straight up at the sky, nocks a blazing golden arrow and draws the string all the way back to his cheek; golden fire gathers on the arrowhead. At about one second and a half he releases: the string snaps forward and the burning arrow flies straight up and leaves through the top edge of the frame, the bow trembling. Then he lowers the bow and returns to the starting pose."+END.format(col='golden fire effects'),
 'houyi_ti_hyp': CAM+"The young archer in red and gold clothes with a long golden bow keeps the same size, feet planted on the same spot, standing upright the whole time, no kneeling. Ultimate skill 'Fall of the Sun'. In the first second he raises the bow and points it straight up at the sky, nocks a blazing golden arrow and draws the string all the way back to his cheek; golden fire gathers on the arrowhead. At about one second and a half he releases: the string snaps forward and the burning arrow flies straight up and leaves through the top edge of the frame, the bow trembling. Then he lowers the bow and returns to the starting pose."+END.format(col='golden fire effects'),
 'ares_ti_atk': CAM+"The muscular war god in bronze armor with a red cape and a short sword in each hand keeps the same size, feet planted on the same spot. Basic attack, a fast melee strike. In the first third of a second he raises both swords to his shoulders, red fire running along the blades. Then he crosses them in one fast short slash close in front of his chest, leaving two short red trails of fire hugging the blades in front of his body; the swords never reach out to the sides, no step, no lunge. Then the fire fades and he returns to the starting pose."+END.format(col='red fire effects'),
 'agni_ti_idle': CAM+"The young fire god with long black hair in red and gold clothes holding a tall golden staff with a flame on top keeps the same size and stays on the same spot. "+IDLE.format(extra='the flame on his staff flickers and his hair and clothes sway',keep='The staff stays upright beside him the whole time.',**M),
 'loki_bt_idle': CAM+"The red-haired trickster in dark green armor and a long black cape with curved golden horns on his headpiece, holding two curved golden daggers, keeps the same size and stays on the same spot. "+IDLE.format(extra='his cape sways and the daggers glint',keep='The daggers stay low beside his hips.',**M),
}
RT=[l.rstrip('\n').split('\t') for l in open('/home/claude/kl/b3/rt7.txt') if l.strip()]
STATIC=['loki_bt_idle','quetzalcoatl_bt_idle','quetzalcoatl_ti_idle','persephone_bt_idle','hecate_bt_idle','heracles_bt_idle','surt_bt_idle','lucifer_bt_idle','agni_ti_idle']
RT+= [[c,'static idle'] for c in STATIC]
def mods(reason,clip):
    r=reason.lower(); m=[]
    if clip.endswith('idle'): m.append('MOVE')
    if re.search(r'edge|width|corner|cut|spill|wide|full width',r): m.append('EDGE')
    if re.search(r'sideways|thrown|aimed|beam shot|pointed|thrust',r): m.append('SIDE')
    if re.search(r'back|turns|profile|away',r): m.append('BACK')
    if re.search(r'zoom|scale|shrink',r): m.append('ZOOM')
    if re.search(r'bg|brighten|dark|flash',r): m.append('BG')
    if re.search(r'starburst|glint|shards|burst',r): m.append('STAR')
    if re.search(r'vanish|overlay|hides|morph',r): m.append('BODY')
    return m
out={}
for clip,reason in RT:
    g=clip.split('_')[0]; P=SEX.get(g,M)
    base=EXTRA.get(clip) or P6.get(clip)
    if base is None: print('NO BASE',clip); continue
    ms=mods(reason,clip)
    ins=''.join(MOD[k].format(**P) for k in ms)
    assert base.startswith(CAM),clip
    txt=CAM+ins+base[len(CAM):]
    if clip=='horseman_bt_atk': txt=txt.replace(CAM,CAM+"Only the one burning pumpkin head he holds; no second pumpkin or other object appears. ",1)
    out[clip]=txt
json.dump(out,open('/home/claude/kl/b3/p7.json','w'),indent=1,ensure_ascii=False)
print(len(out),max(len(v) for v in out.values()))
for k,v in out.items(): print(k, [x for x in mods(dict(RT)[k],k)])
