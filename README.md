# Persona Shield AI - Deepfake Detection Extension

A powerful Chrome extension for detecting deepfakes in real-time across any platform.

## Features

### 📁 Media Analyzer
- Upload images/videos for forensic analysis
- Paste URLs for remote media analysis
- Batch scanning capabilities
- Detailed forensic reports

### 🖥️ Live Shield
- Real-time deepfake detection
- Monitor any video playing on screen
- Works on YouTube, Netflix, news sites, and more
- Floating HUD overlay with live risk scores
- Frame-by-frame detection logging

### 📊 Trust Dashboard
- Complete detection history
- Risk timeline visualization
- Statistical insights
- Export reports
- Detailed analysis logs

## Project Structure

```
/src
  /components    - React components
  /pages         - Main feature pages
    MediaAnalyzer.jsx
    LiveShield.jsx
    TrustDashboard.jsx
  /styles        - CSS stylesheets
  /utils         - Utility functions
    api.js       - API communication
    helpers.js   - Helper functions
  App.jsx        - Main app component
  popup.jsx      - Entry point

/public
  manifest.json  - Chrome extension manifest
  popup.html     - Popup interface
  background.js  - Service worker
  content.js     - Content script for pages
```

## Development

### Setup
```bash
npm install
npm run build
```

### Loading into Chrome
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `/dist` directory

## Architecture

**Detection Pipeline:**
- Screen/Tab Capture (WebRTC API)
- Frame Sampling (500ms intervals via Canvas API)
- Face Detection (MediaPipe)
- GAN Fingerprint Detection
- Temporal Analysis
- Audio-Visual Sync Check
- Risk Aggregation & Reporting

**Backend Integration:**
- FastAPI server (running on localhost:8000)
- Claude API for explanations
- Frame analysis and storage

## Tech Stack

- **Frontend:** React 18, TailwindCSS
- **Extension:** Chrome Manifest V3
- **APIs:** getDisplayMedia, Canvas API, Web Audio API, Chrome Storage API
- **Build:** Vite (with React plugin)
- **Backend:** FastAPI (separate project)
- **AI:** Claude API, MediaPipe, HuggingFace Models

## Configuration

Update API endpoint in `src/utils/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000'; // Your backend URL
```

## Limitations & Roadmap

- [ ] Implement actual ML models integration
- [ ] Build FastAPI backend
- [ ] Add video processing and storage
- [ ] Implement audio-visual sync detection
- [ ] Add more sophisticated GAN detection
- [ ] Support background analysis
- [ ] Add machine learning model caching

## Security Notes

- Frame data is sent to backend for analysis
- Detection history stored locally in Chrome storage
- No data sent to third parties (except Claude API for explanations)
- Recommended to run backend on local machine

## License

Proprietary - DeepGuard AI
