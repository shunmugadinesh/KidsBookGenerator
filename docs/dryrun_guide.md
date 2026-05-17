# Kids Book Generator: Dry-Run Synthesis Guide

This guide documents how the dry-run script `dryrun_audio_video.py` was executed, how it works under the hood, and how to trigger it again for testing.

---

## 🔍 What the Dry Run Script Does

The dry-run script (`dryrun Audio Video/dryrun_audio_video.py`) is a lightweight, standalone Python script designed to test the entire audio-video compilation pipeline without needing the FastAPI server or React frontend. 

It accomplishes this in 5 distinct phases:

```
+--------------------------------------------------------+
| 1. Dynamic Installation: edge-tts, gtts, static-ffmpeg  |
+---------------------------+----------------------------+
                            |
                            v
+--------------------------------------------------------+
| 2. FFmpeg Resolution: Checks system PATH, falls back   |
|    to downloading static portable ffmpeg.exe (~20MB)   |
+---------------------------+----------------------------+
                            |
                            v
+--------------------------------------------------------+
| 3. Placeholder Pulls: Downloads 400x400 random image   |
|    and grabs first 100KB of SoundHelix loops MP3       |
+---------------------------+----------------------------+
                            |
                            v
+--------------------------------------------------------+
| 4. TTS Narration: Generates Edge-TTS Aria voiceover    |
|    speech MP3 track from sample text script            |
+---------------------------+----------------------------+
                            |
                            v
+--------------------------------------------------------+
| 5. FFmpeg Mixing: Loops image, mixes voiceover at      |
|    100% and BGM at 15% volume, outputs still-frame     |
|    H.264 MP4 trimmed precisely to narrator duration.   |
+--------------------------------------------------------+
```

---

## 🚀 How the Dry Run Was Executed

During active development, the dry run was executed directly on your Windows system shell using Python 3.11 with the following command:

```powershell
python "dryrun Audio Video/dryrun_audio_video.py"
```

### Execution Log & Achievements:
1. **Dynamic Package Setup**: Successfully imported/installed standard Python packages `edge-tts`, `gtts`, and `static-ffmpeg`.
2. **Binary Acquisition**: Loaded `static-ffmpeg` and unpacked the static portable Windows `ffmpeg.exe` binary.
3. **Asset Gathering**: Downscaled and saved a random colorful placeholder image to `test_image.png` and fetched a 100KB ukulele sample loops track to `test_bgm.mp3`.
4. **Narration Synthesis**: Synthesized the Edge Neural voice track `test_tts.mp3` with highly realistic intonation from the text:
   > *"Hello! Today we are doing a dry run of the Kids Book Generator audio-video compilation module. It works beautifully!"*
5. **Video Compilation**: Mixed the tracks and compiled `story_video_test.mp4` with a perfect **Exit Code 0** (successful execution)!

---

## 📈 Re-Running the Test

You can run the test script again at any time to verify that your audio-video tools are functional:

1. Open a terminal in the project root.
2. Run:
   ```powershell
   python "dryrun Audio Video/dryrun_audio_video.py"
   ```
3. Check the `dryrun Audio Video` folder for `story_video_test.mp4` and open it to hear the mixed narration and background music!
