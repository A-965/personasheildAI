import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, ShieldAlert, ScanSearch, Shield, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyzeApi } from '../utils/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MediaAnalyzer() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startScan(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      startScan(e.target.files[0]);
    }
  };

  const startScan = async (selectedFile) => {
    setFile(selectedFile);
    setScanning(true);
    setResult(null);

    try {
      // 1. Upload to backend
      const initialResponse = await analyzeApi.uploadMedia(selectedFile);
      const detectionId = initialResponse.id;

      // 2. Poll for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResult = await analyzeApi.getDetectionResult(detectionId);
          if (statusResult.classification !== "PENDING" && statusResult.explanation !== "Analyzing...") {
            clearInterval(pollInterval);
            setScanning(false);
            setResult({
              score: statusResult.risk_score,
              status: statusResult.classification, 
              signals: statusResult.signals.map(s => ({
                label: s.type,
                value: s.description
              })),
              explanation: statusResult.explanation
            });
          }
        } catch (err) {
          console.error("Polling error:", err);
          clearInterval(pollInterval);
          setScanning(false);
        }
      }, 2000);

    } catch (err) {
      console.error("Upload error:", err);
      setScanning(false);
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('report-container');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0A0E17',
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add Header
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.rect(0, 0, pdfWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PersonaShield AI - Official Forensic Analysis', 10, 13);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pdfWidth - 50, 13);

      // Add Canvas Image
      pdf.addImage(imgData, 'PNG', 0, 25, pdfWidth, pdfHeight);
      
      // Save
      pdf.save(`PersonaShield_Report_${file?.name || 'media'}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Media Analyzer</h2>
          <p className="text-slate-400">Upload images or videos for comprehensive forensic analysis.</p>
        </div>
        {/* Redundant URL button removed - now integrated below */}
      </header>

      {!scanning && !result && (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full h-64 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 overflow-hidden ${
              dragActive ? 'border-primary-400 bg-primary-500/10' : 'border-white/10 glass-panel hover:border-primary-500/50 hover:bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
              onChange={handleChange}
              accept="video/*,image/*"
            />
            <div className="w-16 h-16 rounded-full bg-dark-900/50 flex items-center justify-center mb-4 shadow-2xl ring-1 ring-white/5 relative z-20">
              <UploadCloud className={`w-8 h-8 ${dragActive ? 'text-primary-400' : 'text-slate-400'}`} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 relative z-20">Drag & drop or Click to upload</h3>
            <p className="text-slate-500 text-xs font-medium relative z-20">Supports MP4, MOV, JPG, PNG (Max 50MB)</p>
          </motion.div>

        </div>
      )}

      {scanning && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full rounded-[2rem] glass-card p-12 flex flex-col items-center justify-center overflow-hidden relative"
        >
          {/* Advanced scanning effect */}
          <div className="absolute inset-0 bg-primary-500/5 animate-scan pointer-events-none border-b-2 border-primary-400/50 shadow-[0_10px_40px_rgba(96,165,250,0.2)]" />
          
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary-500 blur-2xl opacity-20 animate-pulse" />
            <ScanSearch className="w-20 h-20 text-primary-400 relative z-10 animate-float" />
            <div className="absolute inset-[-1rem] rounded-full border border-primary-500/30 animate-spin-slow" />
            <div className="absolute inset-[-2rem] rounded-full border border-dashed border-accent-violet/30 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '12s' }} />
          </div>
          <h3 className="text-3xl font-bold text-white mb-3 text-glow">Analyzing Media</h3>
          <p className="text-slate-400 text-center max-w-md text-sm leading-relaxed">Running deep neural network inference, GAN fingerprinting, and spatial-temporal correlation analysis...</p>
          
          <div className="w-72 h-1.5 bg-dark-950 rounded-full mt-10 overflow-hidden ring-1 ring-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary-400 via-accent-cyan to-accent-violet relative"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "easeInOut" }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/50 blur-sm" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {result && (
        <motion.div 
          id="report-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 -m-4 bg-[#0A0E17]"
        >
          {/* Main Result Card */}
          <div className="lg:col-span-2 rounded-[2rem] glass-card p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Forensic Report</h3>
                <p className="text-slate-400 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  {file?.name || 'media_file.mp4'}
                </p>
              </div>
              <div className={`px-5 py-2.5 rounded-2xl flex items-center space-x-2 border shadow-lg ${
                result.status === 'FAKE' ? 'bg-accent-fake/10 border-accent-fake/30 text-accent-fake shadow-accent-fake/20' :
                result.status === 'SUSPICIOUS' ? 'bg-accent-suspicious/10 border-accent-suspicious/30 text-accent-suspicious shadow-accent-suspicious/20' :
                'bg-accent-real/10 border-accent-real/30 text-accent-real shadow-accent-real/20'
              }`}>
                {result.status === 'FAKE' && <ShieldAlert className="w-5 h-5" />}
                {result.status === 'SUSPICIOUS' && <AlertTriangle className="w-5 h-5" />}
                {result.status === 'REAL' && <CheckCircle className="w-5 h-5" />}
                <span className="font-bold tracking-widest text-sm">{result.status}</span>
              </div>
            </div>

            <div className="flex-1 bg-dark-950/50 rounded-2xl p-6 border border-white/5 mb-8 relative z-10 backdrop-blur-sm">
              <h4 className="text-xs uppercase tracking-[0.2em] text-primary-400 font-bold mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> AI Analysis Engine
              </h4>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">{result.explanation}</p>
            </div>

            <div className="flex flex-wrap gap-4 mt-auto relative z-10" data-html2canvas-ignore="true">
              <button 
                onClick={() => setResult(null)}
                className="px-6 py-3.5 rounded-2xl glass-button text-white font-semibold flex-1 sm:flex-none"
              >
                Scan Another
              </button>
              <button 
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)] flex-1 sm:flex-none flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download PDF Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="flex flex-col gap-6">
            <div className="rounded-[2rem] glass-panel p-8 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h4 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-8 w-full text-center relative z-10">Risk Score</h4>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-white/5 animate-spin-slow" />
                <svg className="absolute inset-0 w-full h-full transform -rotate-90 filter drop-shadow-xl">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="80" cy="80" r="70" fill="none" 
                    stroke={result.score > 70 ? '#EF4444' : result.score > 30 ? '#F59E0B' : '#10B981'} 
                    strokeWidth="8" strokeDasharray="440" strokeDashoffset={440 - (440 * result.score) / 100} 
                    className="transition-all duration-1500 ease-out" strokeLinecap="round" 
                  />
                </svg>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">{Number(result.score).toFixed(1)}<span className="text-2xl text-slate-500">%</span></span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] glass-panel p-6 flex-1 relative overflow-hidden">
              <h4 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-6">Detected Signals</h4>
              <div className="space-y-3 relative z-10">
                {result.signals.map((sig, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx, duration: 0.4 }}
                    key={idx} 
                    className="bg-dark-950/50 rounded-2xl p-4 border border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-primary-400 font-bold mb-1">{sig.label.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-slate-200 font-medium leading-snug">{sig.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
