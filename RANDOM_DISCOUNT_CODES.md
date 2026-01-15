# Random Discount Codes with Custom Amounts

## ✅ IMPLEMENTED

The system now generates **random discount codes** with **exact custom amounts** based on the coins the user enters.

## How It Works

### 1. User Flow
1. User enters email and checks balance
2. User enters custom coins amount (e.g., 47 coins)
3. User presses **Enter** key
4. System generates random code like `WALLET1234567890`
5. System deducts 47 coins from wallet
6. System redirects to checkout with discount code
7. **Discount code must be created in Shopify admin manually**

### 2. Code Generation
```javascript
// Example: User enters 47 coins
const timestamp = Date.now().toString().slice(-6);  // e.g., "234567"
const randomNum = Math.floor(Math.random() * 10000); // e.g., "8901"
const discountCode = `WALLET${timestamp}${randomNum}`; // "WALLET2345678901"
```

Each code is unique and includes:
- Prefix: `WALLET`
- Timestamp (last 6 digits)
- Random number (4 digits)

### 3. Discount Amount
- **1 coin = ₹1**
- User enters 47 coins → Discount = ₹47
- User enters 150 coins → Discount = ₹150
- User enters 1000 coins → Discount = ₹1000

## Current Status

✅ **Widget deployed** - Version 34
✅ **Backend deployed** - Auto-deploying from GitHub
✅ **Random codes generated** - Unique per transaction
✅ **Custom amounts** - Exact coins entered by user
✅ **Coins deducted** - Immediately from wallet
✅ **Currency** - INR (₹)

❌ **Shopify API not configured** - Codes must be created manually

## The Problem

The discount codes are generated but **don't exist in Shopify yet**. When the user reaches checkout, Shopify shows:

> "Discount code not found"

## Solutions

### Option 1: Manual Creation (Current)
After each transaction, you must:
1. Check backend logs for the discount code
2. Go to Shopify Admin → Discounts
3. Create new discount with that exact code
4. Set amount to match the coins used
5. User can then apply the code

**Example:**
- User uses 47 coins
- Code generated: `WALLET2345678901`
- You create discount in Shopify:
  - Code: `WALLET2345678901`
  - Type: Fixed amount
  - Value: ₹47
  - Usage limit: 1

### Option 2: Shopify App with OAuth (RECOMMENDED)
Set up proper Shopify app to create discounts automatically via API:

1. **Create Shopify App**
   - Go to Shopify Partners Dashboard
   - Create new app
   - Add OAuth scopes: `write_discounts`, `read_discounts`

2. **Install on Store**
   - Install app on `cmstestingg.myshopify.com`
   - Authorize permissions
   - Get access token

3. **Configure Backend**
   - Store access token in database
   - Update `.env` with Shopify credentials
   - Discounts will be created automatically

4. **Test**
   - User enters coins and presses Enter
   - System creates discount in Shopify via API
   - User redirected to checkout
   - Discount works immediately!

### Option 3: Pre-create Discount Codes
Create a pool of discount codes in advance:

```sql
-- Create 1000 discount codes
WALLET0001 = ₹1
WALLET0002 = ₹2
...
WALLET1000 = ₹1000
```

Then widget uses the appropriate code based on amount.

**Pros:** Works immediately, no API needed
**Cons:** Limited to pre-defined amounts, lots of manual work

## Testing

### Test the Current Implementation

1. Go to your store cart
2. Enter email: `debrajecomcure@gmail.com`
3. Check balance (should show 990 coins after previous test)
4. Enter coins: `10`
5. Press Enter
6. Check console logs for generated code
7. Note the code (e.g., `WALLET1234567890`)
8. Go to Shopify Admin → Discounts
9. Create discount with that code for ₹10
10. Go back to checkout and apply the code

### Check Backend Logs

The backend logs will show:
```
[Discount] 🎫 Creating discount: WALLET1234567890 for ₹10
[Discount] ⚠️  No Shopify API access for cmstestingg.myshopify.com
[API] ✅ Coins deducted. New balance: 980
```

## Next Steps

**To enable automatic discount creation:**

1. I can help you set up a Shopify app with OAuth
2. Install it on your store
3. Configure the access token
4. Test automatic discount creation

Would you like me to create the Shopify app setup instructions?

## Summary

✅ Random codes generated per transaction
✅ Custom amounts based on user input
✅ Coins deducted immediately
✅ Currency in INR (₹)
✅ Widget and backend deployed

⚠️  **Manual step required:** Create discount codes in Shopify admin after each transaction

🎯 **Recommended:** Set up Shopify OAuth app for automatic discount creation
