import { pool } from '../config/shopify.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

/**
 * Coin Service - Core business logic for coin management
 */
export class CoinService {
  /**
   * Award coins to a customer
   */
  async awardCoins(shopId, customerId, ruleId, orderId = null, description = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get earning rule
      const ruleResult = await client.query(
        'SELECT * FROM earning_rules WHERE id = $1 AND shop_id = $2 AND is_active = true',
        [ruleId, shopId]
      );
      
      if (ruleResult.rows.length === 0) {
        throw new NotFoundError('Earning rule not found or inactive');
      }
      
      const rule = ruleResult.rows[0];
      
      // Get exchange rate
      const configResult = await client.query(
        'SELECT exchange_rate FROM shop_configurations WHERE shop_id = $1',
        [shopId]
      );
      
      if (configResult.rows.length === 0) {
        throw new NotFoundError('Shop configuration not found');
      }
      
      const exchangeRate = configResult.rows[0].exchange_rate;
      const monetaryValue = rule.coin_amount / exchangeRate;
      
      // Create transaction record
      const transactionResult = await client.query(
        `INSERT INTO coin_transactions 
         (customer_id, shop_id, type, coin_amount, monetary_value, exchange_rate, order_id, rule_id, description, status, processed_at)
         VALUES ($1, $2, 'earn', $3, $4, $5, $6, $7, $8, 'completed', NOW())
         RETURNING *`,
        [
          customerId,
          shopId,
          rule.coin_amount,
          monetaryValue,
          exchangeRate,
          orderId,
          ruleId,
          description || rule.description
        ]
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
        [customerId, shopId, rule.coin_amount]
      );
      
      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (shop_id, customer_id, action, entity_type, entity_id, new_value)
         VALUES ($1, $2, 'COINS_AWARDED', 'transaction', $3, $4)`,
        [shopId, customerId, transactionResult.rows[0].id, JSON.stringify({ coinAmount: rule.coin_amount })]
      );
      
      await client.query('COMMIT');
      
      logger.info('Coins awarded', { 
        shopId, 
        customerId, 
        amount: rule.coin_amount, 
        ruleId,
        transactionId: transactionResult.rows[0].id 
      });
      
      return transactionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Award coins error', { error: error.message, shopId, customerId });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Redeem coins from a customer
   */
  async redeemCoins(shopId, customerId, coinAmount, orderId, description = 'Coin redemption') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate redemption
      const validation = await this.validateRedemption(shopId, customerId, coinAmount);
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join(', '));
      }
      
      // Get exchange rate
      const configResult = await client.query(
        'SELECT exchange_rate FROM shop_configurations WHERE shop_id = $1',
        [shopId]
      );
      
      const exchangeRate = configResult.rows[0].exchange_rate;
      const monetaryValue = coinAmount / exchangeRate;
      
      // Create transaction record
      const transactionResult = await client.query(
        `INSERT INTO coin_transactions 
         (customer_id, shop_id, type, coin_amount, monetary_value, exchange_rate, order_id, description, status, processed_at)
         VALUES ($1, $2, 'redeem', $3, $4, $5, $6, $7, 'completed', NOW())
         RETURNING *`,
        [customerId, shopId, coinAmount, monetaryValue, exchangeRate, orderId, description]
      );
      
      // Update customer balance
      await client.query(
        `UPDATE customer_coin_accounts 
         SET total_coins = total_coins - $1,
             lifetime_redeemed = lifetime_redeemed + $1,
             updated_at = NOW()
         WHERE shopify_customer_id = $2 AND shop_id = $3`,
        [coinAmount, customerId, shopId]
      );
      
      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (shop_id, customer_id, action, entity_type, entity_id, new_value)
         VALUES ($1, $2, 'COINS_REDEEMED', 'transaction', $3, $4)`,
        [shopId, customerId, transactionResult.rows[0].id, JSON.stringify({ coinAmount })]
      );
      
      await client.query('COMMIT');
      
      logger.info('Coins redeemed', { 
        shopId, 
        customerId, 
        amount: coinAmount, 
        orderId,
        transactionId: transactionResult.rows[0].id 
      });
      
