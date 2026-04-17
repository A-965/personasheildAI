"""Analysis API Routes - Core Detection Endpoints"""
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.database import get_db
from app.models import Detection, AnalysisJob
from app.schemas import (
    DetectionResponse, AnalysisJobResponse, URLAnalysisRequest,
    FrameAnalysisRequest, DetectionHistoryItem, DashboardStats,
    NewsAnalysisRequest, NewsAnalysisResponse
)
from app.services import DetectionService
from app.services.claude_service import ClaudeService
from app.utils import save_upload_file, validate_file, get_media_type, cleanup_file
from app.config import get_settings
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analysis"])
settings = get_settings()

# Initialize services
detection_service = DetectionService(use_gpu=settings.USE_GPU)
claude_service = ClaudeService(api_key=settings.CLAUDE_API_KEY)


@router.post("/", response_model=DetectionResponse)
async def analyze_media(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Analyze uploaded media file for deepfakes
    
    Accepts: Images (JPG, PNG, GIF) and Videos (MP4, WebM, MOV)
    Returns: Detection results with risk score and signals
    """
    
    try:
        # Validate file
        is_valid, error_msg = await validate_file(file, max_size=settings.MAX_FILE_SIZE)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Save file
        file_path = await save_upload_file(file, upload_dir=settings.UPLOAD_DIR)
        media_type = get_media_type(file.filename)
        
        # Create detection record
        detection = Detection(
            file_name=file.filename,
            file_path=file_path,
            file_size=file.size or 0,
            media_type=media_type,
            status="processing"
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)
        
        # Schedule background processing
        background_tasks.add_task(
            _process_detection,
            detection_id=detection.id,
            file_path=file_path,
            media_type=media_type
        )
        
        return _detection_to_response(detection)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing media: {e}")
        raise HTTPException(status_code=500, detail="Error processing file")


@router.post("/url", response_model=DetectionResponse)
async def analyze_url(
    request: URLAnalysisRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Analyze media from URL
    
    Downloads and analyzes media from provided URL
    """
    
    try:
        import httpx
        
        # Download file
        async with httpx.AsyncClient() as client:
            response = await client.get(request.url, timeout=30.0)
            response.raise_for_status()
        
        # Save downloaded content
        import tempfile
        ext = request.url.split('.')[-1][:4]  # Get rough extension
        
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            tmp.write(response.content)
            file_path = tmp.name
        
        media_type = request.media_type if request.media_type != "auto" else get_media_type(file_path)
        
        # Create detection record
        detection = Detection(
            file_name=request.url.split('/')[-1][:100],
            file_path=file_path,
            file_size=len(response.content),
            media_type=media_type,
            status="processing"
        )
        db.add(detection)
        db.commit()
        db.refresh(detection)
        
        # Schedule background processing
        background_tasks.add_task(
            _process_detection,
            detection_id=detection.id,
            file_path=file_path,
            media_type=media_type
        )
        
        return _detection_to_response(detection)
        
    except Exception as e:
        logger.error(f"Error analyzing URL: {e}")
        raise HTTPException(status_code=400, detail="Error downloading or analyzing URL")


@router.post("/frame", response_model=DetectionResponse)
async def analyze_frame(
    request: FrameAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze single frame (Live Shield real-time)
    
    Fast frame-by-frame analysis for real-time detection
    """
    
    try:
        # Run detection on frame
        result = await detection_service.analyze_frame(request.frame, request.audio_data)
        
        # Convert signal objects to JSON-friendly format
        signals = [
            signal.dict() if hasattr(signal, 'dict') else signal
            for signal in result.get('signals', [])
        ]

        # Return directly without saving to DB to prevent lock errors
        return DetectionResponse(
            id=0,
            risk_score=result['risk_score'],
            classification=result['classification'],
            confidence=result['confidence'],
            signals=signals,
            face_count=result['face_count'],
            gan_fingerprints=result['gan_fingerprints'],
            temporal_consistency=result['temporal_consistency'],
            audio_visual_sync=result['audio_visual_sync'],
            blending_artifacts=result['blending_artifacts'],
            explanation="Live frame analyzed.",
            file_name=f"frame_{request.timestamp}",
            media_type="image",
            created_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error analyzing frame: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/news", response_model=NewsAnalysisResponse)
async def analyze_news(request: NewsAnalysisRequest):
    """Analyze written news text for misinformation and logical fallacies"""
    try:
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Text too short for analysis")
            
        result = await claude_service.analyze_news_text(request.text)
        return NewsAnalysisResponse(**result)
        
    except Exception as e:
        logger.error(f"Error analyzing news: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{detection_id}", response_model=DetectionResponse)
async def get_detection(
    detection_id: int,
    db: Session = Depends(get_db)
):
    """Get status and result of a specific detection"""
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
        
    return _detection_to_response(detection)


@router.get("/history", response_model=List[DetectionHistoryItem])
async def get_detection_history(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get detection history"""
    
    detections = db.query(Detection)\
        .order_by(Detection.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return [_detection_to_history(d) for d in detections]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    
    today = datetime.utcnow().date()
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).date()
    
    total = db.query(Detection).count()
    fake = db.query(Detection).filter(Detection.classification == "LIKELY FAKE").count()
    real = db.query(Detection).filter(Detection.classification == "LIKELY REAL").count()
    suspicious = db.query(Detection).filter(Detection.classification == "SUSPICIOUS").count()
    
    today_scans = db.query(Detection).filter(
        Detection.created_at >= datetime.combine(today, datetime.min.time())
    ).count()
    
    week_scans = db.query(Detection).filter(
        Detection.created_at >= datetime.combine(seven_days_ago, datetime.min.time())
    ).count()
    
    avg_risk_row = db.query(func.avg(Detection.risk_score)).filter(Detection.risk_score.isnot(None)).one()
    average_risk_score = float(avg_risk_row[0] or 0.0)
    
    return DashboardStats(
        total_scans=total,
        fake_detected=fake,
        real_content=real,
        suspicious_content=suspicious,
        average_risk_score=average_risk_score,
        detections_today=today_scans,
        detections_this_week=week_scans,
        most_common_signal="gan_fingerprint"  # TODO: Calculate from signals
    )


# ==================== Background Tasks ====================

async def _process_detection(
    detection_id: int,
    file_path: str,
    media_type: str
):
    """Background task to process detection"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        detection = db.query(Detection).filter(Detection.id == detection_id).first()
        if not detection:
            return
        
        # Run detection
        if media_type == "image":
            result = await detection_service.analyze_image(file_path)
        else:
            result = await detection_service.analyze_video(file_path)
        
        # Update detection with results
        detection.risk_score = result['risk_score']
        detection.classification = result['classification']
        detection.confidence = result['confidence']
        detection.signals = [s.dict() for s in result['signals']]
        detection.face_count = result['face_count']
        detection.gan_fingerprints = result['gan_fingerprints']
        detection.temporal_consistency = result['temporal_consistency']
        detection.blending_artifacts = result['blending_artifacts']
        
        # Generate explanation
        explanation = await claude_service.generate_explanation(
            risk_score=result['risk_score'],
            classification=result['classification'],
            signals=result['signals']
        )
        detection.explanation = explanation
        detection.status = "completed"
        
        db.commit()
        
        # Cleanup file
        await cleanup_file(file_path)
        
    except Exception as e:
        logger.error(f"Error processing detection {detection_id}: {e}")
        detection.status = "failed"
        detection.error_message = str(e)
        db.commit()
    finally:
        db.close()


# ==================== Helper Functions ====================

def _detection_to_response(detection: Detection) -> DetectionResponse:
    """Convert Detection model to response"""
    return DetectionResponse(
        id=detection.id,
        risk_score=detection.risk_score or 0,
        classification=detection.classification or "PENDING",
        confidence=detection.confidence or 0,
        signals=detection.signals or [],
        face_count=detection.face_count or 0,
        gan_fingerprints=detection.gan_fingerprints,
        temporal_consistency=detection.temporal_consistency,
        audio_visual_sync=detection.audio_visual_sync,
        blending_artifacts=detection.blending_artifacts,
        explanation=detection.explanation or "Analyzing...",
        file_name=detection.file_name,
        media_type=detection.media_type,
        created_at=detection.created_at
    )


def _detection_to_history(detection: Detection) -> DetectionHistoryItem:
    """Convert Detection to history item"""
    return DetectionHistoryItem(
        id=detection.id,
        file_name=detection.file_name,
        media_type=detection.media_type,
        risk_score=detection.risk_score or 0,
        classification=detection.classification or "PENDING",
        created_at=detection.created_at,
        source=None
    )
