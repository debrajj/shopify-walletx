# 🚀 Deploy Your Unified App NOW

## What We Fixed

✅ Added environment variable validation
✅ Added health check endpoint  
✅ Added database connection error handling
✅ API routes are properly configured (no `/api` prefix in Express)
✅ Frontend uses relative URLs (`/api`)

## Critical Step: Set Environment Variables in Netlify

**You MUST do this before the app will work!**

### 1. Go to Netlify Dashboard
Visit: https://app.netlify.com/sites/walletsz/settings/deploys#environment

### 2. Add These Environment Variables

Click "Add a variable" and add each of these:

| Variable Name | Value |
|--------------|-------|
| `DB_HOST` | `family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `shopify_wallet` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `v4HmYtmNgvsVkRrB81AT` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `DEFAULT_OTP_EXPIRY_SECONDS` | `120` |
| `CORS_ORIGIN` | `https://walletsz.netlify.app` |

### 3. Deploy the Changes

```bash
# Commit the fixes
git add .
git commit -m "Fix: Add environment variable validation and health check"
git push
```

Netlify will automatically deploy. Wait 2-3 minutes for the build to complete.

### 4. Test the Deployment

#### Test 1: Health Check
Visit: https://walletsz.netlify.app/api/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-01-10T...",
  "environment": {
    "nodeVersion": "v18.x.x",
    "hasDbConfig": true
  },
  "database": "connected"
}
```

#### Test 2: Login
1. Go to https://walletsz.netlify.app
2. Try to log in
3. Should work without 500 errors!

## Troubleshooting

### Still Getting 500 Errors?

**Check Function Logs:**
1. Go to https://app.netlify.com/sites/walletsz/functions
2. Click on the `api` function
3. Look for error messages

**Common Issues:**

1. **"Missing required environment variables"**
   - Solution: Double-check you added ALL variables in Netlify dashboard
   - Make sure there are no typos in variable names

2. **"Database connection error"**
   - Solution: Check AWS RDS security group
   - Allow connections from `0.0.0.0/0` (all IPs) for testing
   - Or add Netlify's IP ranges

3. **"Service temporarily unavailable"**
   - Solution: Environment variables not set correctly
   - Redeploy after setting variables

### Check What's Wrong

Visit the health endpoint to see detailed status:
```
https://walletsz.netlify.app/api/health
```

This will tell you:
- ✅ If the function is running
- ✅ If environment variables are set
- ✅ If database connection works
- ❌ What's broken if something fails

## Quick Commands

```bash
# See what's deployed
git log -1

# Force redeploy (if needed)
git commit --allow-empty -m "Trigger redeploy"
git push

# Check Netlify CLI status (if installed)
netlify status
```

## Security Note ⚠️

Your database credentials are in the `.env` file which is tracked in git. This is a security risk!

**After deployment works, do this:**

```bash
# Remove .env from git
git rm --cached .env
git commit -m "Remove .env from tracking"
git push

# Then rotate your database password in AWS RDS
# And update only in Netlify dashboard
```

## What Happens Next

1. Set environment variables in Netlify ← **DO THIS NOW**
2. Push the code changes (already done above)
3. Wait for deployment
4. Test the health endpoint
5. Test login functionality
6. 🎉 Your app should work!

## Need Help?

If you're still stuck after following these steps, check:
1. Netlify build logs
2. Netlify function logs  
3. Browser console errors
4. The `/api/health` endpoint response
