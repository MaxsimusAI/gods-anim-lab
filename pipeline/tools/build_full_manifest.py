# -*- coding: utf-8 -*-
"""
Builds gods-anim-lab-repo/gods-data.js (and assets/gods-data.js) for all 62 gods:
  - 52 existing active visible gods (with QA-passed 25-frame <=180x220 sheets + clean <=180x220 reference figures,
    100% genuine live SIM + FX2 «Кузница» engine descriptors, and XX★5 288-fight balance verdicts)
  - 10 brand-new turnkey gods (20 2K BT+TI arts, 4 skills + Astral/enchant/creature progression,
    10 bespoke FX2 «Кузница» recipes, and XX★5 144-fight balance verdicts).
  - Exposes `simGodDataMap` for `SIM_STAND.buildArenaSheets(mode, simGodDataMap, lite)`.
Strictly verifies mob w <= 180 and h <= 220 across all generated/staged sheets.
"""
import os, json

HERE = os.environ["KL_HERE"]
REPO = os.environ.get("KL_REPO", os.path.join(HERE, "gods-anim-lab-repo"))

all52 = json.load(open(os.path.join(HERE, "all_52_gods_data.json"), encoding="utf-8"))
new10 = json.load(open(os.path.join(HERE, "new_10_gods_data.json"), encoding="utf-8"))["gods"]
live_m = json.load(open(os.path.join(HERE, "live_bt_metrics.json"), encoding="utf-8"))
new10_m = json.load(open(os.path.join(HERE, "new_10_art_metrics.json"), encoding="utf-8"))
# The site is built ONLY from published cuts (work/metrics_pub.json, updated by b3/pub1.sh per published clip).
# adapted_all_metrics.json also holds fresh cuts that have not passed review yet - never build the site from it.
_MP = os.path.join(HERE, "metrics_pub.json")
if not os.path.exists(_MP): raise SystemExit("work/metrics_pub.json missing - the site must be built from published cuts only")
adapt_m = json.load(open(_MP, encoding="utf-8"))
KLING = json.load(open(os.path.join(HERE, "kling_done.json"), encoding="utf-8"))   # {"ver": n, "gods": {gid: {"notes": {slot: text}, "date": ..}}}
adapt_m = {k: v for k, v in adapt_m.items() if k.split("_")[0] in KLING["gods"]}   # Gemini clips are no longer shown as ready
SHEET_VER = KLING["ver"]
refs_m = json.load(open(os.path.join(HERE, "ref_sheets_metrics.json"), encoding="utf-8"))
# 13.11 (Maxim 15:36): old/new switch in the proposed arenas. "Вчера" = the sheets published before the current redo pass
# (frozen copies in assets/sheets/<PREV_DIR>/, their metrics in work/metrics_<PREV_DIR>.json). Only gods whose sheets changed
# since then get a "prev" pack; for every other god "вчера" = "сейчас".
PREV_DIR = "v20"
_pm = os.path.join(HERE, f"metrics_{PREV_DIR}.json")
_pd = os.path.join(REPO, "assets", "sheets", PREV_DIR)
if os.path.isdir(_pd) and os.listdir(_pd) and not os.path.exists(_pm):
    raise SystemExit(f"assets/sheets/{PREV_DIR}/ exists but work/metrics_{PREV_DIR}.json is missing - the old/new switch would silently go empty")
prev_m = json.load(open(_pm, encoding="utf-8")) if os.path.exists(_pm) else {}
def _changed(k, v):   # the frozen sheet differs from the current one (by file bytes, both tiers)
    cur = adapt_m.get(k)
    if not cur or "take" in k or "rejected" in k or k.split("_")[0] not in KLING["gods"]:
        return False
    for t in ("mob", "lite"):
        a = os.path.join(_pd, v[t]["file"]); b = os.path.join(REPO, "assets", "sheets", cur[t]["file"])
        if not os.path.exists(a):
            return False
        if not os.path.exists(b) or open(a, "rb").read() != open(b, "rb").read():
            return True
    return False
_prev_all = set(prev_m)
prev_m = {k: v for k, v in prev_m.items() if _changed(k, v)}
# clips published for the first time after v20 (no sheet "yesterday"): in "вчера" they show what the stand showed then
# (the reference / static sheet), and their god counts as changed
import re as _re
if KLING["gods"] and not _prev_all: raise SystemExit("work/metrics_v20.json missing/empty - the 'вчера' view cannot be built")
FIRST = {k for k in adapt_m if _re.fullmatch(r"[a-z]+_(bt|ti)_(idle|atk|sup|hyp)", k) and k.split("_")[0] in KLING["gods"] and k not in _prev_all}
PREV_GODS = sorted({k.split("_")[0] for k in prev_m} | {k.split("_")[0] for k in FIRST})
# 14.11 (Maxim 00:14): alternative takes per slot, shown as "версия 2, 3…" buttons under the skill buttons on the stand.
# Sheets in assets/sheets/alt/, metrics in work/metrics_alt.json: {clip: [ {label, ver, mob, lite, fig, rel, impact, wpt, …} ]}.
_am = os.path.join(HERE, "metrics_alt.json")
alt_m = json.load(open(_am, encoding="utf-8")) if os.path.exists(_am) else {}
alt_m = {k: v for k, v in alt_m.items() if k.split("_")[0] in KLING["gods"]}

