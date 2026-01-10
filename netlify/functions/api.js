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

// Export as serverless function
module.exports.handler = serverless(app);
