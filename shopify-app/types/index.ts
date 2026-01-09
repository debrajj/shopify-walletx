// Core Type Definitions for Shopify Coin Rewards App

export interface CustomerCoinAccount {
  id: string;
  customerId: string;
  shopifyCustomerId: string;
  shopId: string;
  totalCoins: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoinTransaction {
  id: string;
  customerId: string;
  shopId: string;
  type: 'earn' | 'redeem';
  coinAmount: number;
  monetaryValue: number;
  exchangeRate: number;
  orderId?: string;
  ruleId?: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
}

export interface EarningRule {
  id: string;
  shopId: string;
  type: 'purchase' | 'signup' | 'referral' | 'review';
  name: string;
  description: string;
  coinAmount: number;
  conditions: RuleCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ShopConfiguration {
  id: string;
  shopId: string;
  shopDomain: string;
  exchangeRate: number;
  currency: string;
  minimumRedemption: number;
  maximumRedemption: number;
  allowPartialPayment: boolean;
  welcomeBonus: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductEligibility {
  id: string;
  shopId: string;
  productId: string;
  isEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  shopId: string;
  customerId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CoinBalance {
  totalCoins: number;
  monetaryValue: number;
  currency: string;
  lastUpdated: Date;
}

export interface RedemptionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface CoinPayment {
  customerId: string;
  orderId: string;
  coinAmount: number;
  monetaryValue: number;
  currency: string;
}

export interface Analytics {
  totalEarned: number;
  totalRedeemed: number;
  activeCustomers: number;
  transactionCounts: {
    earn: number;
    redeem: number;
  };
  topCustomers: CustomerCoinAccount[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CustomerFilter {
  shopId: string;
  minBalance?: number;
  maxBalance?: number;
  limit?: number;
  offset?: number;
}
