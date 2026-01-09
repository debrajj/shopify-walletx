# Shopify Checkout UI Extension - Coin Balance

This directory contains an example Shopify checkout UI extension that displays customer coin balance and allows redemption during checkout.

## What This Extension Does

- ✅ Shows customer's coin balance in checkout
- ✅ Allows customers to redeem coins for discounts
- ✅ Real-time balance updates
- ✅ Quick redemption buttons (100, 500, 1000 coins)
- ✅ Error handling and loading states

## Setup Instructions

### 1. Create Shopify Extension

```bash
# In your Shopify app directory
npm run shopify app generate extension

# Choose:
# - Type: Checkout UI
# - Name: coin-balance
# - Template: React
```

### 2. Install Dependencies

```bash
cd extensions/coin-balance
npm install
```

### 3. Copy Extension Code

Copy the code from `checkout-ui-extension.jsx` to your extension's main file (usually `src/Checkout.jsx`).

### 4. Update Configuration

In the extension code, update:

```javascript
const BACKEND_URL = 'https://your-backend-url.com';
```

Replace with your actual backend URL.

### 5. Configure Extension Placement

In `shopify.extension.toml`:

```toml
[[extensions]]
type = "ui_extension"
name = "coin-balance"
handle = "coin-balance"

[[extensions.targeting]]
target = "purchase.checkout.block.render"
```

### 6. Deploy Extension

```bash
npm run deploy
```

### 7. Activate in Shopify Admin

1. Go to your Shopify admin
2. Navigate to Settings → Checkout
3. Find your extension in the list
4. Enable it and position it where you want (e.g., above payment methods)

## How It Works

### Flow Diagram

```
Customer in Checkout
    ↓
Extension loads
    ↓
Fetch balance from backend
    ↓
Display balance + redemption options
    ↓
Customer clicks redeem
    ↓
Apply discount code
    ↓
Update balance
```

### API Integration

The extension calls your backend API:

```javascript
// Get balance
GET /api/shopify/coins/balance/:customerId
Headers: { 'x-shop-url': shop.myshopifyDomain }

// Response
{
  "success": true,
  "balance": 1500,
  "currency": "coins"
}
```

### Discount Application

When customer redeems coins:
1. Extension creates a unique discount code
2. Applies it to the checkout
3. Backend webhook (order paid) will deduct coins
4. Balance updates in real-time

## Customization

### Change Redemption Amounts

Edit the button values:

```javascript
<Button onPress={() => setRedeemAmount(Math.min(250, balance))}>
  250 coins ($2.50 off)
</Button>
```

### Change Conversion Rate

Currently: 100 coins = $1

To change to 50 coins = $1:

```javascript
const discountAmount = redeemAmount / 50; // Instead of /100
```

### Add Custom Styling

Use Shopify's UI components:

```javascript
<Banner status="success" title="Special Offer!">
  <Text appearance="accent">
    Double coins on this order!
  </Text>
</Banner>
```

### Add Minimum Redemption

```javascript
const MIN_REDEEM = 100;

if (redeemAmount < MIN_REDEEM) {
  setError(`Minimum redemption is ${MIN_REDEEM} coins`);
  return;
}
```

## Testing

### Local Testing

```bash
npm run dev
```

Then use Shopify's development store to test the checkout.

### Test Scenarios

1. **Customer with 0 coins**: Should show "Earn Rewards" message
2. **Customer with coins**: Should show balance and redemption options
3. **Redeem coins**: Should apply discount and update balance
4. **Not logged in**: Extension should not display

## Troubleshooting

### Extension not showing?
- Check that it's enabled in Shopify admin
- Verify customer is logged in
- Check browser console for errors

### Balance not loading?
- Verify BACKEND_URL is correct
- Check CORS settings on backend
- Ensure customer ID is valid

### Discount not applying?
- Check discount code format
- Verify webhook is processing order
- Check backend logs for errors

## Advanced Features

### Add Transaction History

```javascript
const [transactions, setTransactions] = useState([]);

useEffect(() => {
  fetch(`${BACKEND_URL}/api/shopify/coins/transactions/${customer.id}`, {
    headers: { 'x-shop-url': shop.myshopifyDomain }
  })
  .then(res => res.json())
  .then(data => setTransactions(data.transactions));
}, [customer]);

// Display in UI
<BlockStack>
  <Heading>Recent Activity</Heading>
  {transactions.map(tx => (
    <Text key={tx.id}>
      {tx.type}: {tx.coins} coins - {tx.created_at}
    </Text>
  ))}
</BlockStack>
```

### Add Earning Preview

```javascript
const [cartTotal, setCartTotal] = useState(0);

// Calculate coins to earn
const coinsToEarn = Math.floor(cartTotal);

<Text>
  Complete this order to earn {coinsToEarn} coins!
</Text>
```

### Add Tier System

```javascript
const getTier = (balance) => {
  if (balance >= 10000) return { name: 'Platinum', multiplier: 2 };
  if (balance >= 5000) return { name: 'Gold', multiplier: 1.5 };
  if (balance >= 1000) return { name: 'Silver', multiplier: 1.2 };
  return { name: 'Bronze', multiplier: 1 };
};

const tier = getTier(balance);

<Banner status="info">
  <Text>You're a {tier.name} member! Earning {tier.multiplier}x coins</Text>
</Banner>
```

## Resources

- [Shopify Checkout UI Extensions Docs](https://shopify.dev/docs/api/checkout-ui-extensions)
- [UI Components Reference](https://shopify.dev/docs/api/checkout-ui-extensions/components)
- [Extension Targets](https://shopify.dev/docs/api/checkout-ui-extensions/targets)

## Support

For issues with:
- **Extension code**: Check Shopify's documentation
- **Backend API**: See `SHOPIFY_INTEGRATION_STATUS.md`
- **Deployment**: Use Shopify CLI help commands
