#!/usr/bin/env python3
"""lint_prompt.py — checks a Kling prompt for a god animation BEFORE credits are spent.

Usage:  lint_prompt.py <slot: idle|atk|sup|hyp> <prompt.txt | -> [--still-by-design]      (exit 1 on errors)
        lint_prompt.py --json prompts.json                              ({clip_id: prompt}; slot = last part of the id)

        add --still-by-design when the card gives the reason why the body stands still in this clip
        (Maxim accepted such clips: Agni's three flames from the hand, Inti's super): the "no body move" error becomes a warning

The limits come from our own clips (skill, section 7); tests in tests/:
  must pass : Surt's strike of 27.10 and Athena's "Aegis" super of 12.11 (clips accepted by Maxim), Kitsune's bundle super of
              12.11 (his own idea; he criticised only the game part), the two templates written by the new grammar
  must fail : tests/_glued_*  and all 66 template prompts of 13.11 (pipeline/b3/p10.py, p11.json, p12.json)
Not checked: the prompts of the clips Maxim accepted on the night of 12-13.11 (Heimdall, Indra, Inti ...) were not kept.
"""
import re, sys, json

NEG = re.compile(r"\b(no|not|never|nothing|without|don't|doesn't|cannot|can't)\b", re.I)
SENT = re.compile(r"(?<=[.!?;:])\s+")

def negated(sentence_part):
    return bool(NEG.search(sentence_part))

def find(pat, text):
    """occurrences of pat with the clause they sit in (clause = text between . ; :)"""
    out = []
    for cl in re.split(r"[.;:]", text):
        for m in re.finditer(pat, cl, re.I):
            out.append((m.group(0), cl.strip(), negated(cl[:m.start()])))
    return out

# a move of the body mass, named by its verb. "braces", "stance", "feet planted", "in place" do NOT count (R1: glued feet).
LOWER_BODY = r"\b(crouch\w*|(?:he|she)\s+(?:\w+\s+){0,2}sinks?|kneel\w*|bends? (?:her|his|both|the) knees?|knees? bend\w*|squat\w*|shifts? (?:her|his|the|all|whole)[\w ]{0,12}weight|weight (?:onto|on to|from|back|forward)|steps? (?:her|his|back|aside|sideways|to the side|forward)|lifts? (?:her|his|one|a) (?:foot|leg|heel|knee)|lunges?|rises? (?:on|onto|from)|twists? (?:her|his) hips|turns? (?:her|his) hips|hips (?:turn|twist|swing)\w*)\b"
UNWANTED_VISUALS = r"\b(lens flare|starburst|white-?out|crescent|arc-shaped|star-shaped|cross-shaped|haze|ghostly|transparent|rectangle)\b"
# only when the BODY is the subject ("flames leap up", "embers float" are effects and are fine)
BODY_AIR = r"\b(?:he|she)\b(?:\s+\w+){0,2}?\s+(jumps?|hops?|leaps?|floats?|levitates?|hovers?)\b|\b(?:a|one|small|short|little|big|high)\s+(?:\w+\s+)?(jump|hop|leap)\b"
BODY_WALK = r"\b(?:he|she)\b(?:\s+\w+){0,2}?\s+(runs?|walks?|dashes?|strides?)\b"
TO_CAMERA = r"(steps?|lunges?|moves?|walks?) (forward )?(toward|towards|to) the (camera|viewer)"
SPIN = r"\b(spins?|spinning|twirl\w*|pirouette\w*|turns? around|full turn|rotat(?:es?|ing|ion))\b"
WEAK = r"\b(only slightly|slightly|a little|barely|subtle|subtly|tiny|small)\b"
SMOKE = r"\b(smoke|vapor|vapour|mist|fog|dust)\b"
BLAST = r"\b(burst\w*|explod\w*|explosion\w*|shockwave\w*|blast\w*)\b"
SIDE = r"\b(to the left|to the right|sideways|leftward|rightward)\b"
SIMILE = r"\b(\w+-like)\b"
FLIGHT = r"\b(fl(?:y|ies|ying) (?:away|off|out|toward|across)|shoots? (?:out|away|across|toward)|launch\w*|is fired|hurl\w*|thrown? (?:away|across|toward))"
IDLE_FX = r"\b(glow\w*|fire|flame\w*|lightning|sparks?|magic\w*|aura)\b"
IDLE_ATTACK = r"\b(raise[sd]?|aim\w*|swing\w*|strike\w*|thrust\w*|slash\w*)\b"

