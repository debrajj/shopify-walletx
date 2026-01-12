# Deploy Checkout Extension - Manual Method (No CLI Required)

## 🎯 Quick Steps

### Step 1: Go to Partner Dashboard

1. Visit: https://partners.shopify.com/
2. Click on your app: **walttz**
3. Click **"Extensions"** in the left sidebar

### Step 2: Create New Extension

1. Click **"Create extension"** button
2. Select **"Checkout UI extension"**
3. Name it: `Wallet Coins Checkout`
4. Click **"Create"**

### Step 3: Copy Extension Code

1. Open file: `extensions/checkout-wallet-simple/extension.js`
2. **Copy ALL the code** (Ctrl+A, Ctrl+C)
3. Go back to Partner Dashboard extension editor
4. **Paste the code** into the editor
5. Click **"Save"**

### Step 4: Create Version

1. Click **"Create version"** button
2. Add version notes: `Initial wallet checkout extension`
3. Click **"Create version"**
4. Wait for build to complete (~30 seconds)

### Step 5: Activate in Your Store

1. Go to your store admin: https://admin.shopify.com/store/cmstestingg
2. Navigate to: **Settings → Checkout**
3. Scroll down to **"Checkout extensions"** section
4. Find **"Wallet Coins Checkout"**
5. Click **"Add"** or toggle it **ON**
6. Click **"Save"** at the top

---

## ✅ Testing

### Test the Extension:

1. **Go to your store**: https://cmstestingg.myshopify.com
2. **Add a product to cart**
3. **Go to checkout**
4. **Look for "💰 Use Wallet Coins" section**

### Test Flow:

1. **Enter phone number**: e.g., `+1234567890`
2. **Click "Send OTP"**
3. **Check backend logs** for OTP:
   - Go to: https://dashboard.render.com
   - Click on **shopify-walletx** (backend)
   - Click **"Logs"**
   - Look for: `[cmstestingg.myshopify.com] OTP for +1234567890: 123456`
4. **Enter the OTP** from logs
5. **Click "Verify"**
6. **See wallet balance** (will be 0 for new customer)

### Add Test Coins:

1. **Go to admin app**: https://admin.shopify.com/store/cmstestingg/apps/walttz
2. **Click "Customers"** tab
3. **Search for phone**: `+1234567890`
4. **Add coins**: e.g., 100 coins
5. **Go back to checkout** and try again
6. **Should see balance**: "Balance: 100 coins"
7. **Enter coins to use**: e.g., 50
8. **Click "Apply Coins"**
9. **Discount should apply** to order total

---

## 🎨 What It Looks Like

```
┌─────────────────────────────────────┐
│  💰 Use Wallet Coins                │
│                                     │
│  Enter phone to access wallet       │
│  ┌─────────────────────────────┐   │
│  │ Phone Number                │   │
│  │ +1234567890                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ Send OTP ]                       │
└─────────────────────────────────────┘
```

After OTP verification:

```
┌─────────────────────────────────────┐
│  💰 Use Wallet Coins                │
│                                     │
│  ℹ️ Balance: 100 coins              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Coins to Use                │   │
│  │ 50                          │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ Apply Coins ]                    │
│                                     │
│  Use Different Phone                │
└─────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Extension Not Showing:

**Check 1**: Is it activated?
- Go to: Settings → Checkout
- Look for "Wallet Coins Checkout"
- Make sure toggle is ON

**Check 2**: Is version deployed?
- Go to Partner Dashboard → Extensions
- Check if version shows as "Active"

**Check 3**: Clear cache
- Open checkout in incognito/private window
- Hard refresh (Ctrl+Shift+R)

### OTP Not Received:

**Check backend logs**:
1. Go to: https://dashboard.render.com
2. Click **shopify-walletx**
3. Click **Logs**
4. Look for OTP in logs

**Test API directly**:
```bash
curl -X POST https://shopify-walletx.onrender.com/api/otp/send \
  -H "Content-Type: application/json" \
  -H "x-shop-url: cmstestingg.myshopify.com" \
  -d '{"phone":"+1234567890"}'
```

### Discount Not Applying:

**Check discount code format**:
- Should be: `WALLET-1234567890-50`
- Format: `WALLET-{phone_digits}-{coins}`

**Verify backend is running**:
- Visit: https://shopify-walletx.onrender.com/api/stats
- Should return JSON with stats

---

## 📝 Extension Code Location

The extension code is in:
```
extensions/checkout-wallet-simple/extension.js
```

This is a simplified version that:
- ✅ Works without CLI
- ✅ Can be copy-pasted directly
- ✅ Has all features (OTP, wallet, discount)
- ✅ Handles errors gracefully
- ✅ Shows loading states

---

## 🎊 Summary

**Steps**:
1. ✅ Go to Partner Dashboard
2. ✅ Create Checkout UI Extension
3. ✅ Copy code from `extension.js`
4. ✅ Paste and save
5. ✅ Create version
6. ✅ Activate in store settings
7. ✅ Test at checkout

**Time**: 10-15 minutes

**Result**: Customers can use wallet coins at checkout! 🚀

---

## 🔗 Quick Links

- **Partner Dashboard**: https://partners.shopify.com/
- **Store Admin**: https://admin.shopify.com/store/cmstestingg
- **App**: https://admin.shopify.com/store/cmstestingg/apps/walttz
- **Backend Logs**: https://dashboard.render.com
- **Extension Code**: `extensions/checkout-wallet-simple/extension.js`

