# Troubleshooting - Discount Code Not Generating

## Issue
When entering coins and pressing Enter, the discount code is not being generated.

## Debugging Steps

### 1. Check if Widget is Loaded
Open browser console (F12) and look for:
```
[Wallet Widget] Initialized and watching for cart
```

If you don't see this, the widget isn't loading.

### 2. Check if Widget is Injected
Look for:
```
[Wallet Widget] Injected after .cart-discount
```
or
```
[Wallet Widget] Injected into: [selector]
```

If you don't see this, the widget isn't being injected into the cart.

### 3. Check Balance Loading
After entering email, look for:
```
[Wallet Widget] Balance loaded: 2730 coins
```

### 4. Check Coin Application
After entering coins and pressing Enter, look for:
```
[Wallet Widget] 📝 Apply coins request: {...}
[Wallet Widget] 🎫 Creating discount for X coins (₹X)
[Wallet Widget] 🎟️  Generated code: WALLETXXXXXXXXXX
[Wallet Widget] 📤 Creating discount in Shopify...
[Wallet Widget] 📥 Response status: 200
[Wallet Widget] 📥 Response data: {...}
[Wallet Widget] ✅ Discount created: WALLETXXXXXXXXXX
[Wallet Widget] 🚀 Redirecting to checkout with code: WALLETXXXXXXXXXX
```

## Common Issues

### Issue 1: Widget Not Loading
**Symptoms:** No `[Wallet Widget]` logs in console

**Solutions:**
1. Check if extension is enabled in theme customizer
2. Clear browser cache
3. Check if cart drawer exists on page

### Issue 2: Widget Not Injecting
**Symptoms:** Widget initialized but not injected

**Solutions:**
1. Check if `.cart-discount` element exists
2. Try opening cart drawer
3. Check theme compatibility

### Issue 3: Balance Not Loading
**Symptoms:** "Email not found" error

**Solutions:**
1. Verify email exists in database: `node check-wallet-data.js`
2. Check store URL matches: `cmstestingg.myshopify.com`
3. Verify store settings exist: `node add-store-settings.js`

### Issue 4: Discount Not Creating
**Symptoms:** Error when pressing Enter

**Solutions:**
1. Check backend logs on Render
2. Verify Shopify API token is set
3. Test API directly: `node test-discount-creation.js`

### Issue 5: Network Errors
**Symptoms:** "Network error" message

**Solutions:**
1. Check if backend is running: https://shopify-walletx.onrender.com/api/health
2. Check CORS settings
3. Verify API URL in widget

## Manual Testing

### Test 1: Check Backend Health
```bash
curl https://shopify-walletx.onrender.com/api/health
```

Should return: `{"status":"ok"}`

### Test 2: Check Balance API
```bash
curl "https://shopify-walletx.onrender.com/api/wallet/balance?email=debrajecomcure@gmail.com" \
  -H "x-shop-url: cmstestingg.myshopify.com"
```

Should return: `{"success":true,"walletCoins":2730,"currency":"INR"}`

### Test 3: Test Discount Creation
```bash
node test-discount-creation.js
```

Should show: `✅ SUCCESS!`

## Quick Fixes

### Fix 1: Redeploy Widget
```bash
cd extensions/wallet-theme-app
shopify app deploy
```

### Fix 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Check Theme Customizer
1. Go to Shopify Admin → Online Store → Themes
2. Click "Customize" on active theme
3. Check if "Wallet Coins" app block is enabled
4. Make sure it's placed in cart drawer

## What to Share for Help

If still not working, share:
1. Full console logs (all `[Wallet Widget]` messages)
2. Network tab showing API requests
3. Screenshot of cart drawer
4. Any error messages

## Expected Flow

**Correct flow:**
1. User opens cart drawer
2. Widget injects into cart
3. User enters email
4. Balance loads (2730 coins)
5. User enters coins (e.g., 100)
6. User presses Enter
7. Console shows discount code generation
8. Redirects to checkout with `?discount=WALLETXXXXXXXXXX`
9. Discount appears at checkout

**Current issue:**
Step 7 is not happening - discount code not being generated.

## Next Steps

1. Open your store in browser
2. Open DevTools console (F12)
3. Add items to cart
4. Open cart drawer
5. Enter email: `debrajecomcure@gmail.com`
6. Enter coins: `100`
7. Press Enter
8. Copy ALL console logs
9. Share the logs to identify the issue
