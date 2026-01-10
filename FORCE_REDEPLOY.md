# Force Netlify to Redeploy the Function

## The Problem
Netlify bundled the function but uploaded "0 new functions" because it thinks nothing changed.

## Solution: Clear Deploy Cache

### Option 1: Clear Cache in Netlify Dashboard (RECOMMENDED)
1. Go to: https://app.netlify.com/sites/walletsz/settings/deploys
2. Scroll down to "Build & deploy" section
3. Click "Clear cache and retry deploy" button
4. Wait for the new deployment to complete

### Option 2: Trigger Deploy with Cache Clear
1. Go to: https://app.netlify.com/sites/walletsz/deploys
2. Click "Trigger deploy" dropdown
3. Select "Clear cache and deploy site"
4. Wait for deployment

### Option 3: Make a Small Change to Force Redeploy
Add a comment to the function file:

```bash
# Add a comment to force change detection
echo "// Updated $(date)" >> netlify/functions/api.js
git add netlify/functions/api.js
git commit -m "Force function redeploy"
git push
```

## After Redeployment

Once the cache is cleared and it redeploys, you should see:
```
1 new function(s) to upload
```

Then test:
- https://walletsz.netlify.app/.netlify/functions/api
- https://walletsz.netlify.app (login should work)

## Why This Happened
Netlify caches function builds for performance. When we had the broken function earlier, it got cached. Even though we fixed it, Netlify kept serving the cached broken version.
