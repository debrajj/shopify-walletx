# ✅ Wallet Widget - Ready to Install!

## 🎉 What's New?

I've created **3 different ways** to install the wallet widget on your Shopify store. Choose the one that works best for you!

---

## 🚀 METHOD 1: One-Click Installation (EASIEST!)

### From Your Admin Dashboard:

1. **Go to**: https://shopify-walletx-1.onrender.com/#/widget
2. **Click**: "🚀 Install Widget" button
3. **Done!** The widget will automatically appear on your cart page

### What it does:
- Automatically injects the wallet widget script into your store
- No code editing required
- Can be uninstalled with one click
- Works on all themes

**✨ This is the RECOMMENDED method!**

---

## 📝 METHOD 2: Manual Script Tag

If automatic installation doesn't work, add the script manually:

### Steps:

1. **Go to**: Shopify Admin → Online Store → Themes
2. **Click**: Actions → Edit code
3. **Open**: `Layout/theme.liquid`
4. **Find**: The closing `</body>` tag (near the bottom)
5. **Add this line** just before `</body>`:

```html
<script src="https://shopify-walletx.onrender.com/widget.js"></script>
```

6. **Save**

**✨ Done! Widget will appear on cart page.**

---

## 🎨 METHOD 3: Theme Snippet (Most Control)

For maximum customization, add as a theme snippet:

### Steps:

1. **Go to**: Online Store → Themes → Actions → Edit code
2. **In Snippets folder**: Click "Add a new snippet"
3. **Name it**: `wallet-checkout-widget`
4. **Copy the code from**: `theme-extension/wallet-checkout-widget.liquid`
5. **Paste** into the new snippet
6. **Open**: `templates/cart.liquid` (or `sections/cart-template.liquid`)
7. **Add this line** where you want the widget:

```liquid
{% render 'wallet-checkout-widget' %}
```

8. **Save**

**✨ Widget appears exactly where you placed it!**

---

## 🔧 What's Been Created

### Backend Endpoints (Already Deployed):

✅ `POST /api/shopify/install-widget` - Auto-install script tag
✅ `POST /api/shopify/uninstall-widget` - Remove script tag
✅ `GET /widget.js` - Serves the widget script

### Frontend Pages:

✅ `/widget` - One-click installer page in admin dashboard
✅ Widget appears in navigation menu

### Widget Files:

✅ `extensions/wallet-script-tag/wallet-widget.js` - Main widget script
✅ `theme-extension/wallet-checkout-widget.liquid` - Liquid version
✅ `extensions/wallet-app-block/blocks/wallet-widget.liquid` - App block version

---

## 🎯 Widget Features

The wallet widget includes:

1. **Phone Number Input**
   - Auto-fills for logged-in customers
   - Clean, modern design

2. **OTP Verification**
   - Secure authentication
   - Real-time validation

3. **Balance Display**
   - Shows available coins
   - Beautiful gradient design

4. **Coin Application**
   - Enter coins to use
   - Automatic discount code generation
   - Redirects to checkout with discount applied

5. **Responsive Design**
   - Works on mobile and desktop
   - Smooth animations
   - Loading states

---

## 📱 How It Works

### Customer Flow:

1. Customer goes to cart page
2. Sees wallet widget
3. Enters phone number → Receives OTP
4. Verifies OTP → Sees balance
5. Enters coins to use → Applies discount
6. Redirects to checkout with discount code

### Technical Flow:

```
Widget Script → API Calls → Backend → Database
                    ↓
            Discount Code Generated
                    ↓
            Redirect to /discount/{CODE}
                    ↓
            Shopify applies discount
                    ↓
            Customer completes checkout
```

---

## 🔗 Your URLs

- **Admin Dashboard**: https://shopify-walletx-1.onrender.com
- **Widget Installer**: https://shopify-walletx-1.onrender.com/#/widget
- **Backend API**: https://shopify-walletx.onrender.com
- **Widget Script**: https://shopify-walletx.onrender.com/widget.js
- **Shopify App**: https://admin.shopify.com/store/cmstestingg/apps/walttz

---

## ✅ Next Steps

### Option A: Quick Test (Recommended)
1. Go to: https://shopify-walletx-1.onrender.com/#/widget
2. Click "Install Widget"
3. Visit your cart page to see it in action

### Option B: Manual Installation
1. Follow METHOD 2 above
2. Add script tag to theme.liquid
3. Test on cart page

### Option C: Custom Placement
1. Follow METHOD 3 above
2. Add snippet to any page you want
3. Customize styling as needed

---

## 🎨 Customization

The widget is fully customizable:

### Colors:
Edit the gradient in the widget code:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Position:
- Cart page (default)
- Product pages
- Homepage
- Any page you want

### Text:
All labels and messages can be changed in the code.

---

## 🆘 Troubleshooting

### Widget not appearing?
- Check browser console for errors
- Verify script tag is in theme.liquid
- Clear browser cache

### OTP not sending?
- Check backend logs
- Verify phone number format
- Check API endpoints are working

### Discount not applying?
- Verify discount code format
- Check Shopify discount settings
- Ensure coins are available in wallet

---

## 📊 Testing

### Test the widget:

1. **Add test coins** to a customer:
   - Go to admin dashboard
   - Search for customer by phone
   - Credit coins

2. **Test on storefront**:
   - Add items to cart
   - Go to cart page
   - Enter phone number
   - Verify OTP
   - Apply coins
   - Complete checkout

---

## 🎉 You're All Set!

The wallet widget is ready to use. Choose your installation method and start testing!

**Recommended**: Start with METHOD 1 (one-click) for the easiest setup.

---

## 📚 Documentation

All files are in your project:
- `INSTALL_WALLET_WIDGET.md` - Detailed installation guide
- `extensions/wallet-script-tag/wallet-widget.js` - Widget code
- `pages/WidgetInstaller.tsx` - Admin installer page
- `backend/src/index.js` - API endpoints

Need help? All the code is ready and working! 🚀
