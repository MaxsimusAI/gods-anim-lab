# Builds v5-grammar prompts (idle, app = entrance, atk = skill) for the remaining higher goddesses, BT style.
# Writes prompts/<god>_bt_<slot>_v5.txt
import os
OUT = os.path.join(os.path.dirname(__file__), 'prompts')

TAIL_BODY = ("She moves like a living woman, with natural weight shifts, bending knees and a supple spine; she never rotates "
             "rigidly like a figurine on a stand. She always faces the viewer and never shows her back. She never moves toward "
             "or away from the camera and her size in the frame stays the same. Her whole figure, {items} and all the magic stay "
             "inside the frame; nothing rises out of the top of the frame. Static locked-off camera: no zoom, no pan, no shake. "
             "Keep the character design exactly identical in every frame. Plain flat solid gray background exactly as in the "
             "input image, unchanged for the whole video: no floor, no shadow, no gray smoke, no dust. Her body stays solid in "
             "every frame. ")
IDLE_END = "Smooth, graceful, high-quality game animation; the last frame matches the first frame."
ATK_END = "Smooth, punchy, high-quality game animation; the last frame matches the first frame."
APP_TAIL = ("She always faces the viewer and never shows her back. She stays in the place where she stands in the final frame, "
            "at the same size, and never moves toward or away from the camera. Nothing rises out of the top of the frame and the "
            "magic never covers the whole picture. Static locked-off camera: no zoom, no pan, no shake. Plain flat solid gray "
            "background exactly as in the final image for the whole video: no floor, no shadow, no gray smoke, no dust. Smooth, "
            "magical, high-quality game animation; the last frame matches the final image exactly, with every extra glow faded.")

G = {}

G['creation'] = dict(
  desc=("A tall goddess of creation with a tall golden spiked crown, very long wavy golden hair over her eyes, a golden corset, "
        "a long cream-white skirt with a high slit and a deep blue starry velvet cape over her left shoulder; in her right hand a "
        "tall golden staff topped with a golden armillary sphere of rings; her left hand is open, palm up, at her side."),
  items="the staff",
  app=("Three huge golden rings of light, like the rings of an armillary sphere, appear around the place where she stands and "
       "glide slowly through each other at waist height; inside them golden lines of light build her figure from the feet up like "
       "an architect's drawing, layer by layer: sandals, skirt, corset, cape, hair, crown. She moves while she is built: she rises "
       "from a crouch, sweeps her left arm out and opens her palm, and the staff forms in her right hand. The three rings shrink and "
       "fly into the sphere on top of her staff, and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head, hair and cape follow; her open left hand rises and lowers slowly; the staff "
               "rocks gently."),
  idle_magic=("thin golden rings of light leave the sphere on her staff, grow and float slowly around her waist, chest and knees, "
              "passing in front of her body, then shrink back into the sphere; golden lines of light draw slow geometric patterns "
              "over her skirt and corset and fade; small golden stars glide over her blue cape like a slow night sky; a small "
              "golden cube of light builds itself above her open palm, glows and dissolves."),
  idle_kind="golden",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, swings the staff across her body with both "
       "hands; the rings of the sphere grow large and circle her whole figure. Release: she strikes the butt of the staff on "
       "the ground beside her; a wall of glowing golden hexagonal plates builds up around her legs and waist up to her chest, "
       "covering the front of her body; at the same time she thrusts her open left palm forward at chest height "
       "and two bright golden orbs wrapped in small golden rings blaze above her palm. Recovery, the rest of the clip: the orbs "
       "fade into her palm, the golden plates fall apart into golden lines and fade, the rings shrink into the sphere and she "
       "settles into exactly the same pose as the first frame. The staff stays below her head."),
  atk_items="the staff",
)

