# DeepGuard Complete Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome Extension (Frontend)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Main Menu                             │  │
│  │  ┌─────────────┬──────────────────┬──────────────────┐  │  │
│  │  │ 📁 Media    │ 🖥️ Live Shield   │ 📊 Trust         │  │  │
│  │  │ Analyzer    │                  │ Dashboard        │  │  │
│  │  └─────────────┴──────────────────┴──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              src/utils/api.js                            │  │
│  │  • analyzeMedia(file)                                    │  │
│  │  • analyzeURL(url)                                       │  │
│  │  • analyzeFrame(frameBase64)                             │  │
│  │  • getDetectionHistory()                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
                   http://localhost:8000
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Server                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                  API Endpoints                          │   │
│  │  POST   /api/analyze              (File Upload)        │   │
│  │  POST   /api/analyze/url          (URL Analysis)       │   │
│  │  POST   /api/analyze/frame        (Live Shield)        │   │
│  │  GET    /api/analyze/history      (History)            │   │
│  │  GET    /api/analyze/stats        (Dashboard Stats)    │   │
│  │  GET    /api/health               (Health Check)       │   │
│  └────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Detection Service                          │   │
│  │                                                         │   │
│  │  1. Face Detection (MediaPipe)                          │   │
│  │  2. GAN Fingerprint Detection (FFT Analysis)            │   │
│  │  3. Blending Artifact Detection (Edge Detection)        │   │
│  │  4. Compression Anomaly Detection                       │   │
│  │  5. Risk Score Calculation (Weighted Average)           │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │          Claude AI Service (Optional)                   │   │
│  │  • Generate plain-English explanations                  │   │
│  │  • Fallback explanations if API unavailable             │   │
│  │  • Async processing                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            SQLAlchemy ORM                               │   │
│  │         (Data Persistence Layer)                        │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
           ┌─────────────────────────────────┐
           │     SQLite Database             │
           │   (deepguard.db)                │
           │                                 │
           │  • Detections                   │
           │  • Analysis Jobs                │
           │  • User Sessions                │
           └─────────────────────────────────┘
```

## Data Flow - Media Analysis

```
User Upload File
       ↓
   File Validation (size, type)
       ↓
   Save File to Disk
       ↓
   Create Detection Record (status: "processing")
       ↓
   [Background Task]
   ├─ Load Image/Video
   ├─ Run Detection Pipeline
   │  ├─ Detect Faces
   │  ├─ Analyze GAN Fingerprints
   │  ├─ Check Blending Artifacts
   │  ├─ Find Compression Anomalies
   │  └─ Calculate Risk Score
   ├─ Generate AI Explanation
   └─ Update Detection Record
       ↓
   Return Results to Frontend
       ↓
   Display in Media Analyzer
```

## Real-Time Frame Analysis (Live Shield)

```
User Starts Live Shield
       ↓
Request Screen Capture Permission
       ↓
Browser captures video stream
       ↓
Sample Frame Every 500ms
       ↓
Send Base64 to Backend /api/analyze/frame
       ↓
Fast Analysis (~50-200ms)
       ↓
Return Risk Score & Signals
       ↓
Update Floating HUD Overlay
       ↓
Log Detection Events
       ↓
Display on Dashboard
```

## Dashboard Data Aggregation

```
Query Detection History
       ↓
Calculate Statistics:
├─ Total Scans
├─ Fake Detected Count
├─ Real Content Count
├─ Suspicious Content Count
├─ Average Risk Score
├─ Detections Today
└─ Detections This Week
       ↓
Generate Timeline View
       ↓
Create Risk Distribution Chart
       ↓
Return All Stats to Frontend
       ↓
Display Dashboard
```

## Database Schema

```
Detections Table:
┌─────────────────────────────────────────────┐
│ id (PK)                                     │
│ file_name, file_path, file_size             │
│ media_type (image/video/url)                │
│ risk_score (0-100)                          │
│ classification (REAL/SUSPICIOUS/FAKE)       │
│ confidence (0-100)                          │
│ signals (JSON array)                        │
│ face_count, gan_fingerprints, etc           │
│ explanation (text)                          │
│ status (processing/completed/failed)        │
│ created_at, updated_at                      │
└─────────────────────────────────────────────┘

