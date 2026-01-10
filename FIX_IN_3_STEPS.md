# 🚨 FIX YOUR 500 ERRORS IN 3 STEPS

## Why You're Getting 500 Errors

Your Netlify function can't connect to the database because **environment variables are not set**.

## The Fix (3 Simple Steps)

### ✅ STEP 1: Set Environment Variables (5 minutes)

1. Open this link: **https://app.netlify.com/sites/walletsz/settings/deploys#environment**

2. Click **"Add a variable"** button

3. Copy-paste these **EXACTLY** (one at a time):

| Name | Value |
|------|-------|
| `DB_HOST` | `family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `shopify_wallet` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `v4HmYtmNgvsVkRrB81AT` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `DEFAULT_OTP_EXPIRY_SECONDS` | `120` |
| `CORS_ORIGIN` | `https://walletsz.netlify.app` |

4. Click **"Save"**

### ✅ STEP 2: Deploy the Code (1 minute)

Open terminal and run these commands:

```bash
git add .
git commit -m "Fix database connection"
git push
```

### ✅ STEP 3: Wait & Test (2 minutes)

1. Wait for Netlify to deploy (watch at: https://app.netlify.com/sites/walletsz/deploys)

2. When it says "Published", test this URL:
   **https://walletsz.netlify.app/api/health**

3. If you see `"status": "ok"` and `"database": "connected"` → **YOU'RE DONE!** ✅

4. Try logging in at: **https://walletsz.netlify.app**

---

## That's It!

After these 3 steps, your app will work. The 500 errors will be gone.

## Still Not Working?

Check the health endpoint: https://walletsz.netlify.app/api/health

It will tell you exactly what's wrong:
- If it says "Missing environment variables" → Go back to Step 1
- If it says "Database connection error" → Your AWS RDS might be blocking Netlify
- If it returns an error → Check Netlify function logs

## Questions?

Just tell me what the `/api/health` endpoint returns and I'll help you fix it!
