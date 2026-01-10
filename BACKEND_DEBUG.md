# Backend Debugging Guide

## Current Status
- Backend URL: https://shopify-walletx.onrender.com
- Error: "Invalid JSON response" - Backend returning HTML instead of JSON

## Possible Issues

### 1. Check Render Logs
Go to: https://dashboard.render.com → Your backend service → Logs

Look for:
- ✅ "Server running on port 3000" or similar
- ✅ "Database initialized for Multi-Tenancy"
- ❌ Any error messages
- ❌ Database connection errors

### 2. Verify Environment Variables
Check these are set in Render:
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD
- BCRYPT_SALT_ROUNDS
- DEFAULT_OTP_EXPIRY_SECONDS
- PORT (should be set automatically by Render)
- CORS_ORIGIN

### 3. Test Backend Endpoints

Try these URLs in your browser:

**Test 1: Root** (should return "Cannot GET /")
```
https://shopify-walletx.onrender.com/
```

**Test 2: Stats** (should return JSON)
```
https://shopify-walletx.onrender.com/api/stats
```

**Test 3: Settings** (should return JSON)
```
https://shopify-walletx.onrender.com/api/settings
```

## Common Fixes

### Fix 1: Database Connection
If logs show database errors:
- Verify AWS RDS security group allows connections from `0.0.0.0/0`
- Check DB credentials are correct
- Ensure database exists

### Fix 2: PORT Issue
Backend should listen on `process.env.PORT` (Render provides this)
- Check logs show correct port
- Render automatically sets PORT environment variable

### Fix 3: CORS
If frontend can't connect:
- Set `CORS_ORIGIN=*` in Render environment variables
- Redeploy backend

## Quick Test Command

Test the backend from terminal:
```bash
curl https://shopify-walletx.onrender.com/api/stats
```

Should return JSON like:
```json
{
  "totalWallets": 0,
  "totalCoinsInCirculation": 0,
  "totalTransactionsToday": 0,
  "otpSuccessRate": 98.5
}
```

## Next Steps

1. Check Render logs for errors
2. Test `/api/stats` endpoint
3. If database error, check AWS RDS security group
4. If still failing, share the Render logs
