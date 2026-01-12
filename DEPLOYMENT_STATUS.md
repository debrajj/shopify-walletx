# Deployment Status - Email Support

## ✅ Completed

### 1. Extension Deployed
- **Version**: 15
- **Status**: Live on Shopify
- **Changes**: Email input instead of phone, simplified UI
- **URL**: https://dev.shopify.com/dashboard/159109084/apps/310294249473/versions/830029856769

### 2. Backend Code Pushed
- **Commit**: a8b13d5
- **Status**: Pushed to GitHub (main branch)
- **Changes**: 
  - Email support in `/api/wallet/balance` endpoint
  - Database migration files created
  - Backward compatible (still supports phone)

## ⏳ Pending (Need Your Action)

### 1. Render Deployment
- **Action**: Wait for Render to auto-deploy from GitHub
- **Or**: Manually trigger deploy in Render dashboard
- **Check**: https://dashboard.render.com → Your service → Latest deploy

### 2. Database Migration
You need to run this SQL on Render Postgres:

```sql
-- Add email column
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Create index
CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(customer_email, store_url);

-- Update deepak@gmail.com record
UPDATE wallets 
SET customer_email = 'deepak@gmail.com'
WHERE (
  customer_phone = 'deepak@gmail.com' 
  OR phone_hash = 'deepak@gmail.com'
  OR customer_name LIKE '%deepak%'
)
AND store_url = 'cmstestingg.myshopify.com';
```

**How to run**:
1. Go to Render dashboard
2. Open your Postgres database
3. Click "Connect" → "External Connection"
4. Use psql or any SQL client to run the above SQL

### 3. Test the Widget
After backend deploys and migration runs:

1. Go to: https://cmstestingg.myshopify.com
2. Add items to cart
3. Open cart drawer
4. Widget should appear after discount section
5. Enter: `deepak@gmail.com`
6. Click "Check Balance"
7. Should show coin balance

## Test API Manually

Once backend is deployed, test with:

```bash
curl "https://shopify-walletx.onrender.com/api/wallet/balance?email=deepak@gmail.com" \
  -H "x-shop-url: cmstestingg.myshopify.com"
```

Expected response:
```json
{
  "success": true,
  "walletCoins": 100,
  "currency": "INR"
}
```

## Files Created

- `update-deepak-email.sql` - SQL to update database
- `DEPLOY_BACKEND.md` - Detailed deployment steps
- `WIDGET_EMAIL_UPDATE.md` - Technical changes documentation
- `test-cmstestingg.js` - Test script for API

## Summary

**What's working**: Extension deployed with email UI
**What's needed**: Backend deployment + database migration
**ETA**: ~5-10 minutes after you run the SQL migration