EL_RU = {"light": "Свет", "fire": "Огонь", "water": "Вода", "earth": "Земля", "dark": "Тьма"}
EL_ICON = {"light": "⚡", "fire": "🔥", "water": "💧", "earth": "🌿", "dark": "🌑"}

RC_NAME_RU = {
    "dmg": "урон умения",
    "heal": "сила исцеления",
    "shield": "прочность щита",
    "ctl": "длительность контроля",
    "curse": "сила проклятия",
    "buff": "сила благословения",
    "dot": "периодический урон",
    "drain": "вампиризм от урона",
    "time": "длительность эффекта",
    "exe": "добивание раненых",
}


def fmt_m(val):
    return f"{val:.1f}".replace(".", ",") + "M"


def head_aligned_fig(raw_fig, body_ratio):
    op_top = raw_fig["top"]
    foot = raw_fig["foot"]
    human_top = round(foot - body_ratio * (foot - op_top), 4)
    return {"top": human_top, "foot": foot, "ax": raw_fig["ax"]}


def pack_adapted_or_ref(cid, ref_key, body_ratio, prev=False):
    src_m, sub = (prev_m, PREV_DIR + "/") if (prev and cid in prev_m) else (adapt_m, "")
    if prev and cid in FIRST:
        src_m = {}   # no "yesterday" sheet: fall through to the reference sheet below
    if cid in src_m:
        c = src_m[cid]
        # 13.11 (D14): the adapter already stores the HUMAN crown in fig.top (it applies the body ratio itself). Applying the
        # ratio a second time here made every new god ~1/ratio (Kitsune 12%) taller than the live one on the stand.
        aligned = {"top": c["fig"]["top"], "foot": c["fig"]["foot"], "ax": c["fig"]["ax"]}
        wpt = c.get("wpt") or [0.28, -0.76]
        out = {}
        sim_slot = {
            "cols": 5, "rows": 5, "frames": 25,
            "fig": aligned,
            "rel": c["rel"],
            "impact": c["impact"],
            "wpt": wpt,
            "ho": c.get("ho"), "wf": c.get("wf"),
            "isVideo25": True,
        }
        for tier in ("mob", "lite"):
            t = c[tier]
            if tier == "mob":
                assert t["w"] <= 180 and t["h"] <= 220, f"Ceiling violated on {cid}: {t['w']}x{t['h']}"
            else:
                assert t["w"] <= 126 and t["h"] <= 154, f"Lite ceiling violated on {cid}: {t['w']}x{t['h']}"
            out[tier] = {
                "src": f"assets/sheets/{sub}{t['file']}?k={SHEET_VER}",
                "cols": 5, "rows": 5, "frames": 25,
                "w": t["w"], "h": t["h"],
                "sheetW": t["w"] * 5, "sheetH": t["h"] * 5,
                "kb": t["kb"], "ramMb": t["ramMb"],
                "fig": aligned,
                "rel": c["rel"],
                "impact": c["impact"],
                "wpt": wpt,
                "isStaticRef": False,
                "isVideo25": True,
            }
            sim_slot[tier] = {
                "file": f"{sub}{t['file']}?k={SHEET_VER}",
                "w": t["w"], "h": t["h"],
                "kb": t["kb"], "ramMb": t["ramMb"],
            }
        return out, sim_slot, True
    else:
        r = refs_m[ref_key]
        out = {}
        sim_slot = {
            "cols": 1, "rows": 1, "frames": 1,
            "fig": r["fig"],
            "rel": 0.45,
            "impact": 0,
            "isVideo25": False,
        }
        for tier in ("mob", "lite"):
            t = dict(r[tier])
            if tier == "mob":
                assert t["w"] <= 180 and t["h"] <= 220, f"Ref ceiling violated on {ref_key}: {t['w']}x{t['h']}"
            else:
                assert t["w"] <= 126 and t["h"] <= 154, f"Ref lite ceiling violated on {ref_key}: {t['w']}x{t['h']}"
            t["isVideo25"] = False
            out[tier] = t
            fn = t["src"].split("/")[-1]
            sim_slot[tier] = {
                "file": fn,
                "w": t["w"], "h": t["h"],
                "kb": t["kb"], "ramMb": t["ramMb"],
            }
        return out, sim_slot, False


