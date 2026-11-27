# Order (Порядок) — higher goddess, BT

Art: `work/tasks/229-higher-goddess-art-2/out/order-bt-a-v2.png` (game repo), accepted in round 2. Skill «Закон защиты»: attacks two
enemies, a shield on every ally for 8 s. Live game: the old armoured design, sheets `art/mob/hg/order-*.webp`.

clip: order_bt_idle — status: take 2 (retake 1) shot 26.11, waits for his look
takes: 1 FAIL (fresh eyes: legs dead, feet 0.4 px over the loop) · 2 used (prompt order_bt_idle_r1.txt: the leg action named)
idea: weight from leg to leg, braid and cape sway; the blue scales pulse, light runs up the spear blade.
prompt: pipeline/hg/prompts/order_bt_idle.txt

clip: order_bt_app — status: shot 26.11 (take 1), waits for his look
idea: blue/golden lines draw her outline from the feet up, fill with light, the spear forms from a golden line, the shield last.
watch: the forming spear is a golden line through the whole frame height for ~0.3 s.
prompt: pipeline/hg/prompts/order_bt_app.txt

clip: order_bt_atk — status: take 2 (retake 1) shot 26.11, waits for his look
takes: 1 FAIL (starburst on the shield and on the ground, A3) · 2 used (prompt order_bt_atk_r1.txt: the light described as a glow)
type: ranged + buff
idea: sinks low, the scales blaze, rises and slams the spear butt on the ground; light runs up the shaft and flares on the blade.
release: sheet frame 10 (the slam); wf = spear blade [0.295, 0.21]; wf2 = shield centre [0.735, 0.62]
game_fx: the spear light leaves the top of the clip; from that point two lances of light go to two enemies and break into crystal shards;
her own shield (cut from her portrait) flies from her shield to every ally and melts into a film of light (FX.order). No scales.
watch: at the slam the blue cape opens as a dome across the whole frame width; the spear light leaves the top edge for ~1 s; the
shield flare is a bright star for ~0.3 s.
prompt: pipeline/hg/prompts/order_bt_atk.txt

## v3 (26.11 ~22:30, after Maxim 21:50 «почти нет движения и слишком мало эффектов»)
- idle: v3b (prompt order_bt_idle_v3.txt, 2 variants shot) — weight shift, spear lift, blue flame on the blade, runes from the shield.
- skill: two variants on the stand: atk = v3a (wide swing, energy arc, slam, flame on the blade; release 12, lances from the flame
  top at frame 14 wf [0.30,0.04]; shields from wf2 [0.70,0.6]); atk2 = v3b (energy spirals, wall of light at the slam; release 10,
  lances at 14 wf [0.30,0.03]; wf2 [0.72,0.55]). Both cut with KL_DESMOKE=1.
- game_fx: lances = her own blade in blue flame cut from the v3b clip (assets/hg/new/order-lance.webp); shield = her shield.

## v4 (26.11 ~22:50, after Maxim 22:39 «эффекты только на оружии… эффекты и на самом боге»)
- idle: v4b (prompt order_bt_idle_v4.txt, 2 variants) — glowing blue rune patterns on the armor and legs, a blue rim of light on the
  silhouette, blue flame on the spear and the shield, weight shift. v4a: the same idea, weaker body glow. Sheet 176×299, 582 KB.
- skill: v4b (prompt order_bt_atk_v4.txt) — energy ribbons around her, a ring of light on the ground, the spear slam, a wall of blue
  light with golden crown tips (sheet frames 11–14), then the whole figure burns in blue flame and fades. Sheet 266×317, 751 KB.
  Release: shields at 11 from wf2 [0.71,0.62] (the wall rises); lances at 14 from wf [0.32,0.08] (the spear flame top).
  watch: the wall reaches the side edges of the frame for ~0.5 s (edges fade); the spear flame stays near the top edge ~1 s.
  v4a not shown: a golden starburst over the helmet (A3) and less flame on the body.
- entrance: unchanged, PROTECTED (26.11 22:39 «Точно оставляем»), the same sheet bytes; exit = the entrance backwards.

## v5 (27.11 ~01:00, after Maxim 00:14: entrances static and alike, idle "just a glow", skills kept clear of her, nothing up)
- prompts: pipeline/hg/prompts/order_bt_{idle,app,atk}_v5.txt, 2 variants each; picks and faults in the notes on the stand.
- picks: idle v5b (blue flame ribbons + rune ring over her), entrance v5b (rises from a kneel out of a pool of light while the
  light fills her; the protected entrance of 26.11 stays as app2 «прежнее»), skill v5a (spear circle of blue fire, a sphere of
  light with runes closes over her). Release: shields at 14 from wf2 [0.72,0.66]; lances at 16 from wf [0.27,0.10].
  v5b skill not used: she turns her back on the swing.

- 27.11 01:29 ACCEPTED by Maxim («все круто получилось»): the v5 idle, entrance and skill are protected takes.

## 27.11 — after Maxim 04:08

This section is current; where the text above differs (takes, release points, game_fx), it describes the work before
his remarks of 04:08.

All three sheets re-cut with matte v3 (`pipeline/hg/matte3.py`, `hgcut3.py`; anything that runs out of a side of the
video dissolves over 6 % of the width). Protected take (accepted 01:29): re-cut only, the same 25 moments.

- idle: take `order_bt_idle_v5b`; sheet 209×259, 541 KB, 5.16 MB; options {'g2': 1}
- entrance: take `order_bt_app_v5b`; sheet 266×315, 515 KB, 7.99 MB; options {'g2': 1}
- skill: take `order_bt_atk_v5a`; sheet 266×318, 929 KB, 8.07 MB; options {'g2': 1}
- release: frame 14 wf [0.27, 0.1]; frame 16 wf2 [0.72, 0.66]

Notes on the stand now (Russian):
- Ожидание — новый дубль (по вашему замечанию «просто свечение — скучно»): вокруг неё вьются ленты синего пламени и проходят прямо по фигуре, на груди кольцо рун, светятся щит и копьё; вес переходит с ноги на ногу.
- Появление — новое, с движением: из синей лужи света она поднимается с колена, свет заполняет фигуру, копьё описывает дугу и встаёт рядом, щит загорается последним. Прежнее появление, которое вы оставили, — кнопка «прежнее».
- Умение: приседает и проводит копьём полный круг синего огня вокруг себя, выставляет щит — её накрывает шар из света с золотыми рунами, клинок горит синим пламенем, потом шар рассыпается.
- Что не так: пламя на клинке около секунды доходит до верха кадра (копьё и в картинке почти у верхнего края); дуга огня на взмахе на миг касается верха; в миг, когда смыкается шар, один кадр — белое сияние на ней; шар почти во всю ширину кадра; в появлении копьё на полсекунды поднято к верху и на щите короткий блик; левый край шара срезан краем ролика — в бою это прямая вертикальная граница.
- Второй вариант умения не показываю: на взмахе она поворачивается спиной.
- Эффект игры: щиты союзникам летят со щита, когда смыкается шар; два её клинка в синем пламени летят в двух врагов из пылающего клинка копья.
- Уход — появление задом наперёд.
