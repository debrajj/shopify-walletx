# Render Deployment Checklist

## ✅ Pre-Deployment Checklist

- [x] Backend code is ready in `backend/` directory
- [x] Database credentials are available
- [x] GitHub repository is up to date
- [ ] Render account created

---

## 🔴 STEP 1: Deploy Backend (DO THIS FIRST!)

### Actions:
1. [ ] Go to https://render.com and sign up/login
2. [ ] Click "New +" → "Web Service"
3. [ ] Connect GitHub repository
4. [ ] Set Root Directory: `backend`
5. [ ] Set Build Command: `npm install`
6. [ ] Set Start Command: `node src/index.js`
7. [ ] Add all 8 environment variables:
   - [ ] DB_HOST
   - [ ] DB_PORT
   - [ ] DB_NAME
   - [ ] DB_USER
   - [ ] DB_PASSWORD
   - [ ] BCRYPT_SALT_ROUNDS
   - [ ] DEFAULT_OTP_EXPIRY_SECONDS
   - [ ] PORT
   - [ ] CORS_ORIGIN
8. [ ] Click "Create Web Service"
9. [ ] Wait for deployment (3-5 minutes)
10. [ ] **COPY BACKEND URL**: _______________________________

### Test Backend:
- [ ] Visit: `https://your-backend-url.onrender.com/api/stats`
- [ ] Should see JSON response (even if empty)

---

## 🔵 STEP 2: Update Frontend Config

### Actions:
1. [ ] Open `.env.production` file
2. [ ] Replace `VITE_API_BASE_URL` with your actual backend URL
3. [ ] Save file
4. [ ] Run: `git add .env.production`
5. [ ] Run: `git commit -m "Configure for Render"`
6. [ ] Run: `git push`

---

## 🟢 STEP 3: Deploy Frontend

### Actions:
1. [ ] Go back to Render dashboard
2. [ ] Click "New +" → "Static Site"
3. [ ] Select your repository
4. [ ] Leave Root Directory empty
5. [ ] Set Build Command: `npm install && npm run build`
6. [ ] Set Publish Directory: `dist`
7. [ ] Add 3 environment variables:
   - [ ] VITE_APP_NAME=ShopWallet
   - [ ] VITE_APP_VERSION=1.0.0
   - [ ] VITE_API_BASE_URL=(your backend URL)
8. [ ] Click "Create Static Site"
9. [ ] Wait for deployment (3-5 minutes)
10. [ ] **COPY FRONTEND URL**: _______________________________

---

## 🧪 STEP 4: Test Everything

### Test Login:
1. [ ] Visit your frontend URL
2. [ ] Try to login
3. [ ] Check browser console for errors
4. [ ] Verify dashboard loads

### If Login Fails:
- [ ] Check Render backend logs
- [ ] Verify CORS_ORIGIN is set to `*`
- [ ] Check browser Network tab for API calls
- [ ] Verify backend URL in frontend env vars

---

## 🎯 Success Criteria

✅ Backend responds at `/api/stats`
✅ Frontend loads without errors
✅ Login works
✅ Dashboard displays data

---

## 📞 Need Help?

### Common Issues:

**"Application failed to respond"**
→ Check Render logs for backend errors
→ Verify all environment variables are set

**"CORS error"**
→ Set CORS_ORIGIN=* in backend env vars
→ Redeploy backend

**"Cannot connect to database"**
→ Check AWS RDS security group
→ Verify DB credentials

**"Frontend shows blank page"**
→ Check browser console
→ Verify VITE_API_BASE_URL is correct
→ Check Render build logs

---

## 🚀 You're Done!

Once all checkboxes are complete, your app is live on Render!

**Backend**: https://your-backend.onrender.com
**Frontend**: https://your-frontend.onrender.com

No more Netlify Functions headaches! 🎉
