import express from 'express';
import { pool } from '../config/shopify.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get shop configuration
router.get('/', async (req, res, next) => {
  try {
    const session = res.locals.shopify.session;
    
    const result = await pool.query(
      'SELECT * FROM shop_configurations WHERE shop_id = $1',
      [session.shop]
    );
    
    if (result.rows.length === 0) {
      // Create default configuration
      const defaultConfig = await pool.query(
        `INSERT INTO shop_configurations (shop_id, shop_domain, exchange_rate, currency, minimum_redemption, maximum_redemption, welcome_bonus)
         VALUES ($1, $2, 100.00, 'USD', 100, 10000, 500)
         RETURNING *`,
        [session.shop, session.shop]
      );
      return res.json(defaultConfig.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update shop configuration
router.put('/', async (req, res, next) => {
  try {
    const session = res.locals.shopify.session;
    const { exchangeRate, minimumRedemption, maximumRedemption, welcomeBonus, allowPartialPayment } = req.body;
    
    // Validation
    if (exchangeRate && exchangeRate <= 0) {
      throw new ValidationError('Exchange rate must be greater than 0');
    }
    if (minimumRedemption && minimumRedemption < 0) {
      throw new ValidationError('Minimum redemption cannot be negative');
    }
    if (maximumRedemption && maximumRedemption < minimumRedemption) {
      throw new ValidationError('Maximum redemption must be greater than minimum');
    }
    
    const result = await pool.query(
      `UPDATE shop_configurations 
       SET exchange_rate = COALESCE($1, exchange_rate),
           minimum_redemption = COALESCE($2, minimum_redemption),
           maximum_redemption = COALESCE($3, maximum_redemption),
           welcome_bonus = COALESCE($4, welcome_bonus),
           allow_partial_payment = COALESCE($5, allow_partial_payment),
           updated_at = NOW()
       WHERE shop_id = $6
       RETURNING *`,
      [exchangeRate, minimumRedemption, maximumRedemption, welcomeBonus, allowPartialPayment, session.shop]
    );
    
    logger.info('Shop configuration updated', { shop: session.shop });
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get earning rules
router.get('/rules', async (req, res, next) => {
  try {
    const session = res.locals.shopify.session;
    
    const result = await pool.query(
      'SELECT * FROM earning_rules WHERE shop_id = $1 ORDER BY created_at DESC',
      [session.shop]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create earning rule
router.post('/rules', async (req, res, next) => {
  try {
    const session = res.locals.shopify.session;
    const { type, name, description, coinAmount, conditions, isActive } = req.body;
    
    if (!type || !name || !coinAmount) {
      throw new ValidationError('Type, name, and coin amount are required');
    }
    
    const result = await pool.query(
      `INSERT INTO earning_rules (shop_id, type, name, description, coin_amount, conditions, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [session.shop, type, name, description, coinAmount, JSON.stringify(conditions || []), isActive !== false]
    );
    
    logger.info('Earning rule created', { shop: session.shop, ruleId: result.rows[0].id });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update earning rule
router.put('/rules/:ruleId', async (req, res, next) => {
  try {
    const session = res.locals.shopify.session;
    const { ruleId } = req.params;
    const { name, description, coinAmount, conditions, isActive } = req.body;
    
    const result = await pool.query(
      `UPDATE earning_rules 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           coin_amount = COALESCE($3, coin_amount),
           conditions = COALESCE($4, conditions),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6 AND shop_id = $7
       RETURNING *`,
      [name, description, coinAmount, JSON.stringify(conditions), isActive, ruleId, session.shop]
    );
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Earning rule not found');
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