def pack_alt(c):
    """one alternative take -> (stand sheet pair, sim slot), same shape as pack_adapted_or_ref"""
    aligned = {"top": c["fig"]["top"], "foot": c["fig"]["foot"], "ax": c["fig"]["ax"]}
    wpt = c.get("wpt") or [0.28, -0.76]
    sim_slot = {"cols": 5, "rows": 5, "frames": 25, "fig": aligned, "rel": c["rel"], "impact": c["impact"], "wpt": wpt,
                "ho": c.get("ho"), "wf": c.get("wf"), "isVideo25": True}
    out = {}
    for tier in ("mob", "lite"):
        t = c[tier]
        lim = (180, 220) if tier == "mob" else (126, 154)
        assert t["w"] <= lim[0] and t["h"] <= lim[1], f"Alt ceiling violated: {t['file']}"
        assert os.path.exists(os.path.join(REPO, "assets", "sheets", "alt", t["file"])), f"alt sheet missing: {t['file']}"
        out[tier] = {"src": f"assets/sheets/alt/{t['file']}?k={SHEET_VER}", "cols": 5, "rows": 5, "frames": 25,
                     "w": t["w"], "h": t["h"], "sheetW": t["w"] * 5, "sheetH": t["h"] * 5, "kb": t["kb"], "ramMb": t["ramMb"],
                     "fig": aligned, "rel": c["rel"], "impact": c["impact"], "wpt": wpt, "isStaticRef": False, "isVideo25": True}
        sim_slot[tier] = {"file": f"alt/{t['file']}?k={SHEET_VER}", "w": t["w"], "h": t["h"], "kb": t["kb"], "ramMb": t["ramMb"]}
    return out, sim_slot


