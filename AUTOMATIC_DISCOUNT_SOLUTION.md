# Automatic Discount Solution

## Current Problem
- Widget generates random discount codes (e.g., `WALLET123456`)
- Codes don't exist in Shopify, so checkout shows "discount code not found"
- Requires manual creation of each discount code

## Best Solution: Create ONE Reusable Discount Code

Instead of creating random codes, use ONE fixed discount code that the merchant creates once.

### Step 1: Create the Discount in Shopify Admin

1. Go to **Shopify Admin** → **Discounts**
2. Click **"Create discount"** → **"Discount code"**
3. Configure:
   - **Discount code**: `WALLETDISCOUNT` (or any name you prefer)
   - **Type**: Fixed amount
   - **Value**: ₹1000 (set to maximum possible discount)
   - **Minimum purchase amount**: None
   - **Applies to**: Entire order
   - **Customer eligibility**: All customers
   - **Maximum discount uses**: Unlimited
   - **One use per customer**: NO (uncheck this)
   - **Active dates**: No end date
4. Click **Save**

### Step 2: Update Widget to Use Fixed Code

The widget will:
1. User enters coins (e.g., 50 coins)
2. Calculate discount (50 coins = ₹50)
3. Deduct coins from wallet
4. Redirect to: `/checkout?discount=WALLETDISCOUNT`
5. Shopify applies the discount code
6. **Important**: The discount amount is controlled by the code in Shopify admin

### Step 3: Handle Variable Amounts

Since Shopify discount codes have fixed amounts, we have two options:

**Option A: Multiple Fixed Discounts** (Recommended)
Create multiple discount codes for common amounts:
- `WALLET10` = ₹10 off
- `WALLET25` = ₹25 off
- `WALLET50` = ₹50 off
- `WALLET100` = ₹100 off
- `WALLET250` = ₹250 off
- `WALLET500` = ₹500 off
- `WALLET1000` = ₹1000 off

Widget logic:
```javascript
// Round to nearest discount tier
const tiers = [10, 25, 50, 100, 250, 500, 1000];
const discountAmount = coinsToUse * coinValue;
const tier = tiers.find(t => t >= discountAmount) || tiers[tiers.length - 1];
const discountCode = `WALLET${tier}`;
```

**Option B: Use Shopify Functions** (Advanced)
Create a Shopify Function that:
1. Reads discount amount from cart attributes
2. Applies dynamic discount at checkout
3. Requires Shopify Plus or development store

## Implementation

### Update Widget Code

```javascript
applyCoins: async function() {
  const coinsToUse = parseInt(coinsInput.value) || 0;
  const discountAmount = coinsToUse * this.coinValue;
  
  // Round to nearest tier
  const tiers = [10, 25, 50, 100, 250, 500, 1000];
  const tier = tiers.find(t => t >= discountAmount) || 1000;
  const discountCode = `WALLET${tier}`;
  
  // Deduct coins from backend
  const response = await fetch(API_BASE + '/wallet/deduct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shop-url': shop,
    },
    body: JSON.stringify({
      email: this.currentEmail,
      coinsToRedeem: coinsToUse,
      discountCode: discountCode,
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Redirect with discount code
    window.location.href = `/checkout?discount=${discountCode}`;
  }
}
```

### Create Discount Codes in Shopify

Run this script to create all tier discounts:

```bash
# Create 7 discount codes for different tiers
# You need to do this manually in Shopify Admin or via API
```

Or manually create them:
1. WALLET10 = ₹10 off
2. WALLET25 = ₹25 off
3. WALLET50 = ₹50 off
4. WALLET100 = ₹100 off
5. WALLET250 = ₹250 off
6. WALLET500 = ₹500 off
7. WALLET1000 = ₹1000 off

## Alternative: Shopify Scripts (Shopify Plus Only)

If you have Shopify Plus, you can use Shopify Scripts to apply dynamic discounts:

```ruby
# Wallet discount script
wallet_discount = Input.cart.attributes["wallet_discount"]

if wallet_discount
  discount_amount = Money.new(cents: wallet_discount.to_i * 100)
  Input.cart.line_items.each do |line_item|
    line_item.change_line_price(line_item.line_price - discount_amount, message: "Wallet discount")
  end
end

Output.cart = Input.cart
```

## Recommended Approach

**Use Option A (Multiple Fixed Discounts)** because:
- ✅ Works on all Shopify plans
- ✅ No API setup required
- ✅ Discounts work immediately
- ✅ Easy to manage
- ✅ No manual creation per transaction

**Steps:**
1. Create 7 discount codes in Shopify admin (one-time setup)
2. Update widget to use tiered codes
3. Deploy and test

Would you like me to implement the tiered discount approach?
