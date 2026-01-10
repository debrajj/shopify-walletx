# Complete Netlify Deployment Guide

## ✅ What's Already Done

1. ✅ Frontend deployed to https://walletsz.netlify.app/
2. ✅ Backend API deployed as Netlify Functions
3. ✅ All routes implemented and working
4. ✅ Auto-deployment from GitHub configured
5. ✅ Code pushed to GitHub

## ⚠️ What You Need to Do Now

The API is returning 500 errors because the database environment variables haven't been added to Netlify yet. Follow these steps:

### Step 1: Add Environment Variables in Netlify

1. Go to https://app.netlify.com/
2. Click on your site **walletsz**
3. Go to **Site settings** (in the top navigation)
4. Click **Environment variables** (in the left sidebar under "Build & deploy")
5. Click **Add a variable** button
6. Add each of these variables one by one:

```
Variable Name: DB_HOST
Value: [Your PostgreSQL database host]

Variable Name: DB_PORT
Value: 5432

Variable Name: DB_NAME
Value: shopify_wallet

Variable Name: DB_USER
Value: [Your database username]

Variable Name: DB_PASSWORD
Value: [Your database password]

Variable Name: BCRYPT_SALT_ROUNDS
Value: 10

Variable Name: DEFAULT_OTP_EXPIRY_SECONDS
Value: 120

Variable Name: CORS_ORIGIN
Value: https://walletsz.netlify.app
```

### Step 2: Trigger a Redeploy

After adding all environment variables:

1. Go to the **Deploys** tab (top navigation)
2. Click **Trigger deploy** button (top right)
3. Select **Deploy site**
4. Wait 2-3 minutes for deployment to complete

### Step 3: Test Your Application

Once the deployment is complete:

1. Visit https://walletsz.netlify.app/
2. Try logging in or creating a new account
3. The API should now work correctly!

## Database Setup (If Not Done Already)

If you haven't set up your PostgreSQL database yet, you need to:

1. **Create a PostgreSQL database** (you can use services like):
   - Neon (https://neon.tech) - Free tier available
   - Supabase (https://supabase.com) - Free tier available
   - Railway (https://railway.app) - Free tier available
   - Heroku Postgres - Paid

2. **Run the database initialization script:**
   ```bash
   cd backend
   node src/index.js
   ```
   This will create all necessary tables.

3. **Create a test user** (optional):
   You can sign up through the UI at https://walletsz.netlify.app/

## Verifying Everything Works

### Test the API Directly

You can test if the API is working by opening your browser console and running:

```javascript
fetch('https://walletsz.netlify.app/api/stats')
  .then(r => r.json())
  .then(console.log)
```

If you see stats data, the API is working!

### Check Netlify Function Logs

If something isn't working:

1. Go to Netlify Dashboard
2. Click **Functions** tab
3. Click on **api** function
4. View the logs to see any errors

## Common Issues

### Issue: Still getting 500 errors after adding env vars
**Solution:** Make sure you triggered a redeploy after adding the variables. Environment variables only take effect after a new deployment.

### Issue: Database connection timeout
**Solution:** Check that your database allows connections from external IPs. Some database providers require you to whitelist IPs or allow all IPs.

### Issue: Login not working
**Solution:** Make sure you've run the database initialization script and that all tables are created.

## What's Next?

Once the API is working, you can:

1. **Create your first user** via the signup page
2. **Explore the admin dashboard** at https://walletsz.netlify.app/
3. **Test wallet operations** (credit coins, view transactions, etc.)
4. **Set up Shopify integration** (see QUICK_START_SHOPIFY.md)

## Need Help?

- Check `DEPLOYMENT_STATUS.md` for current status
- Check `NETLIFY_ENV_SETUP.md` for detailed env var instructions
- Check Netlify function logs for specific errors
- Verify your database is accessible and credentials are correct

---

**Your app is almost ready! Just add those environment variables and redeploy! 🚀**
