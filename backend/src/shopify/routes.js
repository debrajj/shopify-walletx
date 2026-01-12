const express = require('express');
const router = express.Router();
const coinService = require('./coinService');
const db = require('../config/db');
// Shopify config disabled - not needed for basic discount creation
// const { shopify } = require('./shopifyConfig');

// Middleware to extract shop URL from Shopify session
const requireShopifyAuth = (req, res, next) => {
  const shopUrl = req.headers['x-shop-url'] || req.query.shop;
  
  if (!shopUrl) {
    return res.status(400).json({ error: 'Missing shop URL' });
  }
  
  req.shopUrl = shopUrl;
  next();
};

// Get customer coin balance (for Shopify storefront)
router.get('/balance/:customerId', requireShopifyAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { shopUrl } = req;
    
    const result = await coinService.getBalance(shopUrl, customerId);
    
    res.json({
      success: true,
      customerId,
      balance: result.balance,
      currency: 'coins'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Award coins (webhook or admin action)
router.post('/award', requireShopifyAuth, async (req, res) => {
  try {
    const { customerId, coinAmount, orderId, description } = req.body;
    const { shopUrl } = req;
    
    if (!customerId || !coinAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await coinService.awardCoins(
      shopUrl,
      customerId,
      parseFloat(coinAmount),
      orderId,
      description
    );
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to award coins' });
  }
});

// Redeem coins (during checkout)
router.post('/redeem', requireShopifyAuth, async (req, res) => {
  try {
    const { customerId, coinAmount, orderId } = req.body;
    const { shopUrl } = req;
    
    if (!customerId || !coinAmount || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await coinService.redeemCoins(
      shopUrl,
      customerId,
      parseFloat(coinAmount),
      orderId
    );
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to redeem coins' });
  }
});

// Get transaction history for a customer
router.get('/transactions/:customerId', requireShopifyAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { shopUrl } = req;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await db.query(
      `SELECT t.id::text, t.order_id, t.coins, t.type, t.status, t.created_at
       FROM transactions t
       JOIN wallets w ON t.wallet_id = w.id
       WHERE w.customer_phone = $1 AND t.store_url = $2
       ORDER BY t.created_at DESC
       LIMIT $3`,
      [customerId, shopUrl, limit]
    );
    
    res.json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Create discount code for coin redemption
router.post('/create-discount', requireShopifyAuth, async (req, res) => {
  try {
    const { email, coinsToRedeem, discountAmount } = req.body;
    const { shopUrl } = req;
    
    if (!email || !coinsToRedeem) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }
    
    // Check if customer has enough coins
    const walletCheck = await db.query(
      'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
      [email, shopUrl]
    );
    
    if (walletCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Wallet not found'
      });
    }
    
    const wallet = walletCheck.rows[0];
    const currentBalance = parseFloat(wallet.balance);
    
    if (currentBalance < coinsToRedeem) {
      return res.status(400).json({ 
        success: false,
        error: 'Insufficient balance',
        available: currentBalance
      });
    }
    
    // Create discount code
    const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const discountCode = `WALLET-${emailHash}-${timestamp}`.substring(0, 25).toUpperCase();
    
    // Note: Actual Shopify discount creation would require Shopify Admin API
    // For now, we just create the code and store it in database
    // The merchant needs to manually create this discount code in Shopify admin
    // OR we need Shopify app OAuth which requires more setup
    
    console.log(`[Wallet] Discount code generated: ${discountCode} for ${coinsToRedeem} coins ($${discountAmount})`);
    
    // Store pending redemption in database
    try {
      await db.query(
        `INSERT INTO pending_redemptions (store_url, phone, discount_code, coins, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
         ON CONFLICT (discount_code) DO UPDATE SET expires_at = NOW() + INTERVAL '24 hours'`,
        [shopUrl, email, discountCode, coinsToRedeem]
      );
    } catch (dbError) {
      console.error('[Wallet] Database error:', dbError);
      // Continue anyway - discount code is still valid
    }
    
    res.json({
      success: true,
      discountCode,
      discountValue: discountAmount,
      message: `Discount code created for ${coinsToRedeem} coins`
    });
    
  } catch (error) {
    console.error('[Wallet] Create discount error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create discount code' 
    });
  }
});
    });
  } catch (error) {
    console.error('[Shopify] Create discount error:', error);
    res.status(500).json({ error: 'Failed to create discount' });
  }
});

// Shopify webhook: Customer created
router.post('/webhooks/customers/create', async (req, res) => {
  try {
    const shopUrl = req.headers['x-shopify-shop-domain'];
    const customer = req.body;
    
    if (!shopUrl || !customer.id) {
      return res.status(200).send('OK');
    }
    
    // Award welcome bonus
    const welcomeBonus = 500; // Configure this per shop
    
    await coinService.awardCoins(
      shopUrl,
      customer.id.toString(),
      welcomeBonus,
      null,
      'Welcome bonus'
    );
    
    console.log(`[Shopify] Welcome bonus awarded to customer ${customer.id}`);
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Shopify] Webhook error:', error);
    res.status(200).send('OK'); // Always return 200 to Shopify
  }
});

// Shopify webhook: Order paid
router.post('/webhooks/orders/paid', async (req, res) => {
  try {
    const shopUrl = req.headers['x-shopify-shop-domain'];
    const order = req.body;
    
    if (!shopUrl || !order.id || !order.customer) {
      return res.status(200).send('OK');
    }
    
    // Award purchase coins (e.g., 1% of order value)
    const orderTotal = parseFloat(order.total_price);
    const coinsToAward = Math.floor(orderTotal); // 1 coin per dollar
    
    if (coinsToAward > 0) {
      await coinService.awardCoins(
        shopUrl,
        order.customer.id.toString(),
        coinsToAward,
        order.id.toString(),
        `Purchase reward for order #${order.order_number}`
      );
      
      console.log(`[Shopify] Purchase reward of ${coinsToAward} coins for order ${order.id}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Shopify] Webhook error:', error);
    res.status(200).send('OK');
  }
});

module.exports = router;