def build_balance_existing(g):
    gid = g["id"]
    if gid == "kitsune":
        return {
            "badge": "В балансе (57,8% побед 5×5 · 2 точечные правки)",
            "badgeClass": "balanced",
            "paragraphsRu": [
                "<b>Полный кап (XX★5, зачарования, Астрал, реликвии, существо + Рыбалка 100):</b> Кицунэ уверенно держит <b>57,8% побед в боях 5×5</b> (средний бой 79,6 сек, 0% ничьих по таймеру). За бой лечит отряд в среднем на <b>73,8M HP</b>, а её обманки перехватывают около 7 вражеских атак.",
                "<b>Что подкрутить:</b> (1) на XX★5 проклятие супера уже упирается в системный потолок <code>−70%</code>, поэтому бонус коллекции Астрала на силу проклятия не даёт прироста — лучше заменить его на длительность (<code>time</code>); (2) ульте «Лисья свадьба» стоит добавить ожидание раненых ниже 70% HP, чтобы не тратить 42,8% командного отхила в перехил на первых секундах."
            ],
        }

    w5 = g["sim5v5"]["winPct"]
    sec_avg = g["sim5v5"]["avgSec"]
    d1 = g["duel1v1Pct"]
    t = g["telemetry"]
    dmg = t["avgDmgDoneM"]
    heal = t["avgHealM"]
    sh = t["avgShieldM"]
    r_role = g.get("rank_role", 1)
    c_role = g.get("count_role", 10)
    role_ru = g["roleName"]
    cls = g["cls"]

    stats_bits = [f"урон <b>{fmt_m(dmg)}</b>"]
    if heal >= 8:
        stats_bits.append(f"исцеление <b>{fmt_m(heal)}</b>")
    if sh >= 12:
        stats_bits.append(f"щиты <b>{fmt_m(sh)}</b>")
    stats_str = ", ".join(stats_bits)

    if w5 >= 62.0:
        badge = f"Слишком сильный ({w5:.1f}% побед 5×5)".replace(".", ",")
        bcls = "op"
        p1 = (
            f"<b>Полный кап (XX★5, все зачарования, Астрал, реликвии, существо + Рыбалка 100):</b> "
            f"{g['name']} вырывается в явные лидеры меты — <b>{str(w5).replace('.', ',')}% побед в 5×5</b> "
            f"({r_role}-е место из {c_role} в роли «{role_ru}», средний вклад за бой: {stats_str}, бой {str(sec_avg).replace('.', ',')} сек)."
        )
        if sh > 250:
            fix = "ослабить множитель прочности командного щита на <b>15–18%</b> (или сократить длительность щита на 1 сек), чтобы связка зачарования и Астрала не перекрывала весь входящий урон."
        elif heal > 100:
            fix = "снизить коэффициент массового лечения/контроля на капе на <b>14–16%</b>, иначе в связке с бонусом Астрала отряд переживает любой фокус без окна для пробития."
        else:
            fix = "уменьшить скейл <code>SKP</code> супера/ульты на <b>12–15%</b> (или поднять паузу между атаками на +0,4 сек), чтобы убрать избыточный перекос на XX★5."
        p2 = f"<b>Рекомендация по правке цифр:</b> стоит {fix}"
    elif (cls != "tank" and w5 <= 41.5) or (cls == "tank" and w5 <= 38.5):
        badge = f"Слишком слабый ({w5:.1f}% побед 5×5)".replace(".", ",")
        bcls = "weak"
        p1 = (
            f"<b>Полный кап (XX★5, все зачарования, Астрал, реликвии, существо + Рыбалка 100):</b> "
            f"на максимальной прокачке {g['name']} проседает до <b>{str(w5).replace('.', ',')}% побед в 5×5</b> "
            f"({r_role}-е место из {c_role} в роли «{role_ru}», дуэли 1×1: {str(d1).replace('.', ',')}%, вклад за бой: {stats_str})."
        )
        if cls == "tank":
            fix = f"усилить командную защиту (дать частичный щит раненому союзнику или поднять <code>SKP</code> на <b>+18%</b>) и ускорить тяжёлый замах (<code>{str(g['pauseSec']).replace('.', ',')} сек</code> → на 0,8 сек быстрее), чтобы враги не игнорировали танка."
        elif cls == "support":
            fix = "усилить профильный эффект на <b>+18–22%</b> или добавить снятие одного контроля/короткий щит на ульте, так как сейчас на капе темп перебивают взрывной урон и антихил."
        else:
            fix = "поднять множитель <code>SKP</code> активных умений на <b>+15–20%</b>, чтобы срабатывание супера/ульты на XX★5 давало ощутимый пик урона и не теряло темп."
        p2 = f"<b>Рекомендация по правке цифр:</b> рекомендуется {fix}"
    else:
        badge = f"В балансе ({w5:.1f}% побед 5×5)".replace(".", ",")
        bcls = "balanced"
        p1 = (
            f"<b>Полный кап (XX★5, все зачарования, Астрал, реликвии, существо + Рыбалка 100):</b> "
            f"{g['name']} показывает ровный здоровый результат — <b>{str(w5).replace('.', ',')}% побед в 5×5</b> "
            f"({r_role}-е место из {c_role} среди роли «{role_ru}», дуэли 1×1: {str(d1).replace('.', ',')}%, средний бой {str(sec_avg).replace('.', ',')} сек; за бой: {stats_str})."
        )
        rc_s = RC_NAME_RU.get(g["skillInfo"]["s"].get("rcType", ""), "усиление супера")
        rc_h = RC_NAME_RU.get(g["skillInfo"]["h"].get("rcType", ""), "усиление ульты")
        if "-70%" in g["skillInfo"]["s"]["desc"] and g["skillInfo"]["s"].get("rcType") == "curse":
            p2 = f"<b>Точечный нюанс капа:</b> базовые цифры в норме, но ослабление на супере уже упирается в потолок <code>−70%</code>, поэтому бонус Астрала ({rc_s}) выгоднее переключить на длительность эффекта."
        else:
            p2 = f"<b>Вердикт по цифрам:</b> скейлы <code>XX★5</code>, ветки зачарования и бонусы Астрала (супер — <i>{rc_s}</i>, ульта — <i>{rc_h}</i>) работают без перекосов и затяжек боя; срочных правок не требуется."

    return {"badge": badge, "badgeClass": bcls, "paragraphsRu": [p1, p2]}


