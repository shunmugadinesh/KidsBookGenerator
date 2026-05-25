import os
import sys
import subprocess
import urllib.request
import base64
import asyncio
import uuid
import httpx

def install_package(package_name):
    """Dynamically installs a pip package if not already present in the environment."""
    try:
        if package_name == "edge-tts":
            import edge_tts
        elif package_name == "gtts":
            import gtts
        else:
            __import__(package_name)
    except ImportError:
        print(f"Dynamic Installer: {package_name} not found. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
            print(f"Dynamic Installer: Successfully installed {package_name}")
        except Exception as e:
            print(f"Dynamic Installer Failed for {package_name}: {e}")

def ensure_ffmpeg():
    """
    Ensures FFmpeg is available on the system.
    1. Checks if 'ffmpeg' is in the system PATH.
    2. Checks if 'static-ffmpeg' Python package can add FFmpeg to PATH.
    3. Searches for a locally downloaded 'ffmpeg.exe' in app/resources/bin/.
    4. Automatically downloads a lightweight static 'ffmpeg.exe' for Windows if not found.
    """
    # 1. Check system path
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return "ffmpeg"
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    # 2. Try static-ffmpeg package
    try:
        install_package("static-ffmpeg")
        import static_ffmpeg
        static_ffmpeg.add_paths()
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return "ffmpeg"
    except Exception:
        pass

    # 3. Check for local ffmpeg binary
    local_bin_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "bin"))
    local_ffmpeg = os.path.join(local_bin_dir, "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg")
    if os.path.exists(local_ffmpeg):
        return local_ffmpeg

    # 4. Auto-download static ffmpeg for Windows
    if sys.platform == "win32":
        try:
            print("FFmpeg not found. Downloading static ffmpeg.exe for Windows...")
            os.makedirs(local_bin_dir, exist_ok=True)
            # Portable static binary of FFmpeg for Windows x64 (~20MB)
            url = "https://github.com/eugene-eeo/static-ffmpeg/raw/master/static_ffmpeg/bin/win32/x64/ffmpeg.exe"
            urllib.request.urlretrieve(url, local_ffmpeg)
            print(f"FFmpeg downloaded successfully to {local_ffmpeg}")
            return local_ffmpeg
        except Exception as e:
            print(f"Auto-download of FFmpeg failed: {e}")
            
    raise FileNotFoundError(
        "FFmpeg binary is required but could not be located or installed automatically. "
        "Please ensure 'ffmpeg' is in your system PATH or run 'pip install static-ffmpeg'."
    )

def ensure_bgm_preset(preset_name):
    """
    Ensures that the selected royalty-free BGM MP3 preset is downloaded and cached.
    Loops are pulled from public soundhelix archives, which are stable and free.
    """
    presets = {
        "calm_piano": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "happy_ukulele": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "magical_fairytale": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "playful_toyland": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    }
    
    if preset_name not in presets:
        return None
        
    bgm_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "bgm"))
    os.makedirs(bgm_dir, exist_ok=True)
    file_path = os.path.join(bgm_dir, f"{preset_name}.mp3")
    
    # Verify file exists and is not empty or corrupted (must be > 100KB)
    if os.path.exists(file_path) and os.path.getsize(file_path) > 100000:
        return file_path
        
    print(f"BGM Cache: Downloading preset '{preset_name}' on demand...")
    url = presets[preset_name]
    import ssl
    context = ssl._create_unverified_context()
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        temp_file_path = file_path + ".tmp"
        with urllib.request.urlopen(req, context=context) as response, open(temp_file_path, 'wb') as out_file:
            out_file.write(response.read())
            
        if os.path.exists(temp_file_path) and os.path.getsize(temp_file_path) > 100000:
            if os.path.exists(file_path):
                os.remove(file_path)
            os.rename(temp_file_path, file_path)
            print(f"BGM Cache: Downloaded '{preset_name}' successfully.")
            return file_path
        else:
            print(f"BGM Cache Error: Downloaded file for '{preset_name}' was corrupted or empty.")
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass
    except Exception as e:
        print(f"BGM Cache Error: Failed to download preset '{preset_name}': {e}")
        
    return None

def generate_ai_bgm(prompt, hf_token=None):
    """
    Generates background music using Hugging Face's Inference API for MusicGen.
    Caches the generated audio track to avoid re-generation.
    """
    bgm_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "bgm"))
    os.makedirs(bgm_dir, exist_ok=True)
    
    # Safe filename from prompt
    clean_prompt = "".join([c if c.isalnum() else "_" for c in prompt])[:30].strip("_")
    file_path = os.path.join(bgm_dir, f"ai_{clean_prompt}.mp3")
    
    if os.path.exists(file_path):
        print(f"BGM Cache: Using existing AI MusicGen track for prompt: {prompt}")
        return file_path
        
    print(f"AI MusicGen: Generating music for prompt '{prompt}' via Hugging Face...")
    API_URL = "https://api-inference.huggingface.co/models/facebook/musicgen-small"
    headers = {}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
    elif os.getenv("HUGGING_API_KEY"):
        headers["Authorization"] = f"Bearer {os.getenv('HUGGING_API_KEY')}"
        
    try:
        response = httpx.post(API_URL, headers=headers, json={"inputs": prompt}, timeout=60.0)
        if response.status_code == 200:
            with open(file_path, "wb") as f:
                f.write(response.content)
            print("AI MusicGen: Generated music successfully.")
            return file_path
        else:
            print(f"AI MusicGen Error (HF Code {response.status_code}): {response.text}")
    except Exception as e:
        print(f"AI MusicGen Connection Error: {e}")
        
    return None

