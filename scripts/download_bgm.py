import os
import subprocess
import static_ffmpeg

# Get the path to ffmpeg from static_ffmpeg
paths = static_ffmpeg.add_paths()
# add_paths actually adds it to os.environ["PATH"]!
# So yt_dlp should find it automatically if we just let it use the environment.

bgm_dir = r"C:\D-Drive\GitHub\KidsBookGenerator\app\resources\bgm"
folders = ["happy", "bedtime", "magical", "adventure", "funny", "educational", "emotional", "transitions", "intro", "outro"]

for folder in folders:
    os.makedirs(os.path.join(bgm_dir, folder), exist_ok=True)

tracks = {
    "happy": [
        "Kids Happy Music NastelBom",
        "Happy Kids Music PaulYudin",
        "Kids Music BombinSound",
        "Happy Kids Background Music Eliveta",
        "Kids Happy Background Music DELOSound"
    ],
    "bedtime": [
        "Classical Vibes 2",
        "Smile",
        "Soft Piano Collection",
        "Gentle Kids Background Music",
        "Relaxing Children's Theme"
    ],
    "magical": [
        "It's April",
        "Magical Children's Theme",
        "Fantasy Story Music"
    ],
    "adventure": [
        "Banjo Man in Africa",
        "Summer's Here",
        "Dance With Me",
        "Kids Adventure Music",
        "Happy Explorer Theme"
    ],
    "funny": [
        "Feeling Happy",
        "Cartoon Fun Music",
        "Happy Bounce Theme"
    ],
    "educational": [
        "Happy Learning Music",
        "Positive Educational Theme"
    ],
    "emotional": [
        "Emotional Kids Theme",
        "Soft Piano Journey",
        "Inspirational Story Music"
    ]
}

print("Starting downloads...")
for category, queries in tracks.items():
    cat_dir = os.path.join(bgm_dir, category)
    for q in queries:
        safe_name = q.replace(" ", "_").replace("'", "")
        out_tpl = os.path.join(cat_dir, f"{safe_name}.%(ext)s")
        if os.path.exists(os.path.join(cat_dir, f"{safe_name}.mp3")):
            print(f"Skipping {safe_name}, already exists.")
            continue
            
        print(f"Downloading: {q} into {category}")
        
        # Run yt-dlp
        cmd = [
            "python", "-m", "yt_dlp",
            f"ytsearch1:{q}",
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "-o", out_tpl,
            "--no-playlist"
        ]
        try:
            # We must pass the updated environment!
            subprocess.run(cmd, check=True, env=os.environ.copy())
        except subprocess.CalledProcessError as e:
            print(f"Failed to download {q}: {e}")
            
print("Finished!")