G['oblivion'] = dict(
  desc=("A tall goddess of oblivion under a long flowing lavender veil that covers her face and her very long silver-lavender hair "
        "down to the ground, with a jewelled silver top and belt and a long lavender skirt; her right index "
        "finger rests on her lips over the veil in a gesture of silence; in her left hand a tall silver staff topped with a silver "
        "half moon, a violet crystal drop and two small silver bells."),
  items="the staff, the veil",
  app=("An empty lavender veil drifts slowly down through the air in the middle of the frame, billowing like a sail, with nothing "
       "inside it. Her figure fills the veil from inside: first her hand pushes the cloth outward, then her shoulders and head; she "
       "turns her head from side to side, lifts her right hand and touches her lips with her finger; the silver staff appears in "
       "her left hand as the bells ring with small violet ripples; the veil settles over her hair and gown and she stands in "
       "exactly the pose of the final frame."),
  idle_motion=("she shifts her weight slowly from leg to leg, bending one knee and then the other; her hips and shoulders follow, "
               "her head tilts softly; the veil and the long skirt float and flow as if under water; the bells on the staff sway."),
  idle_magic=("slow rings of violet-silver light spread from her finger on her lips over her face, chest and gown and fade, like "
              "ripples on still water; glowing violet ribbons wind slowly around her legs and the staff and dissolve; small "
              "glowing violet half moons drift down in front of her body and fade before they reach the ground; the violet "
              "crystal on the staff pulses softly."),
  idle_kind="violet",
  atk=("Wind-up, the first second: she bends her knees and sinks, lifts the staff in front of her chest with both hands; the "
       "silver moon and the violet crystal glow and violet light gathers around her whole figure. Release: she strikes the "
       "butt of the staff on the ground and the bells ring; a wide wave of glowing violet rings spreads out from the staff at waist "
       "height around her body and over the veil; she presses her finger to her lips; glowing violet moon symbols appear on her "
       "veil and gown; her veil and hair blow back. Recovery, the rest of the clip: the violet rings fade, the symbols dim and she "
       "settles into exactly the same pose as the first frame. The staff stays at its height and never goes above her head."),
  atk_items="the staff, the veil",
)

G['pride'] = dict(
  desc=("A tall goddess of pride in shining golden armor with a smooth faceless golden mask, a tall golden spiked crown, very long "
        "wavy brown hair and a long golden brocade gown; her left hand rests on her hip; in her right hand a tall golden scepter "
        "topped with an oval golden mirror in an ornate spiky golden frame."),
  items="the scepter",
  app=("A tall oval golden mirror stands where she will be, and her reflection appears inside it first, moving: she lifts her chin, "
       "turns her head and puts her hand on her hip. The surface of the mirror ripples like liquid gold and melts away around her, "
       "and the goddess herself stands in its place; the golden frame shrinks, glides into her right hand and becomes the small "
       "mirror on top of her scepter; golden light runs down her armor and gown and she settles in exactly the pose of the final "
       "frame."),
  idle_motion=("she shifts her whole weight onto one leg and then the other, her hip swinging slowly with her hand on it; her "
               "shoulders and head follow, she lifts her chin proudly and lowers it; her hair and the gown move; the scepter rocks "
               "gently."),
  idle_magic=("liquid gold flows slowly over her armor and gown like molten metal, running down in waves from her shoulders to "
              "the hem; bright golden reflections glide across her mask, breastplate and the mirror; golden ribbons of light wind "
              "slowly around her waist and arms and dissolve; the mirror on her scepter shimmers like rippling water."),
  idle_kind="golden",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, brings the scepter across her chest with "
       "both hands; the mirror glows and liquid gold gathers from her whole armor into it. Release: she thrusts the scepter "
       "forward at chest height; two long golden mirror blades of light form beside the mirror and blaze; a tall golden aura "
       "surges over her whole body like flowing liquid gold, her armor shines and her hair and gown blow back. Recovery, the rest "
       "of the clip: the two blades fade, the golden aura flows back down into her gown and she settles into exactly the same pose "
       "as the first frame. The scepter stays below her head."),
  atk_items="the scepter",
)

