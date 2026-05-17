# Kids Book Generator: Compile Full Story Book Video Integration Plan

This document outlines the blueprint and architecture for building the **Full Story Book Video Compilation** feature, merging all single-page H.264 MP4 videos into a single continuous full-length storybook cartoon movie.

---

## 📐 Architecture & Subprocess Flow

The full-movie compiler operates in two simple, high-performance phases:

```
+-------------------------------------------------------------+
| Phase 1: Sequential Page Compilation                         |
| Loops through all active book/habit pages, generating clean  |
| individual page MP4 clips.                                  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| Phase 2: FFmpeg Demuxer Merger                              |
| Writes temporary listing of all generated MP4 file paths,   |
| and calls FFmpeg's concat demuxer for instant merging!      |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| Phase 3: Final Movie Stream                                 |
| Saves full movie to 'app/resources/generated/full_movie.mp4'|
| and serves it streamable in the HTML5 player.               |
+-------------------------------------------------------------+
```

---

## 🛠️ Backend Implementation Plan

### 1. Register API Endpoint (`POST /compile-full-movie`)
This endpoint accepts a listing of compiled page filenames and joins them.

**Endpoint Draft (`app/main.py`):**
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os

class FullMovieRequest(BaseModel):
    video_filenames: List[str]

@app.post("/compile-full-movie")
def compile_full_movie_endpoint(request: FullMovieRequest):
    try:
        gen_dir = os.path.abspath("app/resources/generated")
        output_filename = f"full_movie_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(gen_dir, output_filename)
        
        # 1. Create FFmpeg concat demuxer listing file
        list_file_path = os.path.join(gen_dir, "concat_list.txt")
        with open(list_file_path, "w", encoding="utf-8") as f:
            for fname in request.video_filenames:
                # Resolve safe relative paths for FFmpeg demuxer
                safe_fname = fname.replace("\\", "/")
                f.write(f"file '{safe_fname}'\n")
                
        # 2. Execute instant FFmpeg merging (copy streams without re-encoding!)
        ffmpeg_bin = ensure_ffmpeg()
        cmd = [
            ffmpeg_bin, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file_path,
            "-c", "copy",  # Direct stream copy: completes in milliseconds!
            output_path
        ]
        
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Clean up concat temporary file
        if os.path.exists(list_file_path):
            os.remove(list_file_path)
            
        if result.returncode != 0:
            raise Exception(f"FFmpeg merging failed: {result.stderr}")
            
        return {
            "status": "success",
            "video_url": f"/generated-media/{output_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🖥️ Frontend Integration Plan

### 1. UI Control Button
Add a large premium button right below the **"Download All"** or bulk generators on the bottom left sidebar:
* **Label**: `🎬 Compile Full Book Video`
* **Loading State**: Displays `Compiling Page 1 of 5...`, merging streams, and playing.

### 2. State & Execution Loop
```javascript
const compileFullBookVideo = async () => {
  setIsCompilingFullVideo(true);
  try {
    const compiledFilenames = [];
    
    // 1. Loop and compile any pages that are not yet built
    for (const pageKey of pagesList) {
      if (!generatedVideos[pageKey]) {
        // Automatically trigger compile for this page
        const videoUrl = await triggerPageCompilation(pageKey);
        const fname = videoUrl.split('/').pop();
        compiledFilenames.push(fname);
      } else {
        const fname = generatedVideos[pageKey].split('/').pop();
        compiledFilenames.push(fname);
      }
    }
    
    // 2. Call the backend concat demuxer
    const response = await fetch('/compile-full-movie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_filenames: compiledFilenames })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail);
    
    setFullBookVideoUrl(data.video_url);
  } catch (err) {
    setError(`Failed to compile full book video: ${err.message}`);
  } finally {
    setIsCompilingFullVideo(false);
  }
};
```
