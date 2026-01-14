const db = require('../config/db');

class RewardService {
  /**
   * Award coins for a purchase
   */
  async awardPurchaseReward(shopUrl, customerEmail, orderTotal, orderId) {
    try {
      // Get reward settings
      const settings = await db.query(
        'SELECT * FROM app_settings WHERE store_url = $1',
        [shopUrl]
      );
      
      if (settings.rows.length === 0 || !settings.rows[0].enable_auto_rewards) {
        return { success: false, message: 'Auto rewards not enabled' };
      }
      
      const config = settings.rows[0];
      
      // Check minimum order value
      if (orderTotal < parseFloat(config.min_order_for_rewards || 0)) {
        return { success: false, message: 'Order below minimum for rewards' };
      }
      
      // Calculate coins to award
      const rewardRate = parseFloat(config.reward_per_dollar || 1);
      const coinsToAward = Math.floor(orderTotal * rewardRate);
      
      if (coinsToAward <= 0) {
        return { success: false, message: 'No coins to award' };
      }
      
      // Find or create wallet
      let wallet = await db.query(
        'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
        [customerEmail, shopUrl]
      );
      
      let walletId;
      if (wallet.rows.length === 0) {
        const newWallet = await db.query(
          `INSERT INTO wallets (store_url, phone_hash, customer_email, customer_name, balance)
           VALUES ($1, $2, $2, 'Customer', $3)
           RETURNING id`,
          [shopUrl, customerEmail, coinsToAward]
        );
        walletId = newWallet.rows[0].id;
      } else {
        walletId = wallet.rows[0].id;
        const newBalance = parseFloat(wallet.rows[0].balance) + coinsToAward;
        await db.query(
          'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, walletId]
        );
      }
      
      // Create transaction
      await db.query(
        `INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status, order_amount)
         VALUES ($1, $2, $3, $4, 'CREDIT', 'COMPLETED', $5)`,
        [walletId, shopUrl, orderId, coinsToAward, orderTotal]
      );
      
      // Queue notification
      await this.queueNotification(
        shopUrl,
        customerEmail,
        'REWARD_EARNED',
        'You earned coins!',
        `You've earned ${coinsToAward} coins from your recent purchase!`
      );
      
      console.log(`[Rewards] Awarded ${coinsToAward} coins to ${customerEmail} for order ${orderId}`);
      
      return { success: true, coinsAwarded: coinsToAward };
    } catch (error) {
      console.error('[Rewards] Error awarding purchase reward:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Award welcome bonus to new customer
   */
  async awardWelcomeBonus(shopUrl, customerEmail) {
    try {
      const settings = await db.query(
        'SELECT * FROM app_settings WHERE store_url = $1',
        [shopUrl]
      );
      
      if (settings.rows.length === 0 || !settings.rows[0].enable_welcome_bonus) {
        return { success: false, message: 'Welcome bonus not enabled' };
      }
      
      const welcomeBonus = parseInt(settings.rows[0].welcome_bonus || 0);
      
      if (welcomeBonus <= 0) {
        return { success: false, message: 'No welcome bonus configured' };
      }
      
      // Check if customer already has wallet (already got bonus)
      const existing = await db.query(
        'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
        [customerEmail, shopUrl]
      );
      
      if (existing.rows.length > 0) {
        return { success: false, message: 'Welcome bonus already given' };
      }
      
      // Create wallet with welcome bonus
      const result = await db.query(
        `INSERT INTO wallets (store_url, phone_hash, customer_email, customer_name, balance)
         VALUES ($1, $2, $2, 'Customer', $3)
         RETURNING id`,
        [shopUrl, customerEmail, welcomeBonus]
      );
      
      const walletId = result.rows[0].id;
      
      // Create transaction
      await db.query(
        `INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status)
         VALUES ($1, $2, 'WELCOME_BONUS', $3, 'CREDIT', 'COMPLETED')`,
        [walletId, shopUrl, welcomeBonus]
      );
      
      // Queue notification
      await this.queueNotification(
        shopUrl,
        customerEmail,
        'WELCOME_BONUS',
        'Welcome! Here are your bonus coins',
        `Welcome to our store! You've received ${welcomeBonus} bonus coins to get started.`
      );
      
      console.log(`[Rewards] Awarded ${welcomeBonus} welcome bonus to ${customerEmail}`);
      
      return { success: true, coinsAwarded: welcomeBonus };
    } catch (error) {
      console.error('[Rewards] Error awarding welcome bonus:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create referral code for customer
   */
  async createReferralCode(shopUrl, customerEmail) {
    try {
      // Check if customer already has a referral code
      const existing = await db.query(
        'SELECT referral_code FROM referrals WHERE store_url = $1 AND referrer_email = $2 LIMIT 1',
        [shopUrl, customerEmail]
      );
      
      if (existing.rows.length > 0) {
        return { success: true, referralCode: existing.rows[0].referral_code };
      }
      
      // Generate unique code
      const emailHash = customerEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referralCode = `${emailHash}${randomStr}`.toUpperCase();
      
      return { success: true, referralCode };
    } catch (error) {
      console.error('[Rewards] Error creating referral code:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Process referral when referred customer makes first purchase
   */
  async processReferral(shopUrl, referralCode, referredEmail) {
    try {
      const settings = await db.query(
        'SELECT * FROM app_settings WHERE store_url = $1',
        [shopUrl]
      );
      
      if (settings.rows.length === 0 || !settings.rows[0].enable_referrals) {
        return { success: false, message: 'Referrals not enabled' };
      }
      
      const referralReward = parseInt(settings.rows[0].referral_reward || 0);
      
      // Find referral record
      const referral = await db.query(
        'SELECT * FROM referrals WHERE referral_code = $1 AND store_url = $2',
        [referralCode, shopUrl]
      );
      
      if (referral.rows.length === 0) {
        return { success: false, message: 'Invalid referral code' };
      }
      
      const referralRecord = referral.rows[0];
      
      if (referralRecord.reward_given) {
        return { success: false, message: 'Referral reward already given' };
      }
      
      // Award coins to referrer
      const referrerWallet = await db.query(
        'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
        [referralRecord.referrer_email, shopUrl]
      );
      
      if (referrerWallet.rows.length > 0) {
        const wallet = referrerWallet.rows[0];
        const newBalance = parseFloat(wallet.balance) + referralReward;
        
        await db.query(
          'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, wallet.id]
        );
        
        await db.query(
          `INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status)
           VALUES ($1, $2, $3, $4, 'CREDIT', 'COMPLETED')`,
          [wallet.id, shopUrl, `REFERRAL_${referralCode}`, referralReward]
        );
        
        // Update referral status
        await db.query(
          `UPDATE referrals SET status = 'COMPLETED', reward_given = true, completed_at = NOW()
           WHERE id = $1`,
          [referralRecord.id]
        );
        
        // Notify referrer
        await this.queueNotification(
          shopUrl,
          referralRecord.referrer_email,
          'REFERRAL_SUCCESS',
          'Your referral earned you coins!',
          `Your friend ${referredEmail} made a purchase. You've earned ${referralReward} coins!`
        );
        
        console.log(`[Rewards] Referral reward of ${referralReward} coins given to ${referralRecord.referrer_email}`);
        
        return { success: true, coinsAwarded: referralReward };
      }
      
      return { success: false, message: 'Referrer wallet not found' };
    } catch (error) {
      console.error('[Rewards] Error processing referral:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update customer tier based on spending
   */
  async updateCustomerTier(shopUrl, customerEmail, orderTotal) {
    try {
      // Get or create tier record
      let tier = await db.query(
        'SELECT * FROM customer_tiers WHERE store_url = $1 AND customer_email = $2',
        [shopUrl, customerEmail]
      );
      
      let totalSpent = parseFloat(orderTotal);
      let totalOrders = 1;
      
      if (tier.rows.length > 0) {
        totalSpent += parseFloat(tier.rows[0].total_spent);
        totalOrders += parseInt(tier.rows[0].total_orders);
      }
      
      // Determine tier level
      let tierLevel = 'BRONZE';
      if (totalSpent >= 10000) tierLevel = 'PLATINUM';
      else if (totalSpent >= 5000) tierLevel = 'GOLD';
      else if (totalSpent >= 1000) tierLevel = 'SILVER';
      
      if (tier.rows.length === 0) {
        await db.query(
          `INSERT INTO customer_tiers (store_url, customer_email, tier_level, total_spent, total_orders)
           VALUES ($1, $2, $3, $4, $5)`,
          [shopUrl, customerEmail, tierLevel, totalSpent, totalOrders]
        );
      } else {
        const oldTier = tier.rows[0].tier_level;
        await db.query(
          `UPDATE customer_tiers 
           SET tier_level = $1, total_spent = $2, total_orders = $3, tier_updated_at = NOW()
           WHERE store_url = $4 AND customer_email = $5`,
          [tierLevel, totalSpent, totalOrders, shopUrl, customerEmail]
        );
        
        // Notify if tier upgraded
        if (tierLevel !== oldTier) {
          await this.queueNotification(
            shopUrl,
            customerEmail,
            'TIER_UPGRADE',
            `Congratulations! You've been upgraded to ${tierLevel}`,
            `You've reached ${tierLevel} tier! Enjoy enhanced rewards and benefits.`
          );
        }
      }
      
      return { success: true, tierLevel, totalSpent, totalOrders };
    } catch (error) {
      console.error('[Rewards] Error updating tier:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Queue notification for customer
   */
  async queueNotification(shopUrl, customerEmail, type, subject, message) {
    try {
      await db.query(
        `INSERT INTO notification_queue (store_url, customer_email, notification_type, subject, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [shopUrl, customerEmail, type, subject, message]
      );
      return { success: true };
    } catch (error) {
      console.error('[Rewards] Error queuing notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RewardService();
