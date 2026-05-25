"""
Nursery Rhyme Preset Database.

Each entry contains:
  - title:   Display name
  - text:    The complete, canonical rhyme text (verbatim source of truth)
  - stanzas: Pre-split stanzas used as FALLBACK if LLM chunking fails integrity check
  - char:    Main character(s) in the rhyme (used by scene agent for visual focus)
  - theme:   Overall story theme for environment and style guidance
  - style_palette: Visual style hints to keep scenes cohesive
"""

RHYMES_DB: dict = {
    "twinkle_twinkle": {
        "title": "Twinkle Twinkle Little Star",
        "text": (
            "Twinkle, twinkle, little star,\n"
            "How I wonder what you are!\n"
            "Up above the world so high,\n"
            "Like a diamond in the sky."
        ),
        "stanzas": [
            "Twinkle, twinkle, little star",
            "How I wonder what you are!",
            "Up above the world so high",
            "Like a diamond in the sky.",            
        ],
        "char": "a glowing golden star with a happy face",
        "theme": "night sky wonder",
        "style_palette": "deep midnight blue sky, gold and silver stars, soft purple clouds, warm glow",
    },

    "jack_jill": {
        "title": "Jack and Jill",
        "text": (
            "Jack and Jill went up the hill\n"
            "To fetch a pail of water.\n"
            "Jack fell down and broke his crown,\n"
            "And Jill came tumbling after.\n\n"
            "Up Jack got, and home did trot\n"
            "As fast as he could caper.\n"
            "He went to bed to mend his head\n"
            "With vinegar and brown paper."
        ),
        "stanzas": [
            "Jack and Jill went up the hill\nTo fetch a pail of water.",
            "Jack fell down and broke his crown,\nAnd Jill came tumbling after.",
            "Up Jack got, and home did trot\nAs fast as he could caper.",
            "He went to bed to mend his head\nWith vinegar and brown paper.",
        ],
        "char": "Jack (boy, red shirt, brown hair) and Jill (girl, blue dress, pigtails), both toddlers",
        "theme": "outdoor adventure and resilience",
        "style_palette": "sunny green hillside, blue sky, white clouds, bright primary colors",
    },

    "itsy_bitsy": {
        "title": "Itsy Bitsy Spider",
        "text": (
            "The itsy bitsy spider\n"
            "Climbed up the water spout.\n"
            "Down came the rain\n"
            "And washed the spider out.\n\n"
            "Out came the sun\n"
            "And dried up all the rain.\n"
            "And the itsy bitsy spider\n"
            "Climbed up the spout again."
        ),
        "stanzas": [
            "The itsy bitsy spider\nClimbed up the water spout.",
            "Down came the rain\nAnd washed the spider out.",
            "Out came the sun\nAnd dried up all the rain.",
            "And the itsy bitsy spider\nClimbed up the spout again.",
        ],
        "char": "a tiny cute cartoon spider with big friendly eyes, wearing a tiny bow",
        "theme": "perseverance and determination",
        "style_palette": "bright garden green, rainy grey to sunny yellow transition, cozy warm tones",
    },

    "humpty_dumpty": {
        "title": "Humpty Dumpty",
        "text": (
            "Humpty Dumpty sat on a wall,\n"
            "Humpty Dumpty had a great fall.\n"
            "All the king's horses and all the king's men\n"
            "Couldn't put Humpty together again."
        ),
        "stanzas": [
            "Humpty Dumpty sat on a wall,\nHumpty Dumpty had a great fall.",
            "All the king's horses and all the king's men\nCouldn't put Humpty together again.",
        ],
        "char": "Humpty Dumpty, a large friendly egg character with arms, legs and a big smile",
        "theme": "fairytale castle adventure",
        "style_palette": "warm orange sunset, cobblestone wall, purple castle turrets, rich storybook colors",
    },

    "mary_lamb": {
        "title": "Mary Had a Little Lamb",
        "text": (
            "Mary had a little lamb,\n"
            "Its fleece was white as snow.\n"
            "And everywhere that Mary went,\n"
            "The lamb was sure to go.\n\n"
            "It followed her to school one day,\n"
            "Which was against the rule.\n"
            "It made the children laugh and play\n"
            "To see a lamb at school.\n\n"
            "And so the teacher turned it out,\n"
            "But still it lingered near.\n"
            "And waited patiently about\n"
            "Till Mary did appear."
        ),
        "stanzas": [
            "Mary had a little lamb,\nIts fleece was white as snow.",
            "And everywhere that Mary went,\nThe lamb was sure to go.",
            "It followed her to school one day,\nWhich was against the rule.",
            "It made the children laugh and play\nTo see a lamb at school.",
            "And so the teacher turned it out,\nBut still it lingered near.",
            "And waited patiently about\nTill Mary did appear.",
        ],
        "char": "Mary (girl, red dress, curly hair) and a fluffy white lamb with a pink bow",
        "theme": "friendship and loyalty",
        "style_palette": "countryside green meadow, sunny yellow warmth, pastel schoolroom colors",
    },

    "baa_baa": {
        "title": "Baa Baa Black Sheep",
        "text": (
            "Baa baa black sheep,\n"
            "Have you any wool?\n"
            "Yes sir, yes sir,\n"
            "Three bags full.\n\n"
            "One for the master,\n"
            "One for the dame,\n"
            "And one for the little boy\n"
            "Who lives down the lane."
        ),
        "stanzas": [
            "Baa baa black sheep,\nHave you any wool?",
            "Yes sir, yes sir,\nThree bags full.",
            "One for the master,\nOne for the dame,",
            "And one for the little boy\nWho lives down the lane.",
        ],
        "char": "a fluffy black sheep with curly wool and big kind eyes",
        "theme": "generosity and sharing",
        "style_palette": "cozy farm setting, warm earthy tones, golden straw, soft sky blue",
    },

    "hickory_dickory": {
        "title": "Hickory Dickory Dock",
        "text": (
            "Hickory, dickory, dock,\n"
            "The mouse ran up the clock.\n"
            "The clock struck one,\n"
            "The mouse ran down,\n"
            "Hickory, dickory, dock."
        ),
        "stanzas": [
            "Hickory, dickory, dock,\nThe mouse ran up the clock.",
            "The clock struck one,\nThe mouse ran down,",
            "Hickory, dickory, dock.",
        ],
        "char": "a tiny brown mouse with big round ears and a thin tail",
        "theme": "curiosity and time",
        "style_palette": "warm indoor wood tones, golden clock glow, cozy cottage interior, soft candlelight",
    },

    "old_macdonald": {
        "title": "Old MacDonald Had a Farm",
        "text": (
            "Old MacDonald had a farm, E-I-E-I-O!\n"
            "And on his farm he had a cow, E-I-E-I-O!\n"
            "With a moo moo here and a moo moo there,\n"
            "Here a moo, there a moo, everywhere a moo moo.\n"
            "Old MacDonald had a farm, E-I-E-I-O!\n\n"
            "Old MacDonald had a farm, E-I-E-I-O!\n"
            "And on his farm he had a pig, E-I-E-I-O!\n"
            "With an oink oink here and an oink oink there,\n"
            "Here an oink, there an oink, everywhere an oink oink.\n"
            "Old MacDonald had a farm, E-I-E-I-O!\n\n"
            "Old MacDonald had a farm, E-I-E-I-O!\n"
            "And on his farm he had a duck, E-I-E-I-O!\n"
            "With a quack quack here and a quack quack there,\n"
            "Here a quack, there a quack, everywhere a quack quack.\n"
            "Old MacDonald had a farm, E-I-E-I-O!"
        ),
        "stanzas": [
            "Old MacDonald had a farm, E-I-E-I-O!\nAnd on his farm he had a cow, E-I-E-I-O!",
            "With a moo moo here and a moo moo there,\nHere a moo, there a moo, everywhere a moo moo.",
            "Old MacDonald had a farm, E-I-E-I-O!\nAnd on his farm he had a pig, E-I-E-I-O!",
            "With an oink oink here and an oink oink there,\nHere an oink, there an oink, everywhere an oink oink.",
            "Old MacDonald had a farm, E-I-E-I-O!\nAnd on his farm he had a duck, E-I-E-I-O!",
            "With a quack quack here and a quack quack there,\nHere a quack, there a quack, everywhere a quack quack.",
        ],
        "char": "Old MacDonald, a cheerful elderly farmer with overalls and a straw hat",
        "theme": "farm life and animal sounds",
        "style_palette": "bright sunny farm, vivid green fields, colorful barn reds, joyful primary colors",
    },
}


def get_rhyme(key: str) -> dict | None:
    """Returns rhyme data by key, or None if not found."""
    return RHYMES_DB.get(key)


def get_rhyme_list() -> list[dict]:
    """Returns a list of {key, title} for UI dropdown population."""
    return [
        {"key": k, "title": v["title"]}
        for k, v in RHYMES_DB.items()
    ]
