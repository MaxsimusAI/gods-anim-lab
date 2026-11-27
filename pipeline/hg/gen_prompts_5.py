# Builds v5-grammar prompts (idle, app = entrance, atk = skill) for the last five higher goddesses (BT), 27.11 evening:
# Umbra (task 238 portrait umbra-3), Ocean (ocean-2), Time (time-1), Pogibel (pogibel-3), Fear (task 238 fear-full-v4).
# Maxim's rules for higher goddesses (LOG 26.11 20:43, 27.11 00:14): entrance in motion, different for each goddess, ends on the
# picture; idle = smooth magic over the goddess, not a glow round the outline; skill effects may cover her; nothing up out of the frame.
# Writes prompts/<god>_bt_<slot>_v5.txt
import os
from gen_prompts_all import build, OUT

G5 = {}

G5['umbra'] = dict(
  desc=("A tall goddess of darkness with pale skin, a black helmet-mask with a silver half-moon crest, a long silver-white "
        "ponytail, black lacquer armor with silver edges and a long black skirt with high slits; she holds a black greatsword "
        "diagonally across her body, the grip at her right hip, her left palm flat on the blade near the point."),
  items="the greatsword",
  app=("A tall narrow oval of pure black darkness, as tall as she is, with a thin glowing silver rim like the edge of an eclipse, "
       "stands where she will stand. Inside it her figure turns from three-quarters to the front, lifts her head and draws the "
       "greatsword up from low at her side into the diagonal across her body, while the darkness slides off her like black silk "
       "from the head down to the feet and shrinks into a thin silver line at her feet that fades. She lays her left palm on the "
       "blade and settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her left leg and bends her right knee, then onto her right leg and bends her "
               "left knee; her hips, shoulders, head and ponytail follow; the sword rises and lowers slowly and her left palm "
               "slides along the blade and back."),
  idle_kind="black and silver",
  idle_magic=("slow ribbons of black shadow edged with silver moonlight wind around her legs, waist and shoulders, passing in "
              "front of her body and fading; a thin line of silver moonlight runs slowly along the edges of the blade and back; "
              "the silver half-moon on her helmet shines softly and dims."),
  atk=("Wind-up, the first second: she bends her knees and sinks low, draws the greatsword back to her right hip with both "
       "hands; black shadow gathers along the blade. Release: she cuts in a short strong diagonal from her right hip up to her "
       "left shoulder, the blade staying below her head; at the end of the cut a black orb with a thin glowing silver ring "
       "around it, like a total eclipse, appears in front of her chest, and black shadows rush over her whole body. Recovery, "
       "the rest of the clip: the eclipse orb shrinks into the blade and fades, the shadows slide off her, she lays her left "
       "palm on the blade and settles into exactly the same pose as the first frame. The sword stays below her head."),
  atk_items="the greatsword",
)

G5['ocean'] = dict(
  desc=("A tall goddess of the ocean with deep brown skin, a mother-of-pearl mask, a silver diadem over black braids, white "
        "pearl armor and a long sea-green skirt open in front; her right arm reaches out with the palm open and up; her left "
        "hand holds a long pearl-white naginata at her side, its curved blade with a turquoise edge low near her feet."),
  items="the naginata",
  app=("Low turquoise waves roll in along the ground from both sides and meet in the middle; a column of swirling turquoise "
       "water rises from them up to the height of her shoulders, turning like a whirlpool. Her figure forms inside the whirling "
       "water: she rises from a crouch, her braids and diadem appear at the top, she stretches her right arm out of the water "
       "with the palm open; the water pours down off her body and flows into her sea-green skirt; the naginata forms in her left "
       "hand from a stream of water, its blade last. She settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her "
               "right knee; her hips, shoulders and head follow; her open hand rises and lowers slowly like a wave; the "
               "naginata sways gently."),
  idle_kind="turquoise water",
  idle_magic=("slow ribbons of clear turquoise water flow around her legs, waist and outstretched arm, passing in front of her "
              "body and falling back; a small sphere of turquoise water forms above her open palm, turns slowly and melts back "
              "into her hand; a thin turquoise light runs along the edge of the blade."),
  atk=("Wind-up, the first second: she bends her knees and sinks, swings the naginata low behind her and draws her open right "
       "hand back to her chest; turquoise water climbs up her legs. Release: she sweeps the naginata forward in a low arc in "
       "front of her knees, the blade below her waist, and pushes her open right palm forward; a tall wave of turquoise water, "
       "no wider than her shoulders, rises around her from the feet to the shoulders, curls over her body and falls; a sphere "
       "of water shines on her palm. Recovery, the rest of the clip: the wave fades into the ground, the sphere melts into her "
       "palm, and she settles into exactly the same pose as the first frame. The naginata stays below her head."),
  atk_items="the naginata",
)

