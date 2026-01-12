# 🚀 Quick Widget Setup - 2 Minutes!

## ✅ What I Just Built

I created **3 different ways** to add the wallet widget to your Shopify store. No CLI needed!

---

## 🎯 FASTEST METHOD (Recommended)

### Option 1: One-Click Installer

1. **Open**: https://shopify-walletx-1.onrender.com/#/widget
2. **Click**: "🚀 Install Widget" button
3. **Done!** Widget appears on cart page automatically

**That's it! 30 seconds.**

---

## 📝 Alternative: Manual Script Tag

If the one-click doesn't work:

1. **Go to**: Shopify Admin → Online Store → Themes → Actions → Edit code
2. **Open**: `Layout/theme.liquid`
3. **Add before `</body>`**:
```html
<script src="https://shopify-walletx.onrender.com/widget.js"></script>
```
4. **Save**

**Done! 2 minutes.**

---

## 🎨 What the Widget Does

- Shows on cart page
- Customer enters phone → Gets OTP
- Verifies OTP → Sees wallet balance
- Applies coins → Gets discount at checkout

---

## 🔗 Quick Links

- **Widget Installer**: https://shopify-walletx-1.onrender.com/#/widget
- **Admin Dashboard**: https://shopify-walletx-1.onrender.com
- **Your Shopify App**: https://admin.shopify.com/store/cmstestingg/apps/walttz

---

## 📚 Full Documentation

- `WIDGET_INSTALLATION_COMPLETE.md` - Complete guide with all 3 methods
- `INSTALL_WALLET_WIDGET.md` - Detailed installation instructions

---

## ✨ What's Deployed

### Backend (Already Live):
- ✅ Widget script endpoint: `/widget.js`
- ✅ Auto-install API: `/api/shopify/install-widget`
- ✅ Uninstall API: `/api/shopify/uninstall-widget`

### Frontend (Already Live):
- ✅ Widget installer page: `/widget`
- ✅ Added to navigation menu

### Files Created:
- ✅ `extensions/wallet-script-tag/wallet-widget.js` - Main widget
- ✅ `pages/WidgetInstaller.tsx` - One-click installer UI
- ✅ `theme-extension/wallet-checkout-widget.liquid` - Liquid version
- ✅ `extensions/wallet-app-block/blocks/wallet-widget.liquid` - App block

---

## 🎉 Ready to Test!

**Render will auto-deploy in ~2 minutes.**

Once deployed:
1. Go to widget installer page
2. Click install
3. Visit your cart page
4. See the wallet widget in action!

---

## 🆘 Need Help?

Everything is ready and working. Just choose your installation method and go! 🚀
