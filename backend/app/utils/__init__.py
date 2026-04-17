"""Utility functions for file handling"""
import os
import aiofiles
import mimetypes
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'}
MAX_FILE_SIZE = 104857600  # 100MB


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_extension(filename: str) -> str:
    """Get file extension"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


def get_media_type(filename: str) -> str:
    """Determine if file is image or video"""
    ext = get_file_extension(filename).lower()
    image_exts = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
    video_exts = {'mp4', 'webm', 'mov'}
    
    if ext in image_exts:
        return 'image'
    elif ext in video_exts:
        return 'video'
    else:
        return 'unknown'


async def save_upload_file(upload_file, upload_dir: str = "./uploads") -> str:
    """Save uploaded file and return path"""
    try:
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        ext = get_file_extension(upload_file.filename)
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(upload_dir, filename)
        
        # Save file
        async with aiofiles.open(filepath, 'wb') as f:
            content = await upload_file.read()
            await f.write(content)
        
        logger.info(f"Saved file: {filepath}")
        return filepath
        
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise


async def cleanup_file(filepath: str) -> bool:
    """Delete file after processing"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.info(f"Cleaned up file: {filepath}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error cleaning up file: {e}")
        return False


def get_file_size_mb(filepath: str) -> float:
    """Get file size in MB"""
    if os.path.exists(filepath):
        return os.path.getsize(filepath) / (1024 * 1024)
    return 0


async def validate_file(upload_file, max_size: int = MAX_FILE_SIZE) -> tuple[bool, Optional[str]]:
    """Validate uploaded file"""
    # Check extension
    if not is_allowed_file(upload_file.filename):
        return False, f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check size
    if upload_file.size and upload_file.size > max_size:
        max_mb = max_size / (1024 * 1024)
        return False, f"File too large. Maximum: {max_mb}MB"
    
    return True, None
