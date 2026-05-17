# Kids Book Generator: Audio & Video Studio Integration

This document outlines the architecture, features, and API reference for the self-contained **Audio & Video Studio** in the Kids Book/Habit Generator application.

---

## 🚀 Key Features

1. **Text-To-Speech (TTS) Engine**:
   - **Microsoft Edge TTS (Free, Zero Config)**: High-quality, natural-sounding multi-lingual neural voices. No API keys or credentials needed! Supported default voices include Aria (US Female), Guy (US Male), Ana (US Child), Sonia (UK Female), and Neerja (IN Female).
   - **Google TTS (Free)**: Standard baseline TTS backup.
   - **ElevenLabs (Premium)**: Activates automatically if `ELEVENLABS_API_KEY` is present in your `.env` file.

2. **Background Music (BGM)**:
   - **Preset Royalty-Free Loops**: Hand-selected instrumental children loops (Calm Bedtime Piano, Happy Preschool Ukulele, Magical Fairytale Adventure, Playful Whimsical Toyland) are cached on demand in `app/resources/bgm/` from stable public SoundHelix archives.
   - **AI-Generated BGM (MusicGen)**: Submits custom prompts (e.g., `"calm soft acoustic guitar loop, happy upbeat kindergarten music"`) directly to Hugging Face's inference space for Meta's `musicgen-small` model and saves the returned MP3 loop.

3. **FFmpeg Merge Compiler**:
   - Loops the single-page illustration frame to match the audio narration duration.
   - Balances volumes (Voice track at `100%`, Background Music at a warm, pleasant **`30%`** ratio).
   - Exports high-quality H.264 MP4 videos optimized for browser playback.

---

## 📐 Architecture & Subprocess Pipeline

The audio-video compilation module is designed to be fully self-contained, lightweight, and robust. It uses **FFmpeg** via dynamic Windows path resolution to merge visual and auditory tracks:

```
                  +-----------------------+
                  |  Scene Narration Text |
                  +-----------+-----------+
                              |
                              v
                  +-----------+-----------+
                  |    TTS Speech Engine  | <--- (Edge-TTS / gTTS / ElevenLabs)
                  +-----------+-----------+
                              |
                              | (tts_temp.mp3)
                              v
+-------------------+     +---+---+     +-------------------------+
|    Page Image     +---->|  amix +<----+ Background Music (BGM)  |
| (Base64/Local)    |     +---+---+     | (Calm Piano, Ukulele...) |
+---------+---------+         |         +------------+------------+
          |                   |                      ^
          |                   | (mixed_audio.mp3)    | (Cached preset or AI)
          |                   v                      |
          |       +-----------+-----------+          |
          +------>|     FFmpeg Compiler   +----------+
                  +-----------+-----------+
                              |
                              v
                  +-----------+-----------+
                  |   Final H.264 Video   |
                  |     (.mp4 output)     |
                  +-----------------------+
```

---

## 🔌 API Reference

### `POST /generate-audio-video`
Compiles an image, narration text, and background music loop into a final `.mp4` video clip.

* **Headers**: `Content-Type: application/json`
* **Request Payload**:
```json
{
  "image": "data:image/png;base64,iVBORw0KG...",
  "text": "A is for Apple. An apple a day keeps the doctor away!",
  "voice": "en-US-AnaNeural",
  "bgm": "happy_ukulele",
  "page_key": "A"
}
```

* **Response Payload**:
```json
{
  "status": "success",
  "video_url": "/generated-media/story_video_letter_a.mp4",
  "filename": "story_video_letter_a.mp4"
}
```

---

## 🖥️ UI Workflow

The **Audio & Video Studio** is integrated on the right sidebar in the **Audio & Video** tab:
1. **Choose Voice**: Select your favorite narrator voice.
2. **Choose BGM**: Pick one of the beautiful pre-loaded instrumentals or describe an AI prompt.
3. **Compile**: Click **Compile Narrated Video**. The backend generates the video and serves it in an elegant HTML5 player with a full-screen mode and one-click **Download MP4 Video** action!
