# 🚀 Shopify Integration Quick Reference

## Server Commands

```bash
# Start backend server
npm run dev --prefix backend

# Run integration test
node backend/test-shopify-integration.js

# Stop backend server
# Press Ctrl+C in the terminal
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/shopify/coins
```

### Required Header
```
x-shop-url: your-store.myshopify.com
```

### 1. Get Balance
```bash
GET /balance/:customerId
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/shopify/coins/balance/123456789" \
  -H "x-shop-url: your-store.myshopify.com"
```

### 2. Award Coins
```bash
POST /award
Body: {
  "customerId": "string",
  "coinAmount": number,
  "orderId": "string" (optional),
  "description": "string" (optional)
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/shopify/coins/award" \
  -H "Content-Type: application/json" \
  -H "x-shop-url: your-store.myshopify.com" \
  -d '{"customerId":"123456789","coinAmount":500,"description":"Welcome bonus"}'
```

### 3. Redeem Coins
```bash
POST /redeem
Body: {
  "customerId": "string",
  "coinAmount": number,
  "orderId": "string"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/shopify/coins/redeem" \
  -H "Content-Type: application/json" \
  -H "x-shop-url: your-store.myshopify.com" \
  -d '{"customerId":"123456789","coinAmount":100,"orderId":"order_456"}'
```

### 4. Transaction History
```bash
GET /transactions/:customerId?limit=50
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/shopify/coins/transactions/123456789?limit=50" \
  -H "x-shop-url: your-store.myshopify.com"
```

## Webhook Endpoints

### Customer Created
```
POST /api/shopify/coins/webhooks/customers/create
Header: x-shopify-shop-domain: your-store.myshopify.com
```
Awards 500 welcome coins automatically.

### Order Paid
```
POST /api/shopify/coins/webhooks/orders/paid
Header: x-shopify-shop-domain: your-store.myshopify.com
```
Awards 1 coin per dollar spent.

## Configuration

### Environment Variables (.env)
```env
# Shopify
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
HOST=https://your-domain.com

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=shopify_wallet
DB_USER=postgres
DB_PASSWORD=your-password

# Server
PORT=3000
```

## Coin Earning Rules

| Event | Coins Awarded | Configurable |
|-------|---------------|--------------|
| Customer Creation | 500 | Yes (line 60 in routes.js) |
| Order Paid | 1 per $1 | Yes (line 80 in routes.js) |
| Manual Credit | Variable | Via admin API |

## Common Tasks

### Change Welcome Bonus
Edit `backend/src/shopify/routes.js` line 60:
```javascript
const welcomeBonus = 500; // Change this value
```

### Change Purchase Reward Rate
Edit `backend/src/shopify/routes.js` line 80:
```javascript
const coinsToAward = Math.floor(orderTotal); // 1 coin per $1
// Change to: Math.floor(orderTotal * 0.1) for 10% back
```

### Check Database
```sql
-- View all wallets
SELECT customer_phone, balance, store_url FROM wallets;

-- View transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;

-- Check specific customer
SELECT * FROM wallets WHERE customer_phone = '123456789';
```

## Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Database connection error
1. Check `.env` file has correct DB credentials
2. Verify database is accessible
3. Check firewall/security group settings

### Webhooks not working
1. Ensure server is publicly accessible (use ngrok for local)
2. Verify webhook URLs in Shopify admin
3. Check server logs for errors

### Coins not awarding
1. Check server logs
2. Verify `store_url` matches exactly
3. Ensure customer ID is correct

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Test script passes all checks
- [ ] Can award coins via API
- [ ] Can retrieve balance
- [ ] Can redeem coins
- [ ] Transaction history shows correctly
- [ ] Webhooks configured in Shopify
- [ ] Webhooks receiving data

## Documentation Files

| File | Purpose |
|------|---------|
| `INTEGRATION_COMPLETE.md` | Complete integration summary |
| `QUICK_START_SHOPIFY.md` | Step-by-step setup guide |
| `SHOPIFY_INTEGRATION_STATUS.md` | Full API documentation |
| `TEST_RESULTS.md` | Test results and verification |
| `shopify-extension-example/` | Checkout UI extension code |

## Support Resources

- [Shopify App Docs](https://shopify.dev/docs/apps)
- [Webhook Guide](https://shopify.dev/docs/apps/webhooks)
- [Checkout Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)

## Quick Test

```bash
# 1. Start server
npm run dev --prefix backend

# 2. Award coins
curl -X POST "http://localhost:3000/api/shopify/coins/award" \
  -H "Content-Type: application/json" \
  -H "x-shop-url: test.myshopify.com" \
  -d '{"customerId":"test123","coinAmount":500}'

# 3. Check balance
curl -X GET "http://localhost:3000/api/shopify/coins/balance/test123" \
  -H "x-shop-url: test.myshopify.com"

# 4. Redeem coins
curl -X POST "http://localhost:3000/api/shopify/coins/redeem" \
  -H "Content-Type: application/json" \
  -H "x-shop-url: test.myshopify.com" \
  -d '{"customerId":"test123","coinAmount":100,"orderId":"order123"}'
```

---

**Status:** ✅ All systems operational  
**Last Updated:** January 9, 2026
