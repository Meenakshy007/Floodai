import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Shield, AlertTriangle, CloudRain, Waves, Activity, Info, Map as MapIcon, 
  ChevronRight, LayoutDashboard, MapPinned, Users, Target, Zap, Bell,
  Droplets, Thermometer, Search, Mail
} from 'lucide-react';
import KeralaMap from './Map';
import { Panchayat, DistrictSummary, RainfallRecord, getRiskLevel, getRiskColor } from '../types';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'Dashboard' | 'Districts' | 'Risk Map' | 'Community' | 'SDG Impact' | 'AI Insights' | 'Live Alerts';

export default function Dashboard() {
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [history, setHistory] = useState<RainfallRecord[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetch('/api/district-summaries')
      .then(res => res.json())
      .then(setDistricts);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedDistrict 
      ? `/api/panchayats?district=${encodeURIComponent(selectedDistrict)}`
      : '/api/panchayats';
      
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setPanchayats(data);
        if (selectedDistrict && data.length > 0) {
          // If a district is selected but no panchayat, don't auto-select to keep district view
        }
        setLoading(false);
      });
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedId) {
      fetch(`/api/history/${selectedId}`)
        .then(res => res.json())
        .then(setHistory);
    }
  }, [selectedId]);

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panchayatData: panchayats.length > 0 ? panchayats : districts })
      });
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubscribe = async () => {
    if (!email || !selectedId) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panchayat_id: selectedId, email, risk_threshold: 'High' })
      });
      if (res.ok) {
        alert('Successfully subscribed to alerts!');
        setShowSubscribe(false);
        setEmail('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(false);
    }
  };

  const selectedDistrictData = districts.find(d => d.name === selectedDistrict);
  const selectedPanchayat = panchayats.find(p => p.id === selectedId);
  const highRiskCount = panchayats.filter(p => getRiskLevel(p.latest_rainfall, p.latest_discharge) === 'High').length;

  if (loading && districts.length === 0) return (
    <div className="h-screen flex items-center justify-center bg-[#050506] font-mono text-emerald-500">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <Shield className="w-16 h-16 animate-pulse" />
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
        </div>
        <div className="tracking-[0.3em] uppercase text-xs font-bold opacity-80">Syncing Kerala GIS Network...</div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#050506] text-slate-200 overflow-hidden selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0D0E11]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 120 200" className="w-10 h-16 drop-shadow-[0_0_10px_rgba(0,119,182,0.4)]">
                <defs>
                  <linearGradient id="keralaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00B4D8" />
                    <stop offset="100%" stopColor="#0077B6" />
                  </linearGradient>
                  <mask id="keralaMask">
                    <path 
                      fill="white"
                      d="M35,15 L38,12 L42,15 L45,25 L42,35 L48,45 L45,55 L52,65 L48,75 L55,85 L52,95 L60,105 L55,115 L65,125 L60,135 L70,145 L65,155 L75,165 L70,175 L80,185 L75,190 L65,185 L55,175 L45,165 L35,155 L25,145 L20,135 L15,125 L12,115 L15,105 L12,95 L15,85 L12,75 L15,65 L12,55 L15,45 L12,35 L15,25 L12,15 Z" 
                    />
                  </mask>
                </defs>
                <g mask="url(#keralaMask)">
                  <path 
                    fill="url(#keralaGradient)" 
                    d="M0,0 H120 V200 H0 Z" 
                  />
                  {/* Wavy patterns from reference image */}
                  <path 
                    fill="none" 
                    stroke="#ffffff33" 
                    strokeWidth="4" 
                    d="M10,90 Q30,80 50,90 T90,90 M10,100 Q30,90 50,100 T90,100 M10,110 Q30,100 50,110 T90,110" 
                  />
                  {/* District lines */}
                  <path fill="none" stroke="#ffffff22" strokeWidth="0.5" d="M15,45 Q35,40 50,45 M15,75 Q35,70 55,75 M15,105 Q35,100 60,105 M20,135 Q45,130 70,135" />
                </g>
                <path 
                  fill="none" 
                  stroke="#ffffff33" 
                  strokeWidth="0.5"
                  d="M35,15 L38,12 L42,15 L45,25 L42,35 L48,45 L45,55 L52,65 L48,75 L55,85 L52,95 L60,105 L55,115 L65,125 L60,135 L70,145 L65,155 L75,165 L70,175 L80,185 L75,190 L65,185 L55,175 L45,165 L35,155 L25,145 L20,135 L15,125 L12,115 L15,105 L12,95 L15,85 L12,75 L15,65 L12,55 L15,45 L12,35 L15,25 L12,15 Z" 
                />
              </svg>
              <div className="flex flex-col">
                <div className="flex items-baseline font-black tracking-tighter">
                  <span className="text-2xl text-white">FLOODGUARD</span>
                  <span className="text-2xl text-[#00A8E8]">-AI</span>
                </div>
                <div className="flex items-center gap-1.5 -mt-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.3em]">Kerala GIS Intelligence</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-6 w-px bg-white/5 mx-2" />
          
          {/* Search Box */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search LSG nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.03] border border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-[11px] font-medium text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all w-64"
            />
            {searchQuery && (
              <div className="absolute top-full left-0 w-full mt-1 bg-[#0D0E11] border border-white/10 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-[100] custom-scrollbar">
                {panchayats.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                  >
                    <div className="text-[10px] font-bold text-white uppercase">{p.name}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-mono">{p.district} District</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'Dashboard', icon: LayoutDashboard },
              { id: 'Districts', icon: MapPinned },
              { id: 'Risk Map', icon: MapIcon },
              { id: 'AI Insights', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                  activeTab === tab.id 
                  ? 'bg-white/5 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-emerald-500' : ''}`} />
                {tab.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-2 py-1">
            <span className="text-[9px] font-bold uppercase text-slate-500 px-1">Region</span>
            <select 
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-[11px] font-medium text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#0D0E11]">All Districts</option>
              {districts.map(d => <option key={d.name} value={d.name} className="bg-[#0D0E11]">{d.name}</option>)}
            </select>
          </div>
        </div>
      </nav>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 border-b border-white/5 bg-[#0D0E11]/40">
        {[
          { label: 'System Status', value: highRiskCount > 5 ? 'Critical' : highRiskCount > 0 ? 'Warning' : 'Stable', sub: 'AI Risk Assessment', color: highRiskCount > 5 ? 'text-red-500' : highRiskCount > 0 ? 'text-orange-500' : 'text-emerald-500', icon: Activity },
          { label: 'Avg Water Level', value: '3.81m', sub: `Across ${panchayats.length || districts.length} nodes`, icon: Waves, color: 'text-blue-400' },
          { label: 'Precipitation', value: '125mm', sub: '24h Cumulative', icon: CloudRain, color: 'text-emerald-400' },
          { label: 'Threat Vectors', value: highRiskCount, sub: 'Active Alerts', icon: AlertTriangle, color: 'text-red-500' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 flex flex-col gap-1.5 ${i < 3 ? 'border-r border-white/5' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">{stat.label}</span>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-80`} />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className={`text-2xl font-bold tracking-tight text-white ${stat.color === 'text-red-500' && stat.value !== 0 ? 'animate-pulse' : ''}`}>
                {stat.value}
              </h2>
            </div>
            <span className="text-[10px] text-slate-600 font-mono">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'Dashboard' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
              {/* Left: Alerts Feed */}
              <div className="col-span-3 border-r border-white/5 flex flex-col bg-[#0D0E11]/20">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Live Intelligence</h3>
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-slate-500 uppercase">Stream</div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] group hover:bg-red-500/[0.04] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                        <Waves className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wide">Hydrological Breach</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Periyar river crossing danger mark near Aluva. Immediate evacuation advised.</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-mono text-slate-600">06:47:46</span>
                          <span className="text-[9px] font-bold text-red-500/50 uppercase">Priority 1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {panchayats.filter(p => getRiskLevel(p.latest_rainfall, p.latest_discharge) === 'High').slice(0, 8).map(p => (
                    <div key={p.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => setSelectedId(p.id)}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                          <Droplets className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">{p.name} Alert</h4>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Rainfall: {p.latest_rainfall.toFixed(1)}mm. Saturation threshold exceeded.</p>
                          <span className="text-[9px] font-mono text-slate-600 mt-2 block uppercase">Just Now // Node {p.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Map & AI Insights */}
              <div className="col-span-9 flex flex-col">
                <div className="flex-1 relative border-b border-white/5">
                  <KeralaMap 
                    panchayats={panchayats} 
                    districts={districts}
                    selectedId={selectedId} 
                    selectedDistrict={selectedDistrict}
                    onSelect={setSelectedId} 
                    onDistrictSelect={setSelectedDistrict}
                  />
                  
                  {/* Floating Map Controls */}
                  <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
                    <div className="glass-panel p-4 rounded-xl">
                      <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                        <MapIcon className="w-3 h-3" />
                        GIS Layers
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { label: 'Critical Risk', color: 'bg-red-500', glow: 'shadow-[0_0_8px_#ef4444]' },
                          { label: 'Moderate Risk', color: 'bg-orange-500', glow: '' },
                          { label: 'Stable Zone', color: 'bg-emerald-500', glow: '' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3 group cursor-pointer">
                            <div className={`w-2 h-2 rounded-full ${item.color} ${item.glow} transition-transform group-hover:scale-125`} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selected Node Overlay */}
                  <AnimatePresence mode="wait">
                    {(selectedPanchayat || selectedDistrictData) && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute bottom-6 left-6 z-[1000] w-72 glass-panel rounded-xl p-5"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-white tracking-tight leading-none">{selectedPanchayat ? selectedPanchayat.name : selectedDistrictData?.name}</h4>
                            <span className="text-[10px] text-slate-500 uppercase font-mono mt-1 block">{selectedPanchayat ? `${selectedPanchayat.district} District` : 'District Summary'}</span>
                          </div>
                          <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            (selectedPanchayat ? getRiskLevel(selectedPanchayat.latest_rainfall, selectedPanchayat.latest_discharge) : (selectedDistrictData?.avg_rainfall || 0) > 100) === 'High' || (selectedDistrictData?.avg_rainfall || 0) > 100 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {selectedPanchayat ? getRiskLevel(selectedPanchayat.latest_rainfall, selectedPanchayat.latest_discharge) : (selectedDistrictData?.avg_rainfall || 0) > 100 ? 'High' : 'Stable'} Risk
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Precipitation</div>
                            <div className="text-sm font-mono font-bold text-white">{(selectedPanchayat ? selectedPanchayat.latest_rainfall : selectedDistrictData?.avg_rainfall || 0).toFixed(1)}mm</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Discharge</div>
                            <div className="text-sm font-mono font-bold text-white">{(selectedPanchayat ? selectedPanchayat.latest_discharge : selectedDistrictData?.avg_discharge || 0).toFixed(1)}m³/s</div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => setShowSubscribe(true)}
                          className="w-full mt-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Mail className="w-3 h-3" />
                          Automate Alert Triggers
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Alert Subscription Modal */}
                  <AnimatePresence>
                    {showSubscribe && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                      >
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="w-full max-w-md glass-panel rounded-2xl p-8 relative"
                        >
                          <button 
                            onClick={() => setShowSubscribe(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                          >
                            <Zap className="w-4 h-4 rotate-45" />
                          </button>
                          
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                              <Mail className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter leading-none">Alert Automation</h3>
                              <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Configure Email Triggers for {selectedPanchayat?.name || selectedDistrictData?.name}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Recipient Email</label>
                              <input 
                                type="email"
                                placeholder="authority@kerala.gov.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                              />
                            </div>
                            
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                <span className="text-emerald-500 font-bold uppercase">Automation Logic:</span> System will trigger high-priority alerts when precipitation exceeds 120mm or river discharge crosses safety thresholds.
                              </p>
                            </div>

                            <button 
                              onClick={handleSubscribe}
                              disabled={subscribing || !email}
                              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                              {subscribing ? 'Initializing...' : 'Activate Alert Triggers'}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* AI Insights Panel */}
                <div className="h-60 bg-[#0D0E11] p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Zap className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Strategic Assessment Engine</h3>
                        <span className="text-[9px] text-slate-500 font-mono uppercase">Neural Analysis // v4.5.0</span>
                      </div>
                    </div>
                    <button 
                      onClick={runAIAnalysis}
                      disabled={analyzing}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold uppercase rounded-md transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      {analyzing ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      {analyzing ? 'Processing Vectors...' : 'Execute Diagnostic'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar text-xs font-medium text-slate-400 leading-relaxed pr-4">
                    {aiAnalysis ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 italic font-serif text-sm">
                          {aiAnalysis}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
                        <Activity className="w-8 h-8" />
                        <span className="uppercase tracking-[0.2em] text-[10px]">Awaiting system command for neural risk evaluation</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Risk Map' && (
          <div className="flex-1 relative">
            <KeralaMap 
              panchayats={panchayats} 
              districts={districts}
              selectedId={selectedId} 
              selectedDistrict={selectedDistrict}
              onSelect={setSelectedId} 
              onDistrictSelect={setSelectedDistrict}
            />
            <div className="absolute top-6 left-6 z-[1000] w-80 glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-tighter">Statewide Risk Matrix</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">Interactive GIS overlay showing real-time flood probability across all LSG nodes.</p>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Zones</span>
                    <span className="text-xs font-mono text-red-500 font-bold">{highRiskCount}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${(highRiskCount / (panchayats.length || 1)) * 100}%` }} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                      <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Active Nodes</div>
                      <div className="text-lg font-mono font-bold text-white">{panchayats.length || districts.length}</div>
                   </div>
                   <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
                      <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Sync Status</div>
                      <div className="text-lg font-mono font-bold text-emerald-500">LIVE</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Districts' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 border-r border-white/5 overflow-y-auto custom-scrollbar bg-[#0D0E11]/20">
              <div className="p-5 border-b border-white/5 bg-white/[0.01]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Local Body Inventory</h3>
              </div>
              {(panchayats.length > 0 ? panchayats : districts).map((item: any) => (
                <div 
                  key={item.id || item.name}
                  onClick={() => item.id ? setSelectedId(item.id) : setSelectedDistrict(item.name)}
                  className={`p-4 border-b border-white/[0.02] cursor-pointer transition-all duration-200 ${selectedId === item.id || selectedDistrict === item.name ? 'bg-emerald-500/[0.03] border-l-2 border-l-emerald-500 shadow-inner' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`text-[11px] font-bold uppercase tracking-wide ${selectedId === item.id || selectedDistrict === item.name ? 'text-emerald-400' : 'text-slate-200'}`}>{item.name}</h4>
                      <span className="text-[9px] text-slate-500 uppercase font-mono">{item.district || 'District'}</span>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      (item.latest_rainfall ? getRiskLevel(item.latest_rainfall, item.latest_discharge) : item.avg_rainfall > 100) === 'High' || item.avg_rainfall > 100 ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 'bg-emerald-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050506] to-[#0D0E11]">
              {(selectedPanchayat || selectedDistrictData) ? (
                <div className="max-w-4xl mx-auto space-y-10">
                  <div className="flex justify-between items-end border-b border-white/5 pb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase border border-emerald-500/20">LSG NODE {selectedPanchayat?.id || 'DISTRICT'}</div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Active Monitoring</span>
                      </div>
                      <h2 className="text-6xl font-bold tracking-tighter text-white uppercase italic">{selectedPanchayat?.name || selectedDistrictData?.name}</h2>
                      <p className="text-xs text-slate-500 mt-3 font-mono uppercase tracking-[0.3em]">{selectedPanchayat?.district || 'Kerala State'} // District</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Threat Level</div>
                      <div className={`text-4xl font-bold uppercase tracking-tighter ${
                        (selectedPanchayat ? getRiskLevel(selectedPanchayat.latest_rainfall, selectedPanchayat.latest_discharge) : (selectedDistrictData?.avg_rainfall || 0) > 100) === 'High' || (selectedDistrictData?.avg_rainfall || 0) > 100 ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {selectedPanchayat ? getRiskLevel(selectedPanchayat.latest_rainfall, selectedPanchayat.latest_discharge) : (selectedDistrictData?.avg_rainfall || 0) > 100 ? 'High' : 'Stable'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Precipitation', value: `${(selectedPanchayat?.latest_rainfall || selectedDistrictData?.avg_rainfall || 0).toFixed(1)}mm`, icon: CloudRain, color: 'text-emerald-400' },
                      { label: 'River Discharge', value: `${(selectedPanchayat?.latest_discharge || selectedDistrictData?.avg_discharge || 0).toFixed(1)}m³/s`, icon: Waves, color: 'text-blue-400' },
                      { label: 'Ambient Temp', value: '28.4°C', icon: Thermometer, color: 'text-orange-400' },
                    ].map((metric, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                        <metric.icon className={`w-5 h-5 ${metric.color} mb-4 opacity-80`} />
                        <div className="text-3xl font-mono font-bold text-white">{metric.value}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {selectedPanchayat && (
                    <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5">
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Historical Precipitation Matrix</h3>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Rainfall (mm)</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={history}>
                            <defs>
                              <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="date" hide />
                            <YAxis hide />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0D0E11', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                              labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Area type="monotone" dataKey="rainfall_mm" stroke="#10B981" fillOpacity={1} fill="url(#colorRain)" strokeWidth={2.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                  <LayoutDashboard className="w-12 h-12 opacity-10" />
                  <span className="uppercase tracking-[0.3em] text-[10px] font-bold opacity-40 text-center">Select LSG node from inventory<br/>to initialize detailed telemetry</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="h-10 border-t border-white/5 flex items-center justify-between px-6 bg-[#0D0E11] text-[9px] font-mono text-slate-500">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
            <span className="uppercase tracking-widest">Core Systems: Active</span>
          </div>
          <span className="uppercase tracking-widest">Sync: {new Date().toLocaleTimeString()}</span>
          <span className="uppercase tracking-widest">Node: KL-01-SRV-PRO</span>
        </div>
        <div className="flex gap-6">
          <span className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">System Logs</span>
          <span className="hover:text-white cursor-pointer transition-colors uppercase tracking-widest">API v4.5</span>
          <span className="text-slate-800">|</span>
          <span className="uppercase tracking-widest">&copy; 2026 FloodGuard AI</span>
        </div>
      </footer>
    </div>
  );
}
