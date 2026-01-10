# Deploy Backend to Railway (5 Minutes)

## Why Railway Instead of Netlify Functions?

- ✅ Designed for Node.js/Express apps
- ✅ Free tier available
- ✅ Deploys in 2-3 minutes
- ✅ Built-in PostgreSQL support
- ✅ No complex configuration needed
- ✅ Actual server logs you can see

## Step-by-Step Deployment

### 1. Create a Standalone Backend

We'll use your existing `backend/` folder:

```bash
cd backend
```

### 2. Sign Up for Railway

1. Go to: https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub
4. Select your repository: `shopify-walletx`

### 3. Configure the Deployment

Railway will auto-detect your Node.js app. Set these:

**Root Directory**: `backend`
**Start Command**: `node src/index.js`

### 4. Add Environment Variables

In Railway dashboard, add:
```
DB_HOST=family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=shopify_wallet
DB_USER=postgres
DB_PASSWORD=v4HmYtmNgvsVkRrB81AT
BCRYPT_SALT_ROUNDS=12
DEFAULT_OTP_EXPIRY_SECONDS=120
PORT=3000
```

### 5. Deploy

Railway will automatically deploy. You'll get a URL like:
`https://your-app.railway.app`

### 6. Update Frontend

Update your frontend to use the Railway URL:

In `.env.production`:
```
VITE_API_BASE_URL=https://your-app.railway.app
```

Then redeploy frontend to Netlify:
```bash
git add .env.production
git commit -m "Update API URL to Railway"
git push
```

## Alternative: Render.com

If Railway doesn't work, try Render:

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `node src/index.js`
7. Add same environment variables
8. Deploy!

## Benefits

- Your backend will actually work
- You can see real logs
- No more "Cannot GET" errors
- Proper server environment
- Easy to debug

## Time Estimate

- Railway setup: 5 minutes
- First deployment: 2-3 minutes
- Frontend update: 2 minutes

**Total: ~10 minutes to have a working app!**

Much better than continuing to fight with Netlify Functions!
