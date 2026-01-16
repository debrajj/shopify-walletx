# URGENT: Discount Not Creating in Shopify

## Issue
Coupons are NOT being created in Shopify when user redeems coins.

## Error Seen
```
Failed to execute action. Retrying in 2077ms.
BreadcrumbsPluginFetchError: Failed to export metrics to Observe
```

**Note**: The "BreadcrumbsPluginFetchError" is just a Shopify analytics error - NOT the root cause.

## Possible Causes

### 1. Backend Not Deployed
The latest code changes might not be deployed to Render yet.

**Check**:
1. Go to https://dashboard.render.com
2. Check if deployment is complete
3. Look for "Live" status

### 2. GraphQL API Error
The discount creation API call might be failing.

**Check Backend Logs**:
1. Go to Render Dashboard → Your Service → Logs
2. Look for errors when discount is created
3. Search for `[Discount]` to see discount-related logs

### 3. Shopify API Access Token Issue
The access token might be invalid or expired.

**Check**:
```sql
SELECT store_url, shopify_access_token FROM users WHERE store_url = 'www.kushals.com';
```

If `shopify_access_token` is NULL or empty, that's the problem.

### 4. GraphQL Mutation Syntax Error
The recent code changes might have a syntax error.

## Quick Diagnostic Steps

### Step 1: Check if Backend is Receiving Request
Open browser console and look for:
```
[Wallet Widget] 📤 Creating discount in Shopify...
[Wallet Widget] 📥 Response status: 200
[Wallet Widget] 📥 Response data: { ... }
```

If you see `Response status: 500` or error, backend is failing.

### Step 2: Check Backend Logs on Render
Look for these log entries:
```
[Discount] 📝 Request Details: { ... }
[Discount] 🔑 Creating automatic discount code...
[Discount] 📤 GraphQL Mutation Variables: { ... }
```

If you DON'T see these logs, the request isn't reaching the backend.

### Step 3: Test API Directly
Run this to test if backend is working:
```bash
curl -X POST https://shopify-walletx.onrender.com/api/shopify/create-discount \
  -H "Content-Type: application/json" \
  -H "x-shop-url: www.kushals.com" \
  -d '{
    "email": "test@example.com",
    "coinsToRedeem": 10,
    "discountAmount": 10,
    "discountCode": "TEST123"
  }'
```

Expected response:
```json
{
  "success": true,
  "discountCode": "TEST123",
  "discountValue": 10,
  ...
}
```

## Most Likely Issue: Deployment Not Complete

The code was just pushed. Render takes 2-5 minutes to deploy.

**Solution**: Wait 5 minutes, then try again.

## If Still Not Working

### Rollback to Previous Version
If the new code is causing issues, we can rollback:

1. Go to Render Dashboard
2. Click on your service
3. Go to "Manual Deploy" tab
4. Select previous deployment
5. Click "Deploy"

### Check Shopify API Permissions
The access token needs these permissions:
- `write_discounts`
- `read_discounts`
- `read_customers`

## Temporary Workaround

If discount creation is completely broken, you can:

1. **Manual Discount Creation**:
   - Customer redeems coins
   - System shows discount code
   - You manually create the discount in Shopify Admin
   - Customer uses the code at checkout

2. **Use Fallback Code**:
   The system should fall back to creating a simple discount code if the GraphQL mutation fails.

## Next Steps

1. **Check Render deployment status** (most likely cause)
2. **Check backend logs** for errors
3. **Test API directly** with curl command above
4. **Share logs** with me if still not working

## Contact Info

When reporting the issue, please share:
1. **Browser console logs** (from widget)
2. **Backend logs** (from Render)
3. **Exact error message** (if any)
4. **What coins amount** you tried to redeem
5. **Screenshot** of the error

---

**Status**: 🔴 INVESTIGATING
**Priority**: HIGH
**ETA**: Should be fixed once deployment completes (~5 minutes)