def lint(slot, text, still_by_design=False):
    E, W, I = [], [], []
    t = " ".join(text.split())
    words = len(t.split()); negs = len(NEG.findall(t))
    I.append(f"{words} words, {negs} prohibitions")
    action = slot in ("atk", "sup", "hyp")
    if words > 370: E.append(f"too long: {words} words (limit 370; the accepted prompts are 280-340 words)")
    elif words > 350: W.append(f"long: {words} words (the accepted prompts are 280-340)")
    if negs > 14: E.append(f"{negs} prohibitions (limit 14). Do not add bans: describe the wanted move/effect, or change the idea")
    elif negs > 12: W.append(f"{negs} prohibitions (the tail alone has 10; the accepted prompts had 7-14)")
    hits = [h for h in find(UNWANTED_VISUALS, t)]
    if hits: E.append("wall-of-bans words of the 13.11 template (its clips were rejected; a ban is allowed only about this clip's own effect, e.g. 'the light stays on the shield: no beams'; against a vanishing body write 'Her body stays solid and fully visible in every frame'): " + ", ".join(sorted({h[0].lower() for h in hits})))
    if not re.search(r"(same pose as the first frame|last frame matches the first frame|returns? to the starting pose|end pose equals the start pose)", t, re.I):
        E.append("no closing 'settles into exactly the same pose as the first frame'")
    if not re.search(r"(static|locked-off|fixed) (locked-off )?camera", t, re.I): E.append("no 'static locked-off camera' line")
    if not re.search(r"gray background", t, re.I): E.append("no 'plain flat gray background' line")
    walk = [h for h in find(BODY_WALK, t) if not h[2]]
    if walk: E.append("the god walks or runs (no travel; the stand moves him): " + ", ".join(sorted({h[0].lower() for h in walk})))
    air = [h for h in find(BODY_AIR, t) if not h[2]]
    if air: W.append("hop/jump/float of the body: allowed only if it fits the headroom in the card (in R2 these words took heads and weapons out of the frame): " + ", ".join(sorted({h[0].lower() for h in air})))
    cam = [h for h in find(TO_CAMERA, t) if not h[2]]
    if cam: W.append("the body moves toward the camera: the figure grows — keep it small and smooth, the stand scales the leap: " + cam[0][0])
    if action:
        labels = re.search(r"wind-?up", t, re.I) and re.search(r"\brelease\b", t, re.I) and re.search(r"\brecover", t, re.I)
        seq = re.search(r"(wind-?up|first (third of a )?second)", t, re.I) and re.search(r"\bthen\b", t, re.I) and re.search(r"(returns?|settles?|straightens)", t, re.I)
        if not (labels or seq):
            E.append("no three beats: 'Wind-up, the first ...:', 'Release:', 'Recovery, the rest of the clip:'")
        elif not labels:
            W.append("beats are not labelled (new prompts use 'Wind-up, the first ...:', 'Release:', 'Recovery, the rest of the clip:')")
        # the action story = from the "Wind-up" label (or from the start when the beats are not labelled) up to the first
        # "first frame"; the fixed tail ("bending knees ...") comes after it and does not count
        m = re.search(r"wind-?up, the first.*?first frame", t, re.I | re.S) or re.search(r"^.*?first frame", t, re.I | re.S)
        story = m.group(0) if m else t
        if not [h for h in find(LOWER_BODY, story) if not h[2]]:
            (W if still_by_design else E).append("the action story names no move of the body mass (she sinks, crouches, kneels, bends her knees, shifts her weight onto, steps aside, lifts a foot, lunges, twists her hips) — result: only the arm moves. If the idea of this clip keeps the body still, write the reason in the card, tell Maxim, and run with --still-by-design")
        if not re.search(r"(living (wo)?man|living person|big, bold|weight shifts)", t, re.I):
            W.append("no living-motion line ('moves like a living woman, with natural weight shifts, bending knees and a supple spine' / 'big, bold ... clear poses')")
        if not re.search(r"\bfade\w*|dies? (out|down)|dims?\b", t, re.I): W.append("the effect is not told to fade before the recovery")
        fl = [h for h in find(FLIGHT, t) if not h[2]]
        if fl: W.append("something flies out of the clip (allowed only as a planned hand-off through the TOP edge, with the game continuation in the card): " + fl[0][0])
        weak = [h for h in find(WEAK, story) if not h[2]]
        if len(weak) >= 2: W.append("weak-motion words in the action story (Kling then barely moves): " + ", ".join(sorted({h[0].lower() for h in weak})))
    else:
        if not re.search(r"(whole clip|whole loop|entire clip|all the time|never stops)", t, re.I): W.append("idle: say the motion fills the whole clip")
        if not re.search(r"weight", t, re.I): W.append("idle: no weight shift from leg to leg")
        fx = [h for h in find(IDLE_FX, t) if not h[2]]
        if fx: W.append("idle: effect words (an idle is calm; keep an effect only if Maxim asked for it for this god): " + ", ".join(sorted({h[0].lower() for h in fx})))
        at = [h for h in find(IDLE_ATTACK, t) if not h[2]]
        if at: W.append("idle: attack-like verbs: " + ", ".join(sorted({h[0].lower() for h in at})))
    sp = [h for h in find(SPIN, t) if not h[2]]
    if sp and not re.search(r"(feet|foot) (really )?(step|lift)|stepping", t, re.I): W.append("spin/turn without stepping feet = figurine on a turntable: " + sp[0][0])
    for pat, msg in ((SMOKE, "smoke/mist words darken the background"), (BLAST, "burst/explosion words give starbursts and full-frame flashes"),
                     (SIDE, "left/right/sideways aiming is cut by the frame"),):
        hh = [h for h in find(pat, t) if not h[2]]
        if hh: W.append(msg + ": " + ", ".join(sorted({h[0].lower() for h in hh})))
    sim = [h for h in find(SIMILE, t) if not h[2] and "living" not in h[1].lower()[max(0, h[1].lower().find(h[0].lower())):][:30]]
    if sim: W.append("similes make Kling draw the object: " + ", ".join(sorted({h[0].lower() for h in sim})))
    return E, W, I

