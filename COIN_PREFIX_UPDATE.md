# Coin Prefix Update - Completed ✅

## Changes Made

### 1. Discount Code Prefix Changed
- **Old prefix**: `WALLET`
- **New prefix**: `COIN`

### 2. Discount Type
- **Type**: Amount off order (fixed amount discount)
- **Format**: `discountAmount` in rupees (₹)
- **Application**: Applies to entire order, not per item

### 3. Code Examples

#### Frontend (Widget)
- **Format**: `COIN` + timestamp (6 digits) + random number (4 digits)
- **Example**: `COIN1234565678`

#### Backend (Discount Service)
- **Automatic Discount Title**: `Coin Wallet - {email} - {discountCode}`
- **Discount Code Title**: `Coin Wallet - {discountCode}`

### 4. Files Updated

#### Frontend
1. `extensions/wallet-theme-app/blocks/wallet-app-embed.liquid`
   - Changed: `WALLET${timestamp}${randomNum}` → `COIN${timestamp}${randomNum}`

2. `extensions/wallet-theme-app/snippets/wallet-cart-widget.liquid`
   - Changed: `WALLET-` → `COIN-`

3. `extensions/wallet-theme-app/blocks/wallet-cart.liquid`
   - Changed: `WALLET-` → `COIN-`

#### Backend
1. `backend/src/shopify/discountService.js`
   - Changed automatic discount title: `Wallet Coins` → `Coin Wallet`
   - Changed discount code title: `Wallet Coins` → `Coin Wallet`

### 5. Deployment Status

✅ **Frontend**: Deployed to Shopify (version shopify-wallet-admin-49)
✅ **Backend**: Pushed to GitHub and will auto-deploy to Render

### 6. How It Works Now

1. User clicks "Redeem points"
2. Enters coin amount (e.g., 50 coins)
3. Clicks arrow button (→)
4. System generates code like: `COIN1234565678`
5. Creates "Amount off order" discount for ₹50
6. Redirects to checkout with discount applied

### 7. Discount Properties

- **Type**: Fixed amount off order
- **Duration**: 24 hours
- **Usage**: Single use per customer
- **Combines with**: Other order discounts (Yes)
- **Combines with**: Product discounts (No)
- **Combines with**: Shipping discounts (No)

## Testing

To test the new COIN prefix:
1. Go to your Shopify store cart
2. Add items to cart
3. Look for the Wallet widget
4. Click "Redeem points"
5. Enter coins and click the arrow
6. Check that the discount code starts with "COIN"
7. Verify the discount amount matches the coins redeemed

## Notes

- All new discount codes will use the COIN prefix
- Old WALLET codes will still work if they exist
- Backend automatically creates "Amount off order" type discounts
- Discount codes are unique and time-limited (24 hours)
