# Setup Shopify API for Automatic Discount Creation

## Goal
Enable automatic discount creation so when a client uses 200 coins, the system:
1. ✅ Generates coupon code (e.g., `WALLET1234567890`)
2. ✅ Creates discount in Shopify for ₹200
3. ✅ Applies it automatically at checkout
4. ✅ No manual steps required

## Current Status
- ✅ Widget generates random codes
- ✅ Backend deducts coins
- ✅ Redirects to checkout with code
- ❌ Discount doesn't exist in Shopify yet

## Solution: Create Shopify Custom App

### Step 1: Create Custom App in Shopify Admin

1. Go to your Shopify Admin: `https://cmstestingg.myshopify.com/admin`
2. Click **Settings** (bottom left)
3. Click **Apps and sales channels**
4. Click **Develop apps**
5. Click **Allow custom app development** (if prompted)
6. Click **Create an app**
7. Name it: `Wallet Discount Manager`
8. Click **Create app**

### Step 2: Configure API Scopes

1. Click **Configure Admin API scopes**
2. Scroll down and check these permissions:
   - ✅ `write_discounts` - Create discount codes
   - ✅ `read_discounts` - Read discount codes
   - ✅ `write_price_rules` - Create price rules
   - ✅ `read_price_rules` - Read price rules
3. Click **Save**

### Step 3: Install the App

1. Click **Install app** (top right)
2. Click **Install** to confirm
3. You'll see **Admin API access token**
4. Click **Reveal token once** 
5. **COPY THIS TOKEN** - you'll need it!

Example token: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Add Token to Database

Run this SQL command in your database:

```sql
-- Insert or update the store with access token
INSERT INTO users (store_url, shopify_access_token, created_at, updated_at)
VALUES ('cmstestingg.myshopify.com', 'YOUR_TOKEN_HERE', NOW(), NOW())
ON CONFLICT (store_url) 
DO UPDATE SET 
  shopify_access_token = 'YOUR_TOKEN_HERE',
  updated_at = NOW();
```

Replace `YOUR_TOKEN_HERE` with the actual token you copied.

### Step 5: Test Automatic Discount Creation

Run this test:

```bash
node test-discount-creation.js
```

You should see:
```
✅ SUCCESS!
  Discount Code: WALLET1234567890
  New Balance: 970 coins
  ✅ Discount created in Shopify automatically!
```

### Step 6: Test in Store

1. Go to your store
2. Add items to cart
3. Open cart drawer
4. Enter email: `debrajecomcure@gmail.com`
5. Enter coins: `200`
6. Press **Enter**
7. System will:
   - Generate code: `WALLET1234567890`
   - Create discount in Shopify for ₹200
   - Redirect to checkout
   - Discount automatically applied!

## Alternative: Quick Script to Add Token

I can create a script to add the token. Just provide me with:
1. The Admin API access token from Step 3

Then run:
```bash
node add-shopify-token.js YOUR_TOKEN_HERE
```

## Verification

After adding the token, check if it's stored:

```sql
SELECT store_url, 
       CASE 
         WHEN shopify_access_token IS NOT NULL 
         THEN 'Token exists' 
         ELSE 'No token' 
       END as token_status
FROM users 
WHERE store_url = 'cmstestingg.myshopify.com';
```

Should return: `Token exists`

## How It Works After Setup

**User Flow:**
1. User enters 200 coins
2. Presses Enter
3. Widget calls backend API
4. Backend:
   - Generates code: `WALLET1234567890`
   - Calls Shopify API to create discount for ₹200
   - Deducts 200 coins from wallet
   - Returns success
5. Widget redirects to checkout with code
6. **Discount already exists and applies automatically!**

**No manual steps required!**

## Troubleshooting

### Token not working?
- Make sure you copied the full token
- Check token starts with `shpat_`
- Verify app has correct scopes
- Check app is installed on store

### Still requires manual setup?
- Check backend logs for API errors
- Verify token is in database
- Test with: `node test-discount-creation.js`

## Next Steps

1. Create the custom app in Shopify admin
2. Get the access token
3. Add it to database
4. Test automatic discount creation
5. Enjoy fully automatic discounts!

Would you like me to create the script to add the token to the database?
