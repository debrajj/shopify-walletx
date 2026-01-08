import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Bell, 
  Clock, 
  Trash2, 
  Power, 
  MessageSquare, 
  Smartphone,
  BarChart2,
  List,
  TrendingUp,
  CheckCircle2,
  Send,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../services/api';
import { AutomationJob, AutomationAnalytics } from '../types';

type ViewMode = 'JOBS' | 'ANALYTICS';
type TimePeriod = 'DAILY' | 'MONTHLY' | 'YEARLY';

const Automations: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('JOBS');
  const [period, setPeriod] = useState<TimePeriod>('DAILY');
  
  // Jobs State
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState<Partial<AutomationJob>>({
    name: '',
    condition_type: 'EXPIRY_WARNING',
    condition_value: 7,
    action_channel: 'SMS',
    status: 'ACTIVE'
  });

  // Analytics State
  const [analytics, setAnalytics] = useState<AutomationAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (viewMode === 'JOBS') {
      fetchJobs();
    } else {
      fetchAnalytics();
    }
  }, [viewMode, period]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const data = await api.getAutomationJobs();
      setJobs(data);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await api.getAutomationAnalytics(period);
      setAnalytics(data);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await api.toggleAutomationJob(id, newStatus);
    setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    await api.deleteAutomationJob(id);
    setJobs(jobs.filter(j => j.id !== id));
  };

  const handleCreate = async () => {
    if (!newJob.name || !newJob.condition_value) return;
    setJobsLoading(true);
    const created = await api.saveAutomationJob(newJob as Omit<AutomationJob, 'id'>);
    setJobs([...jobs, created]);
    setShowModal(false);
    setJobsLoading(false);
    setNewJob({
        name: '',
        condition_type: 'EXPIRY_WARNING',
        condition_value: 7,
        action_channel: 'SMS',
        status: 'ACTIVE'
    });
  };

  const getConditionText = (job: AutomationJob) => {
    switch (job.condition_type) {
        case 'EXPIRY_WARNING': return `Coins expiring within ${job.condition_value} days`;
        case 'LOW_BALANCE': return `Balance drops below ${job.condition_value} coins`;
        case 'INACTIVE_USER': return `No activity for ${job.condition_value} days`;
        default: return 'Unknown Condition';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage scheduled jobs and track their performance.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('JOBS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'JOBS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="h-4 w-4" />
            Manage Jobs
          </button>
          <button
            onClick={() => setViewMode('ANALYTICS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'ANALYTICS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Performance Reports
          </button>
        </div>
      </div>

      {/* VIEW: JOBS */}
      {viewMode === 'JOBS' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create New Job
            </button>
          </div>

          {jobsLoading && jobs.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-md hover:border-emerald-200/50">
                    <div className="flex items-start gap-4 w-full">
                        <div className={`p-3 rounded-lg ${job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{job.name}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                Condition: <span className="font-medium text-slate-700">{getConditionText(job)}</span>
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    {job.action_channel === 'SMS' ? <Smartphone className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                    <span>Sends {job.action_channel}</span>
                                </div>
                                {job.last_run && (
                                    <span className="text-xs text-slate-400">Last run: {new Date(job.last_run).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button 
                            onClick={() => handleToggle(job.id, job.status)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                job.status === 'ACTIVE' 
                                ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            <Power className="h-4 w-4" />
                            {job.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                            onClick={() => handleDelete(job.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                    <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">No Automations Configured</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Create a scheduled job to automatically notify customers about expiring points or low balances.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ANALYTICS */}
      {viewMode === 'ANALYTICS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Time Filter */}
          <div className="flex justify-end">
             <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                {(['DAILY', 'MONTHLY', 'YEARLY'] as TimePeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      period === p 
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
             </div>
          </div>

          {analyticsLoading ? (
             <div className="flex h-64 items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
             </div>
          ) : analytics ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Send className="h-5 w-5" />
                       </div>
                       <span className="text-sm font-medium text-slate-500">Messages Sent</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{analytics.summary.totalSent.toLocaleString()}</p>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <CheckCircle2 className="h-5 w-5" />
                       </div>
                       <span className="text-sm font-medium text-slate-500">Conversions</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <p className="text-3xl font-bold text-slate-900">{analytics.summary.totalConverted.toLocaleString()}</p>
                       <span className="text-sm text-slate-400">purchases</span>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                          <TrendingUp className="h-5 w-5" />
                       </div>
                       <span className="text-sm font-medium text-slate-500">Conversion Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{analytics.summary.conversionRate}%</p>
                 </div>
              </div>

              {/* Main Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-900 mb-6">Engagement & Conversion Growth</h3>
                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={analytics.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                             dataKey="label" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: '#64748b', fontSize: 12 }} 
                             dy={10} 
                          />
                          <YAxis 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: '#64748b', fontSize: 12 }} 
                          />
                          <Tooltip 
                             cursor={{ fill: '#f8fafc' }}
                             contentStyle={{ 
                                backgroundColor: '#fff', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                             }}
                          />
                          <Legend iconType="circle" />
                          <Bar name="Messages Sent" dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar name="Conversions" dataKey="converted" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in relative">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h2 className="text-lg font-bold text-slate-900">Create Automation Job</h2>
                 <button 
                    onClick={() => setShowModal(false)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all"
                 >
                    <X className="h-5 w-5" />
                 </button>
              </div>
              <div className="p-6 space-y-5">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Name</label>
                    <input 
                        type="text" 
                        value={newJob.name}
                        onChange={(e) => setNewJob({...newJob, name: e.target.value})}
                        className="block w-full rounded-lg border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border text-sm shadow-sm"
                        placeholder="e.g. Monthly Expiry Warning"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trigger Condition</label>
                    <div className="relative">
                        <select 
                            value={newJob.condition_type}
                            onChange={(e) => setNewJob({...newJob, condition_type: e.target.value as any})}
                            className="block w-full rounded-lg border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border bg-white text-sm shadow-sm appearance-none"
                        >
                            <option value="EXPIRY_WARNING">Points Expiring In (Days)</option>
                            <option value="LOW_BALANCE">Balance Below (Coins)</option>
                            <option value="INACTIVE_USER">Inactive For (Days)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condition Value</label>
                    <input 
                        type="number" 
                        value={newJob.condition_value}
                        onChange={(e) => setNewJob({...newJob, condition_value: parseInt(e.target.value) || 0})}
                        className="block w-full rounded-lg border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border text-sm shadow-sm"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Notification Channel</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${newJob.action_channel === 'SMS' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                            <input 
                                type="radio" 
                                name="channel" 
                                checked={newJob.action_channel === 'SMS'}
                                onChange={() => setNewJob({...newJob, action_channel: 'SMS'})}
                                className="sr-only"
                            />
                            <Smartphone className={`h-5 w-5 ${newJob.action_channel === 'SMS' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium">SMS</span>
                            {newJob.action_channel === 'SMS' && (
                                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500"></div>
                            )}
                        </label>
                        <label className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${newJob.action_channel === 'WHATSAPP' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                            <input 
                                type="radio" 
                                name="channel" 
                                checked={newJob.action_channel === 'WHATSAPP'}
                                onChange={() => setNewJob({...newJob, action_channel: 'WHATSAPP'})}
                                className="sr-only"
                            />
                            <MessageSquare className={`h-5 w-5 ${newJob.action_channel === 'WHATSAPP' ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-sm font-medium">WhatsApp</span>
                            {newJob.action_channel === 'WHATSAPP' && (
                                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500"></div>
                            )}
                        </label>
                    </div>
                 </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors">Cancel</button>
                 <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20">Create Job</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Automations;