G['sun'] = dict(
  desc=("A tall goddess of the sun with a white-and-gold helmet crowned with golden sun rays and a visor covering her eyes, very "
        "long wavy golden hair, a white-and-gold corset with a golden sun on the chest, a large golden sun pauldron on her left "
        "shoulder, a light blue sash, a long white skirt with gold trim and golden greaves; her right hand holds a tall white-and-gold "
        "spear with a golden sun-star and a crystal blade; her left hand rests on her hip."),
  items="the spear",
  app=("A small warm golden sun appears in the air at her chest height. Its soft rays sweep around it slowly like the hands of a "
       "clock, and wherever they pass, her figure is painted in warm light: first her corset and helmet, then her arms, the white "
       "skirt and the long golden hair. She moves while she appears: she rises from a kneel, lifts her head, swings the spear from "
       "her side and sets its butt on the ground, and puts her left hand on her hip. The small sun sinks into the golden sun on her "
       "chest and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head and long hair follow as if in a warm wind; the skirt and sash sway; the spear rocks "
               "gently."),
  idle_magic=("warm golden ribbons of sunlight flow slowly around her body, waist and legs, passing in front of her and fading; "
              "the golden lines on her arms and legs glow and pulse like sunlight on water; small warm golden suns light up on her "
              "chest, pauldron and greaves and dim; soft golden sunlight ripples down her white skirt."
              ""),
  idle_kind="golden",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, swings the spear down across her body with "
       "both hands; golden sunlight gathers from her armor into the sun-star of the spear. Release: she thrusts the spear forward "
       "at chest height; a large warm golden sun disk forms around the spear head beside her chest; rings "
       "of warm golden sunfire flow down over her whole body to her feet and her hair and skirt blow back. Recovery, the rest of the "
       "clip: the sun disk shrinks into the spear head, the sunfire fades and she settles into exactly the same pose as the first "
       "frame. The spear stays below her head; soft warm light only, no flare."),
  atk_items="the spear",
)

G['terra'] = dict(
  desc=("A tall goddess of the earth with a crown of glowing amber crystals covering her eyes, long brown braids, a green "
        "scaled top, a bronze belt with a green gem and a long green-and-gold layered skirt with a high slit; she leans her back "
        "against a tall mossy stone pillar beside her, crowned with amber crystals and carved with glowing amber runes; her arms are crossed on her chest and one foot rests against the pillar."),
  items="the pillar",
  app=("The tall stone pillar grows up out of the ground. A rough stone statue of her stands leaning against it, gray and cracked. Amber light "
       "runs through the cracks from the feet up, and the stone breaks and falls away from her in large pieces: her legs, her "
       "skirt, her arms and braids appear in color while she moves; she straightens her shoulders, turns her head, crosses her "
       "arms and leans back against the pillar, lifting one foot against it. The fallen stones sink into the ground, the amber "
       "crystals on the pillar and on her crown light up last, and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her weight against the pillar, her standing knee bends and straightens, her raised knee sways slowly; "
               "her shoulders rise and fall, her head turns a little; her braids and skirt move."),
  idle_magic=("glowing amber light flows slowly through the runes on the pillar and through the green markings on her arms and "
              "legs like molten amber; green moss and small flowering vines creep slowly over the pillar and around her ankles and "
              "wither back; the amber crystals of her crown and the pillar pulse; small glowing amber crystals grow on the pillar "
              "beside her, shine and sink back into the stone."),
  idle_kind="amber and green",
  atk=("Wind-up, the first second: she pushes off the pillar, bends her knees into a deep low stance and pulls her right fist back; "
       "amber light runs up her arm and the runes of the pillar blaze. Release: she drives her fist down to the ground beside her; "
       "large stone slabs and glowing amber cracks break out of the ground around her legs, and plates of stone and "
       "amber crystal climb over her legs, waist and shoulders like armor; two large glowing amber crystals break off the pillar "
       "and hover beside her chest. Recovery, the rest of the clip: the amber light fades, the two crystals glide back into the pillar, the stone plates "
       "crumble into the ground, she stands up, crosses her arms and leans back against the pillar in exactly the same "
       "pose as the first frame."),
  atk_items="the pillar",
)

