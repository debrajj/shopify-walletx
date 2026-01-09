const db = require('../config/db');

class ShopifyCoinService {
  /**
   * Award coins to a customer (Shopify integration)
   */
  async awardCoins(shopUrl, customerId, coinAmount, orderId = null, description = 'Shopify reward') {
    try {
      // Find or create wallet for this customer
      const walletCheck = await db.query(
        'SELECT * FROM wallets WHERE customer_phone = $1 AND store_url = $2',
        [customerId, shopUrl]
      );

      let walletId;
      let newBalance;

      if (walletCheck.rows.length === 0) {
        // Create new wallet
        const result = await db.query(
          `INSERT INTO wallets (store_url, phone_hash, customer_name, customer_phone, balance)
           VALUES ($1, $2, 'Shopify Customer', $3, $4)
           RETURNING id, balance`,
          [shopUrl, customerId, customerId, coinAmount]
        );
        walletId = result.rows[0].id;
        newBalance = parseFloat(result.rows[0].balance);
      } else {
        // Update existing wallet
        const wallet = walletCheck.rows[0];
        walletId = wallet.id;
        newBalance = parseFloat(wallet.balance) + coinAmount;
        
        await db.query(
          'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, walletId]
        );
      }

      // Create transaction record
      await db.query(
        `INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status)
         VALUES ($1, $2, $3, $4, 'CREDIT', 'COMPLETED')`,
        [walletId, shopUrl, orderId || 'SHOPIFY_REWARD', coinAmount]
      );

      console.log(`[Shopify] Awarded ${coinAmount} coins to ${customerId} on ${shopUrl}`);
      
      return { success: true, newBalance, walletId };
    } catch (error) {
      console.error('[Shopify] Award coins error:', error);
      throw error;
    }
  }

  /**
   * Redeem coins for a Shopify order
   */
  async redeemCoins(shopUrl, customerId, coinAmount, orderId) {
    try {
      const walletCheck = await db.query(
        'SELECT * FROM wallets WHERE customer_phone = $1 AND store_url = $2',
        [customerId, shopUrl]
      );

      if (walletCheck.rows.length === 0) {
        return { success: false, error: 'Wallet not found' };
      }

      const wallet = walletCheck.rows[0];
      const currentBalance = parseFloat(wallet.balance);

      if (currentBalance < coinAmount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Deduct coins
      const newBalance = currentBalance - coinAmount;
      await db.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, wallet.id]
      );

      // Create transaction record
      await db.query(
        `INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status)
         VALUES ($1, $2, $3, $4, 'DEBIT', 'COMPLETED')`,
        [wallet.id, shopUrl, orderId, coinAmount]
      );

      console.log(`[Shopify] Redeemed ${coinAmount} coins from ${customerId} for order ${orderId}`);
      
      return { success: true, newBalance, remainingCoins: newBalance };
    } catch (error) {
      console.error('[Shopify] Redeem coins error:', error);
      throw error;
    }
  }

  /**
   * Get customer balance (Shopify)
   */
  async getBalance(shopUrl, customerId) {
    try {
      const result = await db.query(
        'SELECT balance FROM wallets WHERE customer_phone = $1 AND store_url = $2',
        [customerId, shopUrl]
      );

      if (result.rows.length === 0) {
        return { balance: 0, exists: false };
      }

      return {
        balance: parseFloat(result.rows[0].balance),
        exists: true
      };
    } catch (error) {
      console.error('[Shopify] Get balance error:', error);
      throw error;
    }
  }
}

module.exports = new ShopifyCoinService();
