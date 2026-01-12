# Wallet Coins Setup Instructions

## Latest Updates (Version 14)

### What's New
1. **Smart Widget Positioning** - Widget now appears after `class="cart-discount"` elements
2. **Dynamic Cart Detection** - MutationObserver watches for cart drawer loading
3. **Improved Injection Logic** - Multiple fallback strategies for different themes

## What's Been Fixed

1. **App Embed Extension** - Created a proper app embed that shows in cart drawer/cart page
2. **Discount Code Creation** - Backend now creates Shopify discount codes when customers apply coins
3. **API Integration** - Widget calls backend API to validate balance and create discount codes
4. **Cart Positioning** - Widget intelligently positions itself after discount elements

## Setup Steps

### 1. Enable the App Embed in Shopify

1. Go to **Shopify Admin → Online Store → Themes → Customize**
2. Look for **"App embeds"** in the left sidebar (usually at the bottom)
3. Find **"Wallet Coins"** and toggle it **ON**
4. Click **Save**

### 2. Deploy Backend to Render

The backend needs to be deployed with these environment variables:

```
DATABASE_URL=your_postgres_url
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
HOST=https://your-backend-url.onrender.com
SCOPES=read_customers,write_customers,read_orders,write_orders,write_price_rules,write_discounts
```

**Deployment Steps:**
1. Push latest backend code to your repository
2. In Render dashboard, trigger a manual deploy or wait for auto-deploy
3. Check logs to ensure server starts successfully
4. Verify API is accessible at `https://shopify-walletx.onrender.com/api`

### 3. Create Database Table

**Option A: Using Migration Script (Recommended)**

SSH into your Render instance or use Render Shell:
```bash
cd backend
node run-migration.js
```

**Option B: Manual SQL**

Connect to your Render Postgres database and run:

```sql
CREATE TABLE IF NOT EXISTS pending_redemptions (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  discount_code VARCHAR(100) UNIQUE NOT NULL,
  coins DECIMAL(10, 2) NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  order_id VARCHAR(100),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pending_redemptions_code ON pending_redemptions(discount_code);
CREATE INDEX idx_pending_redemptions_phone ON pending_redemptions(phone);
CREATE INDEX idx_pending_redemptions_expires ON pending_redemptions(expires_at);
```

### 4. Test the Flow

1. **Add items to cart** on your Shopify store
2. **Open cart drawer** - you should see the Wallet Coins widget positioned after discount elements
3. **Enter phone number** and click "Check Balance"
4. **Enter coins to use** and click "Apply at Checkout"
5. **Redirects to checkout** with discount code applied

### 5. Verify Deployment

**Check Extension:**
```bash
shopify app versions list
```
Should show version 14 or higher deployed.

**Check Backend:**
```bash
curl https://shopify-walletx.onrender.com/api/wallet/balance?phone=1234567890
```
Should return JSON response (even if wallet doesn't exist).

**Check Database:**
```sql
SELECT * FROM pending_redemptions LIMIT 5;
```
Should return table structure (may be empty initially).

## How It Works

1. Customer enters phone number → Backend checks wallet balance
2. Customer enters coins to use → Backend creates Shopify discount code
3. Customer redirected to `/discount/WALLETXXX` → Shopify applies discount
4. At checkout, discount is applied automatically

### Widget Positioning

The widget automatically positions itself:
1. **Primary**: After any element with `class="cart-discount"` in the cart
2. **Fallback**: Inside the cart drawer if cart-discount element not found
3. **Dynamic Loading**: Uses MutationObserver to detect cart drawer opening

This ensures the widget appears in the right place regardless of theme structure.

## Troubleshooting

### Widget Not Showing
- Make sure app embed is enabled in theme customizer
- Check browser console for JavaScript errors
- Verify the extension is deployed (version 12+)

### Discount Code Not Working
- Check backend logs for discount creation errors
- Verify Shopify API credentials have `write_price_rules` scope
- Ensure database table exists

### Balance Not Loading
- Verify backend API is accessible at `https://shopify-walletx.onrender.com/api`
- Check that wallet exists for the phone number
- Look at network tab in browser dev tools

## API Endpoints

- `GET /api/wallet/balance?phone=XXX` - Get coin balance
- `POST /api/shopify/create-discount` - Create discount code
  ```json
  {
    "phone": "+1234567890",
    "coins": 100
  }
  ```

## Next Steps

1. Deploy backend with updated code
2. Run database migration
3. Enable app embed in Shopify
4. Test end-to-end flow
