# 🚀 Netlify Deployment Guide

## ✅ Build Fixed!

The TypeScript build errors have been resolved. Your app is now ready for Netlify deployment.

---

## 🔧 What Was Fixed

### 1. TypeScript Configuration
Updated `tsconfig.json` to:
- Exclude `backend/` and `shopify-app/` directories
- Only include necessary frontend files
- Prevent TypeScript from compiling backend Node.js code

### 2. Unused Imports Removed
Fixed TypeScript strict mode errors:
- ✅ `App.tsx` - Removed unused `Bell` import
- ✅ `pages/Dashboard.tsx` - Removed unused `Wallet`, `TrendingUp` imports
- ✅ `pages/Reports.tsx` - Removed unused `Calendar`, `ArrowRight` imports
- ✅ `pages/Settings.tsx` - Removed unused `AlertCircle` import

### 3. Build Verification
```bash
npm run build
# ✅ Build successful in 3.08s
```

---

## 📋 Netlify Configuration

### Build Settings

**Build Command:**
```
npm run build
```

**Publish Directory:**
```
dist
```

**Node Version:**
```
18.x or higher
```

---

## 🔐 Environment Variables

Add these in Netlify Dashboard → Site Settings → Environment Variables:

### Frontend Variables (Required)
```
VITE_APP_NAME=ShopWallet
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=https://your-backend-url.com
VITE_DEV_PORT=5173
VITE_STORAGE_KEY=shopwallet_api_config
VITE_USER_STORAGE_KEY=shopwallet_user
VITE_ENABLE_HTTPS=false
VITE_CORS_ORIGIN=https://your-netlify-site.netlify.app
```

### Backend Variables (If deploying backend separately)
```
PORT=3000
BCRYPT_SALT_ROUNDS=10
DEFAULT_OTP_EXPIRY_SECONDS=120
CORS_ORIGIN=https://your-netlify-site.netlify.app
CORS_CREDENTIALS=true

DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=shopify_wallet
DB_USER=postgres
DB_PASSWORD=your-database-password

SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SCOPES=read_customers,write_customers,read_orders,write_orders
HOST=https://your-backend-domain.com
```

---

## 🚀 Deployment Steps

### Option 1: Deploy via Netlify Dashboard

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com/

2. **Add New Site**
   - Click "Add new site" → "Import an existing project"

3. **Connect to GitHub**
   - Select "GitHub"
   - Authorize Netlify
   - Choose repository: `debrajj/shopify-walletx`

4. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

5. **Add Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all VITE_* variables listed above

6. **Trigger Redeploy**
   - Go to Deploys → Trigger deploy → Deploy site

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

---

## 🔗 Backend Deployment

Your backend needs to be deployed separately. Options:

### Option 1: Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SHOPIFY_API_KEY=your-key
heroku config:set SHOPIFY_API_SECRET=your-secret
# ... add all other variables

# Deploy
git subtree push --prefix backend heroku main
```

### Option 2: Railway
1. Go to https://railway.app/
2. Create new project from GitHub
3. Select `backend` directory
4. Add environment variables
5. Deploy

### Option 3: Render
1. Go to https://render.com/
2. Create new Web Service
3. Connect GitHub repository
4. Set root directory to `backend`
5. Add environment variables
6. Deploy

### Option 4: AWS/DigitalOcean/etc.
Deploy as a Node.js application with PostgreSQL database.

---

## 🧪 Testing Deployment

### 1. Check Build Logs
- Go to Netlify Dashboard → Deploys
- Click on latest deploy
- Check build logs for errors

### 2. Test Frontend
```bash
# Visit your Netlify URL
https://your-site.netlify.app

# Check browser console for errors
# Test login functionality
# Verify API calls work
```

### 3. Test Backend Connection
```bash
# Test backend health
curl https://your-backend-url.com/api/stats

# Test Shopify endpoints
curl https://your-backend-url.com/api/shopify/coins/balance/test123 \
  -H "x-shop-url: test.myshopify.com"
```

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors
✅ **Fixed!** The latest commit resolves all TypeScript build errors.

### Environment Variables Not Working
- Ensure all VITE_* variables are prefixed correctly
- Redeploy after adding variables
- Check Netlify build logs for missing variables

### API Calls Failing
- Verify `VITE_BACKEND_URL` points to your deployed backend
- Check CORS settings on backend
- Ensure backend is deployed and running

### 404 on Page Refresh
Add `_redirects` file to `public/` directory:
```
/*    /index.html   200
```

Or add to `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📊 Build Status

Current build status: ✅ **PASSING**

```
✓ TypeScript compilation successful
✓ Vite build completed in 3.08s
✓ Output: dist/index.html (2.15 kB)
✓ Output: dist/assets/index-*.js (650.89 kB)
```

---

## 🎯 Post-Deployment Checklist

- [ ] Frontend deployed to Netlify
- [ ] Backend deployed (Heroku/Railway/Render/etc.)
- [ ] Environment variables configured
- [ ] Database connected
- [ ] CORS configured correctly
- [ ] Test login functionality
- [ ] Test wallet operations
- [ ] Test Shopify integration
- [ ] Configure custom domain (optional)
- [ ] Set up SSL certificate (automatic on Netlify)

---

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Environment Variables in Netlify](https://docs.netlify.com/environment-variables/overview/)

---

## ✅ Ready to Deploy!

Your app is now configured and ready for Netlify deployment. The build errors have been fixed and the app builds successfully.

**Next Steps:**
1. Deploy frontend to Netlify
2. Deploy backend to your preferred platform
3. Configure environment variables
4. Test the deployment

Good luck with your deployment! 🚀
