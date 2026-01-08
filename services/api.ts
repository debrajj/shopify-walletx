import { Wallet, Transaction, AppSettings, DashboardStats, CustomerSummary, AutomationJob, AutomationAnalytics, PaginatedResponse } from '../types';

const DEFAULT_API_BASE = 'http://localhost:3000/api';
const STORAGE_KEY = 'shopwallet_api_config';

// --- API CLIENT ---

const getActiveConfig = (): { baseUrl: string; headers: Record<string, string> } => {
  let baseUrl = DEFAULT_API_BASE;
  let headers: Record<string, string> = {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored) as AppSettings;
      if (settings.useCustomApi && settings.customApiConfig?.baseUrl) {
        baseUrl = settings.customApiConfig.baseUrl.replace(/\/$/, '');
        if (settings.customApiConfig.authHeaderKey) {
          headers[settings.customApiConfig.authHeaderKey] = settings.customApiConfig.authHeaderValue;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load API settings from local storage", e);
  }

  return { baseUrl, headers };
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { baseUrl, headers: customHeaders } = getActiveConfig();
  const url = `${baseUrl}${path}`;

  // Get Auth Token if exists (for standard Login flow)
  const userStr = localStorage.getItem('shopwallet_user');
  const tokenHeader: Record<string, string> = {};
  if (userStr) {
    // In a real app, you'd store a JWT token. For now, we simulate auth context.
    // Ideally: const { token } = JSON.parse(userStr);
    // tokenHeader['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: { 
      'Content-Type': 'application/json',
      ...tokenHeader,
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
    signup: async (data: { name: string; email: string; password: string; storeName: string; storeUrl: string }) => {
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
    // Sync local storage so subsequent requests use the correct API config if custom API is enabled
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