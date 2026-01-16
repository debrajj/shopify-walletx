# Next Steps: Debugging Discount Amount Issue

## What We've Done

✅ **Verified the code is working correctly:**
- Amount formatting function works: `10` → `"10.00"` ✅
- Widget calculation is correct: `50 coins × ₹1 = ₹50` ✅
- Database shows matching amounts ✅

✅ **Added enhanced logging:**
- Now logs the exact GraphQL variables being sent to Shopify
- Shows both raw and formatted amounts
- Logs verification results

✅ **Created diagnostic tools:**
- `check-discount-amounts.js` - Check database records
- `check-shopify-discount-details.js` - Query Shopify directly
- `test-full-discount-flow.js` - Test the full flow
- `DISCOUNT_AMOUNT_DIAGNOSIS.md` - Complete troubleshooting guide

## What You Need to Do Now

### Step 1: Reproduce the Issue
1. Go to your store's cart page
2. Add items worth at least ₹100
3. Open the wallet widget
4. Redeem exactly **50 coins**
5. Note what discount amount is shown in the widget
6. Complete the checkout process
7. Check what discount was actually applied

### Step 2: Check Backend Logs
After creating the discount, check your Render.com logs:

1. Go to https://dashboard.render.com
2. Click on your backend service (`shopify-walletx`)
3. Go to "Logs" tab
4. Look for these new log entries:

```
[Discount] 📤 GraphQL Mutation Variables: {
  "discountAmount": 50,
  "formattedAmount": "50.00",
  "fullVariables": { ... }
}
```

```
[Discount] 📥 GraphQL Response: {
  "success": true,
  ...
}
```

```
[Discount] ✅ Amount verified: ₹50.00 matches expected ₹50.00
```

OR if there's a mismatch:

```
[Discount] ⚠️  AMOUNT MISMATCH DETECTED: {
  "expectedAmount": 50,
  "actualAmount": 5,
  "difference": 45
}
```

### Step 3: Check Shopify Admin
1. Go to Shopify Admin → Discounts
2. Find the discount that was just created (search for "Coin Wallet Discount")
3. Click on it to see details
4. **Take a screenshot** of the discount details showing:
   - Discount name
   - Discount value
   - Customer eligibility
   - Status

### Step 4: Report Back
Share with me:
1. **What amount you tried to redeem**: (e.g., "50 coins")
2. **What the widget showed**: (e.g., "₹50 discount will apply")
3. **Backend log entries**: Copy the log entries from Step 2
4. **Shopify screenshot**: From Step 3
5. **What actually happened at checkout**: (e.g., "Only ₹5 was discounted")

## Possible Issues & Solutions

### Issue 1: Currency Unit Mismatch
**Symptom**: Discount is 100x smaller (₹50 becomes ₹0.50)
**Cause**: Shopify might be expecting amount in paise (smallest currency unit)
**Solution**: Multiply amount by 100 before sending to Shopify

### Issue 2: Decimal Truncation
**Symptom**: ₹50.00 becomes ₹50, then interpreted as ₹0.50
**Cause**: Shopify API might be truncating decimals
**Solution**: Already fixed with `formatDiscountAmount()` - ensures "50.00" format

### Issue 3: Wrong Currency
**Symptom**: Amount is correct but in wrong currency
**Cause**: Store uses different currency than INR
**Solution**: Query store currency and use it in the mutation

### Issue 4: API Version
**Symptom**: Inconsistent behavior
**Cause**: Different API versions handle amounts differently
**Solution**: Update to latest stable API version

## Quick Test

Run this command to check recent discounts:
```bash
node check-discount-amounts.js
```

This will show you if there are any mismatches in the database.

## If You Need Immediate Fix

If the issue is that amounts are 100x too small (e.g., ₹50 becomes ₹0.50), try this temporary fix:

1. Open `backend/src/shopify/discountService.js`
2. Find line ~20 where `formatDiscountAmount` is defined
3. Change it to:
```javascript
function formatDiscountAmount(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  // TEMPORARY FIX: Multiply by 100 if Shopify expects paise
  return (amount * 100).toFixed(2);
}
```
4. Test with 10 coins - if it creates ₹1000 discount, this confirms the issue
5. If confirmed, change back to `amount.toFixed(2)` and we'll fix it properly

## Contact

Once you have the information from Steps 1-4, share it and I'll help identify the exact issue and implement the fix.
