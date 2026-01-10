# 🚀 START HERE - Deploy to Render

## What Happened?

You were getting "Cannot GET /.netlify/functions/api" errors because Netlify Functions wasn't deploying properly. After multiple attempts to fix it, we're moving to **Render** which is more reliable for full-stack apps.

---

## 📋 What You Need to Do (15 minutes)

### 1️⃣ Deploy Backend (10 min)

Go to: https://render.com

1. Sign up with GitHub
2. Click "New +" → "Web Service"
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
5. Add these environment variables:
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
6. Click "Create Web Service"
7. **COPY YOUR BACKEND URL** (e.g., `https://shopify-wallet-backend.onrender.com`)

### 2️⃣ Update Frontend Config (2 min)

Edit `.env.production` and replace:
```
VITE_API_BASE_URL=https://your-actual-backend-url.onrender.com
```

Then:
```bash
git add .env.production
git commit -m "Update backend URL"
git push
```

### 3️⃣ Deploy Frontend (3 min)

Back in Render:

1. Click "New +" → "Static Site"
2. Select your repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables:
   ```
   VITE_APP_NAME=ShopWallet
   VITE_APP_VERSION=1.0.0
   VITE_API_BASE_URL=https://your-actual-backend-url.onrender.com
   ```
5. Click "Create Static Site"

### 4️⃣ Test It!

Visit your frontend URL and try logging in. It should work! 🎉

---

## 📚 Detailed Guides

- **Step-by-step**: `DEPLOY_TO_RENDER_NOW.md`
- **Checklist**: `RENDER_CHECKLIST.md`
- **Why Render?**: `WHY_RENDER_NOT_NETLIFY.md`
- **Full guide**: `RENDER_DEPLOYMENT_GUIDE.md`

---

## 🆘 Need Help?

### Backend not responding?
→ Check Render logs in dashboard

### Frontend can't connect?
→ Verify `VITE_API_BASE_URL` is correct

### Database errors?
→ Check AWS RDS security group allows connections

---

## ✅ Success Looks Like

- Backend URL responds: `https://your-backend.onrender.com/api/stats`
- Frontend loads without errors
- Login works
- Dashboard shows data

---

## 🎯 Bottom Line

**Netlify Functions = Broken** ❌
**Render = Works** ✅

Follow the steps above and you'll be live in 15 minutes!

Good luck! 🚀
