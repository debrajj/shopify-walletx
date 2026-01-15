# How to Enable Automatic Discounts

## Problem
The wallet widget generates discount codes automatically (like `WALLETDEBRAJ1234`), but they don't exist in Shopify yet, so checkout shows "discount code not found".

## Solution Options

### Option 1: Quick Fix - Create a Generic Discount (RECOMMENDED)
Create ONE discount code that works for all wallet redemptions:

1. Go to Shopify Admin → Discounts
2. Click "Create discount" → "Discount code"
3. Set up:
   - **Code**: `WALLET` (or any prefix you want)
   - **Type**: Fixed amount
   - **Value**: Leave flexible or set maximum (e.g., ₹1000)
   - **Applies to**: Entire order
   - **Minimum requirements**: None
   - **Customer eligibility**: All customers
   - **Usage limits**: No limit (or set per customer)
   - **Active dates**: No end date

4. Update widget to use this fixed code instead of random codes

### Option 2: Install Shopify App with OAuth (BEST)
This enables automatic discount creation via API:

1. Create a Shopify App in Partners Dashboard
2. Add OAuth scopes: `write_discounts`, `read_discounts`
3. Install app on your store
4. Store access token in database
5. Discounts will be created automatically

### Option 3: Pre-create Discount Codes
Create multiple discount codes in advance:

```bash
# Run this script to create 100 discount codes
node scripts/create-bulk-discounts.js
```

This creates codes like:
- WALLET0001 = ₹1 off
- WALLET0002 = ₹2 off
- ...
- WALLET1000 = ₹1000 off

## Current Status

❌ **No Shopify API access** - Store doesn't have OAuth token
✅ **Discount codes are generated** - Random codes like `WALLETDEBRAJ1234`
❌ **Codes don't exist in Shopify** - Checkout shows "not found"

## Immediate Workaround

Until you set up Option 1 or 2, the system will:
1. Generate a discount code
2. Deduct coins from wallet
3. Redirect to checkout with code
4. **You must manually create the discount in Shopify admin**

### Manual Steps:
1. User tries to checkout with code (e.g., `WALLETDEBRAJ1234`)
2. Checkout shows "discount code not found"
3. Go to Shopify Admin → Discounts
4. Create new discount with that exact code
5. Set amount to match coins used (check backend logs)
6. User can then apply the code

## Recommended: Use Fixed Code

The easiest solution is to use ONE fixed discount code:

1. Create discount code `WALLETDISCOUNT` in Shopify admin
2. Set it to ₹1000 maximum discount
3. Update widget to always use this code
4. Calculate discount amount on checkout page

This way:
- No need to create codes dynamically
- No API access required
- Works immediately
- Simple to manage

Would you like me to implement this fixed code approach?
