import React, { useEffect, useRef, useState } from 'react';
import '../styles/live-shield.css';
import { analyzeFrame } from '../utils/api';

export default function LiveShield({ onBack }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [captureSource, setCaptureSource] = useState('Screen');
  const [riskScore, setRiskScore] = useState(null);
  const [detections, setDetections] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('Idle');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => stopCapture();
  }, []);

  const getRiskStatus = (score) => {
    if (score === null) return { label: 'Idle', color: '#94a3b8', icon: '⚪' };
    if (score > 70) return { label: 'LIKELY FAKE', color: '#ef4444', icon: '🔴' };
    if (score > 40) return { label: 'SUSPICIOUS', color: '#f59e0b', icon: '🟡' };
    return { label: 'LIKELY REAL', color: '#10b981', icon: '🟢' };
  };

  const status = getRiskStatus(riskScore);

  const enqueueDetection = (data) => {
    setDetections((prev) => [data, ...prev].slice(0, 6));
  };

  const createDetectionEntry = (result) => {
    const score = Number(result?.risk_score ?? result?.score ?? 0);
    const label = result?.classification || 'Unknown';
    const severity = score > 70 ? 'high' : score > 40 ? 'medium' : 'low';

    return {
      id: Date.now(),
      type: label,
      severity,
      timestamp: new Date(),
      detail:
        result?.explanation || result?.signals?.map((s) => s.type).join(', ') || 'No additional details',
    };
  };

  const sendPageMessage = async (action) => {
    return new Promise((resolve, reject) => {
      if (!window.chrome?.runtime?.sendMessage || !window.chrome?.tabs) {
        reject(new Error('Extension runtime unavailable'));
        return;
      }

      chrome.runtime.sendMessage({ action }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  };

  const startCapture = async (mode) => {
    setErrorMessage('');
    setSelectedMode(mode);
    setCaptureSource(mode === 'webcam' ? 'Webcam' : 'Screen');

    if (mode === 'screen' && window.chrome?.runtime && window.chrome?.tabs) {
      try {
        setLastUpdated('Requesting page capture...');
        const response = await sendPageMessage('startScreenCapture');
        if (!response?.success) {
          throw new Error(response?.error || 'Failed to start page capture');
        }
        setIsCapturing(true);
        setLastUpdated('Live Shield active');
        return;
      } catch (error) {
        console.warn('Page capture failed, falling back to popup capture:', error);
      }
    }

    try {
      const stream =
        mode === 'webcam'
          ? await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          : await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });

      streamRef.current = stream;
      setIsCapturing(true);
      setLastUpdated('Connecting...');

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const frameData = canvas.toDataURL('image/jpeg', 0.65);
          const pureBase64 = frameData.split(',')[1] || frameData;
          const result = await analyzeFrame(pureBase64);
          const score = Math.round(result?.risk_score ?? 0);
          setRiskScore(score);
          setLastUpdated(new Date().toLocaleTimeString());
          enqueueDetection(createDetectionEntry(result));
        } catch (error) {
          console.error('Live Shield analysis failed:', error);
          setErrorMessage('Real-time analysis is unavailable. Please check backend connectivity.');
        }
      }, 1200);
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setErrorMessage(
          mode === 'webcam'
            ? 'Webcam permission denied. Please allow access to start Live Shield.'
            : 'Screen sharing permission denied. Please allow capture to start Live Shield.'
        );
      } else {
        setErrorMessage(
          mode === 'webcam'
            ? 'Unable to access your webcam. Please check camera permissions.'
            : 'Unable to start live capture. Your browser may not support screen sharing.'
        );
      }
      setIsCapturing(false);
      streamRef.current = null;
    }
  };

  const stopCapture = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (window.chrome?.runtime && window.chrome?.tabs) {
      try {
        await sendPageMessage('stopScreenCapture');
      } catch (error) {
        console.warn('Failed to stop page capture:', error);
      }
    }

    setIsCapturing(false);
    setSelectedMode(null);
    setRiskScore(null);
    setDetections([]);
    setLastUpdated('Idle');
  };

  return (
    <div className="live-shield">
      <div className="shield-topbar">
        <div className="branding">
          <div className="logo">PS</div>
          <div>
            <p className="brand-subtitle">PERSONA SHIELD</p>
            <h2>Live Shield</h2>
          </div>
        </div>
        <div className="nav-tabs">
          <button type="button" className="tab active">
            Live Shield
          </button>
          <button type="button" className="tab" disabled>
            Analyzer
          </button>
          <button type="button" className="tab" disabled>
            Dashboard
          </button>
        </div>
      </div>

      <div className="shield-header">
        <div>
          <p className="eyebrow">REAL-TIME DETECTION</p>
          <h1>LIVE SHIELD</h1>
        </div>
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
      </div>

      <div className="capture-grid">
        <div
          className={`capture-card ${selectedMode === 'screen' ? 'selected' : ''}`}
          onClick={() => !isCapturing && startCapture('screen')}
        >
          <div className="card-icon">🖥️</div>
          <div className="card-title">Share Screen</div>
          <div className="card-subtitle">Recommended</div>
          <p>
            Share your entire screen, a window, or a browser tab. Persona Shield will analyze what you're watching in real-time for deepfakes.
          </p>
        </div>

        <div
          className={`capture-card ${selectedMode === 'webcam' ? 'selected' : ''}`}
          onClick={() => !isCapturing && startCapture('webcam')}
        >
          <div className="card-icon">📷</div>
          <div className="card-title">Webcam</div>
          <div className="card-subtitle">Self Analysis</div>
          <p>
            Use your webcam to analyze your own video feed. Detect if deepfake technology is being used in video calls.
          </p>
        </div>
      </div>

      {!isCapturing ? (
        <div className="standby-panel">
          <div className="standby-art" />
          <div className="standby-text">
            <h2>Select a capture mode above</h2>
            <p>Auto-scans every ~12 seconds once started.</p>
          </div>
        </div>
      ) : (
        <div className="monitoring-panel">
          <div className="hud-preview">
            <video ref={videoRef} className="screen-preview" muted playsInline />

            <div className="floating-hud" style={{ borderColor: status.color }}>
              <div className="hud-title">🛡️ Persona Shield AI</div>
              <div className="hud-status-row">
                <div className="risk-number">{riskScore !== null ? `${riskScore}%` : '—'}</div>
                <div className="risk-status" style={{ color: status.color }}>
                  {status.icon} {status.label}
                </div>
              </div>
              <div className="hud-meta">
                <span>Source: {captureSource}</span>
                <span>Updated: {lastUpdated}</span>
              </div>
            </div>
          </div>

          <div className="stats-panel">
            <div className="stat">
              <div className="stat-label">Frames analyzed</div>
              <div className="stat-value">{detections.length * 1}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Active signals</div>
              <div className="stat-value">{detections.length}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Last update</div>
              <div className="stat-value">{lastUpdated}</div>
            </div>
          </div>

          <div className="detection-log">
            <h3>Recent Alerts</h3>
            <div className="log-entries">
              {detections.length === 0 ? (
                <p className="no-detections">No suspicious activity detected yet.</p>
              ) : (
                detections.map((d) => (
                  <div key={d.id} className={`log-entry severity-${d.severity}`}>
                    <div>
                      <strong>{d.type}</strong>
                      <div className="entry-detail">{d.detail}</div>
                    </div>
                    <span className="time">{d.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button className="btn-stop" onClick={stopCapture}>
            ⏹️ Stop Monitoring
          </button>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      )}
    </div>
  );
}