def generate_tts(text, voice_name, output_path, elevenlabs_api_key=None):
    """
    Generates a speech audio file (TTS) for the given story text.
    Supports ElevenLabs, Google TTS (gTTS), and Microsoft Edge TTS.
    """
    if elevenlabs_api_key and voice_name.startswith("eleven_"):
        voice_id = voice_name.replace("eleven_", "")
        print(f"TTS: Generating ElevenLabs premium speech (Voice: {voice_id})...")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenlabs_api_key
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        response = httpx.post(url, json=data, headers=headers, timeout=30.0)
        if response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(response.content)
            print("TTS: ElevenLabs speech generated successfully.")
            return True
        else:
            raise Exception(f"ElevenLabs TTS failed: {response.text}")
            
    elif voice_name == "gtts":
        print("TTS: Generating Google TTS speech...")
        install_package("gtts")
        from gtts import gTTS
        tts = gTTS(text=text, lang='en')
        tts.save(output_path)
        print("TTS: Google TTS speech generated successfully.")
        return True
        
    else:
        # Default to Microsoft Edge TTS (Highly realistic, free, zero config)
        print(f"TTS: Generating Microsoft Edge TTS speech (Voice: {voice_name})...")
        install_package("edge-tts")
        import edge_tts
        import threading
        
        async def run_edge_tts():
            communicate = edge_tts.Communicate(text, voice_name)
            await communicate.save(output_path)
            
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
            
        if loop and loop.is_running():
            def run_in_thread():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                try:
                    new_loop.run_until_complete(run_edge_tts())
                finally:
                    new_loop.close()
            
            thread = threading.Thread(target=run_in_thread)
            thread.start()
            thread.join()
        else:
            asyncio.run(run_edge_tts())
            
        print("TTS: Edge TTS speech generated successfully.")
        return True

def compile_story_video(image_data_uri_or_path, text, voice, bgm_option, hf_token=None, elevenlabs_api_key=None, page_key=None):
    """
    Orchestrates the entire voice, background music, and video synthesis pipeline.
    1. Decodes and saves the input image (handles local path or Base64 URI).
    2. Generates the speech audio track (TTS) from the text.
    3. Retrieves or generates the background music (BGM) track.
    4. Combines the image, TTS narration, and BGM into an MP4 video using FFmpeg.
    
    Returns the absolute path to the generated MP4 video.
    """
    # 1. Initialize Paths & Directories
    gen_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "generated"))
    voice_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "voice"))
    os.makedirs(gen_dir, exist_ok=True)
    os.makedirs(voice_dir, exist_ok=True)
    
    if page_key:
        safe_key = "".join([c if c.isalnum() else "_" for c in page_key]).strip("_").lower()
    else:
        safe_key = str(uuid.uuid4())[:8]
        
    image_temp_path = os.path.join(gen_dir, f"img_temp_{safe_key}.png")
    tts_temp_path = os.path.join(voice_dir, f"voice_{safe_key}.mp3")
    video_out_path = os.path.join(gen_dir, f"story_video_{safe_key}.mp4")
    
    # 2. Decode/Save Image
    if image_data_uri_or_path.startswith("data:image/"):
        base64_str = image_data_uri_or_path
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        with open(image_temp_path, "wb") as f:
            f.write(img_bytes)
        image_path = image_temp_path
    else:
        image_path = os.path.abspath(image_data_uri_or_path)
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Source image not found: {image_path}")

    try:
        # 3. Generate Narration (TTS)
        generate_tts(text, voice, tts_temp_path, elevenlabs_api_key)
        
        # 4. Resolve BGM Path
        bgm_path = None
        if bgm_option and bgm_option != "none":
            presets = ["calm_piano", "happy_ukulele", "magical_fairytale", "playful_toyland"]
            if bgm_option in presets:
                bgm_path = ensure_bgm_preset(bgm_option)
            else:
                bgm_path = generate_ai_bgm(bgm_option, hf_token)

        # 5. Compile with FFmpeg
        ffmpeg_bin = ensure_ffmpeg()
        
        if bgm_path and os.path.exists(bgm_path):
            # Mix TTS (volume 1.0) and BGM (volume 0.30)
            # Add 1s silence before voice, and 1s silence after voice
            cmd = [
                ffmpeg_bin, "-y",
                "-loop", "1", "-i", image_path,
                "-i", tts_temp_path,
                "-stream_loop", "-1", "-i", bgm_path,
                "-filter_complex", "[1:a]adelay=1s:all=1,apad=pad_dur=1,volume=1.0[speech];[2:a]volume=0.30[music];[speech][music]amix=inputs=2:duration=first:dropout_transition=2[mixed_audio]",
                "-map", "0:v", "-map", "[mixed_audio]",
                "-c:v", "libx264", "-tune", "stillimage",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest", video_out_path
            ]
        else:
            cmd = [
                ffmpeg_bin, "-y",
                "-loop", "1", "-i", image_path,
                "-i", tts_temp_path,
                "-filter_complex", "[1:a]adelay=1s:all=1,apad=pad_dur=1[speech]",
                "-map", "0:v", "-map", "[speech]",
                "-c:v", "libx264", "-tune", "stillimage",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest", video_out_path
            ]
            
        print(f"FFmpeg Executive Run: {' '.join(cmd)}")
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg execution failed:\n{result.stderr}")
            
        print(f"Video created successfully: {video_out_path}")
        return video_out_path

    finally:
        # Keep the generated voice MP3 inside resources/voice, clean up temporary visual canvas image
        if image_temp_path and os.path.exists(image_temp_path) and image_temp_path != image_data_uri_or_path:
            try:
                os.remove(image_temp_path)
            except Exception:
                pass
