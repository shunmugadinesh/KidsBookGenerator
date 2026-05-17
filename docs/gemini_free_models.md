These are the most commonly available FREE-tier Gemini API models right now through [Google AI Studio](https://aistudio.google.com?utm_source=chatgpt.com) and Gemini Developer API.

# Best FREE Gemini Models

| Model                   | Best For           | Free Tier                 |
| ----------------------- | ------------------ | ------------------------- |
| `gemini-2.5-flash`      | overall best       | Yes                       |
| `gemini-2.5-flash-lite` | cheap/high RPM     | Yes                       |
| `gemini-2.0-flash`      | stable automation  | Yes                       |
| `gemini-1.5-flash`      | older but reliable | Yes                       |
| `gemini-2.5-pro`        | advanced reasoning | Limited/free experimental |
| `gemini-3.1-flash`      | newest fast model  | Some free access          |
| `gemini-3.1-flash-8b`   | lightweight        | Yes                       |

Recent reports indicate Google reduced free-tier access for Pro models while keeping Flash variants broadly available. ([MakeBox AI][1])

---

# My Recommendations

# 1. BEST OVERALL FREE MODEL

## `gemini-2.5-flash`

Best for:

* CrewAI
* automation
* prompt generation
* workflows
* reasoning
* multimodal tasks

Why:

* fast
* huge context window
* cheap/free
* stable

Example:

```python id="hm2jxy"
model="gemini-2.5-flash"
```

---

# 2. BEST FOR AGENTS + CHEAP TASKS

## `gemini-2.5-flash-lite`

Best for:

* routing agents
* summarization
* formatting
* preprocessing
* large workflows

Very low cost and higher free quotas. ([Hivebook][2])

Example:

```python id="cwcevc"
model="gemini-2.5-flash-lite"
```

---

# 3. BEST FOR IMAGE PROMPT GENERATION

## `gemini-2.5-flash`

Very good at:

* cinematic prompts
* structured prompts
* kids-book prompts
* layout planning

---

# 4. BEST FOR ADVANCED REASONING

## `gemini-2.5-pro`

Best for:

* long reasoning
* planning
* architecture
* coding
* agent orchestration

BUT:

* free tier heavily restricted now
* lower RPM/RPD
* often experimental-only

([MakeBox AI][1])

---

# 5. BEST FOR IMAGE GENERATION

## Experimental image models

| Model                                       | Notes                       |
| ------------------------------------------- | --------------------------- |
| `gemini-2.5-flash-preview-image`            | limited/free quota unstable |
| `gemini-2.0-flash-preview-image-generation` | sometimes works free        |
| `gemini-3-pro-image-preview`                | mostly restricted           |

Your earlier 429 error happened because your project currently has:

```text id="vhn0g"
limit: 0
```

for image generation quota.

---

# BEST FREE COMBINATION FOR YOU

Since you're building:

* CrewAI
* automation
* kids books
* image prompts

Use this:

| Agent Type          | Gemini Model            |
| ------------------- | ----------------------- |
| Planner Agent       | `gemini-2.5-flash`      |
| Story Agent         | `gemini-2.5-flash`      |
| Prompt Agent        | `gemini-2.5-flash`      |
| QA Agent            | `gemini-2.5-flash-lite` |
| Routing Agent       | `gemini-2.5-flash-lite` |
| Coding/Layout Agent | local Ollama model      |

---

# BEST HYBRID ARCHITECTURE

```text id="mjlwm4"
CrewAI
   ↓
Gemini Flash
   ↓
Generate prompts/story/layout JSON
   ↓
FLUX image generation
   ↓
HTML/CSS layout
   ↓
Playwright PDF export
```

---

# FREE TIER LIMITS (Typical)

These change frequently, but current reports suggest roughly:

| Model        | Typical Free Limits |
| ------------ | ------------------- |
| Flash        | 10–30 RPM           |
| Flash Lite   | 15+ RPM             |
| Pro          | very limited        |
| Image models | often disabled      |

([MakeBox AI][1])

---

# BEST WAY TO CHECK LIVE LIMITS

Open:

[Google AI Studio Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits?utm_source=chatgpt.com)

and:

[Google AI Studio Dashboard](https://aistudio.google.com?utm_source=chatgpt.com)

because limits vary by:

* region
* account age
* billing status
* project trust score

---

# BEST FREE LOCAL + CLOUD MIX

## Local

Use:

* Ollama
* `qwen2.5-coder`

For:

* layout generation
* HTML
* coding

---

## Cloud

Use Gemini Flash for:

* reasoning
* story generation
* prompt generation

---

# My actual recommendation for your project

## Use:

### Cloud

```text id="pdhvws"
gemini-2.5-flash
```

### Local

```text id="ynlyo7"
qwen2.5-coder via Ollama
```

This is one of the strongest FREE combinations available right now for AI automation pipelines.

[1]: https://makebox.ai/news/gemini-api-free-tier-changes?utm_source=chatgpt.com "Google Removes Gemini Pro Models from Free API Tier Starting April 2026 — MakeBox AI · MakeBox AI"
[2]: https://hivebook.wiki/wiki/google-gemini-api-current?utm_source=chatgpt.com "Hivebook - The Knowledge Base for AI Agents"
