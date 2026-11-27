# Fate (Судьба) — higher goddess, BT

Art: `work/tasks/229-higher-goddess-art-2/out/fate-bt-b-v2.png` (game repo), accepted in round 2. Skill «Неизбежность»: strongly
attacks the most dangerous enemy; all enemies take 20 % more damage for 6 s. Not in the live game (no sheets in art/mob/hg).
Picked for the test (26.11 22:59, «сделай еще двух для тестов») by the executor: a single-target ranged skill, unlike Order/Plague.

clip: fate_bt_idle — status: shot 26.11 (2 variants), published b, waits for his look
idea: weight from leg to leg; golden light on the bow; golden threads wind round arms and legs, stars of the cape twinkle,
the blindfold glows, a golden rim on the silhouette.
watch: b lifts the bow to chest height for ~0.6 s (reads a little like aiming, D5); a glowing dot at the arrow tip. a not used: a
star with rays at the arrow tip (A3), though more body light.
prompt: pipeline/hg/prompts/fate_bt_idle.txt

clip: fate_bt_app — status: shot 26.11 (2 variants), published a, waits for his look
idea: golden threads weave her from the feet up like a loom; a long golden thread spins round her; the bow is spun last.
watch: a small star glint on the arrow tip at the end (~0.25 s).
prompt: pipeline/hg/prompts/fate_bt_app.txt

clip: fate_bt_atk — status: shot 26.11 (2 variants), published a, waits for his look
type: ranged (one target) + debuff on all enemies
idea: wide stance, draws to the cheek aiming up-right, golden arcs of thread whirl round her, the shot leaves as a beam of gold
light toward the top-right corner, gold light on the body, the arrow comes back to her hand.
watch: hair and cape blow out of the left edge for ~1 s (B5 WATCH); a large golden glow round her upper body at the shot
(~0.15 s). b not used: a starburst of rays from her head (A3).
game_fx: from the point where the beam leaves the clip her own golden arrow (cut from her art) flies to the most dangerous enemy;
golden thread (cut from the clip) runs from him to every enemy and winds round each for 6 s (FX.fate).
prompt: pipeline/hg/prompts/fate_bt_atk.txt

## v5 (27.11 ~01:00, after Maxim 00:14: entrances static and alike, idle "just a glow", skills kept clear of her, nothing up)
- prompts: pipeline/hg/prompts/fate_bt_{idle,app,atk}_v5.txt, 2 variants each; picks and faults in the notes on the stand.
- picks: idle v5b (golden thread spiral like a spinning wheel), entrance v5a (a cocoon of threads builds up and unwinds, she
  steps out), skill v5a (thread spirals round her body, shot to the right). Release 12 from the bow wf [0.80,0.21].
  watch: the shot leaves through the right edge; flying hair breaks up in the matting (gray background vs silver hair).

- 27.11 01:29 ACCEPTED by Maxim («все круто получилось»): the v5 idle, entrance and skill are protected takes.

## 27.11 — after Maxim 04:08

This section is current; where the text above differs (takes, release points, game_fx), it describes the work before
his remarks of 04:08.

All three sheets re-cut with matte v3 (`pipeline/hg/matte3.py`, `hgcut3.py`; anything that runs out of a side of the
video dissolves over 6 % of the width). Protected take (accepted 01:29): re-cut only, the same 25 moments.

- idle: take `fate_bt_idle_v5b`; sheet 213×262, 557 KB, 5.32 MB
- entrance: take `fate_bt_app_v5a`; sheet 234×287, 458 KB, 6.4 MB
- skill: take `fate_bt_atk_v5a`; sheet 246×289, 635 KB, 6.78 MB
- release: frame 12 wf [0.8, 0.21]

Notes on the stand now (Russian):
- Ожидание — новый дубль: вокруг неё спиралью вьются золотые нити, как на прялке, и проходят прямо по фигуре; звёзды на плаще мерцают; стоит спокойно, вес с ноги на ногу.
- Появление — новое: на земле нарастает кокон из золотых нитей, нити раскручиваются, она выходит, отбрасывает волосы, разводит руки; плащ и стрела появляются последними.
- Умение: широкая стойка, натягивает лук, вокруг тела спиралью бегут золотые нити, выстрел — золотой луч уходит вправо, нити окутывают её.
- Что не так: выстрел уходит в правый край кадра (в бою стрела вылетает из лука и летит вверх к врагам); волосы и плащ в появлении и после выстрела сильно развеваются влево; верх лука на миг касается верхнего края; около 0,3 с луч ролика ещё уходит вправо, когда игровая стрела уже взлетает из лука, — читается как два выстрела; в появлении и в умении слева прямой срез по краю ролика.
- Вторые варианты не показываю: в ожидании она поднимает лук и целится; в появлении кокон стоит с первого кадра; в умении поперёк кадра блик-линия.
- Эффект игры: из лука вылетает её золотая стрела (из её картинки) и падает на самого опасного врага; от него ко всем врагам бежит золотая нить из её ролика и 6 секунд обвивает каждого.
- Уход — появление задом наперёд.
