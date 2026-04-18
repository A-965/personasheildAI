// Background Service Worker for Chrome Extension
// Handles background tasks, messaging, and API calls

const BACKEND_API_URL = 'http://localhost:8000';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Persona Shield AI extension installed');
  
  // Initialize storage
  chrome.storage.local.set({
    detectionHistory: [],
    settings: {
      autoAnalyze: true,
      notificationsEnabled: true,
      sensitivity: 'medium'
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeFrame') {
    // Forward frame data to backend API
    handleFrameAnalysis(request.frameData, sender.tab?.id, request.sourceUrl)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Will respond asynchronously
  }

  if (request.action === 'startScreenCapture' || request.action === 'stopScreenCapture') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: request.action }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('No content script receiver, injecting content script:', chrome.runtime.lastError.message);
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Injection failed:', chrome.runtime.lastError.message);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            chrome.tabs.sendMessage(tab.id, { action: request.action }, (retryResponse) => {
              if (chrome.runtime.lastError) {
                console.error('Retry message failed:', chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
              }
              sendResponse({ success: true, result: retryResponse });
            });
          });
          return;
        }
        sendResponse({ success: true, result: response });
      });
    });

    return true;
  }
  
  if (request.action === 'getHistory') {
    chrome.storage.local.get('detectionHistory', (data) => {
      sendResponse(data.detectionHistory || []);
    });
    return true;
  }
});

async function handleFrameAnalysis(frameData, tabId, sourceUrl) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/analyze/frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ frame: frameData, timestamp: Date.now(), source_url: sourceUrl })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Backend error ${response.status}: ${body}`);
    }

    const data = await response.json();
    return {
      riskScore: Number(data.risk_score ?? 0),
      classification: data.classification || 'UNKNOWN',
      signals: data.signals || [],
      explanation: data.explanation || ''
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Handle tab updates for Live Shield
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Tab has loaded - can now inject content script
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => console.log('Could not inject script:', err));
  }
});
