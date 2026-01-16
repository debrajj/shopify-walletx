# Automatic Discount Feature - Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Database Migration
- [ ] Run discount_codes table migration
- [ ] Verify table structure
- [ ] Check indexes are created

```bash
# Run migration
node -e "const db = require('./backend/src/config/db'); const fs = require('fs'); const sql = fs.readFileSync('./backend/src/migrations/add_discount_codes_table.sql', 'utf8'); db.query(sql).then(() => { console.log('✅ Migration complete'); db.end(); }).catch(err => { console.error('❌ Migration failed:', err); db.end(); });"
```

### 2. Backend Code
- [x] Fix syntax errors in discountService.js
- [x] Remove unreachable code
- [x] Implement automatic discount creation
- [x] Implement customer lookup
- [x] Implement fallback to discount codes
- [x] Add database tracking

### 3. API Endpoint
- [x] `/api/shopify/create-discount` endpoint exists
- [x] Validates customer balance
- [x] Checks for existing discounts
- [x] Deducts coins on success
- [x] Logs transactions

### 4. Widget
- [x] Version 2.3.0 with cart total update
- [x] Auto-load balance for logged-in customers
- [x] Real-time savings display
- [x] Instant cart total update
- [x] Support for Enter key to apply

### 5. Shopify Configuration
- [ ] Store has API access token configured
- [ ] API token has discount management permissions
- [ ] Store URL is normalized in database

## 🚀 Deployment Steps

### Step 1: Test Locally

```bash
# 1. Test discount creation
node test-automatic-discount.js

# 2. Check database
node check-database.js

# 3. Test API endpoint
node test-discount-creation.js
```

### Step 2: Deploy Backend

```bash
# Backend auto-deploys via GitHub → Render
git add backend/src/shopify/discountService.js
git commit -m "Fix: Remove unreachable code in discount service"
git push origin main

# Monitor deployment
node check-deployment-status.js
```

### Step 3: Deploy Widget

```bash
# Push theme changes to Shopify
cd extensions/wallet-theme-app
shopify theme push

# Or if using Shopify CLI 3.x
shopify theme push --store=cmstestingg.myshopify.com
```

### Step 4: Run Database Migration (Production)

```bash
# Connect to production database and run migration
# Option 1: Via Render dashboard SQL console
# Copy contents of backend/src/migrations/add_discount_codes_table.sql

# Option 2: Via script (if you have direct DB access)
DATABASE_URL="your-production-db-url" node -e "const db = require('./backend/src/config/db'); const fs = require('fs'); const sql = fs.readFileSync('./backend/src/migrations/add_discount_codes_table.sql', 'utf8'); db.query(sql).then(() => { console.log('✅ Migration complete'); db.end(); }).catch(err => { console.error('❌ Migration failed:', err); db.end(); });"
```

### Step 5: Verify Deployment

```bash
# 1. Check backend is running
curl https://shopify-walletx.onrender.com/api/stats

# 2. Test discount creation via API
curl -X POST https://shopify-walletx.onrender.com/api/shopify/create-discount \
  -H "Content-Type: application/json" \
  -H "x-shop-url: cmstestingg.myshopify.com" \
  -d '{
    "email": "test@example.com",
    "coinsToRedeem": 50,
    "discountAmount": 50,
    "discountCode": "WALLETTEST123"
  }'

# 3. Check widget loads on store
# Visit: https://cmstestingg.myshopify.com/cart
# Open browser console and look for: [Wallet Widget] Version: 2.3.0
```

## 🧪 Testing Scenarios

### Scenario 1: Automatic Discount (Happy Path)
1. Customer has sufficient balance
2. Store has API token configured
3. Customer exists in Shopify
4. **Expected**: Automatic discount created, applies at checkout

### Scenario 2: Discount Code Fallback
1. Customer has sufficient balance
2. Store has API token configured
3. Customer NOT found in Shopify
4. **Expected**: Discount code created instead