G['flame'] = dict(
  desc=("A tall goddess of fire with a smooth faceless glossy black head, a golden crown of tall black-and-gold pillars, very long "
        "wavy golden hair, a body of glossy black obsidian with glowing orange lava cracks, black-and-gold armor and a long crimson "
        "velvet skirt-cape; in her right hand a tall black halberd with a golden spike and a curved blade of living fire; her "
        "left hand is open low at her side."),
  items="the halberd",
  app=("A low pool of glowing lava opens on the ground where she stands and a swirl of flames rises from it only up to her waist. "
       "She rises out of the lava from a deep crouch, her body made of molten glowing lava; as she straightens up, the lava cools "
       "into glossy black obsidian with glowing cracks, the flames become her crimson skirt, her golden hair falls over her "
       "shoulders and the crown forms; the halberd's fire blade ignites in her hand; she opens her left hand and settles in "
       "exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head, golden hair and crimson skirt follow; her open left hand turns slowly; the halberd "
               "rocks gently."),
  idle_magic=("molten orange lava flows slowly through the cracks of her obsidian body, from her shoulders down to her legs; "
              "tongues of orange flame lick around her hands, waist and the hem of her skirt and fade; the fire blade of the halberd "
              "burns and flickers; glowing embers drift down around her and go out."),
  idle_kind="fire",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, swings the halberd back with both hands; the "
       "lava cracks of her body blaze bright orange. Release: she sweeps the halberd in a wide horizontal arc in front of her body "
       "at waist height; its fire blade leaves a wide arc of bright orange fire in front of her; flames rush over her whole "
       "body from her feet to her shoulders and her golden hair blows back. Recovery, the rest of the clip: the arc of fire and "
       "the flames fade into embers, the cracks dim and she settles into exactly the same pose as the first frame. The halberd stays "
       "below her head."),
  atk_items="the halberd",
)

G['war'] = dict(
  desc=("A tall goddess of war with a horned bronze helmet and mask covering her eyes, red war paint on her face, a very long red "
        "braid, spiked bronze pauldrons, bronze-and-gold armor with red gems and a lion head on her belt, and a long crimson cape "
        "with golden laurel trim; both her hands rest on the hilt of a huge greatsword planted point-down in front of her, its "
        "blade glowing with red runes."),
  items="the greatsword, the cape",
  app=("A ring of glowing red spectral swords stands stuck in the ground around the place where she stands, only up to her chest. "
       "Her huge greatsword appears planted in the middle, its runes burning red. The crimson cape whirls around the sword like a "
       "war banner in a strong wind, and she appears inside it, from a kneel with her head bowed, gripping the hilt; she rises, "
       "lifts her head and throws her shoulders back while the spectral swords sink into the ground one by one; the cape settles "
       "behind her and she stands in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight from leg to leg, bending one knee and then the other, her hands resting on the hilt; "
               "her shoulders rise and fall with her breath, her head turns a little; her braid and the long crimson cape sway."),
  idle_magic=("glowing red runes float off the blade of the greatsword, circle slowly around her legs, waist and chest, pass in "
              "front of her body and fade; red light pulses along the blade and through the red gems of her armor; a dark red glow "
              "flows over her cape like slow fire."),
  idle_kind="red",
  atk=("Wind-up, the first second: she pulls the greatsword out of the ground with both hands, steps into a wide stance and bends "
       "her knees, swings the sword back low to her side; the red runes blaze. Release: she sweeps the greatsword in a wide "
       "horizontal arc in front of her body at waist height; three glowing red arcs of light peel off the blade in front of "
       "her; red war-fire surges over her armor and cape and her braid and cape fly back. Recovery, the rest of the clip: the "
       "arcs and the fire fade, she plants the sword point-down in front of her again and settles into exactly the same pose "
       "as the first frame. The sword stays below her head."),
  atk_items="the greatsword, the cape",
)

G['famine'] = dict(
  desc=("A tall goddess of famine with a smooth golden helmet with one narrow slit under a pale beige hood, smooth gray skin, a "
        "golden breastplate with wheat ornaments, a long pale beige dress with golden wheat trim over a black skirt; in her right "
        "hand a golden mace with a rough gray stone head held low; on her left arm a large round gray shield carved with a spiral "
        "and a golden boss."),
  items="the mace, the shield",
  app=("A ring of tall withered gray wheat grows up from the ground around the place where she stands, up to her waist. The stalks "
       "dry out and crumble into pale golden chaff that whirls slowly around the spot and sticks together into her hood, dress and "
       "gray figure from the feet up; she rises from a crouch, lifts the round shield to her side and lowers the mace; the spiral on "
       "the shield turns once and stops; the last chaff falls and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders and hooded head follow; her hood and dress sway; the mace swings slowly in her low hand."),
  idle_magic=("pale golden chaff and withered grains drift slowly around her body like falling leaves in a slow whirl, passing in "
              "front of her and fading; the carved spiral on her shield glows pale gold and turns slowly like a whirlpool; dry pale "
              "golden light seeps through her dress and fades; the wheat ornaments of her armor glow and dim."),
  idle_kind="pale golden",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, raises the round shield in front of her chest; "
       "its spiral glows and turns like a whirlpool, pulling pale golden chaff from all around into it. Release: she strikes the "
       "shield with the mace; a wide wave of pale golden withering light rings out from the shield around her body at chest height; "
       "the chaff whirls around her and her hood and dress blow back. Recovery, the rest of the clip: the wave fades, the spiral "
       "slows and stops, she lowers the shield and mace and settles into exactly the same pose as the first frame. The mace stays "
       "below her head."),
  atk_items="the mace, the shield",
)

