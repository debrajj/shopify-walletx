# Deployment Flow - Visual Guide

## Current Problem

```
┌─────────────────────────────────────────────────────────┐
│  Netlify Deployment (BROKEN)                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Netlify) ──X──> Netlify Functions ──X──> DB  │
│                              ↑                           │
│                         Cannot GET                       │
│                    /.netlify/functions/api               │
│                                                          │
│  Status: 500 errors, function not deploying             │
└─────────────────────────────────────────────────────────┘
```

## Solution: Render Deployment

```
┌─────────────────────────────────────────────────────────┐
│  Render Deployment (WORKING)                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend ────────> Backend ────────> Database          │
│  (Static Site)      (Web Service)     (AWS RDS)         │
│                                                          │
│  ✅ Reliable        ✅ Full logs      ✅ Connected       │
│  ✅ Fast builds     ✅ Easy debug     ✅ Secure          │
└─────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flow

### Phase 1: Backend Deployment

```
┌──────────────┐
│ 1. Go to     │
│ Render.com   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. Create    │
│ Web Service  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. Configure │
│ - Root: backend
│ - Build: npm install
│ - Start: node src/index.js
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. Add 8     │
│ Environment  │
│ Variables    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. Deploy    │
│ (3-5 min)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 6. Copy      │
│ Backend URL  │
└──────────────┘
```

### Phase 2: Frontend Configuration

```
┌──────────────┐
│ 1. Edit      │
│ .env.production
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. Update    │
│ VITE_API_BASE_URL
│ with backend URL
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. Git       │
│ commit & push│
└──────────────┘
```

### Phase 3: Frontend Deployment

```
┌──────────────┐
│ 1. Create    │
│ Static Site  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. Configure │
│ - Build: npm install && npm run build
│ - Publish: dist
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. Add 3     │
│ Environment  │
│ Variables    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. Deploy    │
│ (3-5 min)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. Test      │
│ Login!       │
└──────────────┘
```

---

## Environment Variables Reference

### Backend (8 variables)
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

### Frontend (3 variables)
```
VITE_APP_NAME=ShopWallet
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

---

## Timeline

```
┌─────────────────────────────────────────────────────┐
│ Total Time: ~15 minutes                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Backend Deploy:     ████████░░ (10 min)            │
│ Frontend Config:    ██░░░░░░░░ (2 min)             │
│ Frontend Deploy:    ███░░░░░░░ (3 min)             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Success Indicators

### ✅ Backend Deployed Successfully
- Render shows "Live" status
- URL responds: `https://your-backend.onrender.com/api/stats`
- Logs show "Database initialized"

### ✅ Frontend Deployed Successfully
- Render shows "Live" status
- Site loads without errors
- Login page appears

### ✅ Everything Working
- Login succeeds
- Dashboard loads
- Data displays correctly

---

## Troubleshooting Decision Tree

```
Login fails?
    │
    ├─> Check browser console
    │   │
    │   ├─> CORS error?
    │   │   └─> Set CORS_ORIGIN=* in backend
    │   │
    │   └─> Network error?
    │       └─> Check VITE_API_BASE_URL
    │
    └─> Check Render logs
        │
        ├─> Database error?
        │   └─> Verify DB credentials
        │
        └─> Server error?
            └─> Check environment variables
```

---

## Quick Commands

```bash
# Update frontend config
git add .env.production
git commit -m "Update backend URL"
git push

# Check backend is running (replace URL)
curl https://your-backend.onrender.com/api/stats

# View logs
# Go to Render dashboard → Your service → Logs
```

---

## Resources

- Render Dashboard: https://dashboard.render.com
- Backend Logs: Dashboard → Backend Service → Logs
- Frontend Logs: Dashboard → Frontend Service → Logs

---

## Next Steps After Deployment

1. ✅ Test all features (login, dashboard, transactions)
2. ✅ Update CORS_ORIGIN to your frontend URL (for security)
3. ✅ Consider upgrading to paid tier ($7/mo) for no cold starts
4. ✅ Set up custom domain (optional)

---

**Ready? Start with `START_HERE.md`!** 🚀