### Scenario 3: Manual Setup Required
1. Customer has sufficient balance
2. Store does NOT have API token
3. **Expected**: Code generated, manual setup instructions shown

### Scenario 4: Existing Active Discount
1. Customer already has unused discount
2. Tries to create another
3. **Expected**: Returns existing discount code

### Scenario 5: Insufficient Balance
1. Customer tries to redeem more coins than available
2. **Expected**: Error message, no deduction

## 📊 Monitoring

### Key Metrics to Watch
- Discount creation success rate
- Automatic vs code fallback ratio
- Average creation time
- Customer redemption rate
- Error rate

### Logs to Monitor
```bash
# Backend logs (Render dashboard)
# Look for:
[Discount] 🎫 Creating AUTOMATIC discount...
[Discount] ✅ AUTOMATIC discount created successfully!
[Discount] 🔄 Creating discount CODE as fallback...
[Discount] ❌ Error: ...
```

### Database Queries
```sql
-- Check discount creation rate
SELECT 
  COUNT(*) as total_discounts,
  COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_discounts,
  COUNT(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 END) as active_discounts,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_discounts
FROM discount_codes
WHERE store_url = 'cmstestingg.myshopify.com';

-- Check recent discounts
SELECT 
  discount_code,
  customer_email,
  discount_amount,
  is_used,
  created_at,
  expires_at
FROM discount_codes
WHERE store_url = 'cmstestingg.myshopify.com'
ORDER BY created_at DESC
LIMIT 10;

-- Check customer discount history
SELECT 
  customer_email,
  COUNT(*) as total_discounts,
  SUM(discount_amount) as total_savings,
  MAX(created_at) as last_discount
FROM discount_codes
WHERE store_url = 'cmstestingg.myshopify.com'
GROUP BY customer_email
ORDER BY total_savings DESC;
```

## 🐛 Troubleshooting

### Issue: Discount not applying at checkout
**Possible Causes:**
- Discount expired (24 hours)
- Discount already used
- Customer email doesn't match
- Shopify discount not created properly

**Solution:**
1. Check discount_codes table for entry
2. Verify discount exists in Shopify admin
3. Check discount expiration
4. Try creating new discount

### Issue: "Customer not found" error
**Possible Causes:**
- Customer not registered in Shopify
- Email mismatch
- Customer lookup query incorrect

**Solution:**
1. Verify customer exists in Shopify admin
2. Check email spelling
3. System will fallback to discount code automatically

### Issue: API token missing
**Possible Causes:**
- Store not configured
- Token not saved in database

**Solution:**
```bash
# Add Shopify token
node add-shopify-token.js
```

### Issue: Widget not showing
**Possible Causes:**
- Theme not pushed
- Widget injection failed
- JavaScript error

**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify widget version in console
4. Re-push theme

## 🔄 Rollback Plan

If issues occur:

1. **Revert Backend Code**
```bash
git revert HEAD
git push origin main
```

2. **Revert Widget**
```bash
# Push previous version
shopify theme push --theme-id=PREVIOUS_THEME_ID
```

3. **Database Rollback** (if needed)
```sql
-- Disable discount tracking temporarily
ALTER TABLE discount_codes RENAME TO discount_codes_backup;
```

## 📝 Post-Deployment Tasks

- [ ] Monitor error logs for 24 hours
- [ ] Check discount creation success rate
- [ ] Verify customer feedback
- [ ] Update documentation
- [ ] Train support team on new feature
- [ ] Create admin dashboard for discount management

## 🎯 Success Criteria

- ✅ 90%+ discounts created successfully
- ✅ < 2 second average creation time
- ✅ Zero coin balance discrepancies
- ✅ < 1% manual intervention required
- ✅ Positive customer feedback

## 📞 Support

If issues persist:
1. Check logs in Render dashboard
2. Review database entries
3. Test with `test-automatic-discount.js`
4. Check Shopify API status
5. Verify store configuration