G['eternity'] = dict(
  desc=("A tall goddess of eternity with smooth silver skin, a royal blue blindfold, a tall silver crown with spires and sapphires, "
        "very long straight silver-white hair, an ornate silver corset with sapphires and pearl chains, and a long royal blue velvet "
        "cloak with silver embroidery; in her right hand a tall silver ankh staff with a glowing blue sapphire in its loop; on her "
        "left hand a blue sapphire orb with a silver cross."),
  items="the ankh staff, the orb",
  app=("Her long royal blue cloak floats alone in the air, open like wings. It wraps closed around the empty place where she will "
       "stand, glowing with silver embroidery, and opens again: she is inside it, kneeling with her head bowed. She rises while "
       "blue starlight runs over her silver body, lifts her head, the ankh staff appears in her right hand and the orb forms on her "
       "left palm; the cloak settles over her shoulders and she stands in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head, hair and cloak follow; the orb rises and lowers slowly on her palm; the staff "
               "rocks gently."),
  idle_magic=("slow streams of blue starlight flow out of the orb and wind around her body, waist and legs, passing in front of her "
              "and fading; small silver stars drift over her blue cloak like a slow night sky; the sapphire in the ankh pulses like "
              "a heartbeat; silver light ripples over her corset and crown."),
  idle_kind="blue starlight",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, lifts the orb in front of her chest and "
       "brings the ankh staff close; blue starlight gathers from her cloak into the orb. Release: she pushes the orb forward at "
       "chest height; a large glowing shell of blue starlight closes around her whole figure like a sphere of glass covered with "
       "silver stars; many small blue star shards blaze around the orb in front of her; her hair and cloak blow back. Recovery, the "
       "rest of the clip: the star shards fade, the starlight shell dissolves, the light returns into the orb and she settles into "
       "exactly the same pose as the first frame. The staff and the orb stay below her head."),
  atk_items="the ankh staff, the orb",
)

G['retribution'] = dict(
  desc=("A tall goddess of retribution with a red blindfold, a silver crown of tall blades, a platinum-blonde braid over her "
        "shoulder, a red-and-silver corset, a silver plated skirt with a belt buckle shaped like scales and a long crimson hooded "
        "cape; she holds a long straight sword flat across both open palms at waist height, its blade carved with glowing red "
        "runes."),
  items="the sword",
  app=("A single horizontal line of glowing red runes appears in the empty air at her waist height and cuts the air open like a "
       "slash. The cut opens wider like a door of red light, and she is revealed standing behind it, moving: she lifts her head, "
       "spreads her arms and the sword forms flat on her open palms from the line of runes itself; the opening closes behind her "
       "into her crimson cape, and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head and braid follow; the sword rises and lowers slowly on her palms; the cape sways."),
  idle_magic=("the red runes on the blade glow and flow along it like slow fire; thin glowing red ribbons drift off the blade and "
              "wind slowly around her waist, arms and legs, passing in front of her body and fading; the scales on her buckle glow "
              "and tilt; a dark red glow moves over her cape."),
  idle_kind="red",
  atk=("Wind-up, the first second: she grips the sword hilt with her right hand, steps into a wide stance and bends her knees, "
       "draws the sword back to her side; the runes blaze red. Release: she slashes the sword diagonally down across her body in "
       "front of her, from her shoulder to her hip; the blade leaves a wide glowing arc of red runes in front of her; a red "
       "glowing scales symbol lights up softly on her chest; her braid and cape fly back. Recovery, the rest of the clip: the arc "
       "fades, she lays the sword flat across both open palms again and settles into exactly the same pose as the first frame. The "
       "sword stays below her head."),
  atk_items="the sword",
)

