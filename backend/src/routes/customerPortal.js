const express = require('express');
const router = express.Router();
const db = require('../config/db');
const rewardService = require('../services/rewardService');

// Middleware to get shop from header
const requireShop = (req, res, next) => {
  const shopUrl = req.headers['x-shop-url'] || req.query.shop;
  if (!shopUrl) {
    return res.status(400).json({ error: 'Missing shop URL' });
  }
  req.shopUrl = shopUrl.replace(/^https?:\/\//, '');
  next();
};

// Get customer wallet info
router.get('/wallet/:email', requireShop, async (req, res) => {
  try {
    const { email } = req.params;
    const { shopUrl } = req;
    
    // Get wallet
    const wallet = await db.query(
      'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
      [email, shopUrl]
    );
    
    if (wallet.rows.length === 0) {
      return res.json({
        success: true,
        balance: 0,
        tier: 'BRONZE',
        transactions: [],
        referralCode: null
      });
    }
    
    const walletData = wallet.rows[0];
    
    // Get tier info
    const tier = await db.query(
      'SELECT * FROM customer_tiers WHERE customer_email = $1 AND store_url = $2',
      [email, shopUrl]
    );
    
    // Get recent transactions
    const transactions = await db.query(
      `SELECT id::text, order_id, coins, type, status, created_at
       FROM transactions
       WHERE wallet_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [walletData.id]
    );
    
    // Get or create referral code
    const referralResult = await rewardService.createReferralCode(shopUrl, email);
    
    res.json({
      success: true,
      balance: parseFloat(walletData.balance),
      tier: tier.rows[0]?.tier_level || 'BRONZE',
      totalSpent: parseFloat(tier.rows[0]?.total_spent || 0),
      totalOrders: parseInt(tier.rows[0]?.total_orders || 0),
      transactions: transactions.rows,
      referralCode: referralResult.referralCode
    });
  } catch (error) {
    console.error('[Portal] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reward settings (public)
router.get('/rewards/info', requireShop, async (req, res) => {
  try {
    const { shopUrl } = req;
    
    const settings = await db.query(
      'SELECT * FROM app_settings WHERE store_url = $1',
      [shopUrl]
    );
    
    if (settings.rows.length === 0) {
      return res.json({
        success: true,
        rewardPerDollar: 1,
        welcomeBonus: 500,
        referralReward: 100,
        tiers: []
      });
    }
    
    const s = settings.rows[0];
    
    res.json({
      success: true,
      rewardPerDollar: parseFloat(s.reward_per_dollar || 1),
      welcomeBonus: parseInt(s.welcome_bonus || 500),
      referralReward: parseInt(s.referral_reward || 100),
      reviewReward: parseInt(s.review_reward || 50),
      birthdayReward: parseInt(s.birthday_reward || 100),
      tiers: [
        { name: 'BRONZE', minSpend: 0, multiplier: 1 },
        { name: 'SILVER', minSpend: 1000, multiplier: 1.25 },
        { name: 'GOLD', minSpend: 5000, multiplier: 1.5 },
        { name: 'PLATINUM', minSpend: 10000, multiplier: 2 }
      ]
    });
  } catch (error) {
    console.error('[Portal] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register referral
router.post('/referral/register', requireShop, async (req, res) => {
  try {
    const { referralCode, referredEmail } = req.body;
    const { shopUrl } = req;
    
    if (!referralCode || !referredEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find referrer
    const referrer = await db.query(
      'SELECT referrer_email FROM referrals WHERE referral_code = $1 AND store_url = $2',
      [referralCode, shopUrl]
    );
    
    if (referrer.rows.length === 0) {
      // Create referral record
      await db.query(
        `INSERT INTO referrals (store_url, referrer_email, referred_email, referral_code, status)
         VALUES ($1, (SELECT customer_email FROM wallets WHERE store_url = $1 LIMIT 1), $2, $3, 'PENDING')`,
        [shopUrl, referredEmail, referralCode]
      );
    } else {
      // Update existing
      await db.query(
        `INSERT INTO referrals (store_url, referrer_email, referred_email, referral_code, status)
         VALUES ($1, $2, $3, $4, 'PENDING')
         ON CONFLICT DO NOTHING`,
        [shopUrl, referrer.rows[0].referrer_email, referredEmail, referralCode]
      );
    }
    
    res.json({ success: true, message: 'Referral registered' });
  } catch (error) {
    console.error('[Portal] Referral error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
