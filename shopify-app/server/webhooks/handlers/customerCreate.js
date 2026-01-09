import { pool } from '../../config/shopify.js';
import { logger } from '../../utils/logger.js';

export async function handleCustomerCreate(shop, customerData) {
  try {
    const customerId = customerData.id.toString();
    
    // Get shop configuration for welcome bonus
    const configResult = await pool.query(
      'SELECT welcome_bonus, exchange_rate FROM shop_configurations WHERE shop_id = $1',
      [shop]
    );
    
    if (configResult.rows.length === 0) {
      logger.warn('Shop configuration not found', { shop });
      return;
    }
    
    const config = configResult.rows[0];
    const welcomeBonus = config.welcome_bonus;
    
    if (welcomeBonus <= 0) {
      logger.info('Welcome bonus disabled', { shop });
      return;
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create customer coin account with welcome bonus
      await client.query(
        `INSERT INTO customer_coin_accounts (customer_id, shopify_customer_id, shop_id, total_coins, lifetime_earned)
         VALUES ($1, $2, $3, $4, $4)
         ON CONFLICT (shopify_customer_id, shop_id) DO NOTHING`,
        [customerId, customerId, shop, welcomeBonus]
      );
      
      // Create transaction record for welcome bonus
      const monetaryValue = welcomeBonus / config.exchange_rate;
      await client.query(
        `INSERT INTO coin_transactions 
         (customer_id, shop_id, type, coin_amount, monetary_value, exchange_rate, description, status, processed_at)
         VALUES ($1, $2, 'earn', $3, $4, $5, 'Welcome bonus', 'completed', NOW())`,
        [customerId, shop, welcomeBonus, monetaryValue, config.exchange_rate]
      );
      
      await client.query('COMMIT');
      
      logger.info('Welcome bonus awarded', { shop, customerId, amount: welcomeBonus });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Customer create handler error', { error: error.message, shop });
    throw error;
  }
}
