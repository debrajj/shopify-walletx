# Discount Amount Mismatch Diagnosis

## Issue
Automatic "Amount off order" coupons are not being created with the correct discount amount in Shopify.

## What We've Verified

### ✅ Code is Correct
1. **Amount Formatting**: The `formatDiscountAmount()` function correctly formats amounts to 2 decimal places
   - Input: 10 → Output: "10.00"
   - Input: 50.5 → Output: "50.50"
   
2. **Widget Calculation**: The widget correctly calculates discount amount
   ```javascript
   const discountAmount = coinsToRedeem * coinValue; // coinValue = 1
   // Example: 50 coins × ₹1 = ₹50
   ```

3. **API Endpoint**: The backend receives the correct amount and formats it properly before sending to Shopify

4. **Database Records**: Recent discounts show matching amounts:
   - Expected: ₹20.00, Actual: ₹20.00 ✅

## What to Check Next

### 1. Check Backend Server Logs
When a customer redeems coins, look for these log entries:

```
[Discount] 📝 Request Details: {
  "discountAmount": 50,
  "formattedAmount": "50.00"
}
```

```
[Discount] 📥 GraphQL Response: {
  "success": true,
  "response": { ... }
}
```

```
[Discount] ✅ Amount verified: ₹50.00 matches expected ₹50.00
```

OR

```
[Discount] ⚠️  AMOUNT MISMATCH DETECTED: {
  "expectedAmount": 50,
  "actualAmount": 5,
  "difference": 45
}
```

### 2. Check Shopify Admin
1. Go to Shopify Admin → Discounts
2. Find the automatic discount (search for "Coin Wallet Discount")
3. Check the discount value shown
4. Compare with what the customer redeemed

### 3. Test with Specific Amount
Try redeeming exactly 100 coins and verify:
- Widget shows: "₹100 discount will apply"
- Backend logs show: `discountAmount: 100, formattedAmount: "100.00"`
- Shopify shows: ₹100.00 off

## Possible Causes

### If Amount is Wrong in Shopify:

**Cause 1: Currency Mismatch**
- The store might be using a different currency
- Check if Shopify is interpreting the amount in paise instead of rupees
- Solution: Verify store currency settings

**Cause 2: API Version Issue**
- Different Shopify API versions might handle amounts differently
- Current code uses: `2024-01/graphql.json`
- Solution: Check Shopify API changelog

**Cause 3: Decimal Handling**
- Shopify might be truncating decimals
- Example: 50.00 becomes 50, then interpreted as ₹0.50
- Solution: Already fixed with `formatDiscountAmount()`

### If Amount is Correct but Not Applying:

**Cause 1: Minimum Requirements**
- Check if cart total meets minimum requirement
- Current setting: `greaterThanOrEqualToSubtotal: "0"`

**Cause 2: Customer Eligibility**
- Verify customer is in the discount's customer list
- Check if customer email matches

**Cause 3: Discount Status**
- Verify discount status is "ACTIVE"
- Check start/end dates

## How to Get More Information

### Run Diagnostic Scripts:

1. **Check recent discounts in database:**
   ```bash
   node check-discount-amounts.js
   ```

2. **Check actual Shopify discount details:**
   ```bash
   node check-shopify-discount-details.js
   ```

3. **Test discount creation:**
   ```bash
   node test-full-discount-flow.js
   ```

### Check Backend Logs:

If using Render.com:
1. Go to your Render dashboard
2. Click on your backend service
3. Go to "Logs" tab
4. Filter for "[Discount]" to see discount-related logs
5. Look for the log entries mentioned above

### Enable Detailed Logging:

The code already has comprehensive logging. When a discount is created, you should see:
- Request details with formatted amount
- GraphQL response from Shopify
- Verification result
- Any mismatches detected

## Quick Fix to Try

If the issue is that Shopify is interpreting amounts in paise (1/100th of rupee):

1. Open `backend/src/shopify/discountService.js`
2. Find the `formatDiscountAmount()` function
3. Temporarily multiply by 100 to test:
   ```javascript
   function formatDiscountAmount(amount) {
     // TEST: Multiply by 100 if Shopify expects paise
     return (amount * 100).toFixed(2);
   }
   ```
4. Test with 10 coins - should create ₹1000 discount if this is the issue
5. If it works, the problem is currency unit mismatch

## Next Steps

1. **Reproduce the issue**: Have a customer redeem coins and note the exact amounts
2. **Check logs**: Look at backend logs for that specific redemption
3. **Verify in Shopify**: Check the actual discount created in Shopify admin
4. **Compare**: Note any differences between expected and actual amounts
5. **Report back**: Share the log entries and Shopify screenshot

## Contact Information

If you need help:
1. Share the backend log entries for a failed discount creation
2. Share a screenshot of the discount in Shopify admin
3. Share the exact amount the customer tried to redeem
4. Share what amount actually appeared in Shopify
