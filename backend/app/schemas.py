"""Pydantic schemas for API requests and responses"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


# ==================== Detection Response Schemas ====================

class DetectionSignal(BaseModel):
    """Individual detection signal"""
    type: str  # face_boundary, gan_fingerprint, temporal_flicker, etc.
    severity: str  # low, medium, high
    description: str
    confidence: Optional[float] = None


class DetectionResponse(BaseModel):
    """Response for a completed detection"""
    id: int
    risk_score: float = Field(..., ge=0, le=100)
    classification: str  # REAL, SUSPICIOUS, FAKE
    confidence: float = Field(..., ge=0, le=100)
    signals: List[DetectionSignal]
    
    face_count: int
    gan_fingerprints: Optional[float]
    temporal_consistency: Optional[float]
    audio_visual_sync: Optional[float]
    blending_artifacts: Optional[float]
    
    explanation: Optional[str]
    file_name: str
    media_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnalysisJobResponse(BaseModel):
    """Response for tracking analysis job progress"""
    id: int
    job_type: str
    status: str  # pending, processing, completed, failed
    progress: float = Field(..., ge=0, le=100)
    detection_id: Optional[int]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class BatchDetectionResponse(BaseModel):
    """Response for batch detection results"""
    total: int
    results: List[DetectionResponse]
    fake_count: int
    real_count: int
    suspicious_count: int
    average_risk_score: float


# ==================== Detection Request Schemas ====================

class MediaUploadRequest(BaseModel):
    """Request for media file upload analysis"""
    pass  # File is handled multipart/form-data


class URLAnalysisRequest(BaseModel):
    """Request for URL-based media analysis"""
    url: str
    media_type: str = "auto"  # auto, image, video


class NewsAnalysisRequest(BaseModel):
    """Request for written news text analysis"""
    text: str


class NewsAnalysisResponse(BaseModel):
    """Response for a completed news text analysis"""
    risk_score: float = Field(..., ge=0, le=100)
    classification: str  # REAL, SUSPICIOUS, FAKE
    key_claims: List[str]
    fallacies_detected: List[str]
    verdict: str
    explanation: str
    
    class Config:
        from_attributes = True


class FrameAnalysisRequest(BaseModel):
    """Request for single frame analysis (Live Shield)"""
    frame: str  # base64 encoded image
    audio_data: Optional[str] = None  # base64 encoded audio
    timestamp: Optional[float] = None  # milliseconds


class BatchAnalysisRequest(BaseModel):
    """Request for batch file analysis"""
    file_count: int
    analysis_params: Optional[Dict[str, Any]] = None


# ==================== History & Dashboard Schemas ====================

class DetectionHistoryItem(BaseModel):
    """Item in detection history"""
    id: int
    file_name: str
    media_type: str
    risk_score: float
    classification: str
    created_at: datetime
    source: Optional[str]  # YouTube, Instagram, etc.
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_scans: int
    fake_detected: int
    real_content: int
    suspicious_content: int
    average_risk_score: float
    detections_today: int
    detections_this_week: int
    most_common_signal: Optional[str]


class TimelineEvent(BaseModel):
    """Timeline event for dashboard"""
    id: int
    timestamp: datetime
    event_type: str
    risk_score: float
    classification: str
    source: Optional[str]


# ==================== Settings & User Schemas ====================

class UserSettingsRequest(BaseModel):
    """User settings update request"""
    auto_analyze: bool = True
    notifications_enabled: bool = True
    sensitivity: str = "medium"  # low, medium, high
    auto_save_results: bool = True


class UserSettingsResponse(BaseModel):
    """User settings response"""
    auto_analyze: bool
    notifications_enabled: bool
    sensitivity: str
    auto_save_results: bool


# ==================== Export & Report Schemas ====================

class ReportExportRequest(BaseModel):
    """Request to export detection report"""
    format: str = "pdf"  # pdf, json, csv
    include_images: bool = False
    date_range: Optional[Dict[str, str]] = None  # start_date, end_date


class ReportData(BaseModel):
    """Report data for export"""
    detection: DetectionResponse
    metadata: Dict[str, Any]
    timestamp: datetime


# ==================== Error Schemas ====================

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str]
    status_code: int


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str  # healthy, degraded, unhealthy
    version: str
    timestamp: datetime
