// Utility functions for API communication

const API_BASE_URL = 'http://localhost:8000'; // Will change to production URL

export async function analyzeMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

export async function analyzeURL(url) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('URL analysis error:', error);
    throw error;
  }
}

export async function analyzeFrame(frameData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frame: frameData })
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Frame analysis error:', error);
    throw error;
  }
}

export async function getDetectionHistory(limit = 50) {
  return new Promise((resolve) => {
    chrome.storage.local.get('detectionHistory', (data) => {
      resolve((data.detectionHistory || []).slice(0, limit));
    });
  });
}

export async function saveDetection(detection) {
  return new Promise((resolve) => {
    chrome.storage.local.get('detectionHistory', (data) => {
      const history = data.detectionHistory || [];
      history.unshift({
        ...detection,
        id: Date.now(),
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 200 detections
      if (history.length > 200) {
        history.pop();
      }
      
      chrome.storage.local.set({ detectionHistory: history }, resolve);
    });
  });
}

export async function clearHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ detectionHistory: [] }, resolve);
  });
}

export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (data) => {
      resolve(data.settings || {});
    });
  });
}

export async function updateSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, resolve);
  });
}
