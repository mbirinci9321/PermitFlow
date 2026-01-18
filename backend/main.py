from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import engine, Base
from .routers import settings, agents, execution, history, health, inventory
import os
import sys

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IT Management Master")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determine paths
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)

# If packaged (PyInstaller), use _MEIPASS
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    frontend_dist = os.path.join(base_path, "frontend", "dist")
    agent_dir = os.path.join(base_path, "agent")
    static_dir = os.path.join(base_path, "backend", "static")
else:
    frontend_dist = os.path.join(project_root, "frontend", "dist")
    agent_dir = os.path.join(project_root, "agent")
    static_dir = os.path.join(backend_dir, "static")

# Ensure directories exist
os.makedirs(agent_dir, exist_ok=True)
os.makedirs(static_dir, exist_ok=True)

# Debug: Print paths
print(f"[DEBUG] Frontend dist: {frontend_dist} (exists: {os.path.exists(frontend_dist)})")
print(f"[DEBUG] Agent dir: {agent_dir}")

# Mount downloads
app.mount("/downloads/agent", StaticFiles(directory=agent_dir), name="agent_downloads")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include API Routers with /api prefix
app.include_router(settings.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(execution.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")

# API health check endpoint
@app.get("/api/status")
def api_status():
    return {"status": "Master Server Running", "docs": "/docs"}

# Serve Frontend - MUST be last
if os.path.exists(frontend_dist):
    print(f"[DEBUG] Mounting frontend from: {frontend_dist}")
    # Mount static assets (js, css, etc)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Catch-all route to serve index.html for all other routes (React Router support)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Exclude API routes from catch-all to ensure 404s for missing API endpoints
        if full_path.startswith("api"):
             raise HTTPException(status_code=404, detail="API route not found")
        
        # Check if the requested file exists in frontend_dist (e.g., logo.png, favicon.ico)
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
             
        # Otherwise, serve index.html for React Router
        index_path = os.path.join(frontend_dist, "index.html")
        return FileResponse(index_path)
else:
    print(f"[WARNING] Frontend dist not found at {frontend_dist}")
    @app.get("/")
    def read_root():
        return {"status": "Master Server Running", "docs": "/docs", "warning": "Frontend not found"}

# Note: For packaged exe, launcher.py handles startup
# For dev mode, use: uvicorn backend.main:app --reload

