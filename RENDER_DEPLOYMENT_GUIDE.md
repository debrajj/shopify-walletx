# Deploy Full Stack App to Render

## Overview
We'll deploy both frontend and backend to Render as separate services that work together.

## Architecture
```
Frontend (Static Site) → Backend (Web Service) → PostgreSQL Database
```

---

## Part 1: Deploy Backend (5 minutes)

### Step 1: Go to Render Dashboard
1. Visit: https://render.com
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"

### Step 2: Connect Repository
1. Select your repository: `shopify-walletx`
2. Click "Connect"

### Step 3: Configure Backend Service

**Name**: `shopify-wallet-backend`

**Root Directory**: `backend`

**Environment**: `Node`

**Build Command**: `npm install`

**Start Command**: `node src/index.js`

**Instance Type**: `Free`

### Step 4: Add Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

```
DB_HOST=family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=shopify_wallet
DB_USER=postgres
DB_PASSWORD=v4HmYtmNgvsVkRrB81AT
BCRYPT_SALT_ROUNDS=12
DEFAULT_OTP_EXPIRY_SECONDS=120
PORT=3000
CORS_ORIGIN=*
```

### Step 5: Deploy Backend

1. Click "Create Web Service"
2. Wait 2-3 minutes for deployment
3. Copy your backend URL (e.g., `https://shopify-wallet-backend.onrender.com`)

---

## Part 2: Deploy Frontend (5 minutes)

### Step 1: Update Frontend Configuration

First, update the API URL to point to your Render backend:

```bash
# Update .env.production
echo "VITE_API_BASE_URL=https://your-backend-url.onrender.com" > .env.production
```

Replace `your-backend-url` with the actual URL from Step 5 above.

### Step 2: Commit Changes

```bash
git add .env.production
git commit -m "Update API URL for Render deployment"
git push
```

### Step 3: Create Frontend Service in Render

1. Go back to Render dashboard
2. Click "New +" → "Static Site"
3. Select your repository: `shopify-walletx`

### Step 4: Configure Frontend Service

**Name**: `shopify-wallet-frontend`

**Root Directory**: (leave empty - use root)

**Build Command**: `npm install && npm run build`

**Publish Directory**: `dist`

### Step 5: Add Frontend Environment Variables

Add these environment variables:

```
VITE_APP_NAME=ShopWallet
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

(Replace with your actual backend URL)

### Step 6: Deploy Frontend

1. Click "Create Static Site"
2. Wait 2-3 minutes for deployment
3. You'll get a URL like: `https://shopify-wallet-frontend.onrender.com`

---

## Part 3: Test Your Deployment

### Test Backend
Visit: `https://your-backend-url.onrender.com/`

Should return: `Cannot GET /` (this is normal - the backend is running)

### Test Frontend
Visit: `https://your-frontend-url.onrender.com`

Try logging in - it should work!

---

## Troubleshooting

### Backend Issues

**Problem**: "Application failed to respond"
- Check Render logs: Dashboard → Your Service → Logs
- Verify environment variables are set correctly
- Ensure `PORT` is set to `3000`

**Problem**: Database connection errors
- Verify all DB_ environment variables are correct
- Check AWS RDS security group allows connections from `0.0.0.0/0`

### Frontend Issues

**Problem**: API requests failing
- Verify `VITE_API_BASE_URL` points to correct backend URL
- Check CORS settings in backend
- Look at browser console for errors

### CORS Issues

If you get CORS errors, update backend CORS:

In `backend/src/index.js`, change:
```javascript
app.use(cors({
  origin: '*',  // Allow all origins for now
  credentials: true
}));
```

---

## Benefits of Render

✅ **Free tier** for both frontend and backend
✅ **Automatic deployments** on git push
✅ **Real logs** you can actually see
✅ **SSL certificates** included
✅ **Easy environment variables** management
✅ **No serverless complexity**

---

## Cost

- **Backend**: Free (with some limitations)
- **Frontend**: Free
- **Total**: $0/month

Free tier limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to paid ($7/month) for always-on

---

## Next Steps

1. Deploy backend first
2. Get backend URL
3. Update frontend config with backend URL
4. Deploy frontend
5. Test everything works!

**Total time: ~15 minutes**

Much better than fighting with Netlify Functions! 🎉
