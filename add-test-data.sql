-- Add test data for cmstestingg.myshopify.com store
-- Run this SQL on your database

-- 1. First, add the customer_email column if it doesn't exist
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(customer_email, store_url);

-- 2. Register the store (if not already registered)
INSERT INTO users (name, email, password_hash, store_name, store_url, shopify_access_token, shopify_api_key)
VALUES (
  'CMS Testing Store',
  'admin@cmstestingg.com',
  '$2a$10$dummyhashfortest',
  'CMS Testing',
  'cmstestingg.myshopify.com',
  'dummy_token',
  'dummy_key'
)
ON CONFLICT (store_url) DO NOTHING;

-- 3. Create app settings for the store
INSERT INTO app_settings (store_url, is_wallet_enabled)
VALUES ('cmstestingg.myshopify.com', true)
ON CONFLICT (store_url) DO NOTHING;

-- 4. Add wallet for deepak@gmail.com with 100 coins
INSERT INTO wallets (store_url, phone_hash, customer_name, customer_email, customer_phone, balance)
VALUES (
  'cmstestingg.myshopify.com',
  'deepak@gmail.com',
  'Deepak',
  'deepak@gmail.com',
  NULL,
  100.00
)
ON CONFLICT (store_url, phone_hash) 
DO UPDATE SET 
  customer_email = 'deepak@gmail.com',
  balance = 100.00;

-- 5. Verify the data
SELECT 
  w.id,
  w.store_url,
  w.customer_name,
  w.customer_email,
  w.customer_phone,
  w.balance
FROM wallets w
WHERE w.store_url = 'cmstestingg.myshopify.com'
  AND w.customer_email = 'deepak@gmail.com';
