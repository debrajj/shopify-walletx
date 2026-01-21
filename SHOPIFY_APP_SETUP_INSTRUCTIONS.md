# Shopify App Setup Instructions

## ✅ Code Implementation Complete!

All the code has been implemented. Now you need to configure your Shopify Partner account and get API credentials.

---

## Step 1: Create Shopify Partner Account

1. Go to: https://partners.shopify.com/signup
2. Sign up for a free Partner account
3. Verify your email address
4. Complete your partner profile

---

## Step 2: Create a New Shopify App

1. **Login to Partner Dashboard**: https://partners.shopify.com/
2. **Click "Apps"** in the left sidebar
3. **Click "Create app"** button
4. **Select "Create app manually"**
5. **Fill in the app details**:
   - **App name**: `ShopWallet Admin`
   - Click **"Create app"**

---

## Step 3: Configure App Settings

### Get Your API Credentials

After creating the app, you'll see:
- **API key** (also called Client ID)
- **API secret key** (also called Client Secret)

**⚠️ IMPORTANT: Copy these values - you'll need them in the next steps!**

### Configure App URLs

1. Go to **"Configuration"** tab
2. Under **"App URL"**, set:
   ```
   https://shopify-walletx-1.onrender.com
   ```

3. Under **"Allowed redirection URL(s)"**, add:
   ```
   https://shopify-walletx-1.onrender.com/auth/callback
   https://shopify-walletx-1.onrender.com/auth/shopify/callback
   ```

4. **Save** the configuration

### Enable Embedded App

1. Still in **"Configuration"** tab
2. Scroll to **"Embedded app"** section
3. ✅ Check **"Embed your app in Shopify admin"**
4. **Save**

### Configure API Scopes

1. Go to **"Configuration"** → **"API access"**
2. Select these scopes:
   - ✅ `read_orders` - Read order data
   - ✅ `write_orders` - Modify orders
   - ✅ `read_customers` - Read customer data
   - ✅ `write_customers` - Update customer data
   - ✅ `read_discounts` - Read discount codes
   - ✅ `write_discounts` - Create discount codes

3. **Save** the scopes

---

## Step 4: Update Environment Variables

### Frontend (Render Static Site)

1. Go to: https://dashboard.render.com
2. Click on your frontend service: **shopify-walletx-1**
3. Go to **"Environment"** tab
4. Add/Update these variables:

```bash
VITE_SHOPIFY_API_KEY=<paste_your_api_key_here>
VITE_APP_URL=https://shopify-walletx-1.onrender.com
```

5. Click **"Save Changes"**

### Backend (Render Web Service)

1. Go to: https://dashboard.render.com
2. Click on your backend service: **shopify-walletx**
3. Go to **"Environment"** tab
4. Add/Update these variables:

```bash
SHOPIFY_API_KEY=your-shopify-api-key-here
SHOPIFY_API_SECRET=your-shopify-api-secret-here
SHOPIFY_REDIRECT_URI=https://shopify-walletx-1.onrender.com/auth/callback
```

5. Click **"Save Changes"**

---

## Step 5: Deploy Updated Code

### Commit and Push Changes

```bash
git add .
git commit -m "Add Shopify App Bridge integration"
git push origin main
```

Both Render services will automatically redeploy with the new code.

---

## Step 6: Create a Development Store (For Testing)

1. In Partner Dashboard, go to **"Stores"**
2. Click **"Add store"**
3. Select **"Development store"**
4. Fill in:
   - **Store name**: `test-shopwallet` (or any name)
   - **Store purpose**: Testing an app
5. Click **"Create development store"**

---

## Step 7: Install Your App on Development Store

### Method 1: Direct Installation Link

1. In Partner Dashboard, go to **"Apps"** → Your app
2. Click **"Test your app"**
3. Select your development store
4. Click **"Install app"**
5. Shopify will redirect to your app and complete OAuth

### Method 2: Manual Installation

1. Go to: `https://shopify-walletx-1.onrender.com/install`
2. Enter your development store URL: `test-shopwallet.myshopify.com`
3. Click **"Install App"**
4. Complete the OAuth flow

---

## Step 8: Access Your App

After installation, you can access your app from:

**Shopify Admin → Apps → ShopWallet Admin**

Your React dashboard will load inside the Shopify admin panel!

---

## Testing Checklist

- [ ] Created Shopify Partner account
- [ ] Created app in Partner Dashboard
- [ ] Copied API Key and API Secret
- [ ] Configured App URLs and redirect URIs
- [ ] Enabled embedded app mode
- [ ] Set API scopes
- [ ] Updated frontend environment variables on Render
- [ ] Updated backend environment variables on Render
- [ ] Pushed code changes to GitHub
- [ ] Created development store
- [ ] Installed app on development store
- [ ] Accessed app from Shopify admin

---

## Troubleshooting

### App doesn't load in Shopify admin
- Check that "Embed your app in Shopify admin" is enabled
- Verify `VITE_SHOPIFY_API_KEY` matches your Partner Dashboard API key
- Check browser console for errors

### OAuth fails
- Verify redirect URIs match exactly in Partner Dashboard
- Check backend environment variables are set correctly
- Look at backend logs on Render for error messages

### "Invalid API key" error
- Make sure you're using the API key from the correct app
- Verify the key is set in both frontend and backend environment variables
- Redeploy after updating environment variables

---

## What Happens Next?

1. **Merchants install your app** from Partner Dashboard or App Store
2. **OAuth flow** authenticates the merchant's store
3. **Your app loads** inside Shopify admin panel
4. **Merchants manage wallets** using your dashboard
5. **Backend API** handles all wallet operations

---

## Going Live (Optional)

To publish your app to the Shopify App Store:

1. Complete app listing in Partner Dashboard
2. Add app screenshots and description
3. Submit for Shopify review
4. Once approved, merchants can install from App Store

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Shopify Admin Panel                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Your App (Embedded)                               │ │
│  │  https://shopify-walletx-1.onrender.com/          │ │
│  │                                                     │ │
│  │  Dashboard → Customers → Transactions → Settings  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼ API Calls
                         │
         https://shopify-walletx.onrender.com/api
                         │
                         ▼
              PostgreSQL Database (AWS RDS)
```

---

## Support

If you encounter issues:
1. Check Render logs for both frontend and backend
2. Verify all environment variables are set correctly
3. Test OAuth flow step by step
4. Check Shopify Partner Dashboard for app status

---

## Summary

✅ **Code is ready!**
⚠️ **Next steps**: Get Shopify API credentials and configure environment variables
🚀 **Then**: Install on development store and test!

