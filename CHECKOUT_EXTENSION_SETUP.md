# Shopify Checkout Extension Setup Guide

## ✅ What Was Created

A Shopify Checkout UI Extension that allows customers to:
1. Enter their phone number at checkout
2. Receive and verify OTP
3. See their wallet balance
4. Apply wallet coins as a discount

---

## 📁 Files Created

```
extensions/checkout-wallet/
├── shopify.extension.toml    # Extension configuration
├── package.json               # Dependencies
└── src/
    └── Checkout.jsx          # Main extension component
```

---

## 🚀 Deployment Steps

### Option 1: Deploy Using Shopify CLI (Recommended)

#### Step 1: Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/app
```

#### Step 2: Navigate to Extension Directory

```bash
cd extensions/checkout-wallet
```

#### Step 3: Install Dependencies

```bash
npm install
```

#### Step 4: Link to Your Shopify App

```bash
shopify app config link
```

- Select your app from Partner Dashboard
- This connects the extension to your app

#### Step 5: Deploy Extension

```bash
shopify app deploy
```

- Shopify CLI will build and upload the extension
- Extension will be available in your app

#### Step 6: Activate in Shopify Admin

1. Go to your development store
2. Navigate to: **Settings → Checkout**
3. Scroll to **Checkout extensions**
4. Find "Wallet Checkout" extension
5. Click **Add** to activate it
6. **Save** changes

---

### Option 2: Manual Deployment via Partner Dashboard

If Shopify CLI doesn't work, you can manually create the extension:

#### Step 1: Go to Partner Dashboard

1. Visit: https://partners.shopify.com/
2. Click on your app
3. Go to **Extensions** tab

#### Step 2: Create New Extension

1. Click **Create extension**
2. Select **Checkout UI extension**
3. Name it: `Wallet Checkout`

#### Step 3: Copy Extension Code

1. Copy the entire content from `extensions/checkout-wallet/src/Checkout.jsx`
2. Paste it into the extension editor
3. Click **Save**

#### Step 4: Deploy Extension

1. Click **Create version**
2. Add version notes: "Initial wallet checkout extension"
3. Click **Create**

#### Step 5: Activate in Store

1. Go to your development store
2. Navigate to: **Settings → Checkout**
3. Find the extension and activate it

---

## 🎨 How It Works

### Customer Flow:

1. **Customer goes to checkout**
2. **Sees "Use Your Wallet Coins" section**
3. **Enters phone number** → Clicks "Send OTP"
4. **Receives OTP** via SMS (logged in backend console for dev)
5. **Enters OTP** → Clicks "Verify OTP"
6. **Sees wallet balance** (e.g., "Available Balance: 100 coins")
7. **Enters coins to use** (e.g., 50)
8. **Clicks "Apply Coins"**
9. **Discount applied** to order total

### Technical Flow:

```
Checkout Page
     │
     ▼
Extension Loads
     │
     ▼
Customer Enters Phone
     │
     ▼
POST /api/otp/send
     │
     ▼
OTP Sent (logged in backend)
     │
     ▼
Customer Enters OTP
     │
     ▼
POST /api/otp/validate
     │
     ▼
GET /api/wallet/balance
     │
     ▼
Display Balance
     │
     ▼
Customer Applies Coins
     │
     ▼
Discount Code Applied
     │
     ▼
Order Total Reduced
```

---

## 🧪 Testing

### Test in Development Store:

1. **Add products to cart**
2. **Go to checkout**
3. **Look for "Use Your Wallet Coins" section**
4. **Enter phone number**: Use any number (e.g., +1234567890)
5. **Check backend logs** for OTP code:
   - Go to Render dashboard
   - Click on backend service
   - View logs
   - Look for: `[shop.myshopify.com] OTP for +1234567890: 123456`
6. **Enter the OTP** from logs
7. **See wallet balance** (will be 0 if new customer)
8. **Add coins via admin** dashboard first
9. **Try again** - should see balance
10. **Apply coins** - discount should apply

---

## 🔧 Configuration

### Update API URL (if needed):

In `extensions/checkout-wallet/src/Checkout.jsx`, line 24:

```javascript
const API_BASE = 'https://shopify-walletx.onrender.com/api';
```

Change this if your backend URL is different.

---

## 📊 Extension Features

✅ **Phone number input** with auto-fill for logged-in customers
✅ **OTP verification** for security
✅ **Real-time wallet balance** display
✅ **Flexible coin usage** - customer chooses amount
✅ **Automatic discount application**
✅ **Error handling** with user-friendly messages
✅ **Loading states** for better UX
✅ **Multi-step flow** (phone → OTP → wallet)

---

## 🎯 Customization Options

### Change Extension Position:

In `shopify.extension.toml`, modify the `target`:

```toml
[[extensions.targeting]]
target = "purchase.checkout.block.render"  # Current: anywhere in checkout
# target = "purchase.checkout.payment-method-list.render-after"  # After payment methods
# target = "purchase.checkout.shipping-option-list.render-after"  # After shipping
```

### Styling:

Shopify Checkout UI Extensions use Shopify's design system. You can customize:
- Colors (limited to theme colors)
- Spacing
- Text sizes
- Component arrangement

---

## 🐛 Troubleshooting

### Extension Not Showing:

1. **Check if extension is activated**:
   - Go to: Settings → Checkout
   - Look for "Wallet Checkout"
   - Make sure it's enabled

2. **Check extension deployment**:
   - Run: `shopify app versions list`
   - Verify latest version is deployed

3. **Check browser console**:
   - Open checkout page
   - Press F12
   - Look for errors in Console tab

### OTP Not Working:

1. **Check backend logs** on Render
2. **Verify environment variables** are set
3. **Test API endpoint** directly:
   ```bash
   curl -X POST https://shopify-walletx.onrender.com/api/otp/send \
     -H "Content-Type: application/json" \
     -H "x-shop-url: your-store.myshopify.com" \
     -d '{"phone":"+1234567890"}'
   ```

### Discount Not Applying:

1. **Check discount code format**: `WALLET-{phone}-{coins}`
2. **Verify backend has discount creation logic**
3. **Check Shopify discount settings** in admin

---

## 📝 Next Steps

1. **Deploy extension** using Shopify CLI
2. **Activate in checkout** settings
3. **Test with real checkout** flow
4. **Add coins to test customer** via admin
5. **Verify discount applies** correctly

---

## 🎊 Summary

✅ **Extension code created**
✅ **Configuration files ready**
⚠️ **Need to deploy** using Shopify CLI
⚠️ **Need to activate** in checkout settings
⚠️ **Need to test** with real checkout

**Estimated deployment time**: 15-20 minutes

Once deployed, customers will see the wallet option at checkout! 🚀

