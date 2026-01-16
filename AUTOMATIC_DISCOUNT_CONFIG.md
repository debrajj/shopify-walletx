# Automatic Discount Configuration ✅

## Overview
The wallet coin redemption system now creates **automatic discounts** that apply at checkout without requiring customers to enter a discount code.

## Discount Configuration

### Type
- **Discount Type**: Amount off order (Fixed amount)
- **Application**: Automatic (no code needed at checkout)

### Title
- **Format**: `Coin Wallet Discount - {COIN_CODE}`
- **Example**: `Coin Wallet Discount - COIN1234565678`
- **Visibility**: Customers will see this in their cart and at checkout

### Discount Value
- **Type**: Fixed amount (₹)
- **Value**: Equals the number of coins redeemed (1 coin = ₹1)
- **Example**: 50 coins = ₹50 discount

### Eligibility

#### Sales Channels
- **Available on**: All sales channels

#### Customers
- **Type**: Specific customers
- **Selection**: Only the customer who redeemed the coins (by email)
- **Example**: debrajecomcure@gmail.com

### Minimum Purchase Requirements
- **Type**: No minimum requirements
- **Minimum amount**: ₹0
- **Minimum quantity**: None

### Duration
- **Starts**: Immediately upon creation
- **Ends**: 30 days from creation
- **Auto-expires**: Yes, after 30 days

### Combinations

#### Combines With:
- ✅ **Product discounts**: Yes
- ✅ **Order discounts**: Yes (all eligible order discounts will apply)
- ❌ **Shipping discounts**: No

**Note**: The discount won't combine with shipping discounts at checkout.

## How It Works

### User Flow
1. Customer logs in or enters email
2. Wallet widget shows balance (e.g., 117 coins)
3. Customer clicks "Redeem points"
4. Customer enters coin amount (e.g., 50 coins)
5. Customer clicks arrow button (→)
6. System creates automatic discount for ₹50
7. Customer is redirected to checkout
8. Discount applies automatically (no code needed)

### Backend Process
1. Generate unique code: `COIN` + timestamp + random number
2. Look up customer ID in Shopify by email
3. Create automatic discount via GraphQL API
4. Configure discount for specific customer only
5. Set 30-day expiration
6. Deduct coins from customer's wallet balance
7. Return success response

### Frontend Process
1. Show "Creating discount..." message
2. Call backend API to create discount
3. Show "₹X discount will apply automatically!" message
4. Redirect to `/checkout` (no discount code in URL)
5. Discount applies automatically at checkout

## Technical Details

### GraphQL Mutation
```graphql
mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
  discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
    automaticDiscountNode {
      id
      automaticDiscount {
        ... on DiscountAutomaticBasic {
          title
          startsAt
          endsAt
          status
          customerGets {
            value {
              ... on DiscountAmount {
                amount {
                  amount
                }
              }
            }
          }
        }
      }
    }
    userErrors {
      field
      code
      message
    }
  }
}
```

### Variables Structure
```javascript
{
  automaticBasicDiscount: {
    title: "Coin Wallet Discount - COIN1234565678",
    startsAt: "2026-01-16T...",
    endsAt: "2026-02-15T...", // 30 days later
    customerSelection: {
      customers: {
        add: ["gid://shopify/Customer/..."]
      }
    },
    customerGets: {
      value: {
        discountAmount: {
          amount: "50.00",
          appliesOnEachItem: false
        }
      },
      items: {
        all: true
      }
    },
    minimumRequirement: {
      greaterThanOrEqualToSubtotal: {
        greaterThanOrEqualToSubtotal: "0"
      }
    },
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: true,
      shippingDiscounts: false
    }
  }
}
```

## Benefits

### For Customers
- ✅ No need to remember or enter discount codes
- ✅ Discount applies automatically at checkout
- ✅ Can combine with other product and order discounts
- ✅ Clear visibility in cart and checkout
- ✅ 30 days to use the discount

### For Store
- ✅ Customer-specific (prevents sharing)
- ✅ Single-use per customer
- ✅ Auto-expires after 30 days
- ✅ Tracks coin redemptions
- ✅ Reduces checkout friction

## Deployment Status

✅ **Backend**: Deployed to GitHub (auto-deploys to Render)
✅ **Frontend**: Deployed to Shopify (version shopify-wallet-admin-50)

## Testing

To test the automatic discount:

1. Go to your Shopify store
2. Log in as debrajecomcure@gmail.com (or any customer with coins)
3. Add items to cart
4. Open cart and find the Wallet widget
5. Click "Redeem points"
6. Enter coin amount (e.g., 50)
7. Click the arrow button (→)
8. You'll see: "₹50 discount will apply automatically!"
9. You'll be redirected to checkout
10. The discount should appear automatically in the order summary
11. No need to enter any discount code

## Troubleshooting

### Discount Not Appearing
- Check if customer email matches Shopify customer
- Verify Shopify API access token is valid
- Check discount expiration (30 days)
- Ensure customer hasn't already used the discount

### Fallback Behavior
If automatic discount creation fails:
- System falls back to creating a discount code
- Customer will need to enter the code at checkout
- Code format: `COIN-{timestamp}-{random}`

## Notes

- Automatic discounts require Shopify API access
- Customer must exist in Shopify with matching email
- Discount is customer-specific (can't be shared)
- Expires automatically after 30 days
- Combines with product and order discounts
- Does NOT combine with shipping discounts