def build_balance_new10(g):
    w5 = g["sim5v5"]["winPct"]
    sec_avg = g["sim5v5"]["avgSec"]
    d1 = g["duel1v1Pct"]
    t = g["telemetry"]
    cr = g["creature"]
    rc_s = RC_NAME_RU.get(g["skillInfo"]["s"].get("rcType", ""), "бонус супера")
    rc_h = RC_NAME_RU.get(g["skillInfo"]["h"].get("rcType", ""), "бонус ульты")

    stats_bits = [f"урон <b>{fmt_m(t['avgDmgDoneM'])}</b>"]
    if t["avgHealM"] >= 5:
        stats_bits.append(f"хил <b>{fmt_m(t['avgHealM'])}</b>")
    if t["avgShieldM"] >= 10:
        stats_bits.append(f"щиты <b>{fmt_m(t['avgShieldM'])}</b>")

    p1 = (
        f"<b>Сразу сбалансирован на полном капе (XX★5):</b> в симуляции 144 боёв 5×5 против текущих топ-команд "
        f"{g['name']} держит целевые <b>{str(w5).replace('.', ',')}% побед</b> (дуэли 1×1: {str(d1).replace('.', ',')}%, "
        f"средний бой {str(sec_avg).replace('.', ',')} сек, 0% ничьих; вклад за бой: {', '.join(stats_bits)})."
    )
    p2 = (
        f"<b>Полная прокачка «под ключ»:</b> <code>SKP = {g['skp']['s']}</code>, полное зачарование 3 умений, "
        f"коллекция Астрала (<code>{g['rcBt']}</code>: супер +{int(g['skillInfo']['s']['rcVal']*100)}% <i>{rc_s}</i>, "
        f"ульта +{int(g['skillInfo']['h']['rcVal']*100)}% <i>{rc_h}</i>) и наземное 4-лапое существо "
        f"<b>«{cr['name']}»</b> ({cr['desc']})."
    )
    return {
        "badge": f"В балансе с нуля ({str(w5).replace('.', ',')}% побед 5×5)",
        "badgeClass": "balanced",
        "paragraphsRu": [p1, p2],
    }


SIM_GOD_DATA_MAP = {}


def slot_status_tag(ok_bt, ok_ti):
    if ok_bt and ok_ti:
        return "Kling: БТ + TI готовы"
    if ok_bt:
        return "Kling: БТ готов, TI нет"
    if ok_ti:
        return "Kling: TI готов, БТ нет"
    return "Kling: ещё не сделан"


