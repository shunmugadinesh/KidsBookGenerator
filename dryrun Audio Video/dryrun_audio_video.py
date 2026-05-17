import os
import sys
import subprocess
import urllib.request
import base64
import asyncio
import uuid

print("=== Dry-Run Audio-Video Generator ===")

def install_package(package_name):
    try:
        if package_name == "edge-tts":
            import edge_tts
        elif package_name == "gtts":
            import gtts
        else:
            __import__(package_name)
        print(f"Dynamic Installer: {package_name} is already installed.")
    except ImportError:
        print(f"Dynamic Installer: {package_name} not found. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
            print(f"Dynamic Installer: Successfully installed {package_name}")
        except Exception as e:
            print(f"Dynamic Installer Failed for {package_name}: {e}")

def ensure_ffmpeg():
    # 1. Check system path
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print("FFmpeg: Found in system PATH!")
        return "ffmpeg"
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    # 2. Try static-ffmpeg package
    try:
        install_package("static-ffmpeg")
        import static_ffmpeg
        static_ffmpeg.add_paths()
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print("FFmpeg: Found via static-ffmpeg package!")
        return "ffmpeg"
    except Exception:
        pass

    # 3. Check local bin path
    local_bin_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "bin"))
    local_ffmpeg = os.path.join(local_bin_dir, "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg")
    if os.path.exists(local_ffmpeg):
        print(f"FFmpeg: Found locally at {local_ffmpeg}")
        return local_ffmpeg

    # 4. Auto-download static ffmpeg for Windows
    if sys.platform == "win32":
        try:
            print("FFmpeg: Not found on path. Downloading static ffmpeg.exe for Windows...")
            os.makedirs(local_bin_dir, exist_ok=True)
            # Portable static binary of FFmpeg for Windows x64 (~20MB)
            url = "https://github.com/eugene-eeo/static-ffmpeg/raw/master/static_ffmpeg/bin/win32/x64/ffmpeg.exe"
            urllib.request.urlretrieve(url, local_ffmpeg)
            print(f"FFmpeg: Downloaded successfully to {local_ffmpeg}")
            return local_ffmpeg
        except Exception as e:
            print(f"FFmpeg: Auto-download failed: {e}")
            
    raise FileNotFoundError(
        "FFmpeg binary is required but could not be located or installed automatically. "
        "Please ensure 'ffmpeg' is in your system PATH or run 'pip install static-ffmpeg'."
    )

def download_test_assets(img_path, bgm_path):
    print("Assets: Downloading test placeholder image and BGM loop...")
    # Dynamic image placeholder
    try:
        if not os.path.exists(img_path):
            urllib.request.urlretrieve("https://picsum.photos/400", img_path)
            print(f"Assets: Saved test image to {img_path}")
    except Exception as e:
        print(f"Assets: Image download failed: {e}")
        
    # Small test MP3 loop
    try:
        if not os.path.exists(bgm_path):
            # A very stable, tiny test MP3 from soundhelix
            req = urllib.request.Request(
                "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req) as response, open(bgm_path, 'wb') as out_file:
                # Just read the first 100KB to make download instant!
                out_file.write(response.read(100 * 1024))
            print(f"Assets: Saved test BGM loop to {bgm_path}")
    except Exception as e:
        print(f"Assets: BGM download failed: {e}")

async def run_edge_tts(text, voice, output_path):
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def test_pipeline():
    # Setup working directory in scratch area
    scratch_dir = os.path.dirname(__file__)
    img_path = os.path.join(scratch_dir, "test_image.png")
    bgm_path = os.path.join(scratch_dir, "test_bgm.mp3")
    tts_path = os.path.join(scratch_dir, "test_tts.mp3")
    video_path = os.path.join(scratch_dir, "story_video_test.mp4")

    # Ensure dependencies
    install_package("edge-tts")
    install_package("gtts")
    
    # Check FFmpeg
    ffmpeg_bin = ensure_ffmpeg()

    # Get assets
    download_test_assets(img_path, bgm_path)

    # Test TTS
    print("TTS: Generating test voice-over...")
    text_content = "Hello! Today we are doing a dry run of the Kids Book Generator audio-video compilation module. It works beautifully!"
    try:
        asyncio.run(run_edge_tts(text_content, "en-US-AriaNeural", tts_path))
        print(f"TTS: Voice synthesized successfully to {tts_path}")
    except Exception as e:
        print(f"TTS: Edge-TTS failed, trying fallback gTTS: {e}")
        from gtts import gTTS
        tts = gTTS(text=text_content, lang='en')
        tts.save(tts_path)
        print(f"TTS: Fallback Google TTS generated successfully.")

    # Mix using FFmpeg
    print("FFmpeg: Compiling mixed audio and H.264 video...")
    if os.path.exists(bgm_path) and os.path.exists(tts_path):
        cmd = [
            ffmpeg_bin, "-y",
            "-loop", "1", "-i", img_path,
            "-i", tts_path,
            "-stream_loop", "-1", "-i", bgm_path,
            "-filter_complex", "[1:a]volume=1.0[speech];[2:a]volume=0.15[music];[speech][music]amix=inputs=2:duration=first:dropout_transition=2[mixed_audio]",
            "-map", "0:v", "-map", "[mixed_audio]",
            "-c:v", "libx264", "-tune", "stillimage",
            "-c:a", "aac", "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest", video_path
        ]
    else:
        cmd = [
            ffmpeg_bin, "-y",
            "-loop", "1", "-i", img_path,
            "-i", tts_path,
            "-map", "0:v", "-map", "1:a",
            "-c:v", "libx264", "-tune", "stillimage",
            "-c:a", "aac", "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest", video_path
        ]

    print(f"FFmpeg: Running cmd: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode == 0:
        print(f"SUCCESS: Video generated successfully at: {video_path}")
        print(f"Video file size: {os.path.getsize(video_path)} bytes")
    else:
        print(f"ERROR: FFmpeg failed with exit code {result.returncode}")
        print(f"FFmpeg Stderr:\n{result.stderr}")

if __name__ == "__main__":
    test_pipeline()