G['void'] = dict(
  desc=("A tall goddess of the void with a smooth faceless black head, a silver crown with a tall central spike and violet gems, "
        "very long wavy violet hair full of tiny stars, dark violet starry skin, silver armor with violet gems and a long violet "
        "velvet gown with silver star patterns; her right hand is raised to the side, palm up, and a black sphere with a glowing "
        "violet ring floats above it."),
  items="the black sphere",
  app=("A small black sphere with a glowing violet ring floats in the empty air. It grows into a dark violet space full of stars "
       "in the shape of her body, an outline of the night sky, while she moves inside it: she rises from a crouch, turns her head, "
       "lifts her right hand. Her silver crown, armor and gown appear on the starry shape, her violet hair pours down her back, and "
       "the black sphere shrinks and floats above her open palm. She settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head, violet hair and gown follow; her raised hand rises and lowers slowly and the sphere "
               "floats with it."),
  idle_magic=("the stars inside her skin and hair drift slowly like a living galaxy; slow ribbons of violet starlight curl out of "
              "the black sphere and wind around her body, waist and legs, passing in front of her and fading; the violet ring of "
              "the sphere turns slowly; violet light flows over her silver armor."),
  idle_kind="violet starlight",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, pulls the black sphere down in front of her "
       "chest between both hands; it grows larger and violet starlight is pulled into it from all around her. Release: she pushes "
       "both palms forward at chest height; the black sphere swells with a blazing violet ring beside her chest and a swirl of "
       "violet starry darkness wraps around her whole body; her hair and gown blow back. Recovery, the rest of the clip: the swirl "
       "fades, the sphere shrinks, she raises it above her right palm and settles into exactly the same pose as the first frame. "
       "The sphere stays at its height and never goes above her head."),
  atk_items="the black sphere",
)

G['chaos'] = dict(
  desc=("A tall goddess of chaos laughing with her head thrown back, a black-and-white half mask with pink gems and black horns, "
        "long wavy hair white on one side and black on the other, a black-and-white diamond harlequin corset, a short black-and-white "
        "ruffled skirt with pink lining, one black and one white thigh-high boot; in her right hand a long crystal sword with "
        "rainbow shine pointing down; her left hand rests on her hip."),
  items="the crystal sword",
  app=("A flurry of black, white and pink diamond tiles flips and tumbles in the air where she stands, like a deck of cards "
       "shuffled in the air. The tiles flip over one by one and become pieces of her: boots, skirt, corset, hair and mask; she moves "
       "while she appears, stepping and swaying with her arms spread, then plants her feet, puts her left hand on her hip, the "
       "crystal sword drops into her right hand and she throws her head back laughing. The last tiles flip into her skirt and she "
       "settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her weight playfully from leg to leg, bending one knee and then the other, her hips swaying; her "
               "shoulders shake as if she laughs, her head tilts; her two-colored hair and ruffled skirt bounce; the sword swings "
               "a little in her hand."),
  idle_magic=("small black, white and pink diamonds of light flutter around her body like falling cards, flipping over and fading; "
              "the diamond pattern of her corset shifts and changes colors; the crystal sword shimmers with moving rainbow light; "
              "pink sparks dance over her mask and boots."),
  idle_kind="pink, black and white",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, swings the crystal sword back low, laughing; "
       "diamonds of light whirl around her. Release: three quick slashes in front of her body: one to her left, one to her right, "
       "one thrust forward at chest height; each slash leaves a bright arc of a different color, pink, black and white, made of "
       "small diamonds; her hair and skirt whip around her. Recovery, the rest of the clip: the three arcs fall apart into diamonds "
       "and fade, she throws her head back laughing and settles into exactly the same pose as the first frame. The sword stays "
       "below her head."),
  atk_items="the crystal sword",
)

