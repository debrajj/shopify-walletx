import { Wallet, Transaction, AppSettings, DashboardStats, CustomerSummary, AutomationJob, AutomationAnalytics, PaginatedResponse } from '../types';

const DEFAULT_API_BASE = '/api';
const STORAGE_KEY = 'shopwallet_api_config';

// --- API CLIENT ---

const getActiveConfig = (): { baseUrl: string; headers: Record<string, string> } => {
  let baseUrl = DEFAULT_API_BASE;
  let headers: Record<string, string> = {};
  
  // Extract shop URL from logged-in user to send as header for tenant identification in Admin API
  const userStr = localStorage.getItem('shopwallet_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.storeUrl) {
        headers['x-shop-url'] = user.storeUrl;
      }
    } catch (e) {
      // ignore
    }
  }
  
  return { baseUrl, headers };
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { baseUrl, headers: customHeaders } = getActiveConfig();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: { 
      'Content-Type': 'application/json',
      ...customHeaders,
      ...(options?.headers || {})
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Server returned ${response.status}`);
  }

  return data;
}

export const api = {
  // --- AUTHENTICATION ---
  auth: {
    login: async (email: string, password: string) => {
      return request<{ user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    // Updated Signup Signature
    signup: async (data: { name: string; email: string; password: string; storeName: string; storeUrl: string; shopifyAccessToken: string; shopifyApiKey: string }) => {
      return request<{ user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  // --- DASHBOARD ---
  getStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/stats');
  },

  getRevenueData: async (): Promise<{ name: string; value: number }[]> => {
    return request<{ name: string; value: number }[]>('/revenue');
  },

  // --- TRANSACTIONS ---
  getTransactions: async (params: { page: number; limit: number; search?: string } = { page: 1, limit: 10 }): Promise<PaginatedResponse<Transaction>> => {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      search: params.search || ''
    });
    return request<PaginatedResponse<Transaction>>(`/transactions?${query.toString()}`);
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    return request<Transaction[]>('/transactions/all');
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<AppSettings> => {
    const settings = await request<AppSettings>('/settings');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return settings;
  },

  updateSettings: async (settings: AppSettings): Promise<AppSettings> => {
    const updated = await request<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  testIntegration: async (config: { url: string; authKey: string; authValue: string; testPhone: string }) => {
    return request<{ success: boolean; data?: any; message?: string }>('/settings/test-integration', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  // --- CUSTOMERS ---
  searchCustomer: async (query: string): Promise<CustomerSummary | null> => {
    return request<CustomerSummary | null>(`/customers/search?q=${encodeURIComponent(query)}`);
  },

  getCustomerTransactions: async (customerId: string): Promise<Transaction[]> => {
    return request<Transaction[]>(`/customers/${customerId}/transactions`);
  },

  addCoins: async (data: { phone: string; coins: number; description?: string }): Promise<{ success: boolean; newBalance: number }> => {
    return request('/wallet/credit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // --- AUTOMATIONS ---
  getAutomationJobs: async (): Promise<AutomationJob[]> => {
    return request<AutomationJob[]>('/automations');
  },

  saveAutomationJob: async (job: Omit<AutomationJob, 'id'>): Promise<AutomationJob> => {
    return request<AutomationJob>('/automations', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  },

  deleteAutomationJob: async (id: string): Promise<void> => {
    return request<void>(`/automations/${id}`, { method: 'DELETE' });
  },

  toggleAutomationJob: async (id: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> => {
    return request<void>(`/automations/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
  },

  getAutomationAnalytics: async (period: 'DAILY' | 'MONTHLY' | 'YEARLY'): Promise<AutomationAnalytics> => {
    return request<AutomationAnalytics>(`/automations/analytics?period=${period}`);
  }
};