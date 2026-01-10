# Deploy to Render - Quick Start

## 🚀 Deploy Backend First (10 minutes)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repository

### Step 2: Deploy Backend Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

```
Name: shopify-wallet-backend
Root Directory: backend
Environment: Node
Build Command: npm install
Start Command: node src/index.js
Instance Type: Free
```

4. **Add Environment Variables** (click "Advanced"):

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

5. Click **"Create Web Service"**
6. Wait 3-5 minutes for deployment
7. **COPY YOUR BACKEND URL** (e.g., `https://shopify-wallet-backend.onrender.com`)

### Step 3: Test Backend

Visit: `https://your-backend-url.onrender.com/api/stats`

You should see JSON response (might be empty data, that's OK).

---

## 🎨 Deploy Frontend (5 minutes)

### Step 1: Update Frontend Config

**IMPORTANT**: Replace `your-backend-url` with the actual URL from backend deployment above.

Edit `.env.production`:
```bash
VITE_API_BASE_URL=https://your-actual-backend-url.onrender.com
```

### Step 2: Commit and Push

```bash
git add .env.production
git commit -m "Configure for Render deployment"
git push
```

### Step 3: Deploy Frontend on Render

1. Go back to Render dashboard
2. Click **"New +"** → **"Static Site"**
3. Select your repository
4. Configure:

```
Name: shopify-wallet-frontend
Root Directory: (leave empty)
Build Command: npm install && npm run build
Publish Directory: dist
```

5. **Add Environment Variables**:

```
VITE_APP_NAME=ShopWallet
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://your-actual-backend-url.onrender.com
```

6. Click **"Create Static Site"**
7. Wait 3-5 minutes

---

## ✅ Test Everything

1. Visit your frontend URL: `https://your-frontend.onrender.com`
2. Try to login with test credentials
3. Check browser console for any errors

---

## 🔧 Troubleshooting

### Backend not responding?
- Check Render logs: Dashboard → Backend Service → Logs
- Verify all environment variables are set
- Make sure AWS RDS allows connections (security group)

### Frontend can't connect to backend?
- Verify `VITE_API_BASE_URL` is correct in frontend env vars
- Check CORS is set to `*` in backend
- Look at browser Network tab for failed requests

### Database connection errors?
- Verify DB credentials are correct
- Check AWS RDS security group allows `0.0.0.0/0` (or Render IPs)
- Test connection from Render logs

---

## 📝 Important Notes

- **First request after inactivity**: Render free tier spins down after 15 min. First request takes ~30 seconds.
- **Auto-deploy**: Every git push triggers new deployment
- **Logs**: Real-time logs available in Render dashboard
- **SSL**: Automatic HTTPS for both services

---

## 🎯 Summary

1. ✅ Deploy backend → Get URL
2. ✅ Update `.env.production` with backend URL
3. ✅ Commit and push
4. ✅ Deploy frontend
5. ✅ Test login

**Total time: ~15 minutes**

Much better than Netlify Functions! 🎉
