"""Backend API Documentation and Setup"""

# DeepGuard Backend API

## Overview

FastAPI backend for the DeepGuard deepfake detection platform. Provides endpoints for:

- 📁 **Media Analysis** - Upload images/videos for forensic deepfake detection
- 🔗 **URL Analysis** - Analyze media from URLs
- 🎥 **Frame Analysis** - Real-time frame-by-frame detection for Live Shield
- 📊 **Dashboard API** - Detection history and statistics

## Setup

### 1. Python Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

Required environment variables:
- `CLAUDE_API_KEY` - For AI-powered explanations (optional)
- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - Secret key for JWT tokens

### 4. Start Server

```bash
# Development
python -m app.main

# Production with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. Access Documentation

- **Interactive Docs**: http://localhost:8000/api/docs
- **API Info**: http://localhost:8000/api/info
- **Health Check**: http://localhost:8000/api/health

## API Endpoints

### Analysis

#### POST /api/analyze
Upload media file for analysis

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -F "file=@image.jpg"
```

Response:
```json
{
  "id": 1,
  "risk_score": 75.5,
  "classification": "LIKELY FAKE",
  "confidence": 92.3,
  "signals": [
    {
      "type": "gan_fingerprint",
      "severity": "high",
      "description": "GAN fingerprints detected...",
      "confidence": 0.85
    }
  ],
  "explanation": "This image shows signs of...",
  "created_at": "2024-04-17T12:00:00"
}
```

#### POST /api/analyze/url
Analyze media from URL

```bash
curl -X POST "http://localhost:8000/api/analyze/url" \
  -H "Content-Type: application/json" \
  -d {"url": "https://example.com/image.jpg"}
```

#### POST /api/analyze/frame
Real-time frame analysis (Live Shield)

```bash
curl -X POST "http://localhost:8000/api/analyze/frame" \
  -H "Content-Type: application/json" \
  -d {"frame": "base64_encoded_image"}
```

#### GET /api/analyze/history
Get detection history

```bash
curl "http://localhost:8000/api/analyze/history?limit=50&offset=0"
```

#### GET /api/analyze/stats
Get dashboard statistics

```bash
curl "http://localhost:8000/api/analyze/stats"
```

Response:
```json
{
  "total_scans": 150,
  "fake_detected": 35,
  "real_content": 92,
  "suspicious_content": 23,
  "average_risk_score": 42.5,
  "detections_today": 15,
  "detections_this_week": 87
}
```

### Health

#### GET /api/health
Health check

```bash
curl "http://localhost:8000/api/health"
```

## Architecture

```
/app
  /api              - API routes
    analyze.py      - Detection endpoints
    health.py       - Health check
  /models           - Database models
  /services         - Business logic
    DetectionService     - Detection pipeline
    ClaudeService        - AI explanations
  /utils            - Utilities
    File handling, validation
  config.py         - Configuration
  database.py       - Database setup
  main.py           - Application entry
```

## Detection Pipeline

1. **File Upload/Retrieval** - Accept media from user or URL
2. **Face Detection** - Locate faces using MediaPipe
3. **GAN Detection** - Analyze frequency domain for AI artifacts
4. **Temporal Analysis** - Check for blending/warping
5. **Risk Scoring** - Aggregate all signals into risk score
6. **AI Explanation** - Generate human-readable explanation via Claude
7. **Storage** - Save results to database

## Detection Signals

- `face_boundary` - Unnatural face boundaries or warping
- `gan_fingerprint` - AI generation artifacts
- `temporal_flicker` - Inconsistent pixel changes between frames
- `blending_boundary` - Unnatural blend seams
- `audio_visual_sync` - Audio/lip-sync mismatch
- `compression_anomaly` - Unusual compression patterns

## Local Development

```bash
# Start backend
cd backend
python -m app.main

# In another terminal, test frontend against backend
# Update API_BASE_URL in src/utils/api.js to http://localhost:8000
```

## Production Deployment

### Using Gunicorn + Uvicorn

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/

# With coverage
pytest --cov=app tests/
```

## Database

### SQLite (Default)
```
DATABASE_URL=sqlite:///./deepguard.db
```

### PostgreSQL (Production)
```
DATABASE_URL=postgresql://user:password@localhost/deepguard
```

## Security

- ✅ File upload validation (size, type)
- ✅ CORS configuration
- ✅ Rate limiting (can be added)
- ✅ Input validation with Pydantic
- ✅ Secure file storage with unique names
- ✅ Automatic cleanup of processed files

## Performance

- Async/await for I/O operations
- Gzip compression for responses
- GPU acceleration option (set USE_GPU=True)
- Batch frame processing for videos
- Caching for model weights

## Troubleshooting

### Models not loading
```bash
# Check model cache directory
ls -la models_cache/

# Clear cache
rm -rf models_cache/*
```

### Database errors
```bash
# Reset database
rm deepguard.db
# Will be recreated on startup
```

### Claude API errors
- Check `CLAUDE_API_KEY` is set correctly
- Fallback explanations are generated if API fails

## Next Steps

1. Add authentication/API keys
2. Implement rate limiting
3. Add video frame caching
4. Optimize detection models
5. Add WebSocket for real-time updates
6. Deploy to production server