      return transactionResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Redeem coins error', { error: error.message, shopId, customerId });
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get customer coin balance
   */
  async getBalance(shopId, customerId) {
    try {
      const accountResult = await pool.query(
        'SELECT * FROM customer_coin_accounts WHERE shopify_customer_id = $1 AND shop_id = $2',
        [customerId, shopId]
      );
      
      if (accountResult.rows.length === 0) {
        // Create account with zero balance
        await pool.query(
          `INSERT INTO customer_coin_accounts (customer_id, shopify_customer_id, shop_id, total_coins, lifetime_earned)
           VALUES ($1, $1, $2, 0, 0)`,
          [customerId, shopId]
        );
        
        return {
          totalCoins: 0,
          monetaryValue: 0,
          currency: 'USD',
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
          lastUpdated: new Date()
        };
      }
      
      const account = accountResult.rows[0];
      
      // Get exchange rate and currency
      const configResult = await pool.query(
        'SELECT exchange_rate, currency FROM shop_configurations WHERE shop_id = $1',
        [shopId]
      );
      
      const config = configResult.rows[0] || { exchange_rate: 100, currency: 'USD' };
      const monetaryValue = account.total_coins / config.exchange_rate;
      
      return {
        totalCoins: account.total_coins,
        monetaryValue: parseFloat(monetaryValue.toFixed(2)),
        currency: config.currency,
        lifetimeEarned: account.lifetime_earned,
        lifetimeRedeemed: account.lifetime_redeemed,
        lastUpdated: account.updated_at
      };
    } catch (error) {
      logger.error('Get balance error', { error: error.message, shopId, customerId });
      throw error;
    }
  }
  
  /**
   * Get transaction history
   */
  async getTransactionHistory(shopId, customerId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM coin_transactions 
         WHERE customer_id = $1 AND shop_id = $2 
         ORDER BY created_at DESC 
         LIMIT $3 OFFSET $4`,
        [customerId, shopId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Get transaction history error', { error: error.message, shopId, customerId });
      throw error;
    }
  }
  
  /**
   * Validate coin redemption
   */
  async validateRedemption(shopId, customerId, coinAmount) {
    const errors = [];
    
    try {
      // Check customer balance
      const balance = await this.getBalance(shopId, customerId);
      
      if (balance.totalCoins < coinAmount) {
        errors.push('Insufficient coin balance');
      }
      
      // Check shop configuration limits
      const configResult = await pool.query(
        'SELECT minimum_redemption, maximum_redemption FROM shop_configurations WHERE shop_id = $1',
        [shopId]
      );
      
      if (configResult.rows.length > 0) {
        const config = configResult.rows[0];
        
        if (coinAmount < config.minimum_redemption) {
          errors.push(`Minimum redemption is ${config.minimum_redemption} coins`);
        }
        
        if (coinAmount > config.maximum_redemption) {
          errors.push(`Maximum redemption is ${config.maximum_redemption} coins`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Validate redemption error', { error: error.message, shopId, customerId });
      return {
        isValid: false,
        errors: ['Validation failed']
      };
    }
  }
  
  /**
   * Refund coins (reverse a redemption)
   */
  async refundCoins(shopId, transactionId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get original transaction
      const transactionResult = await client.query(
        'SELECT * FROM coin_transactions WHERE id = $1 AND shop_id = $2 AND type = \'redeem\'',
        [transactionId, shopId]
      );
      
      if (transactionResult.rows.length === 0) {
        throw new NotFoundError('Redemption transaction not found');
      }
      
      const transaction = transactionResult.rows[0];
      
      if (transaction.status === 'refunded') {
        throw new ValidationError('Transaction already refunded');
      }
      
      // Update transaction status
      await client.query(
        'UPDATE coin_transactions SET status = \'refunded\' WHERE id = $1',
        [transactionId]
      );
      
      // Restore customer balance
      await client.query(
        `UPDATE customer_coin_accounts 
         SET total_coins = total_coins + $1,
             lifetime_redeemed = lifetime_redeemed - $1,
          
             updated_at = NOW()
         WHERE shopify_customer_id = $2 AND shop_id = $3`,
        [transaction.coin_amount, transaction.customer_id, shopId]
      );
      
      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (shop_id, customer_id, action, entity_type, entity_id, old_value, new_value)
         VALUES ($1, $2, 'COINS_REFUNDED', 'transaction', $3, $4, $5)`,
        [
          shopId,
          transaction.customer_id,
          transactionId,
          JSON.stringify({ status: 'completed' }),
          JSON.stringify({ status: 'refunded' })
        ]
      );
      
      await client.query('COMMIT');
      
      logger.info('Coins refunded', { 
        shopId, 
        transactionId,
        customerId: transaction.customer_id,
        amount: transaction.coin_amount
      });
      
      return { success: true, refundId: transactionId };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Refund coins error', { error: error.message, shopId, transactionId });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const coinService = new CoinService();
