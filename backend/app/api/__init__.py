"""Health Check API Routes"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import HealthCheckResponse
from datetime import datetime
from app import __version__
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", response_model=HealthCheckResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        
        return HealthCheckResponse(
            status="healthy",
            version=__version__,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="degraded",
            version=__version__,
            timestamp=datetime.utcnow()
        )
