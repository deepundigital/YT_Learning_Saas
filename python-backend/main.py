import os
import yt_dlp
import json
import uuid
from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path

app = FastAPI()

# Constants
BASE_DIR = Path(__file__).parent
DOWNLOAD_DIR = BASE_DIR / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)
METADATA_FILE = DOWNLOAD_DIR / "metadata.json"

# Configure CORS to allow our frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Sessions for tracking
app.add_middleware(SessionMiddleware, secret_key="yt_learning_saas_python_secret")

class DownloadRequest(BaseModel):
    url: str

def load_metadata():
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return {}

def save_metadata(metadata):
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=4)

@app.get("/")
def read_root():
    return {"message": "Python YouTube Downloader API is active ✅"}

@app.get("/api/stats")
async def get_stats(request: Request):
    """Get session stats for downloads"""
    downloads = request.session.get("downloads", 0)
    last_url = request.cookies.get("last_downloaded_url", "None")
    local_count = len(load_metadata())
    return {
        "session_downloads": downloads,
        "last_downloaded_url": last_url,
        "local_videos_count": local_count
    }

@app.post("/api/download")
async def get_download_link(req: DownloadRequest, request: Request, response: Response):
    """
    Extracts the best quality direct download link for a YouTube video.
    """
    url = req.url
    if not url:
        raise HTTPException(status_code=400, detail="YouTube URL is required")

    try:
        # Update Session data
        downloads = request.session.get("downloads", 0)
        request.session["downloads"] = downloads + 1
        
        # Set a tracking Cookie
        response.set_cookie(
            key="last_downloaded_url", 
            value=url, 
            max_age=86400, # 24 hours
            httponly=False 
        )

        ydl_opts = {
            'format': 'best',
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            
            best_format = None
            for f in formats:
                if f.get('ext') == 'mp4' and f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                    best_format = f
                    break
            
            if not best_format:
                best_format = info 
            
            return {
                "ok": True,
                "title": info.get('title'),
                "download_url": best_format.get('url'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "id": info.get('id'),
                "session_downloads": request.session["downloads"]
            }
    except Exception as e:
        print(f"yt-dlp error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract video: {str(e)}")

@app.post("/api/download/local")
async def download_locally(req: DownloadRequest):
    """
    Downloads a video to the local server storage for offline playback.
    """
    url = req.url
    if not url:
        raise HTTPException(status_code=400, detail="YouTube URL is required")

    video_id = str(uuid.uuid4())[:8]
    
    try:
        ydl_opts = {
            'format': 'best[ext=mp4]',
            'outtmpl': str(DOWNLOAD_DIR / f"{video_id}.%(ext)s"),
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = f"{video_id}.mp4"
            
            metadata = load_metadata()
            video_data = {
                "id": video_id,
                "yt_id": info.get("id"),
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "filename": filename,
                "url": url,
                "size": os.path.getsize(DOWNLOAD_DIR / filename)
            }
            metadata[video_id] = video_data
            save_metadata(metadata)
            
            return {"ok": True, "video": video_data}
            
    except Exception as e:
        print(f"Local download error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download video locally: {str(e)}")

@app.get("/api/videos")
async def list_videos():
    """List all locally downloaded videos"""
    return list(load_metadata().values())

@app.get("/api/videos/{video_id}")
async def get_video_file(video_id: str):
    """Serve the video file for playback"""
    metadata = load_metadata()
    if video_id not in metadata:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = DOWNLOAD_DIR / metadata[video_id]["filename"]
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file missing")
        
    return FileResponse(video_path, media_type="video/mp4")

@app.delete("/api/videos/{video_id}")
async def delete_video(video_id: str):
    """Delete a locally downloaded video"""
    metadata = load_metadata()
    if video_id not in metadata:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = DOWNLOAD_DIR / metadata[video_id]["filename"]
    if video_path.exists():
        os.remove(video_path)
    
    del metadata[video_id]
    save_metadata(metadata)
    
    return {"ok": True, "message": "Video deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
