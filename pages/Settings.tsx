import React, { useEffect, useState } from 'react';
import { Save, AlertCircle, Database, Server, CheckCircle2, ShieldAlert, Play, RefreshCw, Copy } from 'lucide-react';
import Toggle from '../components/Toggle';
import { api } from '../services/api';
import { AppSettings } from '../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'API'>('GENERAL');
  
  // Test Tool State
  const [testPhone, setTestPhone] = useState('9999999999');
  const [testResult, setTestResult] = useState<{success: boolean; data?: any; message?: string} | null>(null);
  const [isTesting, setIsTesting] = useState(false);

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

  const handleTestConnection = async () => {
    if (!settings?.customApiConfig.walletBalanceUrl || !testPhone) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await api.testIntegration({
        url: settings.customApiConfig.walletBalanceUrl,
        authKey: settings.customApiConfig.authHeaderKey,
        authValue: settings.customApiConfig.authHeaderValue,
        testPhone: testPhone
      });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const expectedResponse = {
    "success": true,
    "walletCoins": 60,
    "currency": "INR"
  };

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
            Wallet Balance API
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
                  <h2 className="text-lg font-semibold text-slate-900">External Wallet Balance Sync</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Connect an external system to fetch the master balance for customers.
                  </p>
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
                 <label className="block text-sm font-medium text-slate-700 mb-2">Wallet Balance API URL</label>
                 <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                      URL
                    </span>
                    <input 
                      type="text" 
                      placeholder="https://api.yourdomain.com/v1/wallet/balance"
                      value={settings.customApiConfig.walletBalanceUrl}
                      onChange={(e) => setSettings({
                        ...settings,
                        customApiConfig: { ...settings.customApiConfig, walletBalanceUrl: e.target.value }
                      })}
                      className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-md border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                 </div>
                 <p className="mt-1.5 text-xs text-slate-500">
                    We will make a GET request to this URL with query parameters: <code>?phone=XXXXXXXXXX&shop=store.myshopify.com</code>
                 </p>
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

          {/* Test Tool & Documentation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Documentation */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
               <div className="p-5 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Expected API Response</h3>
                  <p className="text-xs text-slate-500 mt-1">Your API must return exactly this JSON format.</p>
               </div>
               <div className="p-5">
                  <div className="relative group">
                     <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800 leading-relaxed">
{JSON.stringify(expectedResponse, null, 2)}
                     </pre>
                     <button 
                       onClick={() => navigator.clipboard.writeText(JSON.stringify(expectedResponse, null, 2))}
                       className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                       title="Copy JSON"
                     >
                       <Copy className="h-3 w-3" />
                     </button>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <p>• <strong>success</strong>: Must be true for us to sync.</p>
                    <p>• <strong>walletCoins</strong>: The current balance (number).</p>
                    <p>• If the user doesn't exist in our system, we will create them with 0 coins initially, then sync with your API.</p>
                  </div>
               </div>
            </div>

            {/* Test Tool */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-5 border-b border-slate-200 bg-slate-50/30">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                     <RefreshCw className="h-4 w-4 text-slate-400" />
                     Test Connection
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Verify your API is reachable and returning correct data.</p>
               </div>
               <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                     <label className="block text-xs font-medium text-slate-700 mb-1.5">Test Phone Number</label>
                     <input 
                        type="text" 
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="9999999999"
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 border"
                     />
                  </div>

                  {testResult && (
                    <div className={`mb-4 p-3 rounded-lg text-xs font-mono border ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                       <p className="font-bold mb-1">{testResult.success ? 'SUCCESS' : 'FAILED'}</p>
                       <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(testResult.data || testResult.message, null, 2)}
                       </pre>
                    </div>
                  )}

                  <div className="mt-auto">
                     <button
                        onClick={handleTestConnection}
                        disabled={isTesting || !settings?.customApiConfig.walletBalanceUrl}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isTesting ? (
                           <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                           <Play className="h-4 w-4" />
                        )}
                        Test Request
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;