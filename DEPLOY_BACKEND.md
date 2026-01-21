# Backend Deployment Steps

## Current Issue
- Widget is deployed (version 15) with email support
- Backend on Render still has old code (phone only)
- Database missing `customer_email` column

## Steps to Fix

### 1. Commit Backend Changes
```bash
git add backend/src/index.js
git add backend/database/migrations/004_add_customer_email.sql
git commit -m "Add email support to wallet balance API"
git push origin main
```

### 2. Deploy to Render
- Render will auto-deploy from GitHub
- Or manually trigger deploy in Render dashboard
- Wait for deployment to complete

### 3. Run Database Migration
Connect to Render Postgres and run:
```sql
-- Add email column
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255); 

-- Create index
CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(customer_email, store_url);

-- Update existing deepak@gmail.com record with email
UPDATE wallets 
SET customer_email = 'deepak@gmail.com'
WHERE customer_phone = 'deepak@gmail.com' 
   OR customer_name = 'deepak@gmail.com'
   OR phone_hash = 'deepak@gmail.com';
```

### 4. Verify Data
```sql
-- Check if email column exists
SELECT customer_email, customer_phone, balance, store_url 
FROM wallets 
WHERE customer_email = 'deepak@gmail.com' 
   OR customer_phone LIKE '%deepak%'
   OR customer_name LIKE '%deepak%';
```

### 5. Test API
```bash
curl "https://shopify-walletx.onrender.com/api/wallet/balance?email=deepak@gmail.com" \
  -H "x-shop-url: cmstestingg.myshopify.com"
```

Should return:
```json
{
  "success": true,
  "walletCoins": 100,
  "currency": "INR"
}
```

## Quick Fix (If you have database access)

If deepak@gmail.com exists but in phone field, update it:

```sql
-- Find the record
SELECT * FROM wallets WHERE customer_phone = 'deepak@gmail.com';

-- Add email column if missing
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Copy phone to email for this user
UPDATE wallets 
SET customer_email = customer_phone
WHERE customer_phone = 'deepak@gmail.com';
```