def main():
    a = sys.argv[1:]
    if a and a[0] == "--json":
        d = json.load(open(a[1], encoding="utf-8")); bad = 0
        for cid, p in d.items():
            E, W, I = lint(cid.rsplit("_", 1)[-1], p); bad += bool(E)
            print(f"{'FAIL' if E else 'ok  '} {cid:22s} {I[0]:32s} errors {len(E)} warnings {len(W)}")
        print(f"\n{bad} of {len(d)} prompts fail"); sys.exit(1 if bad else 0)
    still = "--still-by-design" in a; a = [x for x in a if x != "--still-by-design"]
    if len(a) < 2 or a[0] not in ("idle", "atk", "sup", "hyp"):
        sys.exit("usage: lint_prompt.py <idle|atk|sup|hyp> <prompt.txt | -> [--still-by-design]     or: lint_prompt.py --json prompts.json")
    slot, src = a[0], a[1]
    text = sys.stdin.read() if src == "-" else open(src, encoding="utf-8").read()
    E, W, I = lint(slot, text, still)
    for x in I: print("info   :", x)
    for x in E: print("ERROR  :", x)
    for x in W: print("warning:", x)
    print("RESULT :", "FAIL - do not send" if E else ("ok with warnings - note them in the card" if W else "ok"))
    sys.exit(1 if E else 0)

if __name__ == "__main__":
    main()
