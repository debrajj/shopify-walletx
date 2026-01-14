-- Add reward settings columns to app_settings table
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS reward_per_dollar DECIMAL(10, 2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS welcome_bonus INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS min_order_for_rewards DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS referral_reward INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS review_reward INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS birthday_reward INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS enable_auto_rewards BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_welcome_bonus BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_referrals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS coin_expiry_days INTEGER DEFAULT 0;

-- Add referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  referrer_email VARCHAR(255) NOT NULL,
  referred_email VARCHAR(255) NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  reward_given BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Add customer tiers table
CREATE TABLE IF NOT EXISTS customer_tiers (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  tier_level VARCHAR(20) DEFAULT 'BRONZE',
  total_spent DECIMAL(10, 2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  tier_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_url, customer_email)
);

-- Add notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  message TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_store ON referrals(store_url);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_tiers_store_email ON customer_tiers(store_url, customer_email);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_queue(status);
