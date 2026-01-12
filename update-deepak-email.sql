-- Quick fix to add email support for deepak@gmail.com
-- Run this on Render Postgres database

-- Step 1: Add customer_email column if it doesn't exist
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(customer_email, store_url);

-- Step 3: Find and update deepak@gmail.com record
-- (assuming it's stored in customer_phone or phone_hash field)
UPDATE wallets 
SET customer_email = 'deepak@gmail.com'
WHERE (
  customer_phone = 'deepak@gmail.com' 
  OR phone_hash = 'deepak@gmail.com'
  OR customer_name LIKE '%deepak%'
)
AND store_url = 'cmstestingg.myshopify.com';

-- Step 4: Verify the update
SELECT 
  id,
  store_url,
  customer_name,
  customer_email,
  customer_phone,
  balance,
  created_at
FROM wallets 
WHERE customer_email = 'deepak@gmail.com'
   OR customer_phone = 'deepak@gmail.com'
   OR customer_name LIKE '%deepak%';

-- Expected result: Should show deepak@gmail.com with balance
