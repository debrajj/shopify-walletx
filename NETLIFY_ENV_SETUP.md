# 🚀 Netlify Environment Variables Setup

## Current Status
- ✅ Frontend deployed
- ✅ Netlify Functions deployed
- ⚠️ Getting 500 error - **Environment variables needed**

---

## Quick Fix - Add Environment Variables

### Step 1: Go to Netlify Dashboard
1. Visit: https://app.netlify.com/
2. Select your site: **walletsz**
3. Go to: **Site settings** → **Environment variables**

### Step 2: Add These Variables

Click **Add a variable** and add each of these:

```env
# Database (REQUIRED)
DB_HOST=family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=shopify_wallet
DB_USER=postgres
DB_PASSWORD=v4HmYtmNgvsVkRrB81AT

# Backend Config (REQUIRED)
BCRYPT_SALT_ROUNDS=10
DEFAULT_OTP_EXPIRY_SECONDS=120
CORS_ORIGIN=https://walletsz.netlify.app
CORS_CREDENTIALS=true

# Shopify (Optional - for Shopify integration)
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SCOPES=read_customers,write_customers,read_orders,write_orders
HOST=https://walletsz.netlify.app
```

### Step 3: Trigger Redeploy
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 2-3 minutes for deployment

### Step 4: Test
1. Visit: https://walletsz.netlify.app/
2. Try logging in
3. Should work! ✅

---

## Copy-Paste Format for Netlify

For easier setup, here's the format Netlify accepts:

**Variable Name:** `DB_HOST`  
**Value:** `family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com`

**Variable Name:** `DB_PORT`  
**Value:** `5432`

**Variable Name:** `DB_NAME`  
**Value:** `shopify_wallet`

**Variable Name:** `DB_USER`  
**Value:** `postgres`

**Variable Name:** `DB_PASSWORD`  
**Value:** `v4HmYtmNgvsVkRrB81AT`

**Variable Name:** `BCRYPT_SALT_ROUNDS`  
**Value:** `10`

**Variable Name:** `DEFAULT_OTP_EXPIRY_SECONDS`  
**Value:** `120`

**Variable Name:** `CORS_ORIGIN`  
**Value:** `https://walletsz.netlify.app`

**Variable Name:** `CORS_CREDENTIALS`  
**Value:** `true`

---

## Why 500 Error?

The Netlify Function is trying to connect to the database but doesn't have the credentials. Once you add the environment variables and redeploy, it will work!

---

## After Adding Variables

Your app will be fully functional:
- ✅ Login/Signup
- ✅ Dashboard with stats
- ✅ Wallet operations
- ✅ Settings
- ✅ All features working

---

## Troubleshooting

### Still getting 500 error after adding variables?
1. Make sure you clicked "Trigger deploy" after adding variables
2. Wait for the deploy to complete (check Deploys tab)
3. Clear browser cache and try again

### Can't find Environment Variables section?
1. Make sure you're logged into Netlify
2. Select the correct site (walletsz)
3. Look for "Site settings" in the top menu
4. Then "Environment variables" in the left sidebar

---

## Quick Access Links

- **Netlify Dashboard:** https://app.netlify.com/
- **Your Site:** https://walletsz.netlify.app/
- **Site Settings:** https://app.netlify.com/sites/walletsz/settings

---

**Estimated Time:** 5 minutes  
**Next Step:** Add environment variables in Netlify Dashboard