def build_existing_entry(gid):
    g = all52["gods"][gid]
    lm = live_m[gid]
    br_bt = lm.get("bodyRatioBt", 0.94)
    br_ti = lm.get("bodyRatioTi", 0.95)

    bt_sheets = {}
    ti_sheets = {}
    sim_bt_slots = {}
    sim_ti_slots = {}
    ready_flags = {}
    vid_count = 0

    for sl in ("idle", "atk", "sup", "hyp"):
        s_bt, sim_bt, ok_bt = pack_adapted_or_ref(f"{gid}_bt_{sl}", f"{gid}_bt", br_bt)
        s_ti, sim_ti, ok_ti = pack_adapted_or_ref(f"{gid}_ti_{sl}", f"{gid}_ti", br_ti)
        bt_sheets[sl] = s_bt
        ti_sheets[sl] = s_ti
        sim_bt_slots[sl] = sim_bt
        sim_ti_slots[sl] = sim_ti
        ready_flags[sl] = (ok_bt, ok_ti)
        if ok_bt:
            vid_count += 1
        if ok_ti:
            vid_count += 1

    SIM_GOD_DATA_MAP[gid] = {
        "newBt": {"slots": sim_bt_slots},
        "newTi": {"slots": sim_ti_slots},
    }
    prev_arenas = {}
    if gid in PREV_GODS:
        pb, pt, spb, spt = {}, {}, {}, {}
        for sl in ("idle", "atk", "sup", "hyp"):
            pb[sl], spb[sl], _ = pack_adapted_or_ref(f"{gid}_bt_{sl}", f"{gid}_bt", br_bt, prev=True)
            pt[sl], spt[sl], _ = pack_adapted_or_ref(f"{gid}_ti_{sl}", f"{gid}_ti", br_ti, prev=True)
        SIM_GOD_DATA_MAP[gid]["newBtPrev"] = {"slots": spb}
        SIM_GOD_DATA_MAP[gid]["newTiPrev"] = {"slots": spt}
        prev_arenas = {"new_bt_prev": {"clipMap": {}, "sheets": pb}, "new_ti_prev": {"clipMap": {}, "sheets": pt}}

    alt_arenas = {}
    for st, key, gk in (("bt", "new_bt_alt", "newBtAlt"), ("ti", "new_ti_alt", "newTiAlt")):
        per, sper = {}, {}
        for sl in ("idle", "atk", "sup", "hyp"):
            for e in alt_m.get(f"{gid}_{st}_{sl}", []):
                o, so = pack_alt(e)
                n = str(int(e["ver"].lstrip("v")))   # keyed by version number, so "Версия N" means take vN in both styles
                assert int(n) >= 2 and n not in per.get(sl, {}), f"bad alt ver {gid}_{st}_{sl} {e['ver']}"
                per.setdefault(sl, {})[n] = {"label": e.get("label", ""), "ver": e["ver"], "sheet": o}
                sper.setdefault(sl, {})[n] = so
        if per:
            alt_arenas[key] = per
            SIM_GOD_DATA_MAP[gid][gk] = sper
    live_pack = {
        "clipMap": lm.get("clipMap", {}),
        "sheets": lm["sheets"],
    }

    el = g["el"]
    role = g["role"]
    melee = g["melee"]
    sup_name = g["superDef"]["name"]
    hyp_name = g["hyperDef"]["name"]

    mob_bt_idle = bt_sheets["idle"]["mob"]
    mob_ti_idle = ti_sheets["idle"]["mob"]
    live_mob_idle = lm["sheets"]["idle"]["mob"]

    kl = KLING["gods"].get(gid)
    if kl:
        anim_note = (
            f"<b>Kling 4.0 — готово {vid_count}/8</b> ({kl['date']}). Листы 5×5, 25 кадров, не больше 180×220 px. "
            f"Ожидание: БТ {mob_bt_idle['w']}×{mob_bt_idle['h']} px, TI {mob_ti_idle['w']}×{mob_ti_idle['h']} px "
            f"(сейчас в игре {live_mob_idle['w']}×{live_mob_idle['h']} px)."
        )
    else:
        anim_note = "Kling: ещё не сделан. На аренах 2 и 3 стоит неподвижная фигура, боевые эффекты игры работают как есть."

    is_kitsune = (gid == "kitsune")
    fx_verdict_atk = (
        "На Арене 1 работает нетронутый живой рецепт FX2 «Кузница» игры; на Аренах 2 и 3 — обновлённый рецепт FX2 Кицунэ: "
        "огоньки кицунэ-би приближены вплотную к хвостам (≤15 px), без широкого свечения и без залезания на врагов."
        if is_kitsune else
        "Во всех 3 аренах работает 100% подлинный боевой движок игры (SIM + FX2 «Кузница» из art/fx2.js) без поддельных фаерболов. "
        "На Аренах 2 и 3 точка вылета и момент удара автоматически синхронизированы с новым оружием (wpt / rel)."
    )
    fx_verdict_sup = (
        "Арена 1 показывает текущий боевой FX2 как есть; на Аренах 2 и 3 убраны далёкие фонарики и широкий засвет — "
        "оставлены чёткие лисьи огоньки у контура хвостов и читаемый полёт проклятия."
        if is_kitsune else
        f"Во всех 3 аренах исполняется настоящий индивидуальный рецепт FX2 «Кузница» умения «{sup_name}» "
        f"(истинная механика SIM, родные глифы/лучи/удары и реальные статусы боя XX★5)."
    )
    fx_verdict_hyp = (
        "Честное сравнение бок о бок: на Арене 1 сохранены текущие полупрозрачные копии тела (decoys) и широкая дуга фонарей, "
        "а на Аренах 2 и 3 они заменены на аккуратный венец кицунэ-би вокруг Кицунэ и плотные огоньки обманки без превращения экрана в фонарик."
        if is_kitsune else
        f"Во всех 3 аренах исполняется подлинный кульминационный рецепт FX2 «Кузница» ульты «{hyp_name}» "
        f"на реальном движке SIM + FX2 с привязкой к координатам оружия нового 25-кадрового листа."
    )

    skills_obj = {
        "idle": {
            "shortName": "Ожидание",
            "title": "Ожидание (idle) — стойка, дыхание и выравнивание роста по макушке",
            "descRu": anim_note,
            "fxBadge": slot_status_tag(*ready_flags["idle"]),
            "animRu": (kl or {}).get("notes", {}).get("idle", ""), "todoRu": (kl or {}).get("todo", {}).get("idle", ""), "balRu": (kl or {}).get("balance", ""),
            "fxUpgraded": ready_flags["idle"][0] or ready_flags["idle"][1],
            "fxVerdictRu": "Рост человеческой фигуры синхронизирован между всеми тремя аренами по линии макушки (v2Fit), без фоновых пятен и без свечения глаз.",
        },
        "atk": {
            "shortName": "Удар / пассивка" if melee else "Выстрел / пассивка",
            "title": f"Обычное умение (atk, интервал {str(g['pauseSec']).replace('.', ',')} сек) · подлинный FX2",
            "descRu": g["skillInfo"]["a"]["desc"].replace("\n", " "),
            "fxBadge": slot_status_tag(*ready_flags["atk"]),
            "animRu": (kl or {}).get("notes", {}).get("atk", ""), "todoRu": (kl or {}).get("todo", {}).get("atk", ""), "balRu": (kl or {}).get("balance", ""),
            "fxUpgraded": True,
            "fxVerdictRu": fx_verdict_atk,
        },
        "sup": {
            "shortName": sup_name,
            "title": f"Суперумение (sup) — «{sup_name}» · подлинный FX2",
            "descRu": g["skillInfo"]["s"]["desc"].replace("\n", " "),
            "fxBadge": slot_status_tag(*ready_flags["sup"]),
            "animRu": (kl or {}).get("notes", {}).get("sup", ""), "todoRu": (kl or {}).get("todo", {}).get("sup", ""), "balRu": (kl or {}).get("balance", ""),
            "fxUpgraded": True,
            "fxVerdictRu": fx_verdict_sup,
        },
        "hyp": {
            "shortName": hyp_name,
            "title": f"Ульта (hyp) — «{hyp_name}» · подлинный FX2",
            "descRu": g["skillInfo"]["h"]["desc"].replace("\n", " "),
            "fxBadge": slot_status_tag(*ready_flags["hyp"]),
            "animRu": (kl or {}).get("notes", {}).get("hyp", ""), "todoRu": (kl or {}).get("todo", {}).get("hyp", ""), "balRu": (kl or {}).get("balance", ""),
            "fxUpgraded": True,
            "fxVerdictRu": fx_verdict_hyp,
        },
    }

    return {
        "id": gid,
        "group": "existing",
        "name": g["name"],
        "element": el,
        "elementRu": EL_RU[el],
        "elementIcon": EL_ICON[el],
        "role": role,
        "roleRu": g["roleName"],
        "portrait": lm["portrait"],
        "hasVideoAnim": vid_count > 0,
        "videoSlotsReady": vid_count,
        "arenas": {
            "live_bt": live_pack,
            "new_bt": {"clipMap": {}, "sheets": bt_sheets},
            "new_ti": {"clipMap": {}, "sheets": ti_sheets},
            **prev_arenas,
            **alt_arenas,
        },
        "hasPrev": bool(prev_arenas),
        "skills": skills_obj,
        "balance": build_balance_existing(g),
    }


