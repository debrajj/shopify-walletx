import { pool } from '../../config/shopify.js';
import { logger } from '../../utils/logger.js';

export async function handleOrderPaid(shop, orderData) {
  try {
    const customerId = orderData.customer?.id?.toString();
    const orderId = orderData.id.toString();
    const orderTotal = parseFloat(orderData.total_price);
    
    if (!customerId) {
      logger.warn('Order has no customer', { shop, orderId });
      return;
    }
    
    // Get active purchase earning rules
    const rulesResult = await pool.query(
      `SELECT * FROM earning_rules 
       WHERE shop_id = $1 AND type = 'purchase' AND is_active = true
       ORDER BY coin_amount DESC
       LIMIT 1`,
      [shop]
    );
    
    if (rulesResult.rows.length === 0) {
      logger.info('No active purchase earning rules', { shop });
      return;
    }
    
    const rule = rulesResult.rows[0];
    
    // Get exchange rate
    const configResult = await pool.query(
      'SELECT exchange_rate FROM shop_configurations WHERE shop_id = $1',
      [shop]
    );
    
    const exchangeRate = configResult.rows[0].exchange_rate;
    
    // Calculate coins to award (based on order total)
    // For simplicity, award fixed amount per rule
    // In production, you might calculate based on order value
    const coinsToAward = rule.coin_amount;
    const monetaryValue = coinsToAward / exchangeRate;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create transaction record
      await client.query(
        `INSERT INTO coin_transactions 
         (customer_id, shop_id, type, coin_amount, monetary_value, exchange_rate, order_id, rule_id, description, status, processed_at)
         VALUES ($1, $2, 'earn', $3, $4, $5, $6, $7, $8, 'completed', NOW())`,
        [customerId, shop, coinsToAward, monetaryValue, exchangeRate, orderId, rule.id, `Purchase reward for order #${orderId}`]
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
        [customerId, shop, coinsToAward]
      );
      
      await client.query('COMMIT');
      
      logger.info('Purchase coins awarded', { shop, customerId, orderId, amount: coinsToAward });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Order paid handler error', { error: error.message, shop });
    throw error;
  }
}
