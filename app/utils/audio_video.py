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
    Ensures that the selected BGM MP3 preset is available.
    It recursively searches the resources/bgm folder and any subdirectories.
    If it doesn't exist locally, it tries to download a fallback URL.
    """
    bgm_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "bgm"))
    os.makedirs(bgm_dir, exist_ok=True)
    
    # 1. ALWAYS check if the file exists locally by scanning subdirectories
    for root, dirs, files in os.walk(bgm_dir):
        if f"{preset_name}.mp3" in files:
            file_path = os.path.join(root, f"{preset_name}.mp3")
            if os.path.getsize(file_path) > 10000:
                print(f"BGM Cache: Found local track for '{preset_name}' at {file_path}")
                return file_path
        
    # 2. Pre-configured fallback URLs
    presets = {
        "electronic_melody": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "upbeat_synth": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "rhythmic_groove": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "playful_beats": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        "ambient_chords": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        "retro_arp": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        "dance_pop": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
        "smooth_techno": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        "driving_rhythm": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
        "soft_trance": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
        "bright_synth": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
        "mellow_beats": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
        "energetic_mix": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
        "deep_groove": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
        "light_electronica": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
        "dynamic_trance": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
        "cosmic_ambient": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3"
    }
    
    if preset_name not in presets:
        return None
        
    print(f"BGM Cache: Downloading fallback preset '{preset_name}' on demand...")
    url = presets[preset_name]
    download_dir = os.path.join(bgm_dir, "soundhelix")
    os.makedirs(download_dir, exist_ok=True)
    file_path = os.path.join(download_dir, f"{preset_name}.mp3")
    temp_file_path = file_path + ".tmp"
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        with httpx.Client(verify=False) as client:
            with client.stream("GET", url, headers=headers, timeout=60.0) as r:
                if r.status_code == 200:
                    with open(temp_file_path, 'wb') as out_file:
                        for chunk in r.iter_bytes(chunk_size=1024*1024):
                            out_file.write(chunk)
                else:
                    raise Exception(f"HTTP Status Code {r.status_code}")
            
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

def generate_tts(text, voice_name, output_path, elevenlabs_api_key=None, speed="normal", dramatic_pacing=False):
    """
    Generates a speech audio file (TTS) for the given story text.
    Supports ElevenLabs, Google TTS (gTTS), Microsoft Edge TTS, OpenAI, Fish Audio, and KittenTTS.
    """
    if dramatic_pacing:
        # Pacing is now handled visually in the UI by modifying the text directly.
        pass
    if voice_name.startswith("eleven|") or voice_name.startswith("eleven_"):
        if voice_name.startswith("eleven|"):
            parts = voice_name.split("|")
            model_id = parts[1]
            voice_id = parts[2]
        else:
            # Legacy format: eleven_voiceId
            model_id = "eleven_multilingual_v2"
            voice_id = voice_name.replace("eleven_", "", 1)
            
        print(f"TTS: Generating ElevenLabs premium speech (Voice: {voice_id}, Model: {model_id})...")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenlabs_api_key or os.getenv("ELEVENLABS_API_KEY")
        }
        data = {
            "text": text,
            "model_id": model_id,
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
            
    elif voice_name.startswith("openai_"):
        parts = voice_name.split("_", 2)
        model_id = parts[1] if len(parts) > 2 else "tts-1"
        voice_id = parts[2] if len(parts) > 2 else parts[1]
        
        print(f"TTS: Generating OpenAI speech (Voice: {voice_id}, Model: {model_id})...")
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            raise Exception("OPENAI_API_KEY is not set.")
        
        url = "https://api.openai.com/v1/audio/speech"
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model_id,
            "input": text,
            "voice": voice_id
        }
        response = httpx.post(url, json=data, headers=headers, timeout=30.0)
        if response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(response.content)
            print("TTS: OpenAI speech generated successfully.")
            return True
        else:
            raise Exception(f"OpenAI TTS failed: {response.text}")

    elif voice_name.startswith("fishaudio_"):
        voice_id = voice_name.replace("fishaudio_", "")
        print(f"TTS: Generating Fish Audio speech (Voice: {voice_id})...")
        fish_key = os.getenv("FISHAUDIO_API_KEY")
        if not fish_key:
            raise Exception("FISHAUDIO_API_KEY is not set.")
            
        url = "https://api.fish.audio/v1/tts"
        headers = {
            "Authorization": f"Bearer {fish_key}",
            "Content-Type": "application/json"
        }
        data = {
            "text": text,
            "reference_id": voice_id if voice_id != "default" else None
        }
        
        # Fish Audio requires a slightly different payload for models if specified, but usually defaults work.
        response = httpx.post(url, json=data, headers=headers, timeout=45.0)
        if response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(response.content)
            print("TTS: Fish Audio speech generated successfully.")
            return True
        else:
            raise Exception(f"Fish Audio TTS failed: {response.text}")
            
    elif voice_name.startswith("kittentts_"):
        voice_id = voice_name.replace("kittentts_", "")
        print(f"TTS: Generating KittenTTS speech (Voice: {voice_id})...")
        # Gradio API endpoint for KittenTTS Demo
        url = "https://kittenml-kittentts-demo.hf.space/call/predict"
        # We start a gradio queue prediction
        try:
            res_init = httpx.post(url, json={"data": [text, voice_id]}, timeout=15.0)
            if res_init.status_code == 200:
                event_id = res_init.json().get("event_id")
                # Poll the gradio event stream
                poll_url = f"https://kittenml-kittentts-demo.hf.space/call/predict/{event_id}"
                
                with httpx.stream("GET", poll_url, timeout=60.0) as r:
                    for line in r.iter_lines():
                        if line.startswith("event: complete"):
                            # The next line will be data: [...]
                            pass
                        elif line.startswith("data: "):
                            data_content = json.loads(line[6:])
                            if isinstance(data_content, list) and len(data_content) > 0:
                                audio_info = data_content[0]
                                if isinstance(audio_info, dict) and "url" in audio_info:
                                    # Download the actual audio
                                    audio_url = audio_info["url"]
                                    if not audio_url.startswith("http"):
                                        audio_url = "https://kittenml-kittentts-demo.hf.space" + audio_url
                                    
                                    audio_res = httpx.get(audio_url, timeout=30.0)
                                    with open(output_path, "wb") as f:
                                        f.write(audio_res.content)
                                    print("TTS: KittenTTS speech generated successfully.")
                                    return True
                raise Exception("KittenTTS did not return a valid audio URL.")
            else:
                raise Exception(f"KittenTTS API init failed: {res_init.text}")
        except Exception as e:
            raise Exception(f"KittenTTS generation failed: {str(e)}. (Note: HuggingFace Spaces may be asleep/busy)")
            
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
        print(f"TTS: Generating Microsoft Edge TTS speech (Voice: {voice_name}, Speed: {speed})...")
        install_package("edge-tts")
        import edge_tts
        import threading
        
        rate_str = "+0%"
        if speed == "slow":
            rate_str = "-15%"
        elif speed == "fast":
            rate_str = "+15%"
        
        async def run_edge_tts():
            communicate = edge_tts.Communicate(text, voice_name, rate=rate_str)
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

def compile_story_video(image_data_uri_or_path, text, voice, bgm_option, hf_token=None, elevenlabs_api_key=None, page_key=None, project_id_name=None, camera_effect="none", effect_speed="medium", voice_speed="normal", dramatic_pacing=False):
    """
    Orchestrates the entire voice, background music, and video synthesis pipeline.
    1. Decodes and saves the input image (handles local path or Base64 URI).
    2. Generates the speech audio track (TTS) from the text.
    3. Retrieves or generates the background music (BGM) track.
    4. Combines the image, TTS narration, and BGM into an MP4 video using FFmpeg.
    
    Returns the absolute path to the generated MP4 video.
    """
    # 1. Initialize Paths & Directories
    if project_id_name:
        gen_dir = os.path.abspath(os.path.join("book_output", project_id_name, "video"))
        voice_dir = os.path.abspath(os.path.join("book_output", project_id_name, "voice"))
    else:
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
        generate_tts(text, voice, tts_temp_path, elevenlabs_api_key, speed=voice_speed, dramatic_pacing=dramatic_pacing)
        
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
        
        # Calculate exact duration to prevent A/V desync in concat demuxer
        try:
            install_package("mutagen")
            from mutagen.mp3 import MP3
            audio = MP3(tts_temp_path)
            exact_duration = audio.info.length + 2.0  # 1s delay + 1s apad
        except Exception as e:
            print(f"Could not read TTS duration: {e}")
            exact_duration = None

        if bgm_path and os.path.exists(bgm_path):
            filter_complex = "[1:a]adelay=1s:all=1,apad=pad_dur=1,volume=1.0[speech];[2:a]volume=0.30[music];[speech][music]amix=inputs=2:duration=first:dropout_transition=2[mixed_audio]"
            
            cmd = [
                ffmpeg_bin, "-y",
                "-loop", "1", "-i", image_path,
                "-i", tts_temp_path,
                "-stream_loop", "-1", "-i", bgm_path,
                "-filter_complex", filter_complex,
                "-map", "0:v", "-map", "[mixed_audio]",
                "-c:v", "libx264", "-tune", "stillimage",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p"
            ]
        else:
            filter_complex = "[1:a]adelay=1s:all=1,apad=pad_dur=1[speech]"
            
            cmd = [
                ffmpeg_bin, "-y",
                "-loop", "1", "-i", image_path,
                "-i", tts_temp_path,
                "-filter_complex", filter_complex,
                "-map", "0:v", "-map", "[speech]",
                "-c:v", "libx264", "-tune", "stillimage",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p"
            ]
            
        if exact_duration:
            cmd.extend(["-t", str(exact_duration), video_out_path])
        else:
            cmd.extend(["-shortest", "-fflags", "+shortest", "-max_interleave_delta", "100M", video_out_path])
            
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
