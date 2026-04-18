"""FastAPI Application Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
import os

from app.config import get_settings
from app.database import init_db
from app import __version__
from app.api import router as health_router
from app.api.analyze import router as analyze_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered deepfake detection API",
    version=__version__,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add broad CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.on_event("startup")
async def startup_event():
    """Startup event - initialize database"""
    logger.info(f"Starting {settings.APP_NAME} v{__version__}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Database: {settings.DATABASE_URL}")
    
    # Initialize database
    init_db()
    
    # Create uploads directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)
    
    logger.info("Application started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event - cleanup"""
    logger.info("Application shutting down")


# Include routers
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(analyze_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": __version__,
        "status": "running",
        "docs_url": "/api/docs",
        "health_url": "/api/health"
    }


@app.get("/api/info")
async def info():
    """API information endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": __version__,
        "environment": "development" if settings.DEBUG else "production",
        "features": {
            "image_analysis": True,
            "video_analysis": True,
            "url_analysis": True,
            "real_time_frames": True,
            "ai_explanations": bool(settings.CLAUDE_API_KEY),
            "gpu_acceleration": settings.USE_GPU
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        log_level=settings.LOG_LEVEL.lower()
    )