def build_new10_entry(gid):
    g = new10[gid]
    nm = new10_m[gid]
    br_bt = nm["bodyRatioBt"]
    br_ti = nm["bodyRatioTi"]

    cs = nm["conceptSheet"]
    live_concept = {}
    for tier in ("mob", "lite"):
        t = cs[tier]
        live_concept[tier] = {
            "src": f"assets/sheets/{t['file']}?k={SHEET_VER}",
            "cols": 1, "rows": 1, "frames": 1,
            "w": t["w"], "h": t["h"],
            "sheetW": t["w"], "sheetH": t["h"],
            "kb": t["kb"], "ramMb": t["ramMb"],
            "fig": head_aligned_fig(cs["fig"], br_bt),
            "rel": 0.45, "impact": 0,
            "isStaticRef": True, "isConceptRef": True, "isVideo25": False,
        }

    bt_sheets = {}
    ti_sheets = {}
    sim_bt_slots = {}
    sim_ti_slots = {}
    vid_count = 0
    for sl in ("idle", "atk", "sup", "hyp"):
        s_bt, sim_bt, ok_bt = pack_adapted_or_ref(f"{gid}_bt_{sl}", f"{gid}_bt", br_bt)
        s_ti, sim_ti, ok_ti = pack_adapted_or_ref(f"{gid}_ti_{sl}", f"{gid}_ti", br_ti)
        bt_sheets[sl] = s_bt
        ti_sheets[sl] = s_ti
        sim_bt_slots[sl] = sim_bt
        sim_ti_slots[sl] = sim_ti
        if ok_bt:
            vid_count += 1
        if ok_ti:
            vid_count += 1

    SIM_GOD_DATA_MAP[gid] = {
        "newBt": {"slots": sim_bt_slots},
        "newTi": {"slots": sim_ti_slots},
    }

    el = g["el"]
    role = g["role"]
    sup_name = g["superDef"]["name"]
    hyp_name = g["hyperDef"]["name"]

    mob_bt = bt_sheets["idle"]["mob"]
    mob_ti = ti_sheets["idle"]["mob"]

    skills_obj = {
        "idle": {
            "shortName": "Ожидание",
            "title": f"{g['name']} — {g['title']} (новый бог «под ключ»: БТ + Titan Idols)",
            "descRu": (
                f"Нарисованы с нуля 2K-арты в обоих стилях (кнопка «🔍 Арт 2K (БТ + TI)» справа сверху). "
                f"Габарит на арене строго в лимите ≤180×220 px: БТ {mob_bt['w']}×{mob_bt['h']} px, TI {mob_ti['w']}×{mob_ti['h']} px. "
                f"Видео-слоты 25 кд ({vid_count}/8) стоят в приоритетной очереди генерации."
            ),
            "fxBadge": "Новый бог + рецепт FX2 «Кузница»",
            "fxUpgraded": True,
            "fxVerdictRu": f"Арена 1 помечена «Ещё не в живой игре», а на Аренах 2 и 3 уже работает полный боевой профиль SIM и индивидуальный рецепт FX2 «Кузница». Существо бога: «{g['creature']['name']}» ({g['creature']['desc']}).",
        },
        "atk": {
            "shortName": "Обычное умение",
            "title": f"Обычное умение (atk, интервал {str(g['pauseSec']).replace('.', ',')} сек) · авторский FX2",
            "descRu": g["skillInfo"]["a"]["desc"].replace("\n", " "),
            "fxBadge": "Авторский FX2 «Кузница»",
            "fxUpgraded": True,
            "fxVerdictRu": f"Индивидуальный рецепт FX2 «Кузница» (собственный GLYPH + сигнатура): {g['fxPlan']['atk']['desc']}",
        },
        "sup": {
            "shortName": sup_name,
            "title": f"Суперумение (sup) — «{sup_name}» · авторский FX2",
            "descRu": g["skillInfo"]["s"]["desc"].replace("\n", " "),
            "fxBadge": "Авторский FX2 супера",
            "fxUpgraded": True,
            "fxVerdictRu": f"Индивидуальный рецепт FX2 «Кузница»: {g['fxPlan']['sup']['desc']}",
        },
        "hyp": {
            "shortName": hyp_name,
            "title": f"Ульта (hyp) — «{hyp_name}» · авторский FX2",
            "descRu": g["skillInfo"]["h"]["desc"].replace("\n", " "),
            "fxBadge": "Авторский FX2 ульты",
            "fxUpgraded": True,
            "fxVerdictRu": f"Индивидуальный кульминационный рецепт FX2 «Кузница»: {g['fxPlan']['hyp']['desc']}",
        },
    }

    return {
        "id": gid,
        "group": "new10",
        "name": g["name"],
        "titleRu": g["title"],
        "element": el,
        "elementRu": EL_RU[el],
        "elementIcon": EL_ICON[el],
        "role": role,
        "roleRu": g["roleName"],
        "portrait": f"assets/ui/ports/{gid}.webp",
        "conceptArts": {
            "bt": f"assets/concepts/{gid}-bt.webp",
            "ti": f"assets/concepts/{gid}-ti.webp",
        },
        "hasVideoAnim": vid_count > 0,
        "videoSlotsReady": vid_count,
        "isNewGod": True,
        "arenas": {
            "live_bt": {"clipMap": {"atk": "idle", "sup": "idle", "hyp": "idle"}, "sheets": {"idle": live_concept}},
            "new_bt": {"clipMap": {}, "sheets": bt_sheets},
            "new_ti": {"clipMap": {}, "sheets": ti_sheets},
        },
        "skills": skills_obj,
        "balance": build_balance_new10(g),
    }


