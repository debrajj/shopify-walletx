# Deploy Wallet App Block Extension

## 🎯 What This Does

Creates an **App Block** that merchants can add to their theme from the theme editor. When customers install your app, they can drag-and-drop the wallet widget anywhere on their store.

---

## 📦 Quick Deploy Steps

### Method 1: Via Partner Dashboard (Easiest)

#### Step 1: Go to Partner Dashboard
1. Visit: https://partners.shopify.com/
2. Click on your app: **walttz**
3. Click **"Extensions"** tab

#### Step 2: Create App Block Extension
1. Click **"Create extension"**
2. Select **"Theme app extension"**
3. Name it: `Wallet Widget`
4. Click **"Create"**

#### Step 3: Add Block Files

**Create Block File:**
1. In the extension editor, create file: `blocks/wallet-widget.liquid`
2. Copy content from: `extensions/wallet-app-block/blocks/wallet-widget.liquid`
3. Paste and save

**Create Schema File:**
1. Create file: `blocks/wallet-widget.json`  
2. Copy content from: `extensions/wallet-app-block/blocks/wallet-widget.json`
3. Paste and save

#### Step 4: Deploy
1. Click **"Create version"**
2. Add notes: `Wallet balance widget for theme`
3. Click **"Create"**
4. Wait for deployment (~30 seconds)

---

### Method 2: Add to Theme Directly (Alternative)

If app blocks don't work, you can add the widget directly to the theme:

#### Step 1: Go to Theme Editor
1. Visit: https://admin.shopify.com/store/cmstestingg/themes
2. Click **"Customize"** on your active theme

#### Step 2: Add Custom Liquid Section
1. Click **"Add section"**
2. Select **"Custom Liquid"**
3. Paste the entire content from `wallet-widget.liquid`
4. Click **"Save"**

#### Step 3: Position the Widget
1. Drag the section to desired location
2. Common places:
   - Homepage
   - Account page
   - Product pages
   - Cart page

---

## 🎨 How Merchants Use It

### After Installation:

1. **Merchant goes to**: Theme Editor
2. **Clicks**: "Add section" or "Add block"
3. **Sees**: "Wallet Balance Widget" in the Apps section
4. **Drags** it to any page
5. **Customizes** title and settings
6. **Saves** theme

### Customer Experience:

```
┌────────────────────────────────────┐
│     💰 Your Wallet                 │
│                                    │
│  Enter your phone number to        │
│  check your balance                │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ +1234567890                  │ │
│  └──────────────────────────────┘ │
│                                    │
│  [    Check Balance    ]           │
└────────────────────────────────────┘
```

After verification:

```
┌────────────────────────────────────┐
│     💰 Your Wallet                 │
│                                    │
│  ┌──────────────────────────────┐ │
│  │   Available Balance          │ │
│  │                              │ │
│  │         100                  │ │
│  │                              │ │
│  │        Coins                 │ │
│  └──────────────────────────────┘ │
│                                    │
│  [  Refresh Balance  ]             │
└────────────────────────────────────┘
```

---

## ✨ Features

✅ **Beautiful gradient design** (purple/blue)
✅ **Phone number input** with validation
✅ **OTP verification** for security
✅ **Real-time balance** display
✅ **Responsive** - works on mobile & desktop
✅ **Easy to customize** via theme editor
✅ **No coding required** for merchants
✅ **Drag-and-drop** installation

---

## 🧪 Testing

### Test as Merchant:

1. **Install app** on test store
2. **Go to**: Theme Editor
3. **Add**: Wallet Balance Widget
4. **Save** and preview

### Test as Customer:

1. **Visit store** frontend
2. **Find** wallet widget on page
3. **Enter phone**: +1234567890
4. **Click** "Check Balance"
5. **Check backend logs** for OTP
6. **Enter OTP** and verify
7. **See balance** displayed

---

## 🎯 Where to Place Widget

### Recommended Locations:

1. **Homepage** - Above footer
2. **Account Page** - In sidebar
3. **Product Pages** - Below add to cart
4. **Cart Page** - In cart summary
5. **Custom Page** - Dedicated wallet page

### How to Add:

1. Open theme editor
2. Navigate to desired page
3. Click "Add section"
4. Select "Wallet Balance Widget"
5. Position and save

---

## 🔧 Customization

Merchants can customize:
- **Title text** (default: "💰 Your Wallet")
- **Show on mobile** (toggle)
- **Position** on page
- **Visibility** per page

---

## 📱 Mobile Responsive

The widget automatically adapts to:
- Desktop (max-width: 400px, centered)
- Tablet (full width with padding)
- Mobile (full width, optimized touch)

---

## 🐛 Troubleshooting

### Widget Not Showing in Theme Editor:

**Check 1**: Extension deployed?
- Go to Partner Dashboard → Extensions
- Verify version is "Active"

**Check 2**: App installed?
- Go to store admin → Apps
- Verify app is installed

**Check 3**: Theme compatible?
- Must be Online Store 2.0 theme
- Check theme version

### Widget Shows But Doesn't Work:

**Check API connection**:
```bash
curl https://shopify-walletx.onrender.com/api/stats
```

**Check browser console**:
- Open widget page
- Press F12
- Look for errors in Console

**Check backend logs**:
- Go to Render dashboard
- View backend logs
- Look for API requests

---

## 🚀 Alternative: Checkout Extension

If you want the widget at **checkout** instead of theme pages:

1. Use the checkout extension from earlier
2. Deploy via Partner Dashboard
3. Activate in Settings → Checkout

---

## 📝 Files Created

```
extensions/wallet-app-block/
├── blocks/
│   ├── wallet-widget.liquid    # Main widget code
│   └── wallet-widget.json      # Widget settings schema
```

---

## 🎊 Summary

**What You Get**:
- ✅ Drag-and-drop widget for merchants
- ✅ Works on any page of the store
- ✅ Beautiful, responsive design
- ✅ Full wallet functionality
- ✅ Easy to install and use

**Deployment Time**: 10-15 minutes

**Merchant Setup Time**: 2 minutes (drag-and-drop)

**Customer Experience**: Seamless wallet balance checking

---

## 🔗 Quick Links

- **Partner Dashboard**: https://partners.shopify.com/
- **Theme Editor**: https://admin.shopify.com/store/cmstestingg/themes
- **Widget Code**: `extensions/wallet-app-block/blocks/wallet-widget.liquid`
- **Backend API**: https://shopify-walletx.onrender.com/api

---

## 💡 Pro Tip

For best results:
1. Deploy as **App Block Extension** (merchants can add via theme editor)
2. Also create **Checkout Extension** (for checkout page)
3. Merchants get both options!

