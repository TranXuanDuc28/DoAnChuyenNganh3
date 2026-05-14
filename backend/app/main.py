from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.api_v1.api import api_router
from app.core.config import settings
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Legacy Redirects (To support non-updated clients)
from fastapi.responses import RedirectResponse
@app.get("/api/lessons")
async def legacy_lessons(category_id: int = None):
    url = f"/api/v1/lessons"
    if category_id: url += f"?category_id={category_id}"
    return RedirectResponse(url=url)

@app.get("/api/categories")
async def legacy_categories():
    return RedirectResponse(url="/api/v1/categories")

@app.get("/api/lessons/{lesson_id}")
async def legacy_lesson_detail(lesson_id: int):
    return RedirectResponse(url=f"/api/v1/lessons/{lesson_id}")

# Mount static files (for thumbnails and videos)
# Base directory of the backend (where archive folder lives)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
archive_path = os.path.join(BASE_DIR, "archive")

if os.path.exists(archive_path):
    app.mount("/static", StaticFiles(directory=archive_path), name="static")
    print(f"Mounted static files from: {archive_path}")
else:
    print(f"Warning: Static path {archive_path} does not exist!")

@app.get("/")
def root():
    return {"message": "Welcome to Lumina Sign API", "version": "1.0.0"}
