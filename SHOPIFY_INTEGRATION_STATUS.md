# Shopify Integration Status

## ✅ Completed Integration Steps

### 1. Backend Integration
- ✅ Added Shopify routes to main server (`backend/src/index.js`)
- ✅ Created Shopify coin service (`backend/src/shopify/coinService.js`)
- ✅ Created Shopify API routes (`backend/src/shopify/routes.js`)
- ✅ Created Shopify configuration (`backend/src/shopify/shopifyConfig.js`)
- ✅ Added Shopify session storage table to database schema
- ✅ Installed Shopify dependencies (`@shopify/shopify-app-express`, `@shopify/shopify-app-session-storage-postgresql`)

### 2. Environment Configuration
- ✅ Added Shopify environment variables to `.env` and `.env.example`:
  - `SHOPIFY_API_KEY`
  - `SHOPIFY_API_SECRET`
  - `SCOPES`
  - `HOST`

### 3. Database Schema
- ✅ Added `shopify_sessions` table for OAuth session storage
- ✅ Existing tables (`wallets`, `transactions`) already support multi-tenancy via `store_url`

## 🔧 Configuration Required

### Step 1: Create Shopify App
1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Create a new app or use existing app
3. Get your API credentials:
   - API Key
   - API Secret Key
4. Set App URL to your backend URL (e.g., `https://your-domain.com`)
5. Set Redirect URLs:
   - `https://your-domain.com/api/shopify/auth/callback`

### Step 2: Update Environment Variables
Update `.env` file with your Shopify credentials:
```env
SHOPIFY_API_KEY=your_actual_api_key
SHOPIFY_API_SECRET=your_actual_api_secret
HOST=https://your-actual-domain.com
```

### Step 3: Configure Webhooks in Shopify
Set up these webhooks in your Shopify app settings:
- **Customer Creation**: `https://your-domain.com/api/shopify/coins/webhooks/customers/create`
- **Order Paid**: `https://your-domain.com/api/shopify/coins/webhooks/orders/paid`

## 📡 Available API Endpoints

### Shopify Coin Endpoints (Prefix: `/api/shopify/coins`)

#### 1. Get Customer Balance
```
GET /api/shopify/coins/balance/:customerId
Headers: x-shop-url: your-store.myshopify.com
```

#### 2. Award Coins
```
POST /api/shopify/coins/award
Headers: x-shop-url: your-store.myshopify.com
Body: {
  "customerId": "123456789",
  "coinAmount": 500,
  "orderId": "order_123",
  "description": "Purchase reward"
}
```

#### 3. Redeem Coins
```
POST /api/shopify/coins/redeem
Headers: x-shop-url: your-store.myshopify.com
Body: {
  "customerId": "123456789",
  "coinAmount": 100,
  "orderId": "order_456"
}
```

#### 4. Get Transaction History
```
GET /api/shopify/coins/transactions/:customerId?limit=50
Headers: x-shop-url: your-store.myshopify.com
```

#### 5. Webhooks
```
POST /api/shopify/coins/webhooks/customers/create
POST /api/shopify/coins/webhooks/orders/paid
Headers: x-shopify-shop-domain: your-store.myshopify.com
```

## 🔄 How It Works

### Customer Lifecycle
1. **New Customer**: When a customer is created in Shopify, webhook triggers and awards welcome bonus (500 coins)
2. **Purchase**: When order is paid, customer earns coins (1 coin per dollar spent)
3. **Redemption**: Customer can redeem coins during checkout
4. **Balance Check**: Real-time balance available via API

### Multi-Tenancy
- All data is scoped by `store_url` (Shopify domain)
- Each merchant's data is isolated
- Existing wallet system seamlessly integrates with Shopify customers

## 🚀 Next Steps

### Phase 1: Testing (Current)
- [ ] Update `.env` with real Shopify credentials
- [ ] Test OAuth flow
- [ ] Test webhook endpoints
- [ ] Verify coin awarding/redemption

### Phase 2: Shopify Theme Extension
- [ ] Create checkout UI extension to show coin balance
- [ ] Add coin redemption interface in cart/checkout
- [ ] Display coin earning potential on product pages

### Phase 3: App Embed
- [ ] Create Shopify app embed for customer account page
- [ ] Show transaction history
- [ ] Display current balance and rewards

### Phase 4: Admin Dashboard
- [ ] Create Shopify admin app interface
- [ ] Configure coin earning rules
- [ ] View analytics and reports
- [ ] Manage customer rewards

## 📝 Notes

### Coin Earning Rules (Current Implementation)
- Welcome bonus: 500 coins (on customer creation)
- Purchase reward: 1 coin per $1 spent (on order paid)
- Manual credits: Admin can credit coins via existing `/api/wallet/credit` endpoint

### Integration with Existing System
- Shopify customers are identified by their Shopify customer ID
- Customer ID is stored in `customer_phone` field in `wallets` table
- All existing admin endpoints work with Shopify data
- Frontend dashboard shows combined data from both systems

## 🐛 Troubleshooting

### Issue: Webhooks not receiving data
- Verify webhook URLs in Shopify admin
- Check that `x-shopify-shop-domain` header is present
- Ensure your server is publicly accessible (use ngrok for local testing)

### Issue: OAuth errors
- Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
- Check that redirect URL matches exactly in Shopify app settings
- Ensure `HOST` environment variable is set correctly

### Issue: Coins not awarding
- Check server logs for errors
- Verify customer exists in database
- Ensure `store_url` matches Shopify domain exactly

## 📚 Resources
- [Shopify App Development Docs](https://shopify.dev/docs/apps)
- [Shopify Webhooks Guide](https://shopify.dev/docs/apps/webhooks)
- [Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)
