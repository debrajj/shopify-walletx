import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  Coins, 
  CreditCard, 
  Activity, 
  TrendingUp,
  Users,
  ArrowRight,
  X,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import StatCard from '../components/StatCard';
import TransactionTable from '../components/TransactionTable';
import { api } from '../services/api';
import { DashboardStats, Transaction } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bonus Modal State
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusForm, setBonusForm] = useState({ phone: '', coins: '', description: '' });
  const [bonusStatus, setBonusStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS'>('IDLE');

  const loadData = async () => {
    try {
      const [statsData, txnsResponse, chart] = await Promise.all([
        api.getStats(),
        api.getTransactions({ page: 1, limit: 5 }),
        api.getRevenueData()
      ]);
      setStats(statsData);
      setRecentTransactions(txnsResponse.data);
      setChartData(chart);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setBonusStatus('SUBMITTING');
    try {
      await api.addCoins({
        phone: bonusForm.phone,
        coins: parseFloat(bonusForm.coins),
        description: bonusForm.description || 'Bonus issued from Dashboard'
      });
      setBonusStatus('SUCCESS');
      setTimeout(() => {
        setShowBonusModal(false);
        setBonusStatus('IDLE');
        setBonusForm({ phone: '', coins: '', description: '' });
        loadData(); // Refresh stats
      }, 1500);
    } catch (err) {
      console.error(err);
      setBonusStatus('IDLE');
      alert('Failed to issue bonus. Please check inputs.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back! Here's what's happening with your wallet program.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowBonusModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Coins className="h-4 w-4" />
            Issue Bonus
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white shadow-md shadow-slate-900/10 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Wallets" 
            value={stats.totalWallets.toLocaleString()} 
            icon={Users} 
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard 
            title="Coins in Circulation" 
            value={stats.totalCoinsInCirculation.toLocaleString()} 
            icon={Coins} 
            trend={{ value: 4, isPositive: true }}
          />
          <StatCard 
            title="Transactions Today" 
            value={stats.totalTransactionsToday} 
            icon={CreditCard} 
            trend={{ value: 2, isPositive: false }}
          />
          <StatCard 
            title="OTP Success Rate" 
            value={`${stats.otpSuccessRate}%`} 
            icon={Activity} 
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 Usage Trends
               </h2>
               <p className="text-sm text-slate-500">Daily coin consumption over the last week</p>
            </div>
            <select className="text-sm border-none bg-slate-50 rounded-lg py-1.5 pl-3 pr-8 focus:ring-0 text-slate-600 font-medium">
               <option>Last 7 Days</option>
               <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ color: '#10b981', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
           <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
             <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
             <div className="grid grid-cols-1 gap-3">
                {[
                   { label: 'Issue Bonus Coins', icon: Coins, desc: 'Send coins to specific users', action: () => setShowBonusModal(true) },
                   { label: 'Review Flagged Users', icon: Users, desc: '2 users require attention' },
                   { label: 'Configure Auto-Refill', icon: Activity, desc: 'Manage automated rules' }
                ].map((action, i) => (
                   <button 
                    key={i} 
                    onClick={action.action}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-100 transition-all group text-left w-full"
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-white shadow-sm text-slate-400 group-hover:text-emerald-600 transition-colors">
                            <action.icon className="h-5 w-5" />
                         </div>
                         <div>
                            <p className="font-semibold text-sm text-slate-700 group-hover:text-emerald-800">{action.label}</p>
                            <p className="text-xs text-slate-500">{action.desc}</p>
                         </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
                   </button>
                ))}
             </div>
           </div>
           
           <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-md text-white">
               <h3 className="font-semibold mb-4">System Status</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-slate-300">SMS Gateway</span>
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Operational
                     </span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-slate-300">Webhooks</span>
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active
                     </span>
                  </div>
               </div>
           </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
           <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">View All</button>
        </div>
        <TransactionTable transactions={recentTransactions} />
      </div>

      {/* Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in relative ring-1 ring-slate-900/5">
            {bonusStatus === 'SUCCESS' ? (
              <div className="p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Coins Added!</h3>
                <p className="text-slate-500">Successfully added {bonusForm.coins} coins to {bonusForm.phone}.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                  <div className="flex gap-3">
                     <div className="mt-0.5 p-2 bg-emerald-100/50 rounded-lg text-emerald-600 border border-emerald-100">
                        <Gift className="h-5 w-5" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">Issue Bonus Coins</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Manually credit a customer's wallet.</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setShowBonusModal(false)} 
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleIssueBonus} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Customer Phone</label>
                    <input 
                      type="text" 
                      required
                      placeholder="+15550000000"
                      value={bonusForm.phone}
                      onChange={(e) => setBonusForm({...bonusForm, phone: e.target.value})}
                      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Amount (Coins)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="e.g. 50"
                        value={bonusForm.coins}
                        onChange={(e) => setBonusForm({...bonusForm, coins: e.target.value})}
                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 pl-3 pr-10"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-slate-400 text-sm">pts</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Reason / Note</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Loyalty Reward"
                      value={bonusForm.description}
                      onChange={(e) => setBonusForm({...bonusForm, description: e.target.value})}
                      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3"
                    />
                  </div>
                  <div className="pt-3 flex justify-end gap-3 border-t border-slate-50 mt-2">
                    <button 
                      type="button"
                      onClick={() => setShowBonusModal(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={bonusStatus === 'SUBMITTING'}
                      className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {bonusStatus === 'SUBMITTING' ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        'Issue Coins'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;