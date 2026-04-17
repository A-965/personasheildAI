import React, { useState } from 'react';
import '../styles/trust-dashboard.css';

export default function TrustDashboard({ onBack }) {
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all
  const [selectedReport, setSelectedReport] = useState(null);

  const mockReports = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      source: 'YouTube - Viral Video',
      riskScore: 89,
      classification: 'LIKELY FAKE',
      type: 'Live Shield',
      signals: ['face_boundary', 'gan_fingerprint']
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      source: 'News Clip - Interview',
      riskScore: 15,
      classification: 'REAL',
      type: 'Media Analyzer',
      signals: []
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      source: 'Instagram Post',
      riskScore: 62,
      classification: 'SUSPICIOUS',
      type: 'Media Analyzer',
      signals: ['temporal_flicker', 'lip_sync_mismatch']
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      source: 'TikTok - Entertainment',
      riskScore: 78,
      classification: 'LIKELY FAKE',
      type: 'Live Shield',
      signals: ['face_boundary', 'gan_fingerprint', 'blending_boundary']
    },
  ];

  const stats = {
    totalScans: mockReports.length,
    fakeDetected: mockReports.filter(r => r.riskScore > 70).length,
    averageRisk: Math.round(mockReports.reduce((sum, r) => sum + r.riskScore, 0) / mockReports.length),
    realContent: mockReports.filter(r => r.riskScore < 30).length
  };

  const getRiskBadge = (score) => {
    if (score > 70) return { icon: '🔴', label: 'FAKE', color: '#ef4444' };
    if (score > 40) return { icon: '🟡', label: 'SUSPICIOUS', color: '#f59e0b' };
    return { icon: '🟢', label: 'REAL', color: '#10b981' };
  };

  return (
    <div className="trust-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>📊 Trust Dashboard</h1>
      </div>

      {!selectedReport ? (
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <p className="stat-label">Total Scans</p>
                <p className="stat-value">{stats.totalScans}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔴</div>
              <div className="stat-info">
                <p className="stat-label">Fakes Detected</p>
                <p className="stat-value">{stats.fakeDetected}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🟢</div>
              <div className="stat-info">
                <p className="stat-label">Real Content</p>
                <p className="stat-value">{stats.realContent}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <p className="stat-label">Avg Risk Score</p>
                <p className="stat-value">{stats.averageRisk}%</p>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="filter-section">
            <div className="time-filters">
              {['7d', '30d', 'all'].map(range => (
                <button
                  key={range}
                  className={`time-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
                </button>
              ))}
            </div>

            <button className="export-btn">💾 Export Report</button>
          </div>

          {/* Detection Timeline */}
          <div className="timeline-section">
            <h2>📅 Detection Timeline</h2>
            <div className="timeline">
              {mockReports.map((report, idx) => {
                const badge = getRiskBadge(report.riskScore);
                return (
                  <div
                    key={report.id}
                    className="timeline-item"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="timeline-marker" style={{ backgroundColor: badge.color }}>
                      {badge.icon}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h4>{report.source}</h4>
                        <span className="risk-badge" style={{ backgroundColor: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="timeline-type">{report.type} • {report.riskScore}% risk</p>
                      <p className="timeline-time">
                        {formatTime(report.timestamp)}
                      </p>
                    </div>
                    <div className="timeline-arrow">→</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Chart */}
          <div className="chart-section">
            <h2>📈 Risk Distribution</h2>
            <div className="risk-distribution">
              <div className="distribution-bar">
                <div className="bar-section" style={{
                  width: `${(stats.realContent / stats.totalScans * 100)}%`,
                  backgroundColor: '#10b981'
                }}>
                  <span>Real ({stats.realContent})</span>
                </div>
                <div className="bar-section" style={{
                  width: `${((stats.totalScans - stats.realContent - stats.fakeDetected) / stats.totalScans * 100)}%`,
                  backgroundColor: '#f59e0b'
                }}>
                  <span>Suspicious</span>
                </div>
                <div className="bar-section" style={{
                  width: `${(stats.fakeDetected / stats.totalScans * 100)}%`,
                  backgroundColor: '#ef4444'
                }}>
                  <span>Fake ({stats.fakeDetected})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ReportDetail report={selectedReport} onBack={() => setSelectedReport(null)} />
      )}
    </div>
  );
}

function ReportDetail({ report, onBack }) {
  const badge = report.riskScore > 70 ? '🔴' : report.riskScore > 40 ? '🟡' : '🟢';
  const label = report.riskScore > 70 ? 'FAKE' : report.riskScore > 40 ? 'SUSPICIOUS' : 'REAL';

  return (
    <div className="report-detail">
      <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>

      <div className="report-header">
        <h2>{report.source}</h2>
        <p className="report-type">{report.type}</p>
      </div>

      <div className="report-main">
        {/* Risk Score */}
        <div className="report-risk">
          <div className="risk-circle">
            <span className="risk-score">{report.riskScore}%</span>
            <span className="risk-label">{badge} {label}</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="report-metadata">
          <div className="metadata-item">
            <span className="label">Detected:</span>
            <span className="value">{report.timestamp.toLocaleString()}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Detection Type:</span>
            <span className="value">{report.type}</span>
          </div>
        </div>

        {/* Detection Signals */}
        {report.signals.length > 0 && (
          <div className="report-signals">
            <h3>🔍 Detected Anomalies</h3>
            <div className="signals-list">
              {report.signals.map((signal, idx) => (
                <div key={idx} className="signal-item">
                  <span className="signal-icon">⚠️</span>
                  <span className="signal-name">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="report-actions">
        <button className="btn-primary">📥 Download Report</button>
        <button className="btn-secondary">🔗 Share</button>
        <button className="btn-secondary">🗑️ Delete</button>
      </div>
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
