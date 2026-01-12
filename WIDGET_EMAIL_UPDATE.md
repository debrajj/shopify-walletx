# Wallet Widget - Email Support Update

## Changes Made

### 1. Widget UI Changes (wallet-app-embed.liquid)
- **Changed input from phone to email**
  - Input type: `tel` → `email`
  - Placeholder: "Phone number" → "Enter your email"
  - Input ID: `wallet-embed-phone` → `wallet-embed-email`

- **Simplified display**
  - Removed "Apply Coins" section
  - Shows only: Email input → Check Balance button → Coin balance display
  - Cleaner, more focused interface

- **Updated positioning logic**
  - Widget now specifically targets `.cart-discount` element
  - Inserts immediately after discount section in cart
  - Falls back to cart drawer if discount element not found
  - Added MutationObserver to handle dynamic cart loading

### 2. Backend API Changes (backend/src/index.js)
- **Updated `/api/wallet/balance` endpoint**
  - Now accepts both `email` and `phone` query parameters
  - Prioritizes email if both provided
  - Queries database by email or phone accordingly

- **Database schema update**
  - Added `customer_email` column to `wallets` table
  - Created index for faster email lookups
  - Migration file: `backend/database/migrations/004_add_customer_email.sql`

### 3. JavaScript Logic Changes
- **Updated `checkBalance()` function**
  - Reads from email input instead of phone
  - Validates email format (checks for @ symbol)
  - Sends email to API endpoint
  - Shows balance on success

- **Removed unused functions**
  - Removed `applyCoins()` function (simplified flow)
  - User just sees their balance, no checkout integration in widget

## Deployment Steps

### 1. Deploy Backend Changes
```bash
cd backend
git add .
git commit -m "Add email support to wallet balance API"
git push
```

### 2. Run Database Migration (on Render)
```bash
# SSH into Render or use Render shell
node run-migration.js 004_add_customer_email.sql
```

Or manually run SQL:
```sql
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(customer_email, store_url);
```

### 3. Deploy Shopify Extension
```bash
shopify app deploy
```

Select the wallet-theme-app extension when prompted.

### 4. Test in Shopify
1. Go to Shopify Admin → Online Store → Themes → Customize
2. Enable "Wallet Coins" in App embeds section
3. Add items to cart and open cart drawer
4. Widget should appear after discount code section
5. Enter an email address
6. Click "Check Balance"
7. Should display coin balance

## Testing

### Test Email Balance Lookup
```bash
curl "https://shopify-walletx.onrender.com/api/wallet/balance?email=test@example.com" \
  -H "x-shop-url: your-store.myshopify.com"
```

### Add Test Balance
Use the admin panel to credit coins to an email address, or directly in database:
```sql
INSERT INTO wallets (store_url, phone_hash, customer_name, customer_email, balance)
VALUES ('your-store.myshopify.com', 'test@example.com', 'Test User', 'test@example.com', 100.00);
```

## Widget Appearance

The widget will show:
1. **Initial state**: Email input + "Check Balance" button
2. **After checking**: Coin balance display (e.g., "50 coins")
3. **Error states**: "Email not found", "Please enter valid email", etc.

## Notes

- Widget positioning targets `.cart-discount` class specifically
- If cart-discount not found, falls back to cart drawer
- Email validation is basic (checks for @ symbol)
- Backend supports both email and phone for backward compatibility
- Simplified UI - no checkout integration in widget itself
