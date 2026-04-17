import React, { useState, useRef } from 'react';
import '../styles/media-analyzer.css';

export default function MediaAnalyzer({ onBack }) {
  const [analysisMode, setAnalysisMode] = useState('upload'); // upload, url, batch
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file && !url) {
      alert('Please select a file or paste a URL');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis - in real implementation, this would call the backend API
    setTimeout(() => {
      setResult({
        riskScore: Math.floor(Math.random() * 100),
        classification: Math.random() > 0.5 ? 'LIKELY FAKE' : 'LIKELY REAL',
        confidence: Math.floor(Math.random() * 100),
        signals: [
          { type: 'face_boundary', severity: 'high', description: 'Abnormal face boundary detected' },
          { type: 'gan_fingerprint', severity: 'medium', description: 'GAN fingerprints detected' },
          { type: 'temporal_flicker', severity: 'low', description: 'Minor temporal inconsistencies' }
        ],
        timestamp: new Date().toISOString()
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const getRiskColor = (score) => {
    if (score > 70) return '#ef4444'; // red
    if (score > 40) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  return (
    <div className="media-analyzer">
      {/* Header */}
      <div className="analyzer-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📁 Media Analyzer</h1>
      </div>

      {!result ? (
        <div className="analyzer-content">
          {/* Mode Tabs */}
          <div className="mode-tabs">
            <button
              className={`tab ${analysisMode === 'upload' ? 'active' : ''}`}
              onClick={() => setAnalysisMode('upload')}
            >
              Upload File
            </button>
            <button
              className={`tab ${analysisMode === 'url' ? 'active' : ''}`}
              onClick={() => setAnalysisMode('url')}
            >
              URL/Link
            </button>
            <button
              className={`tab ${analysisMode === 'batch' ? 'active' : ''}`}
              onClick={() => setAnalysisMode('batch')}
            >
              Batch Scan
            </button>
          </div>

          {/* Upload Mode */}
          {analysisMode === 'upload' && (
            <div className="input-section">
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">📤</div>
                <p>Drag & drop or click to upload</p>
                <span>Supports: JPG, PNG, MP4, WebM (max 100MB)</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
              {file && (
                <div className="file-preview">
                  <p>📄 {file.name}</p>
                  <button onClick={() => setFile(null)}>Remove</button>
                </div>
              )}
            </div>
          )}

          {/* URL Mode */}
          {analysisMode === 'url' && (
            <div className="input-section">
              <input
                type="text"
                className="url-input"
                placeholder="Paste image or video URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          {/* Batch Mode */}
          {analysisMode === 'batch' && (
            <div className="input-section">
              <p className="batch-info">Upload multiple files for batch analysis</p>
              <div className="upload-zone">
                <div className="upload-icon">📦</div>
                <p>Drop multiple files here</p>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!file && !url)}
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze Media'}
          </button>
        </div>
      ) : (
        <ResultsPanel result={result} onNewAnalysis={() => {
          setResult(null);
          setFile(null);
          setUrl('');
        }} />
      )}
    </div>
  );
}

function ResultsPanel({ result, onNewAnalysis }) {
  const riskColor = result.riskScore > 70 ? '#ef4444' : result.riskScore > 40 ? '#f59e0b' : '#10b981';
  const riskLabel = result.riskScore > 70 ? '🔴 FAKE' : result.riskScore > 40 ? '🟡 SUSPICIOUS' : '🟢 REAL';

  return (
    <div className="results-panel">
      {/* Risk Score Circle */}
      <div className="risk-circle" style={{ borderColor: riskColor }}>
        <div className="risk-score">{result.riskScore}%</div>
        <div className="risk-label">{riskLabel}</div>
      </div>

      {/* Classification */}
      <div className="classification">
        <p>Classification: <strong>{result.classification}</strong></p>
        <p>Confidence: {result.confidence}%</p>
      </div>

      {/* Detection Signals */}
      <div className="signals">
        <h3>🔍 Detection Signals</h3>
        {result.signals.map((signal, idx) => (
          <div key={idx} className={`signal signal-${signal.severity}`}>
            <span className="signal-type">{signal.type}</span>
            <span className="signal-desc">{signal.description}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="btn-primary" onClick={onNewAnalysis}>Analyze Another</button>
        <button className="btn-secondary">📊 View Report</button>
        <button className="btn-secondary">💾 Save Result</button>
      </div>
    </div>
  );
}
