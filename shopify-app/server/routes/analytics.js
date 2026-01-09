import express from 'express';
import { pool } from '../config/shopify.js';

const router = express.Router();

// Get analytics overview
router.get('/overview', async (req, res, next) => {
  try {
    const session = res.locals.shopify.session;
    const { startDate, endDate } = req.query;
    
    // Total coins earned and redeemed
    const totalsResult = await pool.query(
      `SELECT 
         SUM(CASE WHEN type = 'earn' THEN coin_amount ELSE 0 END) as total_earned,
         SUM(CASE WHEN type = 'redeem' THEN coin_amount ELSE 0 END) as total_redeemed,
         COUNT(DISTINCT customer_id) as active_customers
       FROM coin_transactions
       WHERE shop_id = $1
       ${startDate ? 'AND created_at >= $2' : ''}
       ${endDate ? 'AND created_at <= $3' : ''}`,
      [session.shop, startDate, endDate].filter(Boolean)
    );
    
    // Transaction count by type
    const transactionCountResult = await pool.query(
      `SELECT type, COUNT(*) as count
       FROM coin_transactions
       WHERE shop_id = $1
       ${startDate ? 'AND created_at >= $2' : ''}
       ${endDate ? 'AND created_at <= $3' : ''}
       GROUP BY type`,
      [session.shop, startDate, endDate].filter(Boolean)
    );
    
    // Top customers by coin balance
    const topCustomersResult = await pool.query(
      `SELECT customer_id, shopify_customer_id, total_coins, lifetime_earned, lifetime_redeemed
       FROM customer_coin_accounts
       WHERE shop_id = $1
       ORDER BY total_coins DESC
       LIMIT 10`,
      [session.shop]
    );
    
    res.json({
      totals: totalsResult.rows[0],
      transactionCounts: transactionCountResult.rows,
      topCustomers: topCustomersResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction trends
router.get('/trends', async (req, res, next) => {
  try {
    const session = res.locals.shopify.session;
    const { period = 'day', limit = 30 } = req.query;
    
    const periodFormat = {
      hour: 'YYYY-MM-DD HH24:00:00',
      day: 'YYYY-MM-DD',
      week: 'IYYY-IW',
      month: 'YYYY-MM'
    }[period] || 'YYYY-MM-DD';
    
    const result = await pool.query(
      `SELECT 
         TO_CHAR(created_at, $1) as period,
         type,
         SUM(coin_amount) as total_coins,
         COUNT(*) as transaction_count
       FROM coin_transactions
       WHERE shop_id = $2
       GROUP BY period, type
       ORDER BY period DESC
       LIMIT $3`,
      [periodFormat, session.shop, limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
