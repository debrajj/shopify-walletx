# 🎫 Automatic Discount Feature

## Overview

The automatic discount feature allows customers to redeem wallet coins and have discounts automatically applied at checkout without entering discount codes manually. The system uses Shopify's GraphQL Admin API to create customer-specific automatic discounts.

## ✨ Features

- **Automatic Application**: Discounts apply at checkout without code entry
- **Customer-Specific**: Only the customer who redeemed coins can use the discount
- **Single-Use**: Each discount can only be used once per customer
- **Smart Fallback**: Falls back to discount codes if automatic creation fails
- **Balance Persistence**: Auto-loads balance for logged-in customers
- **Real-Time Updates**: Instant cart total updates as coins are entered
- **Duplicate Prevention**: Checks for existing active discounts before creating new ones

## 🏗️ Architecture

```
┌─────────────────┐
│  Shopify Store  │
│   (Frontend)    │
└────────┬────────┘
         │
         │ Widget loads balance
         │ Customer enters coins
         │
         ▼
┌─────────────────┐
│  Widget v2.3.0  │
│  (Liquid/JS)    │
└────────┬────────┘
         │
         │ POST /api/shopify/create-discount
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  (Express.js)   │
└────────┬────────┘
         │
         ├─► Check wallet balance
         ├─► Check existing discounts
         ├─► Create Shopify discount
         │   ├─► Try automatic (GraphQL)
         │   └─► Fallback to code
         ├─► Deduct coins
         └─► Log transaction
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

## 📋 Requirements

### Backend
- Node.js 14+
- Express.js
- PostgreSQL database
- Shopify Admin API access token

### Frontend
- Shopify theme with cart drawer
- Widget v2.3.0 or higher

### Shopify
- Shopify store with API access
- Admin API permissions for discount management
- Customer accounts enabled

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# .env file
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PORT=3000
CORS_ORIGIN=https://your-store.myshopify.com
```

### 3. Run Deployment Script

```bash
node deploy-automatic-discount.js
```

This will:
- ✅ Check database connection
- ✅ Run migrations
- ✅ Verify table structure
- ✅ Check store configuration
- ✅ Test discount service

### 4. Configure Shopify API Token

```bash
node add-shopify-token.js
```

Follow the prompts to add your Shopify API access token.

### 5. Test the Feature

```bash
# Test discount creation
node test-automatic-discount.js

# Check status
node check-discount-status.js
```

### 6. Deploy

```bash
# Deploy backend (auto-deploys via GitHub → Render)
git add .
git commit -m "feat: Add automatic discount feature"
git push origin main

# Deploy widget
cd extensions/wallet-theme-app
shopify theme push
```

## 📖 Usage

### For Customers

1. **Open Cart**: Add items to cart and open cart drawer
2. **Enter Email**: Widget auto-loads if logged in, or enter email manually
3. **Check Balance**: Balance loads automatically
4. **Enter Coins**: Type number of coins to redeem
5. **Apply**: Click arrow button or press Enter
6. **Checkout**: Discount applies automatically at checkout

### For Developers

#### Create Discount Programmatically

```javascript
const { createShopifyDiscount } = require('./backend/src/shopify/discountService');

const result = await createShopifyDiscount(
  'store.myshopify.com',  // Shop URL (normalized)
  'customer@example.com',  // Customer email
  100,                     // Coins to redeem
  100,                     // Discount amount (₹)
  'WALLET123456'          // Discount code
);

console.log(result);
// {
//   success: true,
//   discountCode: 'WALLET123456',
//   discountValue: 100,
//   isAutomatic: true,
//   message: 'Automatic discount ₹100 will apply at checkout!'
// }
```

#### Check Discount Status

```javascript
const db = require('./backend/src/config/db');

const result = await db.query(`
  SELECT * FROM discount_codes 
  WHERE customer_email = $1 
  AND is_used = FALSE 
  AND expires_at > NOW()
`, ['customer@example.com']);

console.log(result.rows);
```

## 🔧 Configuration

### Discount Settings

Edit `backend/src/shopify/discountService.js`:

```javascript
// Discount expiration (default: 24 hours)
endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

// Discount combination rules
combinesWith: {
  orderDiscounts: true,      // Combines with order discounts
  productDiscounts: false,   // Does not combine with product discounts
  shippingDiscounts: false   // Does not combine with shipping discounts
}
```

### Widget Settings

Edit `extensions/wallet-theme-app/blocks/wallet-app-embed.liquid`:

```javascript
// Coin value (default: 1 coin = ₹1)
coinValue: 1

// API endpoint
const API_BASE = 'https://shopify-walletx.onrender.com/api';
```

