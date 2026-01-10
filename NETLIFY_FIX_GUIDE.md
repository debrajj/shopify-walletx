# Netlify Deployment Fix Guide

## Current Issue
The API is returning 500 errors because the Netlify Function doesn't have access to the required environment variables (database credentials).

## Solution Steps

### 1. Set Environment Variables in Netlify

Go to your Netlify dashboard: https://app.netlify.com/sites/walletsz/settings/deploys#environment

Add these environment variables:

```
DB_HOST=family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=shopify_wallet
DB_USER=postgres
DB_PASSWORD=v4HmYtmNgvsVkRrB81AT
BCRYPT_SALT_ROUNDS=12
DEFAULT_OTP_EXPIRY_SECONDS=120
CORS_ORIGIN=https://walletsz.netlify.app
```

### 2. Redeploy the Site

After adding the environment variables, trigger a new deployment:
- Option A: Push a new commit to your repository
- Option B: In Netlify dashboard, go to Deploys → Trigger deploy → Deploy site

### 3. Verify the Fix

After deployment completes:
1. Open https://walletsz.netlify.app
2. Try to log in
3. Check the browser console for errors

## Testing the API Directly

You can test if the function is working by visiting:
```
https://walletsz.netlify.app/.netlify/functions/api
```

This should return:
```json
{"message":"Netlify Function is working!","path":"/","url":"/"}
```

## Common Issues

### Issue: Still getting 500 errors
**Solution**: Check Netlify function logs:
1. Go to Netlify dashboard → Functions
2. Click on the `api` function
3. View the logs to see the actual error

### Issue: Database connection timeout
**Solution**: Ensure your AWS RDS security group allows connections from Netlify's IP ranges. You may need to allow all IPs (0.0.0.0/0) for the database security group.

### Issue: CORS errors
**Solution**: The CORS_ORIGIN environment variable should match your Netlify URL exactly.

## Quick Fix Commands

If you need to redeploy quickly:

```bash
# Make a small change and push
git commit --allow-empty -m "Trigger Netlify redeploy"
git push
```

## Database Security Note

⚠️ **IMPORTANT**: Your database credentials are currently exposed in the `.env` file in your repository. 

**Recommended actions**:
1. Remove `.env` from git tracking:
   ```bash
   git rm --cached .env
   echo ".env" >> .gitignore
   git commit -m "Remove .env from tracking"
   git push
   ```

2. Rotate your database password in AWS RDS

3. Update the new password in Netlify environment variables only
