"""Integration Setup Guide

This file explains how to integrate the frontend and backend.
"""

# ==================== QUICK START ====================

# 1. INSTALL BACKEND DEPENDENCIES
cd backend
pip install -r requirements.txt

# 2. START BACKEND SERVER
# On macOS/Linux:
./run.sh

# On Windows:
run.bat

# Backend will be running at: http://localhost:8000

# 3. UPDATE FRONTEND API BASE URL
# In /src/utils/api.js, the API_BASE_URL is already set to:
# const API_BASE_URL = 'http://localhost:8000';

# 4. BUILD & LOAD EXTENSION
cd ..
npm run build

# Then load dist/ folder in chrome://extensions/

# ==================== TESTING ====================

# Test backend is running:
curl http://localhost:8000/api/health

# Test upload endpoint:
curl -X POST "http://localhost:8000/api/analyze" \
  -F "file=@test_image.jpg"

# Get dashboard stats:
curl http://localhost:8000/api/analyze/stats

# ==================== ENDPOINTS ====================

POST   /api/analyze              - Upload and analyze file
POST   /api/analyze/url          - Analyze from URL
POST   /api/analyze/frame        - Real-time frame analysis
GET    /api/analyze/history      - Get detection history
GET    /api/analyze/stats        - Get dashboard statistics
GET    /api/health               - Health check
GET    /api/info                 - API information
GET    /                         - Root/welcome

# ==================== CONFIGURATION ====================

Backend Configuration in backend/.env:
- CLAUDE_API_KEY      - Set your Claude API key for AI explanations
- DATABASE_URL        - SQLite by default (sqlite:///./deepguard.db)
- MAX_FILE_SIZE       - 100MB by default
- USE_GPU             - Set to True if you have CUDA
- DEBUG               - Set to False in production

Frontend Configuration in src/utils/api.js:
- API_BASE_URL        - Backend URL (default: http://localhost:8000)

# ==================== DATABASE ====================

Database file location: /backend/deepguard.db

To reset database:
rm /backend/deepguard.db
# It will be recreated on next backend startup

# ==================== TROUBLESHOOTING ====================

Q: "Connection refused" error?
A: Make sure backend is running on port 8000
   Try: curl http://localhost:8000/api/health

Q: "File too large" error?
A: Increase MAX_FILE_SIZE in backend/.env
   Default is 100MB (104857600 bytes)

Q: Extension not detecting anything?
A: 1. Check backend /api/docs is accessible
   2. Check browser console for API errors
   3. Ensure frontend API_BASE_URL is correct
   4. Test frame analysis with sample image

Q: Claude explanations not working?
A: Add your Claude API key to backend/.env
   CLAUDE_API_KEY=sk-ant-...
   Without it, default explanations are used

# ==================== DEVELOPMENT ====================

Frontend Development:
npm run dev          - Start Vite dev server
npm run build        - Build for production

Backend Development:
./run.sh             - Start with hot reload
python -m app.main   - Run directly without reload

# ==================== PRODUCTION DEPLOYMENT ====================

Backend:
1. Build Docker image or deploy to server
2. Set DEBUG=False in .env
3. Use production database (PostgreSQL recommended)
4. Set up reverse proxy (Nginx)
5. Use Gunicorn/Uvicorn: gunicorn app.main:app -w 4

Frontend:
1. npm run build
2. Build Docker image or upload dist to CDN
3. Update ALLOWED_ORIGINS in backend .env
4. Deploy to production server

# ==================== NEXT STEPS ====================

1. ✅ Backend is ready to run
2. ✅ Frontend is ready to build
3. 📝 Add authentication/API keys
4. 🔐 Set up SSL/HTTPS
5. 🌍 Deploy to cloud (AWS, GCP, Heroku, etc.)
6. 📊 Add monitoring and logging
7. 🎯 Optimize detection models
8. 🚀 Scale infrastructure as needed
"""
