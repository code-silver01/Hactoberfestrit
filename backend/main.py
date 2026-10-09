"""
CircuitSense — FastAPI Backend
Snap your circuit. Gemma 4 finds the bug.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Ensure parent directory is in sys.path so 'backend.*' imports work from anywhere
parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.routes.analyze import router as analyze_router
from backend.routes.chat import router as chat_router

app = FastAPI(
    title="CircuitSense API",
    description="Debug Arduino circuits with Gemma 4 multimodal AI",
    version="1.0.0",
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api", tags=["Analysis"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])


@app.get("/")
async def root():
    return {
        "name": "CircuitSense API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
