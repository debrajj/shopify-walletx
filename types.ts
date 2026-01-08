export interface Wallet {
  id: string;
  phone_hash: string;
  balance: number;
  customer_name: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  coins: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  created_at: string;
  expires_at?: string; // For credited coins
  order_amount?: number; // For context on spend
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface OtpLog {
  id: string;
  phone_hash: string;
  status: 'VERIFIED' | 'FAILED' | 'EXPIRED';
  expires_at: string;
  created_at: string;
}

export interface AppSettings {
  isWalletEnabled: boolean;
  isOtpEnabled: boolean;
  otpExpirySeconds: number;
  maxWalletUsagePercent: number;
  smsProvider: 'TWILIO' | 'AWS_SNS' | 'MSG91';
  smsApiKey: string;
  // Custom API Integration
  useCustomApi: boolean;
  customApiConfig: {
    baseUrl: string;
    authHeaderKey: string;
    authHeaderValue: string;
  };
}

export interface DashboardStats {
  totalWallets: number;
  totalCoinsInCirculation: number;
  totalTransactionsToday: number;
  otpSuccessRate: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  balance: number;
  total_orders: number;
  total_spent: number;
  total_coins_used: number;
}

export interface AutomationJob {
  id: string;
  name: string;
  condition_type: 'EXPIRY_WARNING' | 'LOW_BALANCE' | 'INACTIVE_USER';
  condition_value: number; // e.g., 10 (days)
  action_channel: 'SMS' | 'WHATSAPP';
  status: 'ACTIVE' | 'PAUSED';
  last_run?: string;
}

export interface AutomationAnalytics {
  summary: {
    totalSent: number;
    totalConverted: number;
    conversionRate: number;
    revenueGenerated: number;
  };
  chartData: {
    label: string;
    sent: number;
    converted: number;
  }[];
}