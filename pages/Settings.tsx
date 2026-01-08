import React, { useEffect, useState } from 'react';
import { Save, AlertCircle, Database, Server, CheckCircle2, ShieldAlert } from 'lucide-react';
import Toggle from '../components/Toggle';
import { api } from '../services/api';
import { AppSettings } from '../types';
import { ApiContractViewer, PageContract } from '../components/ApiContractViewer.tsx';

// --- API Contracts Definition ---
const API_CONTRACTS: PageContract[] = [
  {
    pageName: "Dashboard",
    endpoints: [
      {
        method: "GET",
        path: "/stats",
        description: "Fetch aggregate statistics for dashboard cards.",
        responseBody: {
          totalWallets: 1245,
          totalCoinsInCirculation: 45200,
          totalTransactionsToday: 84,
          otpSuccessRate: 98.2
        }
      },
      {
        method: "GET",
        path: "/revenue",
        description: "Fetch revenue/usage data for the area chart.",
        responseBody: [
          { name: "Mon", value: 4000 },
          { name: "Tue", value: 3000 }
        ]
      }
    ]
  },
  {
    pageName: "Transactions (Paginated)",
    endpoints: [
      {
        method: "GET",
        path: "/transactions?page={page}&limit={limit}&search={query}",
        description: "Fetch paginated transaction history.",
        responseBody: {
          data: [
             { id: "TXN-1", order_id: "#1001", customer_name: "Alice", coins: 100, type: "CREDIT", created_at: "2023-10-01" }
          ],
          meta: {
             current_page: 1,
             last_page: 5,
             total: 50,
             per_page: 10
          }
        }
      }
    ]
  },
  {
    pageName: "Customers",
    endpoints: [
      {
        method: "GET",
        path: "/customers/search?q={query}",
        description: "Search for a customer by phone or name.",
        responseBody: {
          id: "CUST-123",
          name: "Alice Smith",
          phone: "+1 (555) 000-1000",
          balance: 1540,
          total_orders: 12,
          total_spent: 3450.50,
          total_coins_used: 450
        }
      },
      {
        method: "GET",
        path: "/customers/{id}/transactions",
        description: "Get transaction history for a specific customer.",
        responseBody: [
           { id: "TXN-1", coins: 50, type: "CREDIT", status: "COMPLETED", created_at: "2023-10-01T12:00:00Z" }
        ]
      }
    ]
  },
  {
    pageName: "Automations & Analytics",
    endpoints: [
      {
        method: "GET",
        path: "/automations",
        description: "List all scheduled automation jobs.",
        responseBody: [
           { id: "JOB-1", name: "Expiry Warning", condition_type: "EXPIRY_WARNING", status: "ACTIVE" }
        ]
      },
      {
        method: "GET",
        path: "/automations/analytics?period={DAILY|MONTHLY}",
        description: "Fetch performance metrics for automations tab.",
        responseBody: {
          summary: {
             totalSent: 1500,
             totalConverted: 300,
             conversionRate: 20.0,
             revenueGenerated: 12000
          },
          chartData: [
             { label: "Mon", sent: 100, converted: 20 }
          ]
        }
      }
    ]
  }
];

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'API'>('GENERAL');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
        if (data.useCustomApi) {
          setActiveTab('API');
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.updateSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header with Save */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-50 py-4 z-10 border-b border-slate-200/50 backdrop-blur-sm">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">App Settings</h1>
           <p className="text-sm text-slate-500 mt-1">Configure your wallet logic and data sources</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
            saving ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'GENERAL'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Database className="h-4 w-4" />
            General Config
          </button>
          <button
            onClick={() => setActiveTab('API')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'API'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Server className="h-4 w-4" />
            Custom API Integration
          </button>
        </div>
      </div>

      {/* Tab Content: GENERAL */}
      {activeTab === 'GENERAL' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">Core Features</h2>
              <p className="text-sm text-slate-500 mt-1">Control the core features of the Wallet application.</p>
            </div>
            <div className="p-6 divide-y divide-slate-100">
              <Toggle 
                label="Enable Wallet Payment" 
                description="Allow customers to pay using their wallet balance on checkout."
                checked={settings.isWalletEnabled}
                onChange={(v) => setSettings({ ...settings, isWalletEnabled: v })}
              />
              <Toggle 
                label="Require OTP Verification" 
                description="Send SMS OTP to verify ownership before deducting coins."
                checked={settings.isOtpEnabled}
                onChange={(v) => setSettings({ ...settings, isOtpEnabled: v })}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">Wallet Rules</h2>
              <p className="text-sm text-slate-500 mt-1">Set limits and expiration rules for wallet usage.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    OTP Expiry (Seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.otpExpirySeconds}
                    onChange={(e) => setSettings({ ...settings, otpExpirySeconds: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Wallet Usage (%)
                  </label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={settings.maxWalletUsagePercent}
                    onChange={(e) => setSettings({ ...settings, maxWalletUsagePercent: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-900">SMS Provider</h2>
              <p className="text-sm text-slate-500 mt-1">Configure the gateway used for sending OTPs.</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Provider Service
                </label>
                <select
                  value={settings.smsProvider}
                  onChange={(e) => setSettings({ ...settings, smsProvider: e.target.value as any })}
                  className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border bg-white"
                >
                  <option value="TWILIO">Twilio</option>
                  <option value="AWS_SNS">AWS SNS</option>
                  <option value="MSG91">MSG91</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key / Auth Token
                </label>
                <input
                  type="password"
                  value={settings.smsApiKey}
                  onChange={(e) => setSettings({ ...settings, smsApiKey: e.target.value })}
                  className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: API INTEGRATION */}
      {activeTab === 'API' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Toggle & Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                  <h2 className="text-lg font-semibold text-slate-900">Custom API Configuration</h2>
                  <p className="text-sm text-slate-500 mt-1">Connect the admin panel to your own backend.</p>
               </div>
               <div className="flex items-center gap-3">
                 <span className={`text-sm font-medium ${settings.useCustomApi ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {settings.useCustomApi ? 'Enabled' : 'Disabled'}
                 </span>
                 <Toggle 
                   label="" 
                   checked={settings.useCustomApi} 
                   onChange={(v) => setSettings({ ...settings, useCustomApi: v })} 
                 />
               </div>
            </div>
            
            <div className={`p-6 space-y-6 transition-all duration-300 ${!settings.useCustomApi ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Base URL</label>
                 <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                      https://
                    </span>
                    <input 
                      type="text" 
                      placeholder="api.yourdomain.com/v1"
                      value={settings.customApiConfig.baseUrl.replace('https://', '')}
                      onChange={(e) => setSettings({
                        ...settings,
                        customApiConfig: { ...settings.customApiConfig, baseUrl: `https://${e.target.value.replace('https://', '')}` }
                      })}
                      className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-md border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                 </div>
                 <p className="mt-1.5 text-xs text-slate-500">The root URL for all endpoints defined in the spec.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Auth Header Key</label>
                    <input 
                      type="text"
                      placeholder="Authorization"
                      value={settings.customApiConfig.authHeaderKey}
                      onChange={(e) => setSettings({
                        ...settings,
                        customApiConfig: { ...settings.customApiConfig, authHeaderKey: e.target.value }
                      })}
                      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Auth Value / Token</label>
                    <input 
                      type="password"
                      placeholder="Bearer eyJhbGciOi..."
                      value={settings.customApiConfig.authHeaderValue}
                      onChange={(e) => setSettings({
                        ...settings,
                        customApiConfig: { ...settings.customApiConfig, authHeaderValue: e.target.value }
                      })}
                      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 px-3 border"
                    />
                 </div>
              </div>
            </div>
          </div>

          {/* Integration Guide / Specs */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Integration Guide</h2>
                <p className="text-sm text-slate-600 mt-2">
                   To successfully integrate, your backend must implement the following endpoints. 
                   Ensure the request/response structure matches exactly.
                </p>
             </div>
             <div className="p-6">
                <ApiContractViewer contracts={API_CONTRACTS} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;