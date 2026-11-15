# G4 stand check of game effects (round r10, 16.11) — fresh-eyes reviewer

You have NOT seen the work. You check, you do not fix. Report in English, file `/home/claude/kl/r10/g4_verdicts.json`
({ "god:slot:style": {"verdict": "PASS|WATCH|FAIL", "frames": "...", "why": "...", "remark_gone": "yes|no|n/a"} }) plus a short
summary at the end of your reply. Never push, never edit the repo.

Stand: a local server already runs on http://localhost:8766 (the repo /home/claude/gods-anim-lab). Tools in
`pipeline/r9/tools/`: `fseq.py out.jpg <god> <slot> [n] [step_ms] [start_ms] [rows] [scale] [crop]` (deterministic frame
series; rows M = middle arena = BT style, R = right arena = TI style; it prints release time, hold and hit times per arena),
`ftrace.py 8766 god:slot:steps` (numbers: sheet frame per step, leap distance, hits). Start with
`python3 fseq.py /tmp/x.jpg <god> <slot> 14 70 0 MR 0.6 col`, then zoom on the release window (e.g. start = release-150 ms,
step 40-50 ms). LOOK at every image (Read tool). Only ONE headless browser at a time (memory): run the tools sequentially.

What to check for every action (strike atk / super sup / ult hyp) in the list, BT and TI arenas:
1. The game effect starts at the release frame of the sheet, from the weapon or hand — not the chest, belt, feet or empty air.
2. Nothing flies before the gesture; damage numbers / hit reaction come when the projectile or strike arrives, not before.
3. Melee: the god leaps to the enemy, lands on the strike frame; the strike in the clip does not happen mid-air or long before
   the damage.
4. A baked effect cut by the frame edge continues as a game effect from that point at that moment.
5. Who hits whom is readable; projectile fits the weapon (bow → arrow, not a slow ball).
6. No blinding flash, no cheap primitives (plain thin rays, pebbles, tiny balls, droplets, unclear symbols, jerky fire),
   no translucent copy of a god, no big picture/icon over the fight (skull, heads, creature, pumpkin, moon, wheat).
7. Sheet playback not jerky / too fast at game speed (look at consecutive frames).
For each clip also answer: is the owner's remark (text below, Russian) still visible? (`remark_gone`).

