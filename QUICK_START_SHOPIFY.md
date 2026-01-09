# Quick Start: Shopify Integration

## 🎯 What's Been Done

Your existing wallet backend now has Shopify integration! Here's what was added:

### ✅ Backend Changes
1. **New Shopify Routes** (`/api/shopify/coins/*`)
   - Award coins to customers
   - Redeem coins during checkout
   - Check customer balance
   - View transaction history
   - Webhook handlers for customer creation and order payments

2. **Database Updates**
   - Added `shopify_sessions` table for OAuth
   - Existing tables already support multi-tenancy

3. **Dependencies Installed**
   - `@shopify/shopify-app-express`
   - `@shopify/shopify-app-session-storage-postgresql`

## 🚀 How to Use

### Step 1: Get Shopify Credentials

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app (or use existing)
3. Copy your credentials:
   - API Key
   - API Secret

### Step 2: Update .env File

Replace these placeholder values in `.env`:

```env
SHOPIFY_API_KEY=your_actual_api_key_here
SHOPIFY_API_SECRET=your_actual_secret_here
HOST=https://your-domain.com
```

For local testing, you can use ngrok:
```bash
ngrok http 3000
# Then use the ngrok URL as HOST
```

### Step 3: Start Backend

```bash
npm run dev --prefix backend
```

The server will:
- Create the `shopify_sessions` table automatically
- Mount Shopify routes at `/api/shopify/coins`
- Be ready to receive webhooks

### Step 4: Configure Shopify Webhooks

In your Shopify app settings, add these webhooks:

1. **Customer Creation**
   - URL: `https://your-domain.com/api/shopify/coins/webhooks/customers/create`
   - Event: `customers/create`
   - Awards 500 welcome coins

2. **Order Paid**
   - URL: `https://your-domain.com/api/shopify/coins/webhooks/orders/paid`
   - Event: `orders/paid`
   - Awards 1 coin per dollar spent

## 🧪 Testing

### Test the Integration

```bash
node backend/test-shopify-integration.js
```

### Test API Endpoints

#### 1. Check Customer Balance
```bash
curl -X GET "http://localhost:3000/api/shopify/coins/balance/123456789" \
  -H "x-shop-url: your-store.myshopify.com"
```

#### 2. Award Coins
```bash
curl -X POST "http://localhost:3000/api/shopify/coins/award" \
  -H "Content-Type: application/json" \
  -H "x-shop-url: your-store.myshopify.com" \
  -d '{
    "customerId": "123456789",
    "coinAmount": 500,
    "description": "Welcome bonus"
  }'
```

#### 3. Redeem Coins
```bash
curl -X POST "http://localhost:3000/api/shopify/coins/redeem" \
  -H "Content-Type: application/json" \
  -H "x-shop-url: your-store.myshopify.com" \
  -d '{
    "customerId": "123456789",
    "coinAmount": 100,
    "orderId": "order_123"
  }'
```

## 📊 How It Works with Your Existing System

### Multi-Tenancy
- Each Shopify store is identified by `store_url` (e.g., `your-store.myshopify.com`)
- All data is isolated per store
- Your existing admin dashboard shows all data (including Shopify customers)

### Customer Identification
- Shopify customers are identified by their Shopify Customer ID
- Stored in the `customer_phone` field in your `wallets` table
- Seamlessly integrates with your existing wallet system

### Coin Flow
```
New Customer → Webhook → Award 500 coins
Order Paid → Webhook → Award coins (1 per $1)
Checkout → API Call → Redeem coins
```

## 🎨 Frontend Integration (Next Steps)

### Option 1: Shopify Theme Extension
Create a checkout UI extension to show coin balance and redemption:

```javascript
// In your Shopify theme extension
fetch('https://your-backend.com/api/shopify/coins/balance/' + customerId, {
  headers: { 'x-shop-url': Shopify.shop }
})
.then(res => res.json())
.then(data => {
  // Display balance: data.balance
});
```

### Option 2: App Embed
Create an app embed for customer account page showing:
- Current coin balance
- Transaction history
- Rewards earned

### Option 3: Admin App
Build a Shopify admin app interface for:
- Configuring coin earning rules
- Viewing analytics
- Managing customer rewards

## 🔧 Configuration Options

### Customize Coin Earning Rules

Edit `backend/src/shopify/routes.js`:

```javascript
// Welcome bonus (line ~60)
const welcomeBonus = 500; // Change this value

// Purchase reward (line ~80)
const coinsToAward = Math.floor(orderTotal); // 1 coin per $1
// Change to: Math.floor(orderTotal * 0.1) for 10% back
```

### Add Custom Earning Events

Add new webhook handlers in `backend/src/shopify/routes.js`:

```javascript
// Example: Award coins on product review
router.post('/webhooks/reviews/create', async (req, res) => {
  const review = req.body;
  await coinService.awardCoins(
    req.headers['x-shopify-shop-domain'],
    review.customer_id,
    50, // 50 coins per review
    null,
    'Review reward'
  );
  res.status(200).send('OK');
});
```

## 📝 Important Notes

1. **Security**: Shopify webhooks should be verified using HMAC. Add this in production.
2. **Rate Limits**: Shopify API has rate limits. Implement retry logic for production.
3. **Testing**: Use Shopify's webhook testing tool in the admin panel.
4. **Monitoring**: Check server logs for webhook processing status.

## 🐛 Troubleshooting

### Webhooks not working?
- Check that your server is publicly accessible
- Verify webhook URLs in Shopify admin
- Check server logs for errors
- Use ngrok for local testing

### Coins not awarding?
- Verify `store_url` matches exactly
- Check that customer exists
- Look for errors in server logs

### Database errors?
- Ensure backend server ran at least once (to create tables)
- Check database connection in `.env`

## 📚 Documentation

- Full API documentation: `SHOPIFY_INTEGRATION_STATUS.md`
- Spec files: `.kiro/specs/shopify-coin-integration/`
- Test script: `backend/test-shopify-integration.js`

## 🎉 You're Ready!

Your backend now supports:
- ✅ Shopify customer coin management
- ✅ Automatic coin awarding via webhooks
- ✅ Coin redemption during checkout
- ✅ Multi-tenant support
- ✅ Transaction history
- ✅ Real-time balance checks

Next: Build the Shopify theme extension or app embed to complete the customer-facing experience!
