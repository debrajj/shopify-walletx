# 🔧 Step-by-Step Fix for 500 Errors

## The Problem
Your Netlify function is running but can't connect to the database because environment variables aren't set.

## The Solution (Do These Steps IN ORDER)

### STEP 1: Set Environment Variables in Netlify (DO THIS FIRST!)

1. **Open Netlify Dashboard**
   - Go to: https://app.netlify.com/sites/walletsz/settings/deploys#environment
   - Or: Netlify Dashboard → Your Site → Site settings → Environment variables

2. **Click "Add a variable"** and add each of these **ONE BY ONE**:

   ```
   Variable: DB_HOST
   Value: family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com
   ```

   ```
   Variable: DB_PORT
   Value: 5432
   ```

   ```
   Variable: DB_NAME
   Value: shopify_wallet
   ```

   ```
   Variable: DB_USER
   Value: postgres
   ```

   ```
   Variable: DB_PASSWORD
   Value: v4HmYtmNgvsVkRrB81AT
   ```

   ```
   Variable: BCRYPT_SALT_ROUNDS
   Value: 12
   ```

   ```
   Variable: DEFAULT_OTP_EXPIRY_SECONDS
   Value: 120
   ```

   ```
   Variable: CORS_ORIGIN
   Value: https://walletsz.netlify.app
   ```

3. **Click "Save"** after adding all variables

### STEP 2: Push the Code Changes

Open your terminal and run:

```bash
# Add all changes
git add .

# Commit with a message
git commit -m "Fix: Add database error handling and health check endpoint"

# Push to trigger deployment
git push
```

### STEP 3: Wait for Deployment

1. Go to: https://app.netlify.com/sites/walletsz/deploys
2. Wait for the build to complete (usually 2-3 minutes)
3. Look for "Published" status

### STEP 4: Test the Fix

**Test 1: Check Health Endpoint**

Open in browser: https://walletsz.netlify.app/api/health

You should see something like:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-10T..."
}
```

**Test 2: Try Login**

1. Go to: https://walletsz.netlify.app
2. Try to log in
3. Should work now! ✅

## If Still Not Working

### Check Function Logs

1. Go to: https://app.netlify.com/sites/walletsz/functions
2. Click on the `api` function
3. Look at the logs - they will tell you what's wrong

### Common Issues

**Issue: "Missing required environment variables"**
- You forgot to set them in Netlify dashboard
- Go back to STEP 1

**Issue: "Database connection error"**
- Your AWS RDS security group might be blocking Netlify
- Solution: In AWS RDS, allow connections from `0.0.0.0/0`

**Issue: Still getting 500 errors**
- Check the function logs (link above)
- The error message will tell you exactly what's wrong

## Quick Verification Checklist

- [ ] I set ALL 8 environment variables in Netlify dashboard
- [ ] I clicked "Save" in Netlify
- [ ] I ran `git add .`
- [ ] I ran `git commit -m "Fix deployment"`
- [ ] I ran `git push`
- [ ] I waited for deployment to finish
- [ ] I tested `/api/health` endpoint
- [ ] I tested login functionality

## Need More Help?

If you're stuck, tell me:
1. Which step you're on
2. What error you're seeing
3. What the `/api/health` endpoint returns

I'll help you debug it!
