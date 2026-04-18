"""Database Models for DeepGuard"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Detection(Base):
    """Model for storing detection results"""
    __tablename__ = "detections"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # File info
    file_name = Column(String, index=True)
    file_path = Column(String)
    file_size = Column(Integer)  # in bytes
    media_type = Column(String)  # image, video, url
    source_url = Column(String, nullable=True)  # Original URL if provided
    
    # Detection results
    risk_score = Column(Float, index=True)  # 0-100
    classification = Column(String)  # REAL, SUSPICIOUS, FAKE
    confidence = Column(Float)  # 0-100
    
    # Detection signals
    signals = Column(JSON)  # Array of detected anomalies
    
    # Advanced analysis
    face_count = Column(Integer, default=0)
    gan_fingerprints = Column(Float, nullable=True)  # 0-1
    temporal_consistency = Column(Float, nullable=True)  # 0-1
    audio_visual_sync = Column(Float, nullable=True)  # 0-1
    blending_artifacts = Column(Float, nullable=True)  # 0-1
    
    # AI Explanation
    explanation = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Status
    status = Column(String, default="completed")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    __repr__ = lambda self: f"<Detection id={self.id} score={self.risk_score}>"


class AnalysisJob(Base):
    """Model for tracking long-running analysis jobs"""
    __tablename__ = "analysis_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"), unique=True)
    
    # Job info
    job_type = Column(String)  # media_upload, url_analysis, frame_analysis
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0)  # 0-100
    
    # Batch processing
    batch_size = Column(Integer, nullable=True)
    batch_processed = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    __repr__ = lambda self: f"<AnalysisJob id={self.id} type={self.job_type} status={self.status}>"


class UserSession(Base):
    """Model for tracking user sessions and history"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String, unique=True, index=True)
    
    # Aggregated stats
    total_scans = Column(Integer, default=0)
    fake_detected = Column(Integer, default=0)
    real_content = Column(Integer, default=0)
    average_risk_score = Column(Float, default=0)
    
    # Settings
    settings = Column(JSON)  # User preferences
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __repr__ = lambda self: f"<UserSession id={self.id} total_scans={self.total_scans}>"