## 📊 Database Schema

### discount_codes Table

```sql
CREATE TABLE discount_codes (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  discount_code VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  coins_redeemed INTEGER NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(store_url, discount_code)
);
```

## 🔍 Monitoring

### Check Status

```bash
node check-discount-status.js
```

### View Logs

```bash
# Backend logs (Render dashboard)
# Look for:
[Discount] 🎫 Creating AUTOMATIC discount...
[Discount] ✅ AUTOMATIC discount created successfully!
[Discount] 🔄 Creating discount CODE as fallback...
```

### Database Queries

```sql
-- Active discounts
SELECT * FROM discount_codes 
WHERE is_used = FALSE AND expires_at > NOW();

-- Usage statistics
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used,
  SUM(discount_amount) as total_savings
FROM discount_codes;

-- Customer history
SELECT 
  customer_email,
  COUNT(*) as discount_count,
  SUM(discount_amount) as total_savings
FROM discount_codes
GROUP BY customer_email
ORDER BY total_savings DESC;
```

## 🐛 Troubleshooting

### Discount Not Applying

**Problem**: Discount doesn't apply at checkout

**Solutions**:
1. Check if discount expired (24 hours)
2. Verify discount exists in Shopify admin
3. Ensure customer email matches
4. Check if discount already used

```bash
# Check discount in database
node -e "const db = require('./backend/src/config/db'); db.query('SELECT * FROM discount_codes WHERE discount_code = \$1', ['WALLET123456']).then(r => { console.log(r.rows); db.end(); });"
```

### Customer Not Found

**Problem**: "Customer not found in Shopify" error

**Solutions**:
1. Verify customer exists in Shopify admin
2. Check email spelling
3. System automatically falls back to discount code

### API Token Missing

**Problem**: "No Shopify API access" warning

**Solutions**:
```bash
# Add API token
node add-shopify-token.js
```

### Widget Not Showing

**Problem**: Widget doesn't appear in cart

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify widget version: `[Wallet Widget] Version: 2.3.0`
4. Re-push theme: `shopify theme push`

## 🧪 Testing

### Unit Tests

```bash
# Test discount service
node test-automatic-discount.js

# Test API endpoint
node test-discount-creation.js

# Check database
node check-database.js
```

### Manual Testing

1. **Test Automatic Discount**:
   - Configure API token
   - Create discount with existing customer
   - Verify automatic discount in Shopify admin

2. **Test Fallback**:
   - Remove API token temporarily
   - Create discount
   - Verify discount code created

3. **Test Duplicate Prevention**:
   - Create discount
   - Try creating another immediately
   - Verify existing code returned

## 📚 API Reference

### POST /api/shopify/create-discount

Create a discount by redeeming wallet coins.

**Headers**:
```
Content-Type: application/json
x-shop-url: store.myshopify.com
```

**Body**:
```json
{
  "email": "customer@example.com",
  "coinsToRedeem": 100,
  "discountAmount": 100,
  "discountCode": "WALLET123456"
}
```

**Response**:
```json
{
  "success": true,
  "discountCode": "WALLET123456",
  "discountValue": 100,
  "newBalance": 900,
  "isAutomatic": true,
  "message": "Automatic discount ₹100 will apply at checkout!"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Insufficient balance",
  "available": 50
}
```

## 🔐 Security

- ✅ Email validation
- ✅ Balance verification before deduction
- ✅ Duplicate discount prevention
- ✅ Input sanitization
- ✅ Store URL normalization
- ✅ Transaction logging

## 📈 Performance

- Average discount creation: < 2 seconds
- Widget load time: < 1 second
- Cart total update: < 100ms
- Database queries: Indexed for fast lookups

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: See AUTOMATIC_DISCOUNT_DEPLOYMENT.md
- Issues: GitHub Issues
- Email: support@example.com

## 🎯 Roadmap

- [ ] Admin dashboard for discount management
- [ ] Bulk discount creation
- [ ] Discount analytics and reporting
- [ ] Email notifications for discount creation
- [ ] Webhook integration for automatic discount usage tracking
- [ ] Multi-currency support
- [ ] Percentage-based discounts
- [ ] Tiered discount rules

## 📝 Changelog

### v1.0.0 (2024-01-16)
- ✨ Initial release
- ✅ Automatic discount creation via GraphQL
- ✅ Customer lookup by email
- ✅ Fallback to discount codes
- ✅ Database tracking
- ✅ Widget integration
- ✅ Balance persistence
- ✅ Real-time cart updates
