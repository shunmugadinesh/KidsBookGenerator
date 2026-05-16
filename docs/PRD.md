# AI-powered kids creativity books with custom character photos

**Requirement:**

I'm planning to make user friendly kids-oriented creativity books using the picture of a kid as the main character in ultra realistic cartoon way. focusing on fun, enjoyable, easy visual recognition and easy to understand. Size half the size of A4 sheet
eg.  ABCD, numbers, rhymes book.
Share me you suggestion this.
1. how to do it using morden free ai tools
2. need prompts for each book, which can be reused for diff kids
3. SInce its a kids book, done make it clean with big picture and not too clumsy in single page.
4. Final part - Automate this process using some front end/n8n, where user upload the pic and some description and select the book theme to generate the complete book in pdf format/ multiple images

---

**Response from Claude:**

This is such a fun and creative project! Let me give you a comprehensive visual roadmap first, then cover all four parts in detail.

![alt text](image.png)

Here's your complete guide across all four parts:

---

## Part 1 — Free AI Tools to Use

**For face-consistent character generation (the hardest part):**

- **ComfyUI + IP-Adapter FaceID** — the gold standard for free, local use. Upload a child's photo, it locks the face into every generated image. Works with FLUX or SDXL models.
- **Fooocus** (desktop app) — simpler UI, built-in IP-Adapter, great for beginners. Completely free.
- **Stable Diffusion WebUI (AUTOMATIC1111)** — more control, needs a GPU. Use the `roop` or `reactor` extension for face swapping as an alternative.

**For the art style (ultra-realistic cartoon):**

- Model: **FLUX.1-dev** (via ComfyUI) or **DreamShaper XL** on SDXL — both give stunning cartoon-realism.
- Style LoRA: `Pixar Style LoRA` or `3D Cartoon Character LoRA` (free on CivitAI).

**For text/rhymes generation:**

- **Claude or GPT-4o** — free tiers work fine for generating labels, rhymes, and sentences per page.

**For PDF assembly:**

- **Python + Pillow + ReportLab** — free, scriptable, perfect for compositing image + text into A5 pages.
- Alternatively: **Canva API** (free tier) or **HTML-to-PDF** via `puppeteer`.

---

## Part 2 — Reusable Prompts Per Book Type

All prompts use `[CHILD_NAME]` and `[STYLE_SEED]` as placeholders. The style seed comes from the child's reference photo processed through IP-Adapter.

**Universal character style string (add to every prompt):**
```
ultra-realistic 3D cartoon character, Pixar-style render, 
soft studio lighting, big expressive eyes, warm skin tones, 
clean white background, child-friendly, age 4–8 aesthetic, 
no text in image, centered composition
```

---

**ABCD Alphabet Book — per-letter prompt:**
```
A cheerful [CHILD_NAME]-lookalike cartoon child holding a giant 
letter "[LETTER]" made of [MATERIAL e.g. wood, candy, clouds], 
standing next to a [OBJECT STARTING WITH LETTER], 
[universal style string], full body shot, A5 portrait framing
```
Example materials to rotate: wooden blocks / balloons / stars / fruit / flowers / rainbows.

---

**123 Numbers Book — per-number prompt:**
```
A happy [CHILD_NAME]-lookalike cartoon child with [NUMBER] 
floating [OBJECTS e.g. stars, apples, butterflies] around them, 
number "[NUMBER]" glowing softly in the background, 
[universal style string], A5 portrait framing
```

---

**Nursery Rhymes Book — per-rhyme prompt:**
```
[CHILD_NAME]-lookalike cartoon child as the main character 
in the scene of "[RHYME NAME]", e.g. sitting on a wall like 
Humpty Dumpty, [key visual element of rhyme], 
[universal style string], storybook scene, rich background, 
A5 landscape framing
```

---

**Shapes / Colours Book — per-page prompt:**
```
[CHILD_NAME]-lookalike cartoon child dressed in [COLOUR] clothes 
holding a large [SHAPE] object that is [COLOUR], 
playful background with subtle [COLOUR] tones, 
[universal style string], A5 portrait
```

---

## Part 3 — Page Layout Rules (Clean, Big, Simple)

For a half-A4 (A5 = 148 × 210 mm) book:

- **One big image per page** — fills top 65–70% of the page. No clutter.
- **One large letter/number/word** — bold, rounded font (e.g. Baloo, Nunito), bottom 20% of page.
- **One short label or rhyme line** — 1–2 lines max, large font size (28–36pt).
- **White or soft pastel background** — never busy patterns behind text.
- **Page numbers** — small, bottom center, circle badge style.

Page template structure (per page, portrait):
```
┌─────────────────────┐
│                     │
│   [CHARACTER IMAGE] │  ← 65% height, centered
│                     │
├─────────────────────┤
│    A  is for Apple  │  ← Big letter + label, 20% height
├─────────────────────┤
│         • 1 •       │  ← Page number, 15% height
└─────────────────────┘
```

---

## Part 4 — Automation Pipeline (Frontend + n8n)

**Frontend (React/Next.js upload form):**

Three inputs on one page:
1. Photo upload (child's face)
2. Text fields: child's name, age, optional traits
3. Dropdown: select book type (ABCD / 123 / Rhymes / Shapes)

On submit → calls your n8n webhook.

**n8n Workflow nodes:**

```
Webhook trigger
  → Upload photo to Cloudinary (or S3)
  → HTTP Request → ComfyUI API (generate 26 images for ABCD, etc.)
      (pass photo URL + prompt template for each letter/number)
  → Wait for all images (loop / batch node)
  → HTTP Request → Claude/GPT API (generate labels/rhymes per page)
  → Code node (Python) → Pillow: composite image + text → PNG per page
  → ReportLab: combine all PNGs → single PDF
  → Upload PDF to S3
  → Send download link via email / display in frontend
```

**ComfyUI API tip:** Run ComfyUI with `--listen` flag, then call its `/prompt` endpoint from n8n with your workflow JSON. You can template the prompt and image seed dynamically per letter.

**Free stack summary:**
- Frontend: Next.js (Vercel free tier)
- Image AI: ComfyUI on a local GPU or rented RunPod/Vast.ai GPU ($0.20/hr)
- Text AI: Claude API or GPT-4o mini (very cheap — a full book costs <$0.10)
- PDF: Python Pillow + ReportLab (free)
- Automation: n8n (self-hosted free, or n8n cloud free tier)
- Storage: Cloudinary free tier (25GB)

The biggest cost is GPU time for image generation — roughly 26 images per ABCD book at ~5 seconds each on a good GPU = about 2–3 minutes per book order.