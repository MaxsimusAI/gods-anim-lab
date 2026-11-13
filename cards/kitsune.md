# Kitsune — shot cards

Room (tight picture, default margins; re-measure on the real picture with `canvas.py --mode measure`): left 7 %, right 7 %,
head 10 % in the video, of which 3 % can be stored at the idle's scale (figure 214 px). Wide silhouette (nine tails): any
step takes the tails out. Moves that fit: crouch, twist to three-quarters (tails overlap), tails gathered, attribute forward.
Live game: idle 214×290 (figure 272 px), strike 158×217 (figure 202 px).

```
clip: kitsune_bt_atk
status: 12.11 take protected — re-cut 13.11 (figure 208 px), «сейчас» on the site; 13.11 20:48 «Титан-версия обычный удар окей»
type: ranged
idea: short coil, then the fox mask is thrust forward and sky-blue fox-fire flares on it; long soft recovery
remarks:
  - 12.11 «обычный удар слишком быстрое движение» (first take) → fixed 12.11 (release early, long recovery)
  - 13.11 «Во вчерашней версии она сильно двигалась. Она и вперёд что-то смотрела, и маску вперёд выставляла. И это окей, это нормально было»; the 13.11 take: «еле-еле рукой двигает и всё»
measured: 12.11 take — feet 12 %, hips 11 %, silhouette change 59 %; 13.11 take — 0.1 %, 1.2 %, 11 %
```

```
clip: kitsune_ti_atk
status: 13.11 take («сейчас») — 13.11 20:48 «аниме-версия плохо» (he was looking at the new ones). The 12.11 take, re-cut
        (206 px), is under «вчера» — waits for his look. If he rejects it too: re-shoot (Maxim named it), idea lines first
type: ranged
idea: turn with the fan, a sky-blue arc of fire on the fan
remarks:
  - 12.11 «веер прям сильно выходит, и он ещё медленно это делает… в конце что-то перед картинкой летает, мелкое и непонятное»
  - 13.11 (the 13.11 take) «в аниме, окей, хоть какое-то ещё движение есть»
  - 13.11 20:48 «аниме-версия плохо. Э, это я новые еще смотрю»
```

```
clip: kitsune_bt_sup
status: 12.11 take (Maxim's own idea; he criticised only the game part, the clip itself is not judged) re-cut (fits at
        192; was 148) under «вчера» next to the 13.11 take — waits for his look
type: ranged (debuff on all enemies)
idea: crouch, all tails gather into one bundle behind the head, a narrow sky-blue beam leaves through the top; the game
  continues it above the frame and splits it to the enemies
remarks:
  - 12.11 (his idea) «хвосты… в пучок, в единый собрать, и из него луч вылетает, который мы дальше программно продолжаем. Офигенно»
  - 12.11 «луч летит вверх, но потом из неё вылетают 5 кругляшков шариков. Не очень понятно»; clone: «не успевает присесть, а анимации уже вылетают» (game effect — open)
  - 13.11 20:48 game effect: «появляется какая-то тонкая линия, и из тонкой линии летят вот шарики во врагов. Хотя сразу из
    кончика хвоста как раз шарики и могут полететь. Тонкая линия здесь не нужна» → fixed v29: no line, the fox-fires start at
    the tips of the tails (top of the sheet). «разделение» (translucent doubles) removed on the new arenas
game_fx: fox-fires from the tips of the tails (wf 0.50,0.04) to every enemy; no line or bloom above the frame
prompt: pipeline/v2/tests/kitsune_bt_sup_bundle_1211.txt
```

```
clip: kitsune_ti_sup
status: new idea or re-shoot — with the bundle prompt the tails opened wider than the frame twice
note: the idea may differ from BT (skill C5); goes to Maxim as an idea line first
```

```
clip: kitsune_ti_hyp   («Лисья свадьба»)
status: 12.11 take protected — re-cut 13.11 (196 px), «сейчас»; 13.11 20:48 «Лисья свадьба в целом окей»
type: buff (heal)
remarks:
  - 12.11 «вверх веер поднимают, эффекты за край уходят и обрезаются, а программный эффект вылетает из района груди» (game effect — open)
  - 13.11 20:48 «у аниме-версии а, как будто не совсем из прямо веера вылетает. Ну, хотя не уверен» → v29: the game fires are
    born in a tight arc at the fan point (wf 0.24,0.07), not in a wide arc over the head
  - 13.11 20:48 the game mask above her and the name: «эту же маску мы можем внутри анимации прям рисовать… программная хуже» —
    a new take with the mask in the clip would be a re-shoot of a protected take: only on his word
  - 13.11 «у Лисьей свадьбы в аниме-версии она прикольно двигалась… и ногу там что-то поднимала, и всё двигалось, всё тело. В новой версии ноги статичные, просто веером немножко машет»
measured: 12.11 take — feet 20 %; 13.11 take — 0.5 %
```

```
clip: kitsune_bt_hyp
status: 13.11 take «сейчас», 12.11 take re-cut (210 px) under «вчера»; 13.11 20:48 «Лисья свадьба в целом окей» — which of
        the pair he means is not said: ask «какой оставить?»
remarks:
  - 13.11 (the 13.11 take) «У Титан версии ещё всё хуже. Рукой машет, всё остальное там почти статичное»
```

```
choice of 13.11 ~17:40 (question window, not his own words): «Почти без шагов» for Kitsune's actions.
He rejected the result the same evening («ноги статичные…») — not in force.
```
