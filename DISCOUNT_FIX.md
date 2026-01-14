# Discount Code Fix - Shopify Integration

## Problem
Coins weren't working during checkout because discount codes were being generated but not actually created in Shopify's system.

## Solution
Created a new `discountService.js` that integrates with Shopify Admin API to:

1. **Create Price Rules** - Defines the discount amount and rules
2. **Create Discount Codes** - Generates the actual code customers can use
3. **Deduct Coins** - Immediately removes coins from wallet when discount is created
4. **Track Transactions** - Logs the redemption in the database

## How It Works Now

### When Customer Applies Coins:
1. Widget calls `/api/shopify/create-discount` with email, coins, and discount amount
2. Backend checks wallet balance
3. **NEW**: Creates actual Shopify discount code via Admin API
4. Deducts coins from wallet immediately
5. Returns discount code to customer
6. Customer is redirected to checkout with the code applied

### Fallback Behavior:
- If Shopify API fails or store isn't connected, returns code with `requiresManualSetup: true`
- Merchant can manually create the discount in Shopify admin

## Files Changed

### New Files:
- `backend/src/shopify/discountService.js` - Shopify discount creation service

### Modified Files:
- `backend/src/index.js` - Integrated discount service
- `extensions/wallet-theme-app/blocks/wallet-app-embed.liquid` - Auto-balance checking

## Requirements

For automatic discount creation to work, the store must have:
1. Shopify access token stored in database
2. Required API scopes: `read_discounts`, `write_discounts`

## Testing

1. Add items to cart
2. Open cart drawer
3. Enter email and check balance (or auto-loads for logged-in customers)
4. Enter coins to use
5. Click "Apply Coins at Checkout"
6. Should redirect to checkout with discount automatically applied

## API Response

### Success:
```json
{
  "success": true,
  "discountCode": "WALLETUSER123456",
  "discountValue": 5.00,
  "newBalance": 450,
  "message": "Discount code created for 500 coins"
}
```

### Fallback (Manual Setup Required):
```json
{
  "success": false,
  "discountCode": "WALLETUSER123456",
  "requiresManualSetup": true,
  "message": "Shopify not connected - manual discount setup required"
}
```

## Next Steps

If discounts still aren't working:
1. Check backend logs for Shopify API errors
2. Verify Shopify access token is valid
3. Confirm API scopes include discount permissions
4. Test with a manual discount code to verify Shopify checkout works
