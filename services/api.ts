import { Transaction, AppSettings, DashboardStats, CustomerSummary, AutomationJob, AutomationAnalytics, PaginatedResponse } from '../types';
import { config } from '../config/env';

const DEFAULT_API_BASE = config.api.baseUrl;
const STORAGE_KEY = config.storage.apiConfigKey;

// --- API CLIENT ---

const getActiveConfig = (): { baseUrl: string; headers: Record<string, string> } => {
  let baseUrl = DEFAULT_API_BASE;
  let headers: Record<string, string> = {};
  
  // Extract shop URL from logged-in user to send as header for tenant identification in Admin API
  const userStr = localStorage.getItem(config.storage.userKey);
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.storeUrl) {
        // Normalize: remove http:// or https:// prefix
        const normalizedUrl = user.storeUrl.replace(/^https?:\/\//, '');
        headers['x-shop-url'] = normalizedUrl;
      }
    } catch (e) {
      // ignore
    }
  }
  
  // Fallback to default store for testing
  if (!headers['x-shop-url']) {
    headers['x-shop-url'] = 'cmstestingg.myshopify.com';
  }
  
  return { baseUrl, headers };
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { baseUrl, headers: customHeaders } = getActiveConfig();
  const url = `${baseUrl}${path}`;

  console.log('[API Request]', {
    url,
    method: options?.method || 'GET',
    headers: { ...customHeaders, ...(options?.headers || {}) }
  });

  const response = await fetch(url, {
    ...options,
    headers: { 
      'Content-Type': 'application/json',
      ...customHeaders,
      ...(options?.headers || {})
    },
  });

  // Check if response has content before trying to parse JSON
  const text = await response.text();
  console.log('[API Response]', {
    url,
    status: response.status,
    body: text.substring(0, 200)
  });
  
  let data;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch (jsonError) {
    console.error('[API Parse Error]', jsonError);
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }

  if (!response.ok) {
    console.error('[API Error]', { status: response.status, data });
    throw new Error(data?.error || `Server returned ${response.status}`);
  }

  return data;
}

export const api = {
  // --- AUTHENTICATION ---
  auth: {
    login: async (email: string, password: string) => {
      return await request<{ user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    
    signup: async (data: { name: string; email: string; password: string; storeName: string; storeUrl: string; shopifyAccessToken: string; shopifyApiKey: string }) => {
      return await request<{ user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  // --- DASHBOARD ---
  getStats: async (): Promise<DashboardStats> => {
    return await request<DashboardStats>('/stats');
  },

  getRevenueData: async (): Promise<{ name: string; value: number }[]> => {
    return await request<{ name: string; value: number }[]>('/revenue');
  },

  // --- TRANSACTIONS ---
  getTransactions: async (params: { page: number; limit: number; search?: string } = { page: 1, limit: 10 }): Promise<PaginatedResponse<Transaction>> => {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      search: params.search || ''
    });
    
    return await request<PaginatedResponse<Transaction>>(`/transactions?${query.toString()}`);
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    return await request<Transaction[]>('/transactions/all');
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
    return await request<{ success: boolean; data?: any; message?: string }>('/settings/test-integration', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  // --- CUSTOMERS ---
  searchCustomer: async (query: string): Promise<CustomerSummary | null> => {
    return await request<CustomerSummary | null>(`/customers/search?q=${encodeURIComponent(query)}`);
  },

  getCustomerTransactions: async (customerId: string): Promise<Transaction[]> => {
    return await request<Transaction[]>(`/customers/${customerId}/transactions`);
  },

  addCoins: async (data: { phone?: string; email?: string; coins: number; description?: string }): Promise<{ success: boolean; newBalance: number }> => {
    return await request('/wallet/credit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // --- AUTOMATIONS ---
  getAutomationJobs: async (): Promise<AutomationJob[]> => {
    return await request<AutomationJob[]>('/automations');
  },

  saveAutomationJob: async (job: Omit<AutomationJob, 'id'>): Promise<AutomationJob> => {
    return await request<AutomationJob>('/automations', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  },

  deleteAutomationJob: async (id: string): Promise<void> => {
    return await request<void>(`/automations/${id}`, { method: 'DELETE' });
  },

  toggleAutomationJob: async (id: string, status: 'ACTIVE' | 'PAUSED'): Promise<void> => {
    return await request<void>(`/automations/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
  },

  getAutomationAnalytics: async (period: 'DAILY' | 'MONTHLY' | 'YEARLY'): Promise<AutomationAnalytics> => {
    return await request<AutomationAnalytics>(`/automations/analytics?period=${period}`);
  }
};