G['mercy'] = dict(
  desc=("A tall goddess of mercy with a pink-plumed rose-gold helmet and a pink visor covering her eyes, wavy strawberry-blonde hair, "
        "white-and-rose-gold armor, a short pink pleated skirt, a long pink cape and tall white boots; in her right hand a tall white "
        "staff wrapped in rose-gold thorns and topped with a glowing pink crystal heart; on her left arm a white shield with a "
        "rose-gold rose."),
  items="the staff, the shield",
  app=("A small glowing pink heart of light floats in the empty air at her chest height and beats. With every beat a soft pink "
       "wave spreads out, and with every wave another part of her appears in full color: first her boots, then her skirt, armor, "
       "cape and hair. She moves while she appears: she rises from a kneel behind her shield, lowers the shield to her side and "
       "lifts her head; the heart flies into the crystal on top of her staff and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head, hair and cape follow; the shield sways slowly on her arm; the staff rocks gently."),
  idle_magic=("the crystal heart on her staff beats with soft pink light; with each beat a soft pink wave flows over her body from "
              "head to feet; glowing pink rose petals drift slowly around her waist, arms and legs, passing in front of her and "
              "fading; the rose on her shield glows and opens a little, then closes."),
  idle_kind="pink",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, raises the shield and the staff in front of "
       "her chest; the crystal heart glows bright pink. Release: she touches the staff to the shield; a large glowing pink rose of "
       "light blooms on her shield and a wide ring of pink rose petals and soft pink light flows out around her body at waist "
       "height; soft pink healing light pours down over her figure and her cape blows back. Recovery, the rest of the clip: the "
       "petals fade, the rose closes back into the shield and she settles into exactly the same pose as the first frame. The staff "
       "stays below her head."),
  atk_items="the staff, the shield",
)

G['death'] = dict(
  desc=("A tall goddess of death with a golden skull mask, a tall golden spiked crown, very long white hair under a long white lace "
        "veil, a black-and-gold corset with gold lace, a short black skirt and a wide long black-and-gold train; her right hand is "
        "raised with two fingers up; her left hand holds a golden flail on her shoulder, a golden-and-black skull hanging from its "
        "chain."),
  items="the flail",
  app=("The golden skull of her flail appears first, floating in the empty air and glowing pale gold. Black-and-gold chains unwind "
       "from it and spiral around an empty shape, faster and faster, and become her corset, skirt and long train; she appears inside "
       "them, rising from a deep crouch, lifts her head and raises her right hand with two fingers; the white veil drifts down over "
       "her hair last, and the flail settles on her shoulder with the skull hanging. She stands in exactly the pose of the final "
       "frame."),
  idle_motion=("she shifts her whole weight onto her right leg and bends her left knee, then onto her left leg and bends her right "
               "knee; her hips, shoulders, head and veil follow; the skull on the chain swings slowly like a pendulum; the train "
               "sways."),
  idle_magic=("pale golden soul flames flicker in the eyes of the skull and drift slowly around her body like small candle flames, "
              "passing in front of her and fading; golden lace patterns crawl slowly over her black train and corset; the white "
              "veil flows as if in a slow wind; a pale golden glow rises and falls around her raised fingers."),
  idle_kind="pale golden",
  atk=("Wind-up, the first second: she steps into a wide stance and bends her knees, takes the flail off her shoulder and swings "
       "the skull back low at her side; its eyes blaze with pale golden fire. Release: she swings the flail around her body in a "
       "wide circle at waist height and swings the skull forward on its chain; it blazes with pale golden soul fire and leaves a "
       "wide arc of black-and-gold fire in front of her; she points with two fingers; her veil and train blow back. Recovery, "
       "the rest of the clip: the arc fades, the skull swings back, she rests the flail on her shoulder and settles into "
       "exactly the same pose as the first frame. The flail stays below her head."),
  atk_items="the flail",
)

