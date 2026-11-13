# Hel — shot cards

Room (`canvas.py --mode measure --stored 205` on the tight pictures): BT left 12 %, right 12 %, head 8.1 % in the video,
7.3 % storable; TI left 8 %, right 8 %, head 7.8 % in the video, 7.3 % storable (TI picture narrow: 70 % of the frame width).
BT: bone staff upright in the right hand, left hand free, long gown. TI: long staff held diagonally with both hands.
Sources of all eight published takes: Maxim's `Kling тест\workspace` (mp4-d-h.tar) and the Kling history (13.11 tight takes);
frame match checked 14.11 (same takes, the old cut used other start/end frames).

```
clip: hel_bt_idle, hel_ti_idle
status: published (re-shot 13.11) — waits for his look; sharp re-cut 14.11
remarks:
  - 12.11 «движения почти нет» (old take) → re-shot 13.11
```

```
clip: hel_bt_atk, hel_ti_atk
status: published (re-shot 13.11) — waits for his look; sharp re-cut 14.11
type: ranged (one target)
idea (13.11): ghost flame in the staff head and in the free palm, a short throw upward; the game throws the bolt
wf: BT staff head; TI free hand
remarks:
  - 12.11 «эффекта слишком мало (чуть-чуть свечения)», «выстрел не из посоха» (old take) → re-shot 13.11
```

```
clip: hel_bt_sup, hel_ti_sup   («Хватка Хельхейма»: damage + stun one target)
status: re-shoot (a gate fails: check 12 «only a little glow», check 1 legs still; 12.11 note «сам жест усилить»)
type: ranged (one target, control)
idea: crouch and weight shift, the free hand drawn back with curled fingers, then thrust forward at shoulder height and
  clenched into a fist; green soul-fire flares around the fist as grasping bony claws and fades
room check: the hand goes forward and a little up, inside the side room (BT 12 %, TI 8 %); nothing above the head
wind_up: knees bend, crouch (BT) / weight onto the right foot; TI lets the staff go with the lower hand
release: thrust + fist, weight onto the left foot, hips turn
recovery: hand down (TI: takes the staff again), rises, same pose as the first frame
baked_fx: on the fist, pale green, claw-shaped, fades
game_fx: from the fist a green grip closes on the target (claws), stun stars stay the game's
wf: the fist
legs: crouch and weight shift in the wind-up, weight onto the other foot at the release
takes: 1 (12.11) — hand forward, small glow in the palm; to be replaced if the new take passes
prompt: pipeline/r6/hel_bt_sup.txt, hel_ti_sup.txt
```

```
clip: hel_bt_hyp, hel_ti_hyp   («Воинство Хельхейма»: resurrection / shields)
status: published (re-shot 13.11) — waits for his look; sharp re-cut 14.11
idea (13.11): a ring of soul-fire at the feet, souls rise around the body in a spiral
remarks:
  - 12.11 «слабо: просто шарик над рукой» (old take) → re-shot 13.11
  - TI: a thin horizontal glint from the gem at the peak — the executor's note of 13.11, to be judged by the reviewer
```
