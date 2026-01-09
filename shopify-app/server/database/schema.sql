-- Shopify Coin Rewards App Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shop Configuration Table
CREATE TABLE IF NOT EXISTS shop_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(255) UNIQUE NOT NULL,
    shop_domain VARCHAR(255) NOT NULL,
    exchange_rate DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    minimum_redemption INTEGER NOT NULL DEFAULT 100,
    maximum_redemption INTEGER NOT NULL DEFAULT 10000,
    allow_partial_payment BOOLEAN NOT NULL DEFAULT true,
    welcome_bonus INTEGER NOT NULL DEFAULT 500,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Coin Accounts Table
CREATE TABLE IF NOT EXISTS customer_coin_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(255) NOT NULL,
    shopify_customer_id VARCHAR(255) NOT NULL,
    shop_id VARCHAR(255) NOT NULL,
    total_coins INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shopify_customer_id, shop_id)
);

-- Earning Rules Table
CREATE TABLE IF NOT EXISTS earning_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'signup', 'referral', 'review')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coin_amount INTEGER NOT NULL,
    conditions JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coin Transactions Table
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(255) NOT NULL,
    shop_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earn', 'redeem')),
    coin_amount INTEGER NOT NULL,
    monetary_value DECIMAL(10, 2) NOT NULL,
    exchange_rate DECIMAL(10, 2) NOT NULL,
    order_id VARCHAR(255),
    rule_id UUID REFERENCES earning_rules(id),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Product Eligibility Table
CREATE TABLE IF NOT EXISTS product_eligibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    is_eligible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, product_id)
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id VARCHAR(255) NOT NULL,
    customer_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_customer_accounts_shopify_id ON customer_coin_accounts(shopify_customer_id);
CREATE INDEX idx_customer_accounts_shop_id ON customer_coin_accounts(shop_id);
CREATE INDEX idx_transactions_customer_id ON coin_transactions(customer_id);
CREATE INDEX idx_transactions_shop_id ON coin_transactions(shop_id);
CREATE INDEX idx_transactions_order_id ON coin_transactions(order_id);
CREATE INDEX idx_transactions_created_at ON coin_transactions(created_at DESC);
CREATE INDEX idx_earning_rules_shop_id ON earning_rules(shop_id);
CREATE INDEX idx_earning_rules_type ON earning_rules(type);
CREATE INDEX idx_product_eligibility_shop_id ON product_eligibility(shop_id);
CREATE INDEX idx_audit_logs_shop_id ON audit_logs(shop_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_shop_configurations_updated_at BEFORE UPDATE ON shop_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_coin_accounts_updated_at BEFORE UPDATE ON customer_coin_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_earning_rules_updated_at BEFORE UPDATE ON earning_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_eligibility_updated_at BEFORE UPDATE ON product_eligibility
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
