# Hel — shot cards

Room (`canvas.py --mode measure --stored 205` on the tight pictures): BT left 12 %, right 12 %, head 8.1 % in the video,
7.3 % storable; TI left 8 %, right 8 %, head 7.8 % in the video, 7.3 % storable (TI picture narrow: 70 % of the frame width).
BT: bone staff upright in the right hand, left hand free, long gown. TI: long staff held diagonally with both hands.
Sources of all eight published takes: Maxim's `Kling тест\workspace` (mp4-d-h.tar) and the Kling history (13.11 tight takes);
frame match checked 14.11 (same takes, the old cut used other start/end frames).

```
clip: hel_bt_idle, hel_ti_idle
status: published (re-shot 13.11) — waits for his look; sharp re-cut 14.11 (v40); fresh eyes WATCH (BT nearly still ~0.9 s at
        the seam; TI feet still)
remarks:
  - 12.11 «движения почти нет» (old take) → re-shot 13.11
```

```
clip: hel_bt_atk, hel_ti_atk
status: BT — published 13.11 take, sharp re-cut 14.11 (v40), fresh eyes FAIL (legs still, no readable shot); three new takes
        14.11 failed (wide swing with a fire arc across the frame; a jab toward the camera — she grows; swing again) → shown
        to Maxim as «Версия 2/3» (P2: two failed retakes). TI — 14.11 retake 2 (a tip of the staff with fire on the crystal,
        strong legs) under review; take 1 (fire stream out of the right edge) is «Версия 2»
type: ranged (one target)
idea (13.11): ghost flame in the staff head and in the free palm, a short throw upward; the game throws the bolt
wf: BT staff head; TI free hand
remarks:
  - 12.11 «эффекта слишком мало (чуть-чуть свечения)», «выстрел не из посоха» (old take) → re-shot 13.11
```

```
clip: hel_bt_sup, hel_ti_sup   («Хватка Хельхейма»: damage + stun one target)
status: new takes 14.11 published «сейчас» (v41), fresh eyes WATCH both: legs act, big fire; the fire covers the face ~0.2 s,
        TI one frame of a white core and the flame at the top edge. Old take under «вчера»
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
status: BT — 13.11 take, sharp re-cut, matting haze removed (v41), fresh eyes PASS. TI — 13.11 take FAIL (lilac slab, thin
        horizontal flare, legs still); 14.11 take 1 FAIL (fire ring cut by both side edges 1.4 s, wisps like sickles, a hop);
        retake 1 with a small ring and small soul-flames running
idea (13.11): a ring of soul-fire at the feet, souls rise around the body in a spiral
remarks:
  - 12.11 «слабо: просто шарик над рукой» (old take) → re-shot 13.11
  - TI: a thin horizontal glint from the gem at the peak — the executor's note of 13.11, to be judged by the reviewer
```

Pipeline note (14.11): the pink/gray translucent "slab" around green fire was a matting artifact (the gray background kept
at low alpha and tinted by the despill), not in the video. `b3/haze_fix.py` removes it (low alpha, far from the figure,
not effect-coloured); fresh eyes: body pixels unchanged.
