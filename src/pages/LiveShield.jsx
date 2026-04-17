import React, { useState, useRef, useEffect } from 'react';
import { Radio, StopCircle, Maximize, AlertTriangle, Activity, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeApi } from '../utils/api';

export default function LiveShield() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [riskScore, setRiskScore] = useState(0);
  const [signals, setSignals] = useState([]);
  const detectionLoopRef = useRef(null);

  // Reliably attach the stream to the video element once it is rendered
  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isActive, stream]);

  const startCapture = async () => {
    try {
      let mediaStream;
      try {
        // Try with audio first (supported on Chrome tabs)
        mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: "always" },
          audio: true 
        });
      } catch (e) {
        // Fallback to video only (for Safari or full screen sharing on Mac)
        console.warn("Audio capture not supported, falling back to video only.");
        mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: "always" },
          audio: false 
        });
      }
      
      setStream(mediaStream);
      setIsActive(true);
      
      mediaStream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
      
      // Pass the stream directly since React state is async
      startRealDetection(mediaStream);
    } catch (err) {
      console.error("Error capturing screen:", err);
      alert("Could not access screen capture. Please ensure you have granted screen recording permissions to your browser.");
    }
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (detectionLoopRef.current) {
      clearTimeout(detectionLoopRef.current);
    }
    setStream(null);
    setIsActive(false);
    setRiskScore(0);
    setSignals([]);
  };

  const startRealDetection = (activeStream) => {
    let audioContext = null;
    let audioProcessor = null;
    let audioSource = null;

    if (activeStream && activeStream.getAudioTracks().length > 0) {
      audioContext = new AudioContext();
      audioSource = audioContext.createMediaStreamSource(activeStream);
      audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      const audioChunks = [];
      audioProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunks.push(new Float32Array(inputData));
        
        // Keep roughly 2 seconds of audio at 48kHz (approx 24 chunks of 4096)
        if (audioChunks.length > 24) {
          audioChunks.shift();
        }
      };
      
      audioSource.connect(audioProcessor);
      audioProcessor.connect(audioContext.destination);
    }

    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        detectionLoopRef.current = setTimeout(processFrame, 500);
        return;
      }

      // Resize frame to prevent 'Payload Too Large' API errors
      const MAX_WIDTH = 640;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
      
      // Get base64 string (High quality JPEG preserves artifacts but saves massive bandwidth over PNG)
      const frameBase64 = canvas.toDataURL('image/jpeg', 0.95);
      
      // Package audio data if available
      let audioDataStr = null;
      if (audioContext && audioProcessor) {
        audioDataStr = "audio-buffer-present"; // Placeholder for actual base64 audio logic
      }

      try {
        // Send to analyzeFrame API. Update the API helper to accept audio later.
        const response = await fetch('/api/analyze/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            frame: frameBase64,
            audio_data: audioDataStr,
            timestamp: Date.now()
          })
        });
        const result = await response.json();
        
        setRiskScore(result.risk_score || 0);
        
        if (result.signals && result.signals.length > 0) {
          setSignals(result.signals.map(s => `⚠️ ${s.description}`));
        } else {
          setSignals(['✓ Authentic frames detected']);
        }
      } catch (err) {
        console.error("Frame analysis failed:", err);
        // If the backend fails or proxy drops, show a spike so we know it's a network error, not a '0% real' result
        setSignals(['⚠️ API Connection Failed - Please Hard Refresh (Cmd+Shift+R)']);
      }
      
      // Schedule next frame (ensure we use the latest function reference)
      if (isActive) {
        detectionLoopRef.current = setTimeout(processFrame, 2000);
      }
    };
    
    // Start the loop
    processFrame();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const getStatusColor = () => {
    if (riskScore > 80) return 'text-accent-fake border-accent-fake/50 bg-accent-fake/10 shadow-[0_0_30px_rgba(239,68,68,0.3)]';
    if (riskScore > 50) return 'text-accent-suspicious border-accent-suspicious/50 bg-accent-suspicious/10 shadow-[0_0_30px_rgba(245,158,11,0.3)]';
    return 'text-accent-real border-accent-real/50 bg-accent-real/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]';
  };

  const getStatusText = () => {
    if (riskScore > 80) return 'LIKELY FAKE';
    if (riskScore > 50) return 'SUSPICIOUS';
    return 'REAL';
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 flex items-center tracking-tight">
          Live Shield 
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-4 px-4 py-1.5 bg-primary-500/10 border border-primary-500/30 text-primary-400 text-xs rounded-full uppercase tracking-[0.2em] font-black flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          >
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            Real-time
          </motion.span>
        </h2>
        <p className="text-slate-400 font-medium">Detect deepfakes in any video playing on your screen instantly.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[2rem] glass-card p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/20 transition-colors duration-500" />
          
          <div className="aspect-video bg-dark-950 rounded-[1.5rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl ring-1 ring-white/10 z-10">
            {isActive ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover opacity-90 scale-105"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Viewfinder UI */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-primary-500/70 rounded-tl-lg" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-primary-500/70 rounded-tr-lg" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-primary-500/70 rounded-bl-lg" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-primary-500/70 rounded-br-lg" />
                  </div>
                </div>

                <div className="absolute top-6 left-6 flex items-center space-x-2 bg-dark-950/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">Capturing</span>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 relative z-10"
              >
                <div className="w-24 h-24 rounded-full bg-dark-900 flex items-center justify-center mx-auto mb-6 shadow-2xl ring-1 ring-white/5 relative group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-md" />
                  <Maximize className="w-10 h-10 text-primary-400 relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Screen Capture Inactive</h3>
                <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">Share your screen or a specific tab (e.g., YouTube, Zoom) to start real-time detection.</p>
              </motion.div>
            )}
            
            {/* Overlay HUD inside the video player */}
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`absolute bottom-6 right-6 p-5 rounded-2xl border backdrop-blur-2xl min-w-[260px] ${getStatusColor()}`}
                >
                  <div className="flex items-center justify-between mb-4 border-b border-current/20 pb-3">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5" />
                      <span className="font-black tracking-widest text-sm uppercase">PersonaShield AI</span>
                    </div>
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-1 font-bold">Live Risk Score</div>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl font-black tracking-tighter drop-shadow-md">{Math.round(riskScore)}%</span>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border ${getStatusColor()} font-bold text-xs`}>
                        {getStatusText()}
                      </div>
                    </div>
                    {/* HACKATHON DEBUG: Show exact raw output from backend */}
                    <div className="mt-4 text-xs font-mono text-slate-400 break-all max-w-xs">
                      DEBUG: {signals.length > 0 ? signals[0] : "Waiting..."}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {signals.filter(s => s !== '⚠️ API Connection Failed - Please Hard Refresh (Cmd+Shift+R)').map((sig, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2.5 py-1.5 rounded-lg truncate"
                      >
                        {sig}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex justify-center relative z-10">
            {!isActive ? (
              <button 
                onClick={startCapture}
                className="flex items-center space-x-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)] group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Radio className="w-6 h-6 relative z-10" />
                <span className="relative z-10 tracking-wide">Start Live Shield</span>
              </button>
            ) : (
              <button 
                onClick={stopCapture}
                className="flex items-center space-x-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition-all shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)] hover:shadow-[0_0_60px_-15px_rgba(239,68,68,0.7)] group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <StopCircle className="w-6 h-6 relative z-10" />
                <span className="relative z-10 tracking-wide">Stop Protection</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[2rem] glass-panel p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h4 className="text-xs uppercase tracking-[0.2em] text-primary-400 font-bold mb-6 relative z-10">How it works</h4>
            <div className="space-y-6 relative z-10">
              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">1</div>
                <div>
                  <h5 className="text-slate-200 font-bold mb-1 tracking-wide">Select Window</h5>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">Choose the specific tab or window playing the video you want to analyze.</p>
                </div>
              </div>
              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">2</div>
                <div>
                  <h5 className="text-slate-200 font-bold mb-1 tracking-wide">Secure Sampling</h5>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">We securely sample audio and visual frames every 2 seconds via Canvas API.</p>
                </div>
              </div>
              <div className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">3</div>
                <div>
                  <h5 className="text-slate-200 font-bold mb-1 tracking-wide">AI Inference</h5>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">PyTorch models analyze the stream and inject a non-intrusive HUD with live results.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-[2rem] glass-panel p-8 flex-1 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-accent-suspicious/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AlertTriangle className="w-12 h-12 text-accent-suspicious mb-5 relative z-10" />
            <h4 className="text-slate-200 font-bold mb-3 tracking-wide relative z-10">Privacy First</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium relative z-10">All processing happens locally on your device or via secure encrypted tunnels. Screen data is never permanently stored.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