PRIORITY_FIRST = ["kitsune", "athena", "artemis", "zeus", "demeter", "hel"]
EL_ORDER = {"light": 0, "fire": 1, "water": 2, "earth": 3, "dark": 4}
rem_ids = [gid for gid in all52["visibleIds"] if gid not in PRIORITY_FIRST]
rem_ids.sort(key=lambda gid: (EL_ORDER.get(all52["gods"][gid]["el"], 9), all52["gods"][gid]["name"]))
ordered_existing = PRIORITY_FIRST + rem_ids

NEW10_ORDER = ["perun", "ishtar", "tyr", "kagutsuchi", "sedna", "manannan", "gilgamesh", "skadi", "izanami", "baron"]

gods_list = [build_existing_entry(gid) for gid in ordered_existing] + [build_new10_entry(gid) for gid in NEW10_ORDER]

manifest = {
    "updatedAt": __import__("time").strftime("%Y-%m-%d"),
    "existingCount": len(ordered_existing),
    "new10Count": len(NEW10_ORDER),
    "ceilingMob": "180x220",
    "ceilingLite": "126x154",
    "totalVideoClipsReady": sum(g["videoSlotsReady"] for g in gods_list),
    "gods": gods_list,
    "simGodDataMap": SIM_GOD_DATA_MAP,
    "prevDir": PREV_DIR,
    "prevGods": PREV_GODS,
}

js_payload = "window.GODS_MANIFEST = " + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n"

for rel_dst in (os.path.join("assets", "gods-data.js"),):   # 13.11: the root copy was junk (T3)
    out_path = os.path.join(REPO, rel_dst)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_payload)

sz_kb = round(len(js_payload.encode("utf-8")) / 1024.0, 1)
print(
    f"Built gods-data.js ({sz_kb} KB): {len(ordered_existing)} existing + {len(NEW10_ORDER)} new10 = {len(gods_list)} gods, "
    f"QA-verified 25-frame clips={manifest['totalVideoClipsReady']}. 100% mob<=180x220 & lite<=126x154 verified! "
    f"prev ({PREV_DIR}) packs: {PREV_GODS} ({len(prev_m)} sheets)"
)
