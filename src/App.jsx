import React, { useState } from 'react';
import MediaAnalyzer from './pages/MediaAnalyzer';
import LiveShield from './pages/LiveShield';
import TrustDashboard from './pages/TrustDashboard';
import './styles/app.css';

export default function App() {
  const [activeMode, setActiveMode] = useState('menu');

  const modes = {
    menu: 'menu',
    media: 'media',
    live: 'live',
    dashboard: 'dashboard'
  };

  return (
    <div className="app-container">
      {activeMode === modes.menu && (
        <MainMenu onSelectMode={setActiveMode} />
      )}
      {activeMode === modes.media && (
        <MediaAnalyzer onBack={() => setActiveMode(modes.menu)} />
      )}
      {activeMode === modes.live && (
        <LiveShield onBack={() => setActiveMode(modes.menu)} />
      )}
      {activeMode === modes.dashboard && (
        <TrustDashboard onBack={() => setActiveMode(modes.menu)} />
      )}
    </div>
  );
}

function MainMenu({ onSelectMode }) {
  return (
    <div className="main-menu">
      {/* Header */}
      <div className="menu-header">
        <div className="logo">🛡️</div>
        <h1>Persona Shield AI</h1>
        <p>AI-Powered Deepfake Detection</p>
      </div>

      {/* Mode Selection Cards */}
      <div className="modes-grid">
        {/* Media Analyzer */}
        <div className="mode-card" onClick={() => onSelectMode('media')}>
          <div className="card-icon">📁</div>
          <h2>Media Analyzer</h2>
          <p>Upload image or video for forensic analysis</p>
          <ul className="features">
            <li>✓ Upload files</li>
            <li>✓ Paste URLs</li>
            <li>✓ Batch scan</li>
          </ul>
        </div>

        {/* Live Shield */}
        <div className="mode-card" onClick={() => onSelectMode('live')}>
          <div className="card-icon">🖥️</div>
          <h2>Live Shield</h2>
          <p>Detect deepfakes in any video playing on screen</p>
          <ul className="features">
            <li>✓ Real-time detection</li>
            <li>✓ Any platform (YouTube, Netflix...)</li>
            <li>✓ Live overlay HUD</li>
          </ul>
        </div>

        {/* Trust Dashboard */}
        <div className="mode-card" onClick={() => onSelectMode('dashboard')}>
          <div className="card-icon">📊</div>
          <h2>Trust Dashboard</h2>
          <p>History, reports & risk timeline</p>
          <ul className="features">
            <li>✓ Detection history</li>
            <li>✓ Risk timeline</li>
            <li>✓ Export reports</li>
          </ul>
        </div>
      </div>

      {/* Version Footer */}
      <div className="menu-footer">
        <p>Persona Shield AI v1.0 | Powered by AI Detection Engine</p>
      </div>
    </div>
  );
}
