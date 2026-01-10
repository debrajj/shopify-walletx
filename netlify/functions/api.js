const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const db = {
  query: (text, params) => pool.query(text, params)
};

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
const DEFAULT_OTP_EXPIRY_SECONDS = parseInt(process.env.DEFAULT_OTP_EXPIRY_SECONDS || '120');

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(bodyParser.json());

// Middleware: Tenant Resolver
const requireStorefrontAuth = async (req, res, next) => {
  const shopUrl = req.headers['x-shop-url'] || req.query.shop;
  if (!shopUrl) {
    return res.status(400).json({ error: 'Missing x-shop-url header or shop query param' });
  }
  try {
    const result = await db.query('SELECT store_url FROM users WHERE store_url = $1', [shopUrl]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not registered' });
    }
    req.shopUrl = shopUrl;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tenant validation error' });
  }
};

const requireAdminAuth = async (req, res, next) => {
  const shopUrl = req.headers['x-shop-url'];
  if (shopUrl) {
    req.shopUrl = shopUrl;
    return next();
  }
  const result = await db.query('SELECT store_url FROM users LIMIT 1');
  if (result.rows.length > 0) {
    req.shopUrl = result.rows[0].store_url;
    next();
  } else {
    res.status(401).json({ error: 'No active store found' });
  }
};

// AUTH ROUTES
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storeName: user.store_name,
        storeUrl: user.store_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password, storeName, storeUrl, shopifyAccessToken, shopifyApiKey } = req.body;
    if (!storeUrl || !shopifyAccessToken) {
      return res.status(400).json({ error: 'Shopify Store URL and Access Token are required' });
    }
    const check = await db.query('SELECT * FROM users WHERE email = $1 OR store_url = $2', [email, storeUrl]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'User or Store URL already registered' });
    }
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    const result = await db.query(`
      INSERT INTO users (name, email, password_hash, store_name, store_url, shopify_access_token, shopify_api_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id::text, name, email, store_name, store_url
    `, [name, email, hash, storeName, storeUrl, shopifyAccessToken, shopifyApiKey]);
    await db.query('INSERT INTO app_settings (store_url, is_wallet_enabled) VALUES ($1, true)', [storeUrl]);
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing signup' });
  }
});

// STATS
app.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const walletCount = await db.query('SELECT COUNT(*) FROM wallets WHERE store_url = $1', [shopUrl]);
    const coinsSum = await db.query('SELECT SUM(balance) FROM wallets WHERE store_url = $1', [shopUrl]);
    const todayTxns = await db.query("SELECT COUNT(*) FROM transactions WHERE store_url = $1 AND created_at >= NOW() - INTERVAL '24 HOURS'", [shopUrl]);
    res.json({
      totalWallets: parseInt(walletCount.rows[0]?.count || 0),
      totalCoinsInCirculation: parseFloat(coinsSum.rows[0]?.sum || 0),
      totalTransactionsToday: parseInt(todayTxns.rows[0]?.count || 0),
      otpSuccessRate: 98.5
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// REVENUE
app.get('/revenue', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const result = await db.query(`
      SELECT TO_CHAR(created_at, 'Dy') as name, SUM(coins) as value
      FROM transactions 
      WHERE store_url = $1 AND type = 'DEBIT' AND created_at >= NOW() - INTERVAL '7 DAYS'
      GROUP BY TO_CHAR(created_at, 'Dy'), DATE(created_at)
      ORDER BY DATE(created_at)
    `, [shopUrl]);
    res.json(result.rows.length > 0 ? result.rows : []);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SETTINGS
app.get('/settings', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const result = await db.query('SELECT * FROM app_settings WHERE store_url = $1', [shopUrl]);
    if (result.rows.length === 0) {
      await db.query('INSERT INTO app_settings (store_url, is_wallet_enabled) VALUES ($1, true)', [shopUrl]);
      return res.json({ isWalletEnabled: true, useCustomApi: false });
    }
    const row = result.rows[0];
    res.json({
      isWalletEnabled: row.is_wallet_enabled,
      isOtpEnabled: row.is_otp_enabled,
      otpExpirySeconds: row.otp_expiry_seconds,
      maxWalletUsagePercent: row.max_wallet_usage_percent,
      smsProvider: row.sms_provider,
      smsApiKey: row.sms_api_key,
      useCustomApi: row.use_custom_api,
      customApiConfig: {
        walletBalanceUrl: row.custom_api_wallet_balance_url,
        authHeaderKey: row.custom_api_auth_header_key,
        authHeaderValue: row.custom_api_auth_header_value
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Export as serverless function
module.exports.handler = serverless(app);