AnalysisJobs Table:
┌─────────────────────────────────────────────┐
│ id (PK)                                     │
│ detection_id (FK)                           │
│ job_type, status, progress                  │
│ batch_size, batch_processed                 │
│ created_at, started_at, completed_at        │
│ error_message, retry_count                  │
└─────────────────────────────────────────────┘

UserSessions Table:
┌─────────────────────────────────────────────┐
│ id (PK)                                     │
│ session_token                               │
│ total_scans, fake_detected, real_content    │
│ average_risk_score                          │
│ settings (JSON)                             │
│ created_at, last_activity                   │
└─────────────────────────────────────────────┘
```

## File Structure Summary

```
personashieldAI/
├── src/                          (Frontend)
│   ├── App.jsx
│   ├── popup.jsx
│   ├── pages/
│   │   ├── MediaAnalyzer.jsx
│   │   ├── LiveShield.jsx
│   │   └── TrustDashboard.jsx
│   ├── utils/
│   │   ├── api.js                ← API communication
│   │   └── helpers.js
│   └── styles/
│       ├── app.css
│       ├── media-analyzer.css
│       ├── live-shield.css
│       └── trust-dashboard.css
│
├── public/                       (Extension Files)
│   ├── manifest.json
│   ├── popup.html
│   ├── background.js
│   └── content.js
│
├── backend/                      (Backend)
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py      (Health)
│   │   │   └── analyze.py       (Main endpoints)
│   │   ├── models/
│   │   │   └── __init__.py      (Database models)
│   │   ├── services/
│   │   │   ├── __init__.py      (Detection pipeline)
│   │   │   └── claude_service.py (AI explanations)
│   │   ├── utils/
│   │   │   └── __init__.py      (File handling)
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── schemas.py
│   │   └── main.py              ← Entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── run.sh / run.bat
│   └── README.md
│
├── dist/                         (Built Extension)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   ├── content.js
│   └── assets/
│
└── Root Files
    ├── package.json
    ├── vite.config.ts
    ├── README.md
    ├── INTEGRATION_GUIDE.md
    ├── BACKEND_COMPLETE.md
    └── FRONTEND_COMPLETE.md
```

## Key Connections

### Frontend → Backend

**File:** `src/utils/api.js`
- All API calls use `API_BASE_URL = 'http://localhost:8000'`
- Functions wrap backend endpoints
- Automatic error handling

**Functions:**
```javascript
analyzeMedia(file)              → POST /api/analyze
analyzeURL(url)                 → POST /api/analyze/url
analyzeFrame(frameBase64)       → POST /api/analyze/frame
getDetectionHistory(limit)      → GET /api/analyze/history
```

### Backend → Frontend

**Response Format:**
```json
{
  "risk_score": 75.5,
  "classification": "LIKELY FAKE",
  "signals": [...],
  "explanation": "...",
  ...
}
```

## Error Handling

```
Frontend:
  Upload Error → Show validation message
  API Error → Show "Backend unavailable"
  Detection Timeout → Show progress indicator

Backend:
  File validation fails → 400 Bad Request
  Processing error → 500 Internal Error
  Database error → Health check degraded
```

## Performance Optimization

- **Async/await** - Non-blocking I/O operations
- **Background tasks** - Long analysis doesn't block response
- **Gzip compression** - Smaller response sizes
- **GPU acceleration** - Optional CUDA support
- **Frame sampling** - Videos analyzed at configurable frame rate
- **Database indexing** - Fast queries on risk_score, created_at

## Security Measures

- File type validation (jpg, png, mp4, webm, mov only)
- File size limits (100MB default)
- Unique file naming (UUID)
- Automatic file cleanup after processing
- CORS configuration
- Input validation via Pydantic
- Environment-based secrets

## Scalability Path

1. **Current:** Single server, SQLite
2. **Next:** PostgreSQL, Celery job queue
3. **Advanced:** Kubernetes, distributed task workers
4. **Enterprise:** Load balancer, Redis cache, S3 storage

---

**Ready to run!** 🚀
