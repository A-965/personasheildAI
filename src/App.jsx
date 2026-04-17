import React, { useState } from 'react';
import { Shield, FileVideo, Radio, LayoutDashboard, Settings, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaAnalyzer from './pages/MediaAnalyzer';
import LiveShield from './pages/LiveShield';
import TrustDashboard from './pages/TrustDashboard';
import NewsChecker from './pages/NewsChecker';
import './styles/app.css';

export default function App() {
  const [activeMode, setActiveMode] = useState('media');

  const modes = [
    { id: 'media', label: 'Media Analyzer', icon: FileVideo },
    { id: 'live', label: 'Live Shield', icon: Radio },
    { id: 'news', label: 'News Checker', icon: FileText },
    { id: 'dashboard', label: 'Trust Dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="flex h-screen w-full bg-dark-950 text-slate-200 overflow-hidden font-sans relative selection:bg-primary-500/30">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-accent-violet/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-accent-cyan/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000 pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-64 flex flex-col glass-panel border-y-0 border-l-0 relative z-20">
        <div className="p-8 flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 blur-lg opacity-40 animate-pulse-slow rounded-xl"></div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-violet flex items-center justify-center relative shadow-lg ring-1 ring-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white drop-shadow-sm">Persona<span className="text-primary-400">Shield</span> <span className="text-sm text-slate-300">AI</span></h1>
            <p className="text-[10px] text-primary-300/80 uppercase tracking-[0.2em] font-bold">Pro Defense</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 mt-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive ? (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-violet/10 border border-white/10 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-2xl" />
                )}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium relative z-10 text-sm tracking-wide">{mode.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
            <Settings className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden z-10 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {activeMode === 'media' && <MediaAnalyzer />}
              {activeMode === 'live' && <LiveShield />}
              {activeMode === 'news' && <NewsChecker />}
              {activeMode === 'dashboard' && <TrustDashboard />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