G5['time'] = dict(
  desc=("A tall goddess of time floating a little above the ground, legs together, toes pointed down, with olive skin, a "
        "bronze visor, a tall bronze crown of spires, long curly brown hair, bronze armor and a long ivory cape and skirt; her "
        "right hand holds a level bronze staff with an ivory blade at each end and an amber hourglass in the middle; her left "
        "arm is held out with the palm down."),
  items="the staff",
  app=("Glowing amber sand flows upward from the ground like an hourglass running backwards: it pours up in a slow spiral and "
       "builds her figure from the toes up, feet, legs, ivory skirt, bronze armor, hair and crown, while she already moves "
       "inside it: she lifts her head, opens her left arm out to the side and draws the staff level in her right hand; the "
       "hourglass forms last in the middle of the staff and the sand settles in it. She floats in exactly the pose of the final "
       "frame."),
  idle_motion=("hovering, she bends her knees softly one after the other and her pointed feet sway; she twists her hips a "
               "little and her shoulders and head follow; her long hair and the ends of her cape drift slowly as if under water; "
               "her outstretched hand rises and lowers gently; the staff tilts a little and levels again."),
  idle_kind="amber sand",
  idle_magic=("the amber sand in the hourglass flows upward; thin streams of glowing amber sand leave the hourglass, wind slowly "
              "around her legs, waist and outstretched arm, passing in front of her body, and flow back into the glass; a slow "
              "ring of fine amber sand circles her waist and fades."),
  atk=("Wind-up, the first second: she draws her knees up and twists her hips and shoulders to three-quarters; with her right "
       "hand she rolls the staff in her fingers so that the hourglass turns upside down while the staff stays level; the sand "
       "starts to flow upward. Release: she twists back to the front, bends her knees and pushes her left palm down; a wide "
       "band of glowing amber sand winds around her whole body from the feet up to the shoulders and turns backward, and the "
       "grains stop in the air around her for a moment. Recovery, the rest of the clip: the band of sand fades back into the "
       "hourglass, she rolls the staff back and floats in exactly the same pose as the first frame. The staff stays level and "
       "below her head."),
  atk_items="the staff",
)

G5['pogibel'] = dict(
  desc=("A tall goddess of doom with pale skin, a golden mask with a red-orange line across the eyes, a tall golden crown, "
        "long black hair, golden armor and a long burgundy velvet cape and skirt; her right hand rests on the top of the haft of "
        "a golden morning star standing head-down beside her, its spiked head glowing red-orange like a setting sun; her left "
        "hand is on her hip."),
  items="the morning star",
  app=("A low crimson-orange glow spreads on the ground like the light of a setting sun. Out of it rises the spiked golden head "
       "of her morning star, glowing red-orange; burgundy velvet unfolds upward from the ground around it like curtains and "
       "becomes her cape and skirt; her figure appears inside it, rising from one knee: her golden armor, then her hair and her "
       "crown; her right hand comes to rest on the haft and her left hand on her hip; the red-orange line on her mask lights up "
       "last. She stands in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her left leg and bends her right knee, then onto her right leg and bends her "
               "left knee; her hips, shoulders, head, hair and cape follow; her hand on the haft rocks the morning star slowly "
               "from side to side."),
  idle_kind="crimson sunset",
  idle_magic=("slow waves of crimson and orange sunset light flow up from the head of the morning star, wind around her legs "
              "and waist and over her velvet cape, passing in front of her body and fading; the red-orange line on her mask "
              "brightens and dims; the sun inside the spiked head turns slowly."),
  atk=("Wind-up, the first second: she grips the haft with both hands, bends her knees and lifts the morning star off the "
       "ground to her right hip; the sun inside its head brightens. Release: she swings the morning star in a short heavy arc "
       "and strikes its head on the ground beside her right foot; a low dome of crimson and orange sunset light, no wider than "
       "her shoulders, rises around her from the ground up to her chest and washes over her whole body. Recovery, the rest of "
       "the clip: the sunset light fades into the ground, she sets the morning star down, rests her hand on the haft and "
       "settles into exactly the same pose as the first frame. The morning star stays below her head."),
  atk_items="the morning star",
)

G5['fear'] = dict(
  desc=("A tall goddess of fear with ash-grey skin, a dark steel helmet over her whole face with three steel thorns, "
        "shoulder-length black hair, steel armor, a short ivory skirt with a violet sash and steel greaves; her left hand is on "
        "her hip; her right hand holds a big cleaver low at her side, its broad violet blade with a silver edge and a silver thorn."),
  items="the cleaver",
  app=("A flat black shadow of a woman lies on the empty ground. The shadow stands up from the ground like a figure of black "
       "ink and takes her shape; the black ink peels off her from the head down in violet flakes that fade at once: first the "
       "steel helmet with its thorns, then her shoulders, armor, ivory skirt and violet sash, and her legs; she lifts her head, "
       "puts her left hand on her hip, and the cleaver forms in her right hand last. She stands in exactly the pose of the final "
       "frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her "
               "right knee; her hips, shoulders, head and hair follow; the heavy cleaver rocks slowly at her side."),
  idle_kind="cold violet",
  idle_magic=("slow cold violet ribbons crawl over her armor and legs and wind around her waist and arms, passing in front of "
              "her body and fading; a violet light pulses through the thorn on the blade like a slow heartbeat; the three thorns "
              "on her helmet shine faintly and dim."),
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, swings the heavy cleaver back low behind "
       "her right leg with both hands; violet light gathers on the blade. Release: she brings the cleaver up to her shoulder and "
       "down in a short heavy chop, striking the ground in front of her right foot; violet cracks of light run along the ground "
       "no wider than her shoulders, a ring of violet thorns of light rises around her legs up to her knees, and cold violet "
       "light rolls up over her whole body. Recovery, the rest of the clip: the thorns fade into the ground, the violet light "
       "fades from her body, she puts her left hand on her hip and settles into exactly the same pose as the first frame. The "
       "cleaver stays below her head."),
  atk_items="the cleaver",
)

if __name__ == '__main__':
    for g, d in G5.items():
        for slot, txt in build(g, d).items():
            p = os.path.join(OUT, f'{g}_bt_{slot}_v5.txt')
            open(p, 'w').write(txt)
            print(g, slot, len(txt.split()))