Priority clips (changed today — check first, they must be PASS): poseidon:atk, artemis:atk, artemis:sup, surt:sup,
llorona:sup. Also look at heimdall:sup, thor:sup, ares:sup, wukong:sup (numbers show damage ~0.28 s after the strike frame).
Then every clip of the list below (god_style_slot | the owner's remark).
mictlan_bt_hyp | Убрать программную картинку черепа
mictlan_ti_hyp | Убрать программную картинку черепа
lucifer_bt_sup | Программный эффект не синхронизирован с анимацией и выглядит плохо
lucifer_ti_sup | Программный эффект не синхронизирован с анимацией и выглядит плохо
lucifer_bt_hyp | Программный эффект не синхронизирован с анимацией и выглядит плохо
lilith_bt_atk | Во время старта анимации дергается влево
lilith_ti_hyp | Программные эффекты плозихие, полностью поменять
koschei_ti_sup | Плохо синхронизированы программные эффекты и аниммация
kali_bt_sup | Плохие прогрманные эффекты, опять не понятно кто кого бьет
kali_ti_sup | Плохие прогрманные эффекты, опять не понятно кто кого бьет
kali_bt_hyp | Слишком резко дергается в анимации. Плохие прогрманные эффекты, опять не понятно кто кого бьет
kali_ti_hyp | Плохие прогрманные эффекты, опять не понятно кто кого бьет
hecate_bt_sup | Плохая синхронизация у прогрммныъ эффектов с анимацией
hecate_bt_hyp | Программная картинка 3 голов не нужна
hecate_ti_hyp | Программная картинка 3 голов не нужна
horseman_bt_atk | Убрать программную маленькую иконку тыквы
horseman_ti_atk | Убрать программную маленькую иконку тыквы
horseman_bt_sup | Нет связи между анимацией умения и уроном
horseman_ti_sup | Нет связи между анимацией умения и уроном
horseman_bt_hyp | Нет связи между анимацией умения и уроном
horseman_ti_hyp | Нет связи между анимацией умения и уроном
veles_bt_atk | Программных эффект не соответствует тому, что делает бог. Он прыгает вперед и наносит урон, но почемуто оновременно с этим по земле бедит разлом и потом молния на противнике
veles_ti_atk | Программных эффект не соответствует тому, что делает бог. Он прыгает вперед и наносит урон, но почемуто оновременно с этим по земле бедит разлом и потом молния на противнике
veles_bt_sup | Слишком быстро проходит анимация
veles_ti_sup | Слишком быстро проходит анимация
veles_bt_hyp | Плохая синхронизация програмного эффекта и у програмнного эффекта вид не вау и другой цвет
veles_ti_hyp | Плохая синхронизация програмного эффекта и у програмнного эффекта вид не вау и другой цвет
anansi_bt_sup | Слишком резкая анимуция и нет синхронизации анимации и программного эффекта
anansi_ti_sup | Слишком резкая анимуция и нет синхронизации анимации и программного эффекта
wukong_bt_atk | Непонятное дерганье в анимации и нет связи с программным эффектом
wukong_ti_atk | нет связи с программным эффектом
wukong_bt_hyp | нет связи с программным эффектом
wukong_ti_hyp | нет связи с программным эффектом
wukong_bt_sup | нет связи с программным эффектом
wukong_ti_sup | нет связи с программным эффектом
silent_bt_hyp | Плохая связь анимации и программного эффекта
silent_ti_hyp | Плохая связь анимации и программного эффекта
heracles_bt_hyp | Плохая связь анимации и програмного эффекта. Программный эффект плохой
heracles_ti_hyp | Плохая связь анимации и програмного эффекта. Программный эффект плохой
blackbeard_bt_hyp | Плохая связь анимации и програмного эффекта. Программный эффект плохой
blackbeard_ti_hyp | Плохая связь анимации и програмного эффекта. Программный эффект плохой
raijin_bt_sup | Слишком дерганная анимация?
raijin_ti_sup | Слишком дерганная анимация?
raijin_bt_hyp | Плохая связь анимации и програмного эффекта. Программный эффект плохой
raijin_ti_hyp | Плохая связь анимации и програмного эффекта. Программный эффект плохой
poseidon_bt_sup | Плохая связь анимации и програмного эффекта. Программный эффект плохой
poseidon_ti_sup | Плохая связь анимации и програмного эффекта. Программный эффект плохой
dutchman_bt_atk | Плохая связь анимации и програмного эффекта. Можно сделать без прыжка
dutchman_ti_atk | Плохая связь анимации и програмного эффекта. Можно сделать без прыжка
llorona_bt_atk | Сделать без ближнего удара это умение
llorona_ti_atk | Сделать без ближнего удара это умение
llorona_bt_sup | Плохая синхронизация программного эффекта. Он должен быть выше, где в анимации заканчивается
llorona_ti_sup | Плохой программный эффект
llorona_bt_hyp | Плохой программный эффект
llorona_ti_hyp | Плохой программный эффект
atlas_bt_sup | Плохой программный эффект
atlas_ti_sup | Плохой программный эффект
atlas_bt_hyp | Плохой программный эффект
atlas_ti_hyp | Плохой программный эффект
aoguang_bt_sup | Плохо синхронизирован программный эффект
aoguang_ti_sup | Плохо синхронизирован программный эффект
aoguang_bt_hyp | Плохо синхронизирован программный эффект. Большая картинка существа не нужна
aoguang_ti_hyp | Плохо синхронизирован программный эффект. Большая картинка существа не нужна
shiva_bt_atk | Сделать умение без прыжка к врагу
shiva_ti_atk | Сделать умение без прыжка к врагу
shiva_bt_sup | нет связи между анимацией и нанесением урона
shiva_ti_sup | нет связи между анимацией и нанесением урона
shiva_bt_hyp | Плохая синхронизация программного эффекта
shiva_ti_hyp | Плохая синхронизация программного эффекта
shango_bt_sup | Плохая синхронизация программного эффекта
shango_ti_sup | Плохая синхронизация программного эффекта
surt_bt_atk | Сделайть умение без прыжка к врагу
surt_ti_atk | Сделайть умение без прыжка к врагу
surt_bt_sup | Плохая синхронизация программного эффекта
surt_ti_sup | Плохая синхронизация программного эффекта
sekhmet_bt_sup | Плохая синхронизация. Огонь из рта в анимации, а программных эффект из ног
sekhmet_ti_sup | Плохая синхронизация. Огонь из рта в анимации, а программных эффект из ног
lubu_bt_sup | Слишком быстро дергается в анимации
lubu_bt_hyp | Нет связи програмнного эффекта с анимацией и уроном
loki_bt_hyp | Нет связи программного эффекта и урона
loki_ti_hyp | Нет связи программного эффекта и урона
agni_bt_hyp | Программная анимация струи огня слишком быстро дергается
agni_ti_hyp | Программная анимация струи огня слишком быстро дергается
erlang_bt_hyp | В программной анимации не понятно что летит. Слишком резко и не заметно
erlang_ti_hyp | В программной анимации не понятно что летит. Слишком резко и не заметно
ra_bt_atk | Слишком быстро дергается анимация
ra_ti_atk | Слишком быстро дергается анимация
inti_bt_atk | Слишком быстро дергается анимация
inti_ti_atk | Слишком быстро дергается анимация
vanhelsing_bt_atk | Программный эффект вылетает не из кончика оружия
vanhelsing_ti_atk | Программный эффект вылетает не из кончика оружия
vanhelsing_bt_hyp | Плохой программный эффект
brynhild_bt_atk | Плохо синхронихипрованная анимация и урон. Она бьет в анимации раньше чем оказывается рядом с противником
brynhild_ti_atk | Плохо синхронихипрованная анимация и урон. Она бьет в анимации раньше чем оказывается рядом с противником
amaterasu_bt_atk | Плохая синхронизация с программный эффектом
hel_bt_hyp | Слишком большие программные картинки. Лучше их полностью убрать
hel_ti_hyp | Слишком большие программные картинки. Лучше их полностью убрать
demeter_bt_hyp | Принять версию 2 и убрать программные ростки пшеницы (они теперь естьв  анимации бога)
demeter_ti_hyp | Принять версию 2 и убрать программные ростки пшеницы (они теперь естьв  анимации бога)
zeus_ti_atk | Плохая синхронизация у программного эффекта
artemis_bt_atk | Плохая синхронизация у програмного эффекта
artemis_ti_atk | Плохая синхронизация у програмного эффекта
artemis_bt_sup | Плохая синхронизация у програмного эффекта
artemis_ti_sup | У аниме версии берем вторую версию. анимаций. Плохая синхронизация у програмного эффекта
artemis_bt_hyp | Берем эту версию. Убираем программную луну (зачем она, если в анимации уже есть луна?)
artemis_ti_hyp | Берем эту версию. Убираем программную луну (зачем она, если в анимации уже есть луна?)
poseidon_bt_atk | Плохая синхронизация анимации и урона. Герой бьет раньше чем успевает долететь до врага, а удар в анимации уже прошел
poseidon_ti_atk | Плохая синхронизация анимации и урона. Герой бьет раньше чем успевает долететь до врага, а удар в анимации уже прошел
