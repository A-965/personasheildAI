import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, AlertTriangle, CheckCircle, ShieldAlert, Activity } from 'lucide-react';
import { analyzeApi } from '../utils/api';

export default function NewsChecker() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (text.trim().length < 20) {
      setError("Please paste a longer text to analyze.");
      return;
    }
    
    setError(null);
    setIsAnalyzing(true);
    
    try {
      const response = await analyzeApi.analyzeNews(text);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze text. Please check your network connection or API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score) => {
    if (score > 75) return 'text-red-500';
    if (score > 40) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <header className="mb-10">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 flex items-center tracking-tight">
          News Fact Checker
        </h2>
        <p className="text-slate-400 font-medium">Analyze written articles, claims, or viral text for logical fallacies and misinformation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-wide">Paste Text</h3>
              <p className="text-xs text-slate-400">Insert the news article or claim below</p>
            </div>
          </div>

          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here to analyze for misinformation, AI-generated propaganda, or logical fallacies..."
            className="w-full h-64 bg-dark-900/50 border border-white/10 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none relative z-10 mb-4"
          />

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || text.length < 10}
            className={`w-full py-4 rounded-xl font-bold tracking-wider uppercase text-sm transition-all relative z-10 overflow-hidden group ${
              isAnalyzing || text.length < 10
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-500/25'
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center">
                <Activity className="w-5 h-5 animate-pulse mr-2" />
                Analyzing Narrative...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Search className="w-5 h-5 mr-2" />
                Fact Check Text
              </span>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="glass-card rounded-[2rem] p-6 relative overflow-hidden flex flex-col">
          {!result && !isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50 relative z-10">
              <ShieldAlert className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium tracking-wide">Awaiting text for analysis</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <div className="w-16 h-16 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin mb-4" />
              <p className="text-primary-400 font-medium animate-pulse tracking-wide uppercase text-sm">Claude OSINT Engine Processing</p>
            </div>
          )}

          <AnimatePresence>
            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">Misinformation Risk</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className={`text-6xl font-black tracking-tighter drop-shadow-md ${getRiskColor(result.risk_score)}`}>
                        {Math.round(result.risk_score)}%
                      </span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border font-bold text-sm ${
                    result.classification === 'FAKE' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                    result.classification === 'SUSPICIOUS' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' :
                    'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                  }`}>
                    {result.classification}
                  </div>
                </div>

                <div className="mb-6 p-4 bg-dark-900/50 border border-white/5 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-400 mb-2 flex items-center">
                    <ShieldAlert className="w-3 h-3 mr-1.5" /> Verdict
                  </h4>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">{result.verdict}</p>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                      <Search className="w-3 h-3 mr-1.5" /> Key Claims Extracted
                    </h4>
                    <ul className="space-y-2">
                      {result.key_claims.map((claim, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-slate-500 shrink-0" />
                          <span>{claim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1.5" /> Logical Fallacies & Biases
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.fallacies_detected.length > 0 ? (
                        result.fallacies_detected.map((fallacy, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg uppercase tracking-wide">
                            {fallacy}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-500 text-sm font-medium">✓ No obvious fallacies detected</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
                      <FileText className="w-3 h-3 mr-1.5" /> Detailed Explanation
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{result.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
