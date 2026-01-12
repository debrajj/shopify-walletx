# Install Wallet Widget - 3 Simple Methods

Your wallet checkout extension is ready! Choose the easiest method for you:

---

## ✅ METHOD 1: App Block (RECOMMENDED - No CLI Needed)

This widget can be added by merchants through the theme editor.

### Steps:

1. **Go to Shopify Partner Dashboard**
   - Visit: https://partners.shopify.com
   - Select your app: "Walttz"

2. **Create App Extension**
   - Click "Extensions" → "Create extension"
   - Choose: "Theme app extension"
   - Name it: "Wallet Widget"

3. **Add the Block Code**
   - Create a new block file: `blocks/wallet-widget.liquid`
   - Copy the code from: `extensions/wallet-app-block/blocks/wallet-widget.liquid`
   - Paste it into the Partner Dashboard editor

4. **Save and Publish**
   - Click "Save"
   - Click "Create version" → "Publish"

5. **Merchants Can Now Add It**
   - Go to: Online Store → Themes → Customize
   - Click "Add section" or "Add block"
   - Find "Wallet Widget" under "Apps"
   - Drag it to any page (homepage, product page, cart, etc.)

**✨ DONE! The widget will appear on the storefront.**

---

## 🎯 METHOD 2: Manual Theme Installation (Fastest)

Add the widget directly to your theme code.

### Steps:

1. **Go to Theme Editor**
   - Online Store → Themes → Actions → Edit code

2. **Create New Snippet**
   - In "Snippets" folder, click "Add a new snippet"
   - Name it: `wallet-checkout-widget`

3. **Paste the Code**
   - Copy from: `theme-extension/wallet-checkout-widget.liquid`
   - Paste into the new snippet

4. **Add to Cart Page**
   - Open `templates/cart.liquid` (or `sections/cart-template.liquid`)
   - Add this line where you want the widget to appear:
   ```liquid
   {% render 'wallet-checkout-widget' %}
   ```

5. **Save**

**✨ DONE! Widget appears on cart page.**

---

## 🚀 METHOD 3: Checkout Extension (Most Powerful)

This adds the wallet widget directly in the Shopify checkout flow.

### Requirements:
- Shopify Plus plan (for checkout extensions)
- Partner Dashboard access

### Steps:

1. **Go to Partner Dashboard**
   - Visit: https://partners.shopify.com
   - Select your app

2. **Create Checkout UI Extension**
   - Extensions → Create extension
   - Choose: "Checkout UI extension"
   - Name: "Wallet Checkout"

3. **Add the Code**
   - Copy from: `extensions/checkout-wallet-simple/extension.js`
   - Paste into the extension editor
   - Or upload the entire `extensions/checkout-wallet/` folder

4. **Configure Extension**
   - Set target: `purchase.checkout.block.render`
   - Enable for all merchants

5. **Publish**
   - Create version → Publish

**✨ DONE! Widget appears in checkout.**

---

## 🔧 Current Setup

Your backend is already configured and working:

- **Backend API**: https://shopify-walletx.onrender.com
- **Frontend Admin**: https://shopify-walletx-1.onrender.com
- **Shopify Store**: cmstestingg.myshopify.com
- **App URL**: https://admin.shopify.com/store/cmstestingg/apps/walttz

All API endpoints are ready:
- ✅ `/api/otp/send` - Send OTP
- ✅ `/api/otp/validate` - Verify OTP
- ✅ `/api/wallet/balance` - Get balance
- ✅ `/api/wallet/deduct` - Deduct coins
- ✅ `/api/wallet/credit` - Credit coins

---

## 📱 Widget Features

The wallet widget includes:

1. **Phone Number Input** - Auto-fills for logged-in customers
2. **OTP Verification** - Secure authentication
3. **Balance Display** - Real-time wallet balance
4. **Coin Application** - Apply coins as discount at checkout
5. **Responsive Design** - Works on mobile and desktop

---

## 🎨 Customization

All widget files support customization:

- **Colors**: Edit the CSS in the `<style>` section
- **Text**: Change labels and messages
- **API URL**: Already configured to your backend
- **Shop Domain**: Auto-detected from Shopify

---

## 💡 Recommendation

**Start with METHOD 2** (Manual Theme Installation) - it's the fastest way to test.

Once you confirm it works, move to **METHOD 1** (App Block) so merchants can add it themselves without code.

If you have Shopify Plus, use **METHOD 3** for the best checkout experience.

---

## 🆘 Need Help?

All files are ready in your project:
- `theme-extension/wallet-checkout-widget.liquid` - For METHOD 2
- `extensions/wallet-app-block/blocks/wallet-widget.liquid` - For METHOD 1
- `extensions/checkout-wallet/` - For METHOD 3

Just copy and paste! No CLI needed for METHOD 1 and 2.
