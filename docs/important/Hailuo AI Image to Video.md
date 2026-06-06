For children's storybooks, the best image-to-video prompts are usually **motion-focused**, not scene-description-focused. The image already contains the environment; the prompt should tell the AI **what moves, how the camera moves, and what mood to create**.

## Page 1 → Bedroom Scene

**Prompt**

```text
A joyful toddler giggles while playing with a small wooden toy boat on the bed. He gently tilts the boat and splashes imaginary water with his tiny hands. The stuffed lamb, dog, and cat behind him softly bounce and sway as if joining the playtime adventure. Warm golden sunlight streams through the large window, creating floating dust particles and soft light rays across the room. The colorful books and curtains move slightly in a gentle breeze.

Camera: slow cinematic push-in toward the child, shallow depth of field, subtle handheld movement.

Motion intensity: low to medium.
Mood: cozy, playful, heartwarming.
Style: Pixar-quality animated children's storybook, natural character motion, smooth animation, highly detailed, 3D cinematic lighting.
Duration: 5–7 seconds.
```

### Negative Prompt

```text
blurry, distorted hands, extra fingers, deformed face, duplicate toys, fast camera movement, shaking camera, horror, dark lighting, aggressive motion, text, watermark
```

---

## Page 1 → Page 2 Transition (Best for Hailuo Start/End Frame)

Since Hailuo supports Start Frame and End Frame, use this between the two pages.

**Transition Prompt**

```text
The toddler's toy boat begins to glow with magical golden sparkles. The sparkles swirl around the child and his stuffed lamb. The bedroom slowly transforms into an enchanted forest. Books become glowing flowers, sunlight turns into magical fairy lights, and the bed gently dissolves into a moss-covered forest path. The child and lamb step forward together into the magical world as glowing teal and pink flowers appear around them.

Camera: smooth forward tracking shot following the child and lamb.

Motion: magical transformation, seamless scene morphing.

Style: Pixar-quality fantasy animation, cinematic lighting, dreamy atmosphere, smooth transitions, highly detailed.
Duration: 5–8 seconds.
```

This type of prompt usually performs much better than a hard cut from bedroom to forest.

---

## Page 2 → Magical Forest Scene

**Prompt**

```text
A cheerful toddler and a fluffy lamb skip happily along a glowing forest path. Their feet gently bounce across soft moss while sparkling particles float through the air. The glowing teal and pink flowers slowly sway and illuminate the path around them. Massive bioluminescent trees shimmer with magical light, and crystal stones reflect colorful sparkles. The forest canopy glows softly as the pastel sunrise brightens the background.

Camera: smooth tracking shot moving alongside the child and lamb, occasional gentle orbit around them.

Motion intensity: medium.
Mood: magical, adventurous, wonder-filled.
Style: Pixar-quality animated fantasy, cinematic depth, volumetric lighting, soft glow effects, natural character movement, highly detailed.
Duration: 5–7 seconds.
```

### Negative Prompt

```text
dark forest, scary creatures, horror, fast running, blurry animation, flickering lights, distorted child, extra limbs, low quality, text, watermark
```

---

### For Kids Book Videos

A formula that consistently works in Hailuo, Kling, and PixVerse is:

```text
Character Motion
+ Environmental Motion
+ Camera Motion
+ Emotion/Mood
+ Pixar-quality cinematic animation
+ Duration
```

Avoid long environment descriptions in the video prompt—the image already contains those details. Focus 80% of the prompt on **movement and camera behavior**. This generally produces much more natural-looking animated storybook videos.
