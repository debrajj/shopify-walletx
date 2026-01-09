import express from 'express';
import { pool } from '../config/shopify.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get customer coin balance
router.get('/balance/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const session = res.locals.shopify.session;
    
    const result = await pool.query(
      'SELECT * FROM customer_coin_accounts WHERE shopify_customer_id = $1 AND shop_id = $2',
      [customerId, session.shop]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Customer coin account not found');
    }
    
    const account = result.rows[0];
    
    // Get exchange rate
    const configResult = await pool.query(
      'SELECT exchange_rate, currency FROM shop_configurations WHERE shop_id = $1',
      [session.shop]
    );
    
    const config = configResult.rows[0];
    const monetaryValue = account.total_coins / config.exchange_rate;
    
    res.json({
      totalCoins: account.total_coins,
      monetaryValue: monetaryValue.toFixed(2),
      currency: config.currency,
      lifetimeEarned: account.lifetime_earned,
      lifetimeRedeemed: account.lifetime_redeemed,
      lastUpdated: account.updated_at
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction history
router.get('/transactions/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const session = res.locals.shopify.session;
    
    const result = await pool.query(
      `SELECT * FROM coin_transactions 
       WHERE customer_id = $1 AND shop_id = $2 
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [customerId, session.shop, limit, offset]
    );
    
    res.json({
      transactions: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    next(error);
  }
});

// Award coins (internal use)
router.post('/award', async (req, res, next) => {
  try {
    const { customerId, ruleId, orderId, description } = req.body;
    const session = res.locals.shopify.session;
    
    if (!customerId || !description) {
      throw new ValidationError('Customer ID and description are required');
    }
    
    // Get earning rule
    const ruleResult = await pool.query(
      'SELECT * FROM earning_rules WHERE id = $1 AND shop_id = $2 AND is_active = true',
      [ruleId, session.shop]
    );
    
    if (ruleResult.rows.length === 0) {
      throw new NotFoundError('Earning rule not found or inactive');
    }
    
    const rule = ruleResult.rows[0];
    
    // Get exchange rate
    const configResult = await pool.query(
      'SELECT exchange_rate FROM shop_configurations WHERE shop_id = $1',
      [session.shop]
    );
    const exchangeRate = configResult.rows[0].exchange_rate;
    const monetaryValue = rule.coin_amount / exchangeRate;
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create transaction record
      const transactionResult = await client.query(
        `INSERT INTO coin_transactions 
         (customer_id, shop_id, type, coin_amount, monetary_value, exchange_rate, order_id, rule_id, description, status, processed_at)
         VALUES ($1, $2, 'earn', $3, $4, $5, $6, $7, $8, 'completed', NOW())
         RETURNING *`,
        [customerId, session.shop, rule.coin_amount, monetaryValue, exchangeRate, orderId, ruleId, description]
      );
      
      // Update customer balance
      await client.query(
        `INSERT INTO customer_coin_accounts (customer_id, shopify_customer_id, shop_id, total_coins, lifetime_earned)
         VALUES ($1, $1, $2, $3, $3)
         ON CONFLICT (shopify_customer_id, shop_id) 
         DO UPDATE SET 
           total_coins = customer_coin_accounts.total_coins + $3,
           lifetime_earned = customer_coin_accounts.lifetime_earned + $3,
           updated_at = NOW()`,
        [customerId, session.shop, rule.coin_amount]
      );
      
      await client.query('COMMIT');
      
      logger.info('Coins awarded', { customerId, amount: rule.coin_amount, ruleId });
      
      res.json({
        success: true,
        transaction: transactionResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

export default router;
