import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, ShieldAlert, CheckCircle, AlertTriangle, Download, Filter } from 'lucide-react';
import { analyzeApi } from '../utils/api';

export default function TrustDashboard() {
  const [stats, setStats] = useState({
    total_scans: 0,
    fake_detected: 0,
    real_content: 0,
    suspicious_content: 0,
    average_risk_score: 0,
  });
  const [history, setHistory] = useState([]);
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await analyzeApi.getStats();
        setStats(statsData);

        const historyData = await analyzeApi.getHistory(20, 0);
        setHistory(historyData);

        // Generate dynamic timeline from history
        const timeline = historyData.map(h => {
          const date = new Date(h.created_at);
          return {
            time: `${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`,
            risk: h.risk_score,
            name: h.file_name
          };
        }).reverse();
        setTimelineData(timeline);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    loadData();
  }, []);
  return (
    <div className="max-w-6xl mx-auto pb-12">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">Trust Dashboard</h2>
          <p className="text-slate-400 font-medium">Review your detection history, risk timeline, and export forensic reports.</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-3 rounded-2xl glass-button text-white font-medium transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/20">
          <Download className="w-5 h-5 text-primary-400" />
          <span>Export All Data</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-[2rem] glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/20 transition-colors duration-500" />
          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center shadow-inner">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Total Scans</div>
              <div className="text-3xl font-black text-white tracking-tighter">{stats.total_scans}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-fake/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent-fake/20 transition-colors duration-500" />
          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-fake/20 to-red-600/10 border border-accent-fake/20 text-accent-fake flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Fakes Blocked</div>
              <div className="text-3xl font-black text-white tracking-tighter">{stats.fake_detected}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-real/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent-real/20 transition-colors duration-500" />
          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-real/20 to-green-600/10 border border-accent-real/20 text-accent-real flex items-center justify-center shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Safe Content</div>
              <div className="text-3xl font-black text-white tracking-tighter">{stats.real_content}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[2rem] glass-panel p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Risk Timeline</h3>
            <select className="bg-dark-950/50 border border-white/10 text-slate-300 text-sm font-medium rounded-xl px-4 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 backdrop-blur-md">
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 19, 29, 0.8)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#F8FAFC', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#8B5CF6', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorRisk)" activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] glass-panel p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-bold text-white tracking-tight">Recent Detections</h3>
            <button className="w-10 h-10 rounded-xl glass-button flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 relative z-10 custom-scrollbar">
            {history.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-dark-950/40 border border-white/5 hover:bg-white/5 transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-semibold text-slate-200 truncate pr-2 group-hover:text-white transition-colors" title={item.file_name}>
                    {item.file_name}
                  </div>
                  <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${
                    item.classification === 'LIKELY FAKE' ? 'bg-accent-fake/10 border-accent-fake/30 text-accent-fake shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                    item.classification === 'SUSPICIOUS' ? 'bg-accent-suspicious/10 border-accent-suspicious/30 text-accent-suspicious shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                    'bg-accent-real/10 border-accent-real/30 text-accent-real shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  }`}>
                    {item.classification}
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-500/50"></span>
                    <span className="uppercase tracking-wider">{item.media_type}</span>
                  </span>
                  <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-3 text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest relative z-10">
            View All History →
          </button>
        </div>
      </div>
    </div>
  );
}
