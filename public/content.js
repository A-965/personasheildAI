// Content Script
// Runs in the context of web pages to capture screen and communicate with the extension

console.log('Persona Shield AI content script loaded');

// Listen for messages from the popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startScreenCapture') {
    startScreenCapture()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'stopScreenCapture') {
    try {
      stopScreenCapture();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  return false;
});

// Global capture state
let captureStream = null;
let canvasElement = null;
let animationFrameId = null;
let hudContainer = null;
let hudScoreElement = null;
let hudStatusElement = null;
let hudDetailElement = null;

function updateHUD(score, statusText, detailText = '') {
  if (!hudScoreElement || !hudStatusElement) return;
  hudScoreElement.textContent = `${Math.round(score)}%`;
  hudStatusElement.textContent = statusText;
  if (hudDetailElement) {
    hudDetailElement.textContent = detailText;
  }
}

async function startScreenCapture() {
  try {
    // Request screen capture permission from user
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always'
      },
      audio: true
    });

    // Create canvas for frame sampling
    canvasElement = document.createElement('canvas');
    const videoElement = document.createElement('video');
    videoElement.srcObject = captureStream;
    videoElement.muted = true;
    await videoElement.play();

    // Sample frames every 500ms
    const frameSampleInterval = setInterval(() => {
      if (!canvasElement || !videoElement) return;
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) return;

      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      const ctx = canvasElement.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      const frameData = canvasElement.toDataURL('image/jpeg', 0.7);

      // Send frame to background script for analysis and update HUD
      chrome.runtime.sendMessage({
        action: 'analyzeFrame',
        frameData: frameData
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime message error:', chrome.runtime.lastError.message);
          updateHUD(0, 'ERROR', 'Unable to analyze frame');
          return;
        }

        if (!response || !response.success) {
          console.error('Frame analysis failed:', response?.error);
          updateHUD(0, 'ERROR', 'Analysis failed');
          return;
        }

        const result = response.result;
        const score = Number(result.riskScore ?? 0);
        const label = result.classification || 'UNKNOWN';
        const detail = result.signals?.length > 0
          ? result.signals.map(s => s.type).join(', ')
          : result.explanation || 'No signals detected';

        updateHUD(score, label, detail);
      });
    }, 500);

    // Store interval ID for cleanup
    captureStream._sampleInterval = frameSampleInterval;

  } catch (error) {
    console.error('Failed to start screen capture:', error);
    
    // Handle permission denied
    if (error.name === 'NotAllowedError') {
      console.log('User denied screen capture permission');
      updateHUD(0, 'PERMISSION', 'Screen sharing denied');
    } else {
      updateHUD(0, 'ERROR', 'Unable to start capture');
    }
  }
}

function stopScreenCapture() {
  if (captureStream) {
    const tracks = captureStream.getTracks();
    tracks.forEach(track => track.stop());
    
    if (captureStream._sampleInterval) {
      clearInterval(captureStream._sampleInterval);
    }
    
    captureStream = null;
  }
  
  if (canvasElement) {
    canvasElement.remove();
    canvasElement = null;
  }
}

// Inject floating HUD overlay
function injectHUD() {
  const hudContainer = document.createElement('div');
  hudContainer.id = 'persona-shield-hud';
  hudContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 160px;
    padding: 12px;
    background: rgba(31, 41, 55, 0.95);
    border: 2px solid #10b981;
    border-radius: 10px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  
  hudContainer.innerHTML = `
    <div style="font-weight: 600; text-align: center; margin-bottom: 8px;">🛡️ Persona Shield AI</div>
    <div style="text-align: center;">
      <div id="persona-shield-score" style="font-size: 20px; font-weight: 700; color: white;">---%</div>
      <div id="persona-shield-status" style="font-size: 10px; color: #9ca3af;">Initializing...</div>
      <div id="persona-shield-detail" style="font-size: 10px; color: #d1d5db; margin-top: 4px;">Waiting for video feed...</div>
    </div>
  `;
  
  document.body.appendChild(hudContainer);
  hudContainer.style.pointerEvents = 'none';

  hudScoreElement = document.getElementById('persona-shield-score');
  hudStatusElement = document.getElementById('persona-shield-status');
  hudDetailElement = document.getElementById('persona-shield-detail');
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectHUD);
} else {
  injectHUD();
}
