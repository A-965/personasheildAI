"""Application Configuration"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Config
    APP_NAME: str = "DeepGuard - Deepfake Detection API"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "sqlite:///./deepguard.db"
    
    # API
    API_PREFIX: str = "/api"
    ALLOWED_ORIGINS: list = ["*"]
    
    # Claude API
    CLAUDE_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-sonnet-20240229"
    
    # Security
    SECRET_KEY: str = "dev-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Upload
    MAX_FILE_SIZE: int = 104857600  # 100MB
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_EXTENSIONS: set = {"jpg", "jpeg", "png", "gif", "mp4", "webm", "mov"}
    
    # Detection Models
    USE_GPU: bool = False
    MODEL_CACHE_DIR: str = "./models_cache"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
