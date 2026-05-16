# Image-to-Image Models Research for BookGenerator

## Problem Statement
The BookGenerator app currently uses `black-forest-labs/FLUX.1-dev` with the **wavespeed** provider for the Hugging Face integration. This model **only supports `text-to-image`** on wavespeed — NOT `image-to-image`. This causes the error:

```
Failed to generate image. Model black-forest-labs/FLUX.1-dev is not supported 
for task image-to-image and provider wavespeed. Supported task: text-to-image.
```

## Root Cause Analysis

| Component | Current Value | Issue |
|-----------|--------------|-------|
| Model | `black-forest-labs/FLUX.1-dev` | Supports text-to-image on wavespeed, NOT image-to-image |
| Provider | `wavespeed` | Only supports `text-to-image` task for FLUX.1-dev |
| Method | `client.image_to_image()` | Requires a model+provider combo that supports image-to-image |

## Solution: Change Provider to `fal-ai`

The **fastest fix** is to switch the provider from `wavespeed` to `fal-ai` for image-to-image tasks. Fal.ai supports image-to-image for FLUX models.

### But Better Yet: Use the Right Model — FLUX.1-Kontext-dev

**`black-forest-labs/FLUX.1-Kontext-dev`** is specifically designed for image-to-image tasks:
- Edit images based on text instructions
- Character, style and object reference without finetuning (perfect for your use case!)
- Robust consistency across multiple edits
- Available via **fal.ai**, **Replicate**, **Together AI** providers

---

## Recommended Models for Image-to-Image (via HuggingFace InferenceClient)

### Tier 1 — Best for BookGenerator Use Case (Character Reference)

| Model | Provider | Best For | Downloads |
|-------|----------|----------|-----------|
| `black-forest-labs/FLUX.1-Kontext-dev` | `fal-ai`, `replicate` | Image editing with character reference — ideal for ABCD book! | 81.1k |
| `black-forest-labs/FLUX.2-dev` | `fal-ai` | Next-gen image editing, multi-reference support, 32B params | 186k |

### Tier 2 — Good Alternatives

| Model | Provider | Best For | Downloads |
|-------|----------|----------|-----------|
| `black-forest-labs/FLUX.2-klein-9B` | `fal-ai` | Lighter version of FLUX.2 (9B params), faster inference | 139k |
| `black-forest-labs/FLUX.2-klein-4B` | `fal-ai` | Even lighter (4B params), fastest FLUX.2 variant | 262k |
| `stabilityai/stable-diffusion-xl-refiner-1.0` | `fal-ai` | Classic SDXL refiner, well-tested | — |

### Tier 3 — Specialized Models

| Model | Provider | Best For |
|-------|----------|----------|
| `Alissonerdx/BFS-Best-Face-Swap` | varies | Face swapping specifically |
| `Qwen/Qwen-Image-Edit-2511` | varies | General image editing |
| `FireRedTeam/FireRed-Image-Edit-1.1` | varies | General image editing |

---

## Recommended Code Change

### Current Code (Broken for image-to-image):
```python
client = InferenceClient(
    provider="wavespeed",       # wavespeed doesn't support image-to-image for this model
    api_key=hugging_key,
)
image = client.image_to_image(
    image=input_image_bytes,
    prompt=request.prompt,
    model="black-forest-labs/FLUX.1-dev",  # This model is text-to-image only on wavespeed
)
```

### Proposed Fix — Use FLUX.1-Kontext-dev with fal-ai:
```python
if request.image:
    # Image-to-Image: Use Kontext model with fal-ai provider
    client_i2i = InferenceClient(
        provider="fal-ai",
        api_key=hugging_key,
    )
    base64_data = request.image
    if "," in base64_data:
        base64_data = base64_data.split(",")[1]
    input_image_bytes = base64.b64decode(base64_data)
    
    image = client_i2i.image_to_image(
        image=input_image_bytes,
        prompt=request.prompt,
        model="black-forest-labs/FLUX.1-Kontext-dev",
    )
else:
    # Text-to-Image: Keep wavespeed for FLUX.1-dev (this works fine)
    client_t2i = InferenceClient(
        provider="wavespeed",
        api_key=hugging_key,
    )
    image = client_t2i.text_to_image(
        request.prompt,
        model="black-forest-labs/FLUX.1-dev",
    )
```

---

## Provider x Task x Model Compatibility Matrix

| Provider | text-to-image | image-to-image | Best Model |
|----------|:------------:|:--------------:|------------|
| **wavespeed** | Yes | No | FLUX.1-dev (text only) |
| **fal-ai** | Yes | Yes | FLUX.1-Kontext-dev, FLUX.2-dev |
| **replicate** | Yes | Yes | FLUX.1-Kontext-dev |
| **together** | Yes | Yes | FLUX.1-Kontext-dev |

---

## Why FLUX.1-Kontext-dev is Perfect for BookGenerator

Your app generates children's book illustrations where you want the **child's face from a reference photo** to appear in each A-Z scene. FLUX.1-Kontext-dev was specifically built for this:

1. **Character Reference Without Finetuning** — Pass the child's photo + scene prompt, and it maintains the face/character
2. **Edit Instruction Based** — "Place this child in a scene holding an apple" works natively
3. **Consistency Across Edits** — The same child will look consistent across all 26 letters
4. **Available via API** — fal.ai, Replicate, Together AI all support it

---

## Notes
- You may need to accept the model license on Hugging Face before using it via API
- The `fal-ai` provider routes through Hugging Face using your HF token — no separate fal.ai API key needed
- Pollinations remains text-to-image only (no image input support)
- Gemini already handles image-to-image correctly in your code