G['destruction'] = dict(
  desc=("A tall muscular goddess of destruction with short white hair, a black blindfold and a wide grin, a bronze-and-black armored "
        "corset, a heavy bronze pauldron and a long layered black, bronze and orange ruffled skirt; she leans forward with both "
        "forearms crossed on top of a huge warhammer standing upright on its head beside her, the hammer head glowing with orange "
        "cracks."),
  items="the warhammer",
  app=("Broken stone fragments and orange sparks fly inward from all sides toward the place where she stands, as if time runs "
       "backwards. They slam together into her armor, skirt and the huge warhammer, glowing with orange cracks, while she "
       "moves: she rises from a crouch, rolls her shoulders, grins, and leans forward with her forearms on the hammer. The last "
       "cracks cool on the hammer head and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her weight from leg to leg, bending her knees, leaning on the hammer; her shoulders roll, her head turns "
               "with her grin; her ruffled skirt sways."),
  idle_magic=("glowing orange cracks spread slowly across her armor, skirt and the hammer head like molten light under stone and "
              "close again; small orange embers drift around her and go out; orange light pulses through the hammer handle into her "
              "arms; small stone fragments break off the hammer, float and fall back into place."),
  idle_kind="orange",
  atk=("Wind-up, the first second: she grips the hammer with both hands, steps into a wide stance and bends her knees, heaves the "
       "hammer up onto her shoulder; orange cracks blaze over her arms and the hammer. Release: she slams the hammer down to the "
       "ground in front of her with her whole body; a ring of orange cracks and flying stone fragments spreads around the hammer "
       "head at ground level, and a wave of orange light rolls over her body; her skirt and hair blow back. Recovery, the rest of "
       "the clip: the orange light fades, the fragments fall, the cracks cool, she stands the hammer upright on its head and leans on it in exactly the "
       "same pose as the first frame. The hammer stays at shoulder height and never goes above her head."),
  atk_items="the warhammer",
)

G['wrath'] = dict(
  desc=("A tall goddess of wrath with a smooth silver mask with a crown of spikes, very long wavy red-orange hair, ornate cream-and-gold "
        "armor, and a long orange-and-gold brocade gown; she stands with one knee raised high, her foot resting on the handle of a "
        "huge golden double-bladed battle axe lying on the ground in front of her; her hands rest on her raised knee and her hip."),
  items="the axe",
  app=("A low ring of crimson and orange flames flares up from the ground where she stands, only up to her knees, and the huge "
       "battle axe lies inside it glowing red-hot. The flames climb into her shape and burn away like paper, revealing her as she "
       "moves: she rises from a crouch, tosses her red-orange hair, lifts one knee high and puts her foot on the axe handle, and "
       "rests her hands on her knee and hip. The flames sink into the axe and she settles in exactly the pose of the final frame."),
  idle_motion=("she shifts her weight on her standing leg, bending and straightening its knee, her raised knee rocks slowly; her "
               "shoulders, head and long red-orange hair follow; her gown sways."),
  idle_magic=("orange and crimson flames flow slowly along the hem of her gown, her armor and the blades of the axe; her long hair "
              "moves like fire, with glowing orange ends; tongues of flame curl around her legs and arms and fade; embers drift "
              "around her and go out."),
  idle_kind="fire",
  atk=("Wind-up, the first second: she lifts the axe off the ground with both hands, steps into a wide stance and bends her knees, "
       "swings the axe back low; the blades glow red-hot and flames run up her arms. Release: she sweeps the axe in a wide "
       "horizontal arc in front of her body at waist height; it leaves a wide arc of crimson and orange fire in front of her; "
       "flames rush over her whole body and her hair flies back like fire. Recovery, the rest of the clip: the arc fades into "
       "embers, she lowers the axe to the ground, puts her foot on its handle and settles into exactly the same pose as the first "
       "frame. The axe stays below her head."),
  atk_items="the axe",
)


def build(g, d):
    idle = ("2D game character idle loop animation, full body, front view. " + d['desc'] +
            " Idle, alive and clearly moving for the whole clip: " + d['idle_motion'] +
            " Smooth " + d['idle_kind'] + " magic moves over her the whole time: " + d['idle_magic'] +
            " Calm and slow, never an attack. She ends exactly in the pose of the first frame. " +
            TAIL_BODY.format(items=d['items']) + IDLE_END)
    atk = ("2D game character skill animation, full body, front view. Make every motion big, bold and exaggerated. " +
           d['desc'] + " " + d['atk'] + " " + TAIL_BODY.format(items=d['atk_items']) + ATK_END)
    app = ("2D game character entrance animation, full body, front view. " + d['desc'] +
           " The clip starts on the empty flat gray background. " + d['app'] + " " + APP_TAIL)
    return {'idle': idle, 'atk': atk, 'app': app}


if __name__ == '__main__':
    for g, d in G.items():
        for slot, txt in build(g, d).items():
            p = os.path.join(OUT, f'{g}_bt_{slot}_v5.txt')
            open(p, 'w').write(txt)
            print(g, slot, len(txt.split()))
