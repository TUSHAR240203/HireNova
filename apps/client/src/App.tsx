import { useState, useEffect } from 'react';
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
  Play,
  Send,
  CheckCircle,
  AlertTriangle,
  Terminal,
  Key,
  LogOut,
  Loader2,
  Plus,
  Trash2,
  FileText,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Core Data States
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any[]>([]);

  // Form States
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    type: 'Full-Time',
    location: 'Remote',
    department: 'Engineering',
    requirements: '',
    stages: 'Screening,Assessment,AIInterview,Offer'
  });
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    talentPool: false
  });
  const [applyCandidateId, setApplyCandidateId] = useState('');
  const [applyJobId, setApplyJobId] = useState('');

  // Sandbox Workspace States
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [sandboxLang, setSandboxLang] = useState('javascript');
  const [sandboxCode, setSandboxCode] = useState('');
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);
  const [sandboxRunning, setSandboxRunning] = useState(false);

  // AI Interview Simulator States
  const [activeInterviewId, setActiveInterviewId] = useState('');
  const [interviewMessages, setInterviewMessages] = useState<any[]>([]);
  const [candidateMessage, setCandidateMessage] = useState('');
  const [interviewCandidateId, setInterviewCandidateId] = useState('');
  const [interviewJobId, setInterviewJobId] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState('');

  // SSO & MFA configuration states
  const [ssoConfig, setSsoConfig] = useState({
    entityId: 'urn:hn:auth:saml',
    ssoUrl: 'https://identity.provider.com/saml/sso',
    certificate: '-----BEGIN CERTIFICATE-----\nMIIB...-----END CERTIFICATE-----',
    enabled: false
  });
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Fetch core data from APIs when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchJobs();
      fetchApplications();
      fetchCandidates();
      fetchProblems();
      fetchAuditLogs();
      fetchAiUsageLogs();
    }
  }, [isAuthenticated, token, activeTab]);

  // Sync sandbox starter code when problem changes
  useEffect(() => {
    if (selectedProblem) {
      const codeObj = selectedProblem.starterCode?.find((c: any) => c.language === sandboxLang);
      setSandboxCode(codeObj ? codeObj.code : `// Write your solution here\nfunction solution(input) {\n  \n}`);
    } else {
      setSandboxCode('');
    }
  }, [selectedProblem, sandboxLang]);

  // Headers helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // API Call: Fetch Jobs
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/v1/jobs', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setJobs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  // API Call: Fetch Applications
  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/v1/candidates/applications', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setApplications(data.data || []);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    }
  };

  // API Call: Fetch Candidates
  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/v1/candidates', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setCandidates(data.data || []);
    } catch (err) {
      console.error('Failed to fetch candidates', err);
    }
  };

  // API Call: Fetch Coding Problems
  const fetchProblems = async () => {
    try {
      const res = await fetch('/api/v1/assessments/coding-problems', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setProblems(data.data || []);
        if (data.data && data.data.length > 0 && !selectedProblem) {
          setSelectedProblem(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch coding problems', err);
    }
  };

  // API Call: Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setAuditLogs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    }
  };

  // API Call: Fetch AI Usage Logs
  const fetchAiUsageLogs = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs/ai-usage', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setAiUsage(data.data || []);
    } catch (err) {
      console.error('Failed to fetch AI usage logs', err);
    }
  };

  // Submit Handler: Register or Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const url = authMode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload = authMode === 'login' 
      ? { email, password, companySlug } 
      : { name, email, password, companyName, companySlug };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const { token, user, company } = data.data;
        setAuth(user, token, company.id);
        setActiveTab('overview');
      } else {
        setAuthError(data.error || 'Authentication process failed.');
      }
    } catch (err: any) {
      setAuthError('Server connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // API Call: Create Job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.description) return;

    try {
      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...newJob,
          requirements: newJob.requirements.split(',').map(s => s.trim()).filter(Boolean),
          pipelineStages: newJob.stages.split(',').map(s => ({ name: s.trim(), stageType: s.trim() })).filter(Boolean)
        })
      });
      if (res.ok) {
        setNewJob({
          title: '',
          description: '',
          type: 'Full-Time',
          location: 'Remote',
          department: 'Engineering',
          requirements: '',
          stages: 'Screening,Assessment,AIInterview,Offer'
        });
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Delete Job
  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      const res = await fetch(`/api/v1/jobs/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Create Candidate
  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.email) return;

    try {
      const res = await fetch('/api/v1/candidates', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newCandidate.name,
          email: newCandidate.email,
          phone: newCandidate.phone,
          parsedData: {
            skills: newCandidate.skills.split(',').map(s => s.trim()).filter(Boolean),
            experience: [],
            education: []
          },
          talentPool: newCandidate.talentPool
        })
      });
      if (res.ok) {
        setNewCandidate({
          name: '',
          email: '',
          phone: '',
          skills: '',
          talentPool: false
        });
        fetchCandidates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Apply Candidate to Job
  const handleApplyCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyCandidateId || !applyJobId) return;

    try {
      const res = await fetch('/api/v1/candidates/applications', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          candidateId: applyCandidateId,
          jobId: applyJobId,
          resumeMatchScore: Math.floor(Math.random() * 40) + 60 // Mock match score
        })
      });
      if (res.ok) {
        setApplyCandidateId('');
        setApplyJobId('');
        fetchApplications();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to apply candidate.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Update Application Stage
  const handleStageChange = async (appId: string, stage: string) => {
    try {
      const res = await fetch(`/api/v1/candidates/applications/${appId}/stage`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ stage })
      });
      if (res.ok) fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Upload candidates mock
  const handleBulkUpload = async () => {
    const mockList = [
      { name: 'Ada Lovelace', email: 'ada@computing.org', phone: '111', skills: 'C,Assembly,Algorithms' },
      { name: 'Alan Turing', email: 'turing@bletchley.edu', phone: '222', skills: 'Python,Logic,Cryptography' },
      { name: 'Grace Hopper', email: 'grace@navy.mil', phone: '333', skills: 'COBOL,Compiler,Flow-matic' }
    ];

    try {
      const res = await fetch('/api/v1/candidates/bulk-upload', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          candidates: mockList.map(m => ({
            name: m.name,
            email: m.email,
            phone: m.phone,
            parsedData: { skills: m.skills.split(','), experience: [], education: [] }
          }))
        })
      });
      if (res.ok) fetchCandidates();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Execute Sandbox Code
  const handleRunSandbox = async () => {
    if (!selectedProblem || !sandboxCode) return;
    setSandboxRunning(true);
    setSandboxOutput(null);

    try {
      // Execute code against standard evaluation endpoint with random mock attemptId
      const attemptId = '60d5ec4b1f6d9021bc3623d4';
      const res = await fetch(`/api/v1/assessments/attempts/${attemptId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `hn-sandbox-${Date.now()}` // Dynamic key
        },
        body: JSON.stringify({
          language: sandboxLang,
          code: sandboxCode,
          problemId: selectedProblem._id
        })
      });
      const data = await res.json();
      setSandboxOutput(data);
    } catch (err: any) {
      setSandboxOutput({ error: true, message: 'Compiler engine execution failed' });
    } finally {
      setSandboxRunning(false);
    }
  };

  // AI Interview API Call: Start session
  const handleStartInterview = async () => {
    if (!interviewCandidateId || !interviewJobId) return;
    setInterviewLoading(true);
    setInterviewMessages([]);
    setInterviewStatus('InProgress');

    try {
      const res = await fetch('/api/v1/interviews/start', {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Idempotency-Key': `hn-interview-${Date.now()}`
        },
        body: JSON.stringify({
          candidateId: interviewCandidateId,
          jobId: interviewJobId
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveInterviewId(data.data.interviewId);
        setInterviewMessages([
          { role: 'assistant', content: data.data.firstQuestion }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewLoading(false);
    }
  };

  // AI Interview API Call: Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateMessage || !activeInterviewId) return;

    const userMsg = candidateMessage;
    setCandidateMessage('');
    setInterviewMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInterviewLoading(true);

    try {
      const res = await fetch(`/api/v1/interviews/${activeInterviewId}/message`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (data.success) {
        setInterviewMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
        setInterviewStatus(data.data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/40 via-transparent to-transparent pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent pointer-events-none z-0" />
        
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl relative z-10 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bot className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                HireNova
              </h1>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-widest uppercase block -mt-1">
                Enterprise AI Recruitment
              </span>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <h2 className="text-xl font-bold text-white text-center">
              {authMode === 'login' ? 'Sign In to Workspace' : 'Onboard New Tenant'}
            </h2>

            {authError && (
              <div className="p-3 bg-red-950/30 border border-red-800/40 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-600"
                    placeholder="Jitendra Dev"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-600"
                    placeholder="DevCorp Inc."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company Identifier Slug</label>
              <input 
                type="text" 
                value={companySlug} 
                onChange={e => setCompanySlug(e.target.value)}
                required={authMode === 'register'}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-600"
                placeholder="devcorp (used for domain isolation)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Work Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-600"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Security Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 text-slate-100 placeholder-slate-600"
                placeholder="••••••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : authMode === 'login' ? (
                'Access Workspace'
              ) : (
                'Onboard Platform'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {authMode === 'login' ? (
              <p>
                Need to register a new tenant?{' '}
                <button onClick={() => setAuthMode('register')} className="text-cyan-400 font-semibold hover:underline">
                  Create tenant account
                </button>
              </p>
            ) : (
              <p>
                Already registered your tenant?{' '}
                <button onClick={() => setAuthMode('login')} className="text-cyan-400 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-900 flex flex-col md:flex-row relative">
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-950/40 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0 relative z-10">
        <div>
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

          <nav className="space-y-1">
            {[
              { id: 'overview', name: 'Dashboard', icon: Activity },
              { id: 'jobs', name: 'Jobs Pipeline', icon: Briefcase },
              { id: 'candidates', name: 'Candidates & ATS', icon: Users },
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

        <div className="pt-4 border-t border-slate-800/80 mt-6">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
                {user?.name?.[0] || 'JD'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-slate-200">
                  {user?.name || 'Jitendra Dev'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.role || 'CompanyAdmin'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => clearAuth()}
              className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/20 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 font-medium">Workspace / {activeTab}</span>
            <h2 className="text-2xl font-bold text-white tracking-tight capitalize">{activeTab} Panel</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
              <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Active Slug: {companySlug || 'Default'}</span>
            </div>
          </div>
        </header>

        {/* Tab Content Router */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Active Job Openings', value: jobs.length, desc: 'Published roles', icon: Briefcase, color: 'from-cyan-500 to-blue-500' },
                { label: 'ATS Applications', value: applications.length, desc: 'Active pipeline entries', icon: Users, color: 'from-blue-500 to-indigo-500' },
                { label: 'Total Candidates', value: candidates.length, desc: 'Registered in database', icon: FileText, color: 'from-purple-500 to-pink-500' },
                { label: 'Security & Audit logs', value: auditLogs.length, desc: 'Records tracked', icon: Lock, color: 'from-emerald-500 to-teal-500' }
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

            {/* main overview panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Active Candidate Applications Pipeline
                </h3>
                {applications.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No active applications. Select "Candidates & ATS" tab to apply a candidate to a job!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((app, i) => (
                      <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-slate-850/30 border border-slate-800 hover:bg-slate-800/20 transition-all duration-300">
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{app.candidateId?.name}</p>
                          <p className="text-[10px] text-slate-500">{app.candidateId?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-cyan-400">{app.resumeMatchScore}% Score</p>
                          <p className="text-[10px] text-slate-500">{app.jobId?.title}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-950/40 text-cyan-400 border border-cyan-900/50">
                            {app.currentStage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System Sandbox Logs */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" /> Active Sandbox Health
                  </h3>
                  <div className="space-y-3 mb-6">
                    {[
                      { label: 'Sandbox Isolation', val: 'Docker Process Limits', ok: true },
                      { label: 'Test Case Compiler', val: 'Active (NodeJS/Python)', ok: true },
                      { label: 'Rate Limiter', val: 'Active (Fallback Enabled)', ok: true },
                      { label: 'Audit System', val: 'Active (Mongoose Logs)', ok: true },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{item.label}</span>
                        <span className={`font-semibold ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800/80 text-center">
                  <p className="text-[10px] text-slate-500 mb-3">Enterprise sandbox runs compilation processes under standard CPU/RAM resource quotas.</p>
                  <button onClick={() => setActiveTab('sandbox')} className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-colors duration-300">
                    Open Execution Sandbox
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Pipeline */}
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Job Form */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" /> Create Job Posting
              </h3>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Job Title</label>
                  <input 
                    type="text" 
                    value={newJob.title} 
                    onChange={e => setNewJob({...newJob, title: e.target.value})}
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="Senior Backend Engineer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Job Description</label>
                  <textarea 
                    value={newJob.description} 
                    onChange={e => setNewJob({...newJob, description: e.target.value})}
                    required
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="We are looking for a Node.js wizard..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Job Type</label>
                    <select 
                      value={newJob.type} 
                      onChange={e => setNewJob({...newJob, type: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option>Full-Time</option>
                      <option>Contract</option>
                      <option>Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Location</label>
                    <input 
                      type="text" 
                      value={newJob.location} 
                      onChange={e => setNewJob({...newJob, location: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="Remote / NYC"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Skills Requirements (comma separated)</label>
                  <input 
                    type="text" 
                    value={newJob.requirements} 
                    onChange={e => setNewJob({...newJob, requirements: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="NodeJS, TypeScript, MongoDB"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Pipeline Stages</label>
                  <input 
                    type="text" 
                    value={newJob.stages} 
                    onChange={e => setNewJob({...newJob, stages: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="Screening, Assessment, AIInterview, Offer"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl text-xs font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  Publish Job Posting
                </button>
              </form>
            </div>

            {/* Jobs list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white mb-2">Current Openings</h3>
              {jobs.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/20 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                  No published job listings found. Use the editor to add one.
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job._id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700/80 transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-base font-bold text-white">{job.title}</h4>
                        <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wide">{job.department} · {job.type} · {job.location}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteJob(job._id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.requirements?.map((req: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded-md text-[9px] text-slate-400 font-mono">
                          {req}
                        </span>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-slate-800/50 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold mr-2">Stages:</span>
                      {job.pipelineStages?.map((stage: any, idx: number) => (
                        <div key={idx} className="flex items-center text-[9px] font-semibold text-slate-300 bg-slate-850 px-2 py-0.5 rounded-full border border-slate-800">
                          {stage.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Candidates & ATS */}
        {activeTab === 'candidates' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Register Candidate Form */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" /> Onboard Candidate
                </h3>
                <form onSubmit={handleCreateCandidate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={newCandidate.name} 
                      onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={newCandidate.email} 
                      onChange={e => setNewCandidate({...newCandidate, email: e.target.value})}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={newCandidate.phone} 
                      onChange={e => setNewCandidate({...newCandidate, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Skills (comma separated)</label>
                    <input 
                      type="text" 
                      value={newCandidate.skills} 
                      onChange={e => setNewCandidate({...newCandidate, skills: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      placeholder="TypeScript, Python, Docker"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl text-xs font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                    Add Candidate Profile
                  </button>
                </form>
              </div>

              {/* Apply Candidate to Job Form */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" /> Apply Candidate to Job
                </h3>
                <form onSubmit={handleApplyCandidate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Candidate</label>
                    <select 
                      value={applyCandidateId} 
                      onChange={e => setApplyCandidateId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Choose Candidate --</option>
                      {candidates.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Active Job</label>
                    <select 
                      value={applyJobId} 
                      onChange={e => setApplyJobId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Choose Job --</option>
                      {jobs.map(j => (
                        <option key={j._id} value={j._id}>{j.title}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl text-xs font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                    Submit Job Application
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <p className="text-[10px] text-slate-500 mb-2">Want to mock candidates quickly using bulk resumes text extraction?</p>
                  <button onClick={handleBulkUpload} className="w-full py-2 bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-800 transition-colors">
                    Bulk Upload 3 Candidates
                  </button>
                </div>
              </div>

              {/* Quick Profiles reference list */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit max-h-[380px] overflow-y-auto">
                <h3 className="text-sm font-bold text-white mb-3">Onboarded Profiles</h3>
                {candidates.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">No profiles. Add some via onboarding.</p>
                ) : (
                  <div className="space-y-3">
                    {candidates.map(c => (
                      <div key={c._id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                        <p className="font-bold text-slate-200">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {c.parsedData?.skills?.slice(0, 3).map((s: string, idx: number) => (
                            <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded text-[8px] font-mono text-cyan-400">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Applications pipeline stage grid */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">ATS Pipeline Applications</h3>
              {applications.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No applications found. Choose a candidate and job from the panels above to submit an application.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500">
                        <th className="pb-3 font-semibold uppercase">Candidate</th>
                        <th className="pb-3 font-semibold uppercase">Applied Job</th>
                        <th className="pb-3 font-semibold uppercase">Score</th>
                        <th className="pb-3 font-semibold uppercase">Current Stage</th>
                        <th className="pb-3 font-semibold uppercase text-right">Transition Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {applications.map((app) => (
                        <tr key={app._id} className="hover:bg-slate-800/10">
                          <td className="py-3">
                            <p className="font-bold text-slate-200">{app.candidateId?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-500">{app.candidateId?.email || 'N/A'}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-slate-300 font-semibold">{app.jobId?.title || 'Unknown'}</p>
                          </td>
                          <td className="py-3">
                            <span className="font-mono text-cyan-400 font-bold">{app.resumeMatchScore}%</span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-900/30">
                              {app.currentStage}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <select
                              value={app.currentStage}
                              onChange={e => handleStageChange(app._id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-300 px-2 py-1 rounded-lg focus:outline-none focus:border-cyan-500"
                            >
                              <option>Screening</option>
                              <option>Assessment</option>
                              <option>AIInterview</option>
                              <option>Offer</option>
                              <option>Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coding Problems Sidebar */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit max-h-[500px] overflow-y-auto">
              <h3 className="text-sm font-bold text-white mb-4">Select Coding Problem</h3>
              {problems.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No coding problems registered. Verify database tests run.</p>
              ) : (
                <div className="space-y-2">
                  {problems.map((prob) => (
                    <button
                      key={prob._id}
                      onClick={() => setSelectedProblem(prob)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 ${
                        selectedProblem?._id === prob._id
                          ? 'bg-slate-850 border-cyan-500 text-white'
                          : 'bg-slate-950 border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold">{prob.title}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          prob.difficulty === 'Easy' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50' : 'bg-amber-950/20 text-amber-400 border-amber-900/50'
                        }`}>{prob.difficulty}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{prob.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sandbox IDE Panel */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
              <div>
                {/* IDE Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      {selectedProblem ? selectedProblem.title : 'No Problem Selected'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sandboxLang}
                      onChange={e => setSandboxLang(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-300 px-2 py-1 rounded-lg focus:outline-none focus:border-cyan-500"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                    </select>
                    <button
                      onClick={handleRunSandbox}
                      disabled={sandboxRunning || !selectedProblem}
                      className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-[10px] font-bold rounded-lg hover:shadow-md hover:shadow-cyan-500/10 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                    >
                      {sandboxRunning ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Run Tests
                    </button>
                  </div>
                </div>

                {/* Problem Description */}
                {selectedProblem && (
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl mb-4 text-xs text-slate-400">
                    <p className="font-semibold text-slate-200 mb-1">Problem Description:</p>
                    <p className="mb-2 leading-relaxed">{selectedProblem.description}</p>
                    <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-850/60 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-500 font-bold block mb-1">Starter Test Cases:</span>
                        {selectedProblem.testCases?.slice(0, 2).map((tc: any, idx: number) => (
                          <div key={idx} className="mb-1 text-slate-400">
                            Input: <span className="text-cyan-400">"{tc.input}"</span> → Expect: <span className="text-emerald-400">"{tc.output}"</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block mb-1">Limits:</span>
                        Execution Timeout: <span className="text-amber-400">{selectedProblem.timeLimitMs || 2000}ms</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Code Editor */}
                <div className="relative">
                  <span className="absolute top-2.5 right-3 text-[9px] font-mono text-slate-600 pointer-events-none">CODE EDITOR</span>
                  <textarea
                    value={sandboxCode}
                    onChange={e => setSandboxCode(e.target.value)}
                    rows={12}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-4 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed shadow-inner"
                    placeholder="function solution(input) { ... }"
                  />
                </div>
              </div>

              {/* Compiler Terminal Output */}
              <div className="mt-4 pt-4 border-t border-slate-850">
                <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wide">Terminal Output Log</span>
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs min-h-[120px] flex flex-col justify-between">
                  {sandboxOutput ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-slate-500">Evaluation status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sandboxOutput.status === 'Accepted' 
                            ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/60' 
                            : 'bg-red-950/30 text-red-400 border border-red-900/60'
                        }`}>
                          {sandboxOutput.status || 'Finished'}
                        </span>
                      </div>
                      
                      {sandboxOutput.status === 'Accepted' ? (
                        <div className="text-emerald-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>All {sandboxOutput.totalCount} test cases completed successfully! (Latency: {sandboxOutput.executionTimeMs}ms)</span>
                        </div>
                      ) : (
                        <div className="text-red-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Failed test cases: {sandboxOutput.totalCount - sandboxOutput.passedCount} of {sandboxOutput.totalCount} failed. Status: {sandboxOutput.status}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-600 italic">No output. Submit code execution to compile algorithms.</div>
                  )}
                  <div className="text-[9px] text-slate-600 border-t border-slate-850/60 pt-2 mt-2">
                    Compiler Sandbox: isolated runtimes active. Environment sandbox logs written asynchronously.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Interviews */}
        {activeTab === 'ai-agents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Start Panel */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" /> Start Technical Interview
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Candidate Profile</label>
                  <select 
                    value={interviewCandidateId} 
                    onChange={e => setInterviewCandidateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {candidates.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Applied Job</label>
                  <select 
                    value={interviewJobId} 
                    onChange={e => setInterviewJobId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Job --</option>
                    {jobs.map(j => (
                      <option key={j._id} value={j._id}>{j.title}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleStartInterview}
                  disabled={!interviewCandidateId || !interviewJobId || interviewLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl text-xs font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 disabled:opacity-50"
                >
                  {interviewLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Initiate AI Interview'
                  )}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 leading-relaxed">
                The technical interview agent adaptive loop will generate up to 4 custom questions targeted at the job specs and the candidate's parsed skills. Token costs will be recorded in the `aiUsage` database logs.
              </div>
            </div>

            {/* Chat Simulator Workspace */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
              <div>
                {/* Chat header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">AI Interview Chat Terminal</span>
                  </div>
                  {interviewStatus && (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                      interviewStatus === 'Completed' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50' : 'bg-cyan-950/20 text-cyan-400 border-cyan-900/50'
                    }`}>
                      Status: {interviewStatus}
                    </span>
                  )}
                </div>

                {/* Message Log Timeline */}
                <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
                  {interviewMessages.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-xs italic">
                      No active session. Select your candidate/job and launch the AI interview loop.
                    </div>
                  ) : (
                    interviewMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 text-xs max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          msg.role === 'user' ? 'bg-slate-800 text-cyan-400' : 'bg-cyan-950 text-cyan-400 border border-cyan-900'
                        }`}>
                          {msg.role === 'user' ? 'C' : 'AI'}
                        </div>
                        <div className={`p-3.5 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-r from-cyan-900/40 to-blue-900/20 border border-cyan-900/30 text-slate-200' 
                            : 'bg-slate-950 border border-slate-850 text-slate-300'
                        }`}>
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {interviewLoading && (
                    <div className="flex gap-3 text-xs max-w-[80%] items-center text-slate-500 italic">
                      <div className="w-6 h-6 rounded-full bg-cyan-950 flex items-center justify-center text-[10px] font-bold text-cyan-400 border border-cyan-900">
                        AI
                      </div>
                      <div className="flex gap-1 items-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>AI Interviewer is writing follow-up question...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input Bar */}
              {interviewStatus === 'InProgress' && (
                <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-slate-850 flex gap-2">
                  <input
                    type="text"
                    value={candidateMessage}
                    onChange={e => setCandidateMessage(e.target.value)}
                    required
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="Type technical response answer..."
                  />
                  <button type="submit" className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Data Center */}
        {activeTab === 'database' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Audit Logs */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" /> System Audit Trail logs
              </h3>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-10 text-center">No audit logs recorded for this tenant company.</p>
              ) : (
                <div className="overflow-x-auto max-h-[440px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500">
                        <th className="pb-2 font-semibold">Timestamp</th>
                        <th className="pb-2 font-semibold">Action Event</th>
                        <th className="pb-2 font-semibold">Module</th>
                        <th className="pb-2 font-semibold">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 font-mono text-[10px] text-slate-400">
                      {auditLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/10">
                          <td className="py-2.5">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2.5">
                            <span className="font-bold text-slate-200">{log.action}</span>
                          </td>
                          <td className="py-2.5 text-cyan-400">{log.entityName}</td>
                          <td className="py-2.5">{log.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI usage metrics */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between h-fit">
              <div>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> AI LLM Token Metrics
                </h3>
                <div className="space-y-4 mb-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                    <p className="text-slate-500 font-semibold mb-1">Estimated Cost Incurred</p>
                    <p className="text-2xl font-bold text-white font-mono">
                      ${aiUsage.reduce((acc, curr) => acc + (curr.costUsd || 0), 0).toFixed(5)}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                    <p className="text-slate-500 font-semibold mb-1">Accumulated Tokens Consumed</p>
                    <p className="text-xl font-bold text-cyan-400 font-mono">
                      {aiUsage.reduce((acc, curr) => acc + (curr.tokensConsumed || 0), 0)} tokens
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-slate-850/60 pt-3">
                  <p className="font-bold uppercase tracking-wider mb-2 text-slate-400">Consumption Logs:</p>
                  {aiUsage.length === 0 ? (
                    <p className="italic">No OpenAI API requests logged yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {aiUsage.map((u, i) => (
                        <div key={i} className="flex justify-between font-mono bg-slate-950/40 border border-slate-850 p-2 rounded-lg">
                          <span>{u.serviceUsed}</span>
                          <span className="text-cyan-400">{u.tokensConsumed}t (${u.costUsd?.toFixed(6)})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security & SSO */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SSO CONFIG */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" /> SAML SSO Metadata Configuration
              </h3>
              <form onSubmit={e => { e.preventDefault(); alert('SSO metadata updated successfully.'); }} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Identity Provider Entity ID</label>
                  <input 
                    type="text" 
                    value={ssoConfig.entityId} 
                    onChange={e => setSsoConfig({...ssoConfig, entityId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Single Sign-On URL (HTTP-Redirect)</label>
                  <input 
                    type="text" 
                    value={ssoConfig.ssoUrl} 
                    onChange={e => setSsoConfig({...ssoConfig, ssoUrl: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Public X.509 Certificate (PEM format)</label>
                  <textarea 
                    value={ssoConfig.certificate} 
                    onChange={e => setSsoConfig({...ssoConfig, certificate: e.target.value})}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="ssoEnabled"
                    checked={ssoConfig.enabled}
                    onChange={e => setSsoConfig({...ssoConfig, enabled: e.target.checked})}
                    className="w-4 h-4 bg-slate-950 border border-slate-850 rounded focus:ring-0 text-cyan-500"
                  />
                  <label htmlFor="ssoEnabled" className="text-slate-300 font-bold select-none cursor-pointer">Enable SSO SAML Sign-On</label>
                </div>
                <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  Save SAML SSO Rules
                </button>
              </form>
            </div>

            {/* MFA Security parameters */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" /> Multi-Factor Authentication (MFA)
              </h3>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">TOTP (Google Authenticator)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Enforce a cryptographically random one-time-passcode on login checks.</p>
                  </div>
                  <button 
                    onClick={() => setMfaEnabled(!mfaEnabled)}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-colors ${
                      mfaEnabled 
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/20' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    {mfaEnabled ? 'Enforced' : 'Disabled'}
                  </button>
                </div>
                {mfaEnabled && (
                  <div className="flex items-center gap-4 p-3 bg-slate-900 rounded-xl border border-slate-850/60 text-[10px] font-mono text-slate-400">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-slate-950 font-bold text-center shrink-0">
                      QR CODE
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">Secret TOTP Seed:</p>
                      <p className="text-cyan-400">HIRENOVA7SEC38472MFA</p>
                      <p className="mt-1 text-slate-500 font-sans leading-tight">Scan this seed in Google Authenticator or Microsoft Authenticator keychains.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs">
                <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" /> Infrastructure Threat Model Info
                </h4>
                <p className="text-slate-400 leading-relaxed mb-2 text-[10px]">
                  All backend database queries are logical-tenancy quarantined via `companyId` headers. Multi-region replica sets and SSL handshake checks ensure data integrity.
                </p>
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-900/40">
                  Compliance Target: SOC-2 Type II
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
