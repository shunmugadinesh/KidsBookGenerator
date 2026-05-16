Yes — there *is* a practical structure that works much better across almost all image models like:

* FLUX
* SDXL
* Midjourney
* DALL·E
* Gemini Image
* Recraft
* Ideogram

Good prompts are usually:

1. structured
2. visual
3. layered
4. specific
5. ordered by importance

---

# Golden Rule

Image models understand prompts best in this order:

```text id="3yb7va"
SUBJECT
→ ACTION / POSE
→ ENVIRONMENT
→ STYLE
→ LIGHTING
→ CAMERA / COMPOSITION
→ DETAILS
→ QUALITY
→ NEGATIVE PROMPT
```

---

# Universal Prompt Formula

```text id="v5r4mo"
[Main Subject],
[action/pose],
[scene/environment],
[style/art type],
[lighting],
[camera/composition],
[details/textures],
[quality modifiers]
```

---

# Example

BAD:

```text id="x3z4q0"
cute child in park
```

GOOD:

```text id="xj3cc6"
cute 3-year-old toddler girl with curly hair,
smiling while running through a flower garden,
Pixar-style illustration,
warm golden sunset lighting,
wide-angle cinematic composition,
soft pastel colors,
highly detailed facial expression,
storybook illustration,
4k ultra detailed
```

---

# The 10 Most Important Prompt Components

## 1. SUBJECT (Most Important)

Be extremely specific.

BAD:

```text id="zaxz0m"
dog
```

GOOD:

```text id="zt3m5w"
golden retriever puppy with fluffy fur and blue collar
```

---

# 2. ACTION / POSE

Tell model what is happening.

Examples:

* sitting
* jumping
* reading
* looking at camera
* dancing
* holding balloon

Example:

```text id="8d9y2h"
sitting on wooden chair and reading a storybook
```

---

# 3. ENVIRONMENT / BACKGROUND

This gives realism.

Examples:

* classroom
* futuristic Tokyo
* enchanted forest
* preschool room
* coffee shop

Example:

```text id="t6y2st"
inside a colorful preschool classroom with toys and rainbow wall art
```

---

# 4. STYLE

VERY important.

## Common styles

| Style         | Example        |
| ------------- | -------------- |
| Pixar         | animated 3D    |
| Disney        | fantasy        |
| Anime         | Japanese       |
| Realistic     | photo          |
| Watercolor    | painting       |
| Cyberpunk     | neon sci-fi    |
| Storybook     | children books |
| Studio Ghibli | soft fantasy   |

Example:

```text id="k9mv8j"
Pixar-style 3D illustration
```

---

# 5. LIGHTING

Lighting dramatically improves output.

## Best keywords

| Lighting            | Effect       |
| ------------------- | ------------ |
| cinematic lighting  | movie look   |
| soft lighting       | smooth       |
| golden hour         | warm         |
| volumetric lighting | dramatic     |
| neon lighting       | cyberpunk    |
| studio lighting     | professional |

Example:

```text id="frdtsq"
soft cinematic golden-hour lighting
```

---

# 6. CAMERA / COMPOSITION

Very important for realism.

## Examples

| Term                 | Effect            |
| -------------------- | ----------------- |
| close-up             | face focus        |
| wide-angle           | landscape         |
| portrait shot        | vertical          |
| overhead view        | top-down          |
| centered composition | symmetry          |
| depth of field       | blurry background |

Example:

```text id="w5m4ev"
portrait shot with shallow depth of field
```

---

# 7. DETAILS / TEXTURES

This increases richness.

Examples:

* detailed fabric texture
* freckles
* glossy eyes
* soft fur
* realistic skin texture

Example:

```text id="m1y23e"
highly detailed eyes and realistic skin texture
```

---

# 8. QUALITY KEYWORDS

Common universal enhancers:

```text id="ngh0yi"
ultra detailed,
4k,
masterpiece,
professional,
high quality,
sharp focus
```

For FLUX:

```text id="3if7gq"
cinematic photo,
high detail,
natural lighting
```

---

# 9. NEGATIVE PROMPT (VERY IMPORTANT)

Tells model what to avoid.

Common:

```text id="7g7kgf"
blurry,
low quality,
extra fingers,
deformed hands,
cropped face,
bad anatomy,
duplicate objects,
watermark,
text
```

This improves results massively in SDXL/FLUX.

---

# 10. ASPECT RATIO INTENT

Describe framing in prompt:

Examples:

```text id="4v2d1t"
vertical portrait composition
```

```text id="7o7m6g"
storybook page layout
```

```text id="jtf4q0"
wide cinematic frame
```

---

# Professional Prompt Template

## Cinematic Realism

```text id="g0vkww"
[A detailed subject],
[action],
[in environment],
cinematic photography,
soft natural lighting,
shallow depth of field,
highly detailed textures,
realistic skin tones,
professional composition,
ultra realistic,
8k
```

---

# Children Book Template

```text id="cwhh91"
cute toddler character,
playful expression,
inside colorful preschool classroom,
Pixar-style illustration,
soft pastel colors,
storybook art style,
friendly atmosphere,
highly expressive face,
children's book illustration,
4k
```

---

# Anime Template

```text id="xgjmgh"
anime girl with silver hair,
standing under neon rain in Tokyo,
cyberpunk anime style,
dramatic neon lighting,
dynamic pose,
detailed background,
Makoto Shinkai style,
high detail,
cinematic composition
```

---

# Prompt Engineering Tricks

## 1. Put important things FIRST

Models prioritize early tokens.

GOOD:

```text id="4d50xj"
close-up portrait of a royal queen
```

BAD:

```text id="9v5d3m"
beautiful, cinematic, detailed, 4k, portrait of queen
```

---

# 2. Avoid long messy prompts

Too many unrelated ideas confuse models.

---

# 3. Use commas not paragraphs

Most models parse comma-separated concepts better.

---

# 4. Use visual words only

BAD:

```text id="rx5pkd"
make it awesome
```

GOOD:

```text id="yjlwm1"
dramatic cinematic lighting with rich shadows
```

---

# 5. Reference known styles

Examples:

* Pixar
* Studio Ghibli
* Unreal Engine
* Leica photo
* DSLR photography

---

# Best Prompt Structure for FLUX

FLUX prefers:

* natural language
* cleaner prompts
* less keyword spam

GOOD FLUX prompt:

```text id="vl40wg"
A cozy wooden cabin in snowy mountains at sunset, warm glowing windows, cinematic atmosphere, realistic photography
```

---

# Best Prompt Structure for SDXL

SDXL likes:

* detailed descriptors
* quality tags
* negative prompts

---

# Recommended Workflow for You

```text id="sq5fvg"
Idea
 ↓
LLM expands prompt
 ↓
Add style + lighting
 ↓
Add negative prompt
 ↓
Generate in FLUX/SDXL
 ↓
Upscale
```

---

# Best LLMs for prompt generation

| Tool                                                         | Best For           |
| ------------------------------------------------------------ | ------------------ |
| [Claude](https://claude.ai?utm_source=chatgpt.com)           | cinematic prompts  |
| [ChatGPT](https://chatgpt.com?utm_source=chatgpt.com)        | structured prompts |
| [Gemini](https://aistudio.google.com?utm_source=chatgpt.com) | fast iteration     |
| [Groq](https://groq.com?utm_source=chatgpt.com)              | automation speed   |

---

# Most important takeaway

The best prompts are:

* specific
* visual
* structured
* emotionally clear
* composition-aware
* lighting-aware

That matters more than writing extremely long prompts.
