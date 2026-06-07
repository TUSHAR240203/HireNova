import { useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { 
  Briefcase, 
  Users, 
  Code, 
  Bot, 
  Database, 
  Lock, 
  Activity,
  Globe,
  Settings
} from 'lucide-react';

export default function App() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-900">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/40 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent pointer-events-none z-0" />

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 p-6 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Bot className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  HireNova
                </h1>
                <span className="text-[10px] text-cyan-400 font-semibold tracking-widest uppercase">
                  Enterprise AI
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {[
                { id: 'overview', name: 'Dashboard', icon: Activity },
                { id: 'jobs', name: 'Jobs Pipeline', icon: Briefcase },
                { id: 'candidates', name: 'Candidates', icon: Users },
                { id: 'sandbox', name: 'Code Sandbox', icon: Code },
                { id: 'ai-agents', name: 'AI Interviews', icon: Bot },
                { id: 'database', name: 'Data Center', icon: Database },
                { id: 'security', name: 'Security & SSO', icon: Lock },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/30 text-cyan-400 border-l-2 border-cyan-400 shadow-md shadow-cyan-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer User Profile */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400">
                JD
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold truncate text-slate-200">
                  {user?.name || 'Jitendra Dev'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || 'admin@hirenova.co'}
                </p>
              </div>
              <Settings className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 font-medium">Workspace / {activeTab}</span>
              <h2 className="text-2xl font-bold text-white tracking-tight capitalize">{activeTab} Overview</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Active Tenant: DevCorp</span>
              </div>
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all duration-300 transform hover:-translate-y-0.5">
                New Job Posting
              </button>
            </div>
          </header>

          {/* Tab Content Router */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Active Job Openings', value: '14', desc: '+2 this week', icon: Briefcase, color: 'from-cyan-500 to-blue-500' },
                  { label: 'Total Candidates', value: '124,809', desc: '+1,420 parsed', icon: Users, color: 'from-blue-500 to-indigo-500' },
                  { label: 'AI Interviews Run', value: '8,410', desc: 'Average rating 4.2', icon: Bot, color: 'from-purple-500 to-pink-500' },
                  { label: 'Security Status', value: 'Hardened', desc: 'gVisor & WAF Active', icon: Lock, color: 'from-emerald-500 to-teal-500' }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
                      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 blur-xl transition-opacity duration-300`} />
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                        <div className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/30">
                          <Icon className="w-4 h-4 text-cyan-400" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-white tracking-tight mb-1">{stat.value}</h3>
                      <p className="text-[10px] text-slate-500">{stat.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Central Panel Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Candidates Funnel */}
                <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" /> Recent Assessment Submissions
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Sarah Connor', email: 's.connor@cyberdyne.net', test: 'Senior Backend Engineer', score: '96/100', status: 'Passed AI Review', time: '10m ago' },
                      { name: 'Bruce Wayne', email: 'bwayne@waynecorp.com', test: 'Principal Architect', score: '92/100', status: 'Passed AI Review', time: '23m ago' },
                      { name: 'Clark Kent', email: 'ckent@dailyplanet.com', test: 'Content Lead', score: '62/100', status: 'Review Flagged', time: '1h ago' }
                    ].map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-slate-800/10 border border-slate-800/50 hover:bg-slate-800/25 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs font-bold text-slate-300">
                            {c.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-cyan-400">{c.score}</p>
                          <p className="text-[10px] text-slate-500">{c.test}</p>
                        </div>
                        <div className="text-right hidden md:block">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                            c.score.startsWith('6') ? 'bg-amber-950/20 text-amber-400 border-amber-800/40' : 'bg-emerald-950/20 text-emerald-400 border-emerald-800/40'
                          }`}>
                            {c.status}
                          </span>
                          <p className="text-[9px] text-slate-600 mt-1">{c.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Sandbox Logs */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <Code className="w-4 h-4 text-cyan-400" /> Active Sandbox Health
                    </h3>
                    <div className="space-y-3 mb-6">
                      {[
                        { label: 'Sandbox Isolation', val: 'gVisor Active', ok: true },
                        { label: 'Avg Execution Latency', val: '142ms', ok: true },
                        { label: 'WAF Rate Limits', val: '0 events blocked', ok: true },
                        { label: 'DLQ Queue Status', val: '0 pending', ok: true },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">{item.label}</span>
                          <span className={`font-semibold ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-800/80 text-center">
                    <p className="text-[10px] text-slate-500 mb-3">Enterprise Sandbox is configured to run code compilations securely isolated.</p>
                    <button className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-xs font-semibold hover:bg-slate-750 transition-colors duration-300">
                      View Engine Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Feature Module Initialized</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                This {activeTab} workspace module is set up inside the monorepo and ready for backend service link integration.
              </p>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 border border-cyan-900 text-cyan-400 font-mono">
                Sprint 1 Foundation Status: Locked
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
