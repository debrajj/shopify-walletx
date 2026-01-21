# Email Typo Issue - Two Different Wallets

## Problem
You have TWO different email addresses with TWO different wallets:

1. **debrajecom**cure**@gmail.com** - Has 1 coin (shown in widget)
2. **debrajecom**cmure**@gmail.com** - Has 1498 coins (shown in admin)

Notice the difference: "comcure" vs "cocmure" - there's a typo!

## Why This Happened
The system created separate wallets for each email because they're technically different:
- Widget is using the correct Shopify customer email: `debrajecomcure@gmail.com`
- Admin panel is showing a wallet with a typo: `debrajecocmure@gmail.com`

## Solution Options

### Option 1: Merge the Wallets (Recommended)
Transfer the 1498 coins from the typo email to the correct email:

```sql
-- Find both wallets
SELECT id, customer_email, balance FROM wallets 
WHERE customer_email IN ('debrajecomcure@gmail.com', 'debrajecocmure@gmail.com');

-- Transfer coins from typo wallet to correct wallet
UPDATE wallets 
SET balance = balance + 1498 
WHERE customer_email = 'debrajecomcure@gmail.com';

-- Delete or zero out the typo wallet
UPDATE wallets 
SET balance = 0 
WHERE customer_email = 'debrajecocmure@gmail.com';
```

### Option 2: Fix the Typo Email
Update the typo email to the correct one:

```sql
UPDATE wallets 
SET customer_email = 'debrajecomcure@gmail.com'
WHERE customer_email = 'debrajecocmure@gmail.com';
```

**Note**: This might fail if both emails already exist as separate wallets.

## Quick Fix via Admin Panel
1. Go to admin panel
2. Search for customer with typo email: `debrajecocmure@gmail.com`
3. Manually add -1498 coins (to zero it out)
4. Search for correct email: `debrajecomcure@gmail.com`
5. Manually add +1498 coins

## Prevention
Always double-check email addresses when:
- Creating wallets manually
- Adding coins via admin
- Testing with customer data

The widget uses the email from Shopify's logged-in customer, which is the source of truth.

---

**Current State:**
- ❌ Widget shows 1 coin (correct email, wrong balance)
- ❌ Admin shows 1498 coins (typo email)

**After Fix:**
- ✅ Widget shows 1499 coins (correct email, combined balance)
- ✅ Admin shows 1499 coins (same wallet)
