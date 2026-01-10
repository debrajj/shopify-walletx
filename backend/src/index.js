const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const path = require('path');

// Load .env from the project root (two levels up from this file)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Shopify integration
const shopifyRoutes = require('./shopify/routes');

const app = express();
const PORT = process.env.PORT || 3000;
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
const DEFAULT_OTP_EXPIRY_SECONDS = parseInt(process.env.DEFAULT_OTP_EXPIRY_SECONDS || '120');

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: process.env.CORS_CREDENTIALS === 'true',
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// --- DATABASE INIT (SaaS Schema) ---
const initDb = async () => {
  try {
    console.log("Initializing database schema for SaaS...");

    // 1. Users Table (The Tenant/Merchant)
    // Added shopify credentials columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        store_name VARCHAR(255),
        store_url VARCHAR(255) UNIQUE NOT NULL,
        shopify_access_token VARCHAR(255),
        shopify_api_key VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. App Settings Table
    // Now linked to store_url instead of being a singleton
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        store_url VARCHAR(255) REFERENCES users(store_url) ON DELETE CASCADE,
        is_wallet_enabled BOOLEAN DEFAULT true,
        is_otp_enabled BOOLEAN DEFAULT true,
        otp_expiry_seconds INTEGER DEFAULT 300,
        max_wallet_usage_percent INTEGER DEFAULT 20,
        sms_provider VARCHAR(50) DEFAULT 'TWILIO',
        sms_api_key VARCHAR(255) DEFAULT '',
        use_custom_api BOOLEAN DEFAULT false,
        custom_api_wallet_balance_url VARCHAR(255) DEFAULT '',
        custom_api_auth_header_key VARCHAR(100) DEFAULT '',
        custom_api_auth_header_value VARCHAR(255) DEFAULT '',
        UNIQUE(store_url)
      );
    `);

    // 3. Wallets Table
    // Added store_url for data isolation
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        store_url VARCHAR(255) NOT NULL,
        phone_hash VARCHAR(255),
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_url, phone_hash)
      );
    `);

    // 4. Transactions Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id),
        store_url VARCHAR(255) NOT NULL,
        order_id VARCHAR(255),
        coins DECIMAL(10, 2) NOT NULL,
        type VARCHAR(20),
        status VARCHAR(20) DEFAULT 'COMPLETED',
        order_amount DECIMAL(10, 2),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Automation Jobs Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS automation_jobs (
        id SERIAL PRIMARY KEY,
        store_url VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        condition_type VARCHAR(50) NOT NULL,
        condition_value INTEGER NOT NULL,
        action_channel VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        last_run TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Automation Logs Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id SERIAL PRIMARY KEY,
        store_url VARCHAR(255) NOT NULL,
        job_id INTEGER, 
        channel VARCHAR(20),
        status VARCHAR(20),
        converted BOOLEAN DEFAULT false,
        revenue DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. OTP Sessions Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS otp_sessions (
        id VARCHAR(50) PRIMARY KEY,
        store_url VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        otp VARCHAR(10),
        expires_at TIMESTAMP,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Shopify Session Storage Table (for OAuth)
    await db.query(`
      CREATE TABLE IF NOT EXISTS shopify_sessions (
        id VARCHAR(255) PRIMARY KEY,
        shop VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        isOnline BOOLEAN NOT NULL DEFAULT FALSE,
        scope VARCHAR(1024),
        expires TIMESTAMP,
        accessToken VARCHAR(255),
        onlineAccessInfo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Database initialized for Multi-Tenancy.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
};

initDb();

// --- MIDDLEWARE: TENANT RESOLVER ---

// For Public/Storefront APIs: Relies on 'x-shop-url' header
const requireStorefrontAuth = async (req, res, next) => {
  const shopUrl = req.headers['x-shop-url'] || req.query.shop;

  if (!shopUrl) {
    return res.status(400).json({ error: 'Missing x-shop-url header or shop query param' });
  }

  try {
    const result = await db.query('SELECT store_url FROM users WHERE store_url = $1', [shopUrl]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not registered with ShopWallet' });
    }
    req.shopUrl = shopUrl; // Attach tenant to request
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Tenant validation error' });
  }
};

// For Admin APIs: In a real app, verify JWT. Here we assume the client sends the storeUrl in headers or we extract from login context
// For this demo, we will check a custom header 'x-admin-store-url' which the frontend should send, 
// OR simpler for this stage: We'll extract it from the user session lookup if provided.
// To keep it simple and working with the current frontend:
const requireAdminAuth = async (req, res, next) => {
  // In production, decode JWT from 'Authorization' header to get user.store_url
  // For now, we'll assume the client is valid or pass a header. 
  // Let's rely on the frontend sending the store url for admin actions if needed,
  // OR strictly for this demo: use a default or find the user from the Login endpoint response logic.
  
  // NOTE: In a real implementation, `req.user` comes from JWT middleware.
  // We will assume for the "Admin UI" endpoints (not public API) that we handle tenancy 
  // by looking up the single user (if local) or expecting a header.
  
  // For the sake of the requested changes "all data stored against that client",
  // we will default to the FIRST user found if no header is present (Legacy/Dev mode),
  // OR strictly require the header.
  
  const shopUrl = req.headers['x-shop-url']; 
  if (shopUrl) {
      req.shopUrl = shopUrl;
      return next();
  }
  
  // Fallback for dev environment without auth headers implemented fully in frontend yet
  // We just grab the first user to simulate "Logged In" state
  const result = await db.query('SELECT store_url FROM users LIMIT 1');
  if (result.rows.length > 0) {
      req.shopUrl = result.rows[0].store_url;
      next();
  } else {
      res.status(401).json({ error: 'No active store found' });
  }
};


// --- AUTH ROUTES ---

app.post('/api/auth/login', async (req, res) => {
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
        storeUrl: user.store_url // IMPORTANT: Frontend needs this for headers
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, storeName, storeUrl, shopifyAccessToken, shopifyApiKey } = req.body;

    // Validate Input
    if (!storeUrl || !shopifyAccessToken) {
        return res.status(400).json({ error: 'Shopify Store URL and Access Token are required' });
    }

    // Check if user/store exists
    const check = await db.query('SELECT * FROM users WHERE email = $1 OR store_url = $2', [email, storeUrl]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'User or Store URL already registered' });
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);

    // Create Tenant
    const result = await db.query(`
      INSERT INTO users (name, email, password_hash, store_name, store_url, shopify_access_token, shopify_api_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id::text, name, email, store_name, store_url
    `, [name, email, hash, storeName, storeUrl, shopifyAccessToken, shopifyApiKey]);

    // Create Default Settings for Tenant
    await db.query(`
      INSERT INTO app_settings (store_url, is_wallet_enabled) VALUES ($1, true)
    `, [storeUrl]);

    res.status(201).json({
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing signup' });
  }
});

// --- PUBLIC / STOREFRONT APIS (REQUIRE x-shop-url) ---

// 1. Get Wallet Balance
app.get('/api/wallet/balance', requireStorefrontAuth, async (req, res) => {
  try {
    const { phone } = req.query;
    const shopUrl = req.shopUrl; // From Middleware

    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Get settings for THIS store
    const settingsRes = await db.query('SELECT * FROM app_settings WHERE store_url = $1', [shopUrl]);
    const settings = settingsRes.rows[0];

    // Defaults if settings missing (shouldn't happen due to signup flow)
    if (!settings) return res.status(404).json({ error: 'Store settings not found' });

    let balance = 0;
    let currency = "INR";
    let externalSyncSuccess = false;

    // External Sync Logic
    if (settings.use_custom_api && settings.custom_api_wallet_balance_url) {
       try {
         const urlObj = new URL(settings.custom_api_wallet_balance_url);
         urlObj.searchParams.append('phone', phone);
         urlObj.searchParams.append('shop', shopUrl);
         
         const headers = { 'Content-Type': 'application/json' };
         if (settings.custom_api_auth_header_key) {
           headers[settings.custom_api_auth_header_key] = settings.custom_api_auth_header_value;
         }
         
         const apiRes = await fetch(urlObj.toString(), { headers });
         if (apiRes.ok) {
           const apiData = await apiRes.json();
           if (apiData.success) {
              balance = parseFloat(apiData.walletCoins || 0);
              currency = apiData.currency || currency;
              externalSyncSuccess = true;
           }
         }
       } catch (e) {
         console.error(`[${shopUrl}] Custom API Sync Failed:`, e);
       }
    }

    // Local DB Logic (Scoped by store_url)
    const walletCheck = await db.query('SELECT * FROM wallets WHERE customer_phone = $1 AND store_url = $2', [phone, shopUrl]);
    
    if (walletCheck.rows.length > 0) {
       if (externalSyncSuccess) {
          await db.query('UPDATE wallets SET balance = $1, updated_at = NOW() WHERE customer_phone = $2 AND store_url = $3', [balance, phone, shopUrl]);
       } else {
          balance = parseFloat(walletCheck.rows[0].balance);
       }
    } else {
       // Create new wallet for this store
       await db.query(`
         INSERT INTO wallets (store_url, phone_hash, customer_name, customer_phone, balance)
         VALUES ($1, $2, 'Guest', $3, $4)
       `, [shopUrl, phone, phone, balance]);
    }

    res.json({
      success: true,
      walletCoins: balance,
      currency: currency
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', success: false });
  }
});

// 2. Send OTP
app.post('/api/otp/send', requireStorefrontAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    const shopUrl = req.shopUrl;

    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = `OTP_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const expiresAt = new Date(Date.now() + DEFAULT_OTP_EXPIRY_SECONDS * 1000);

    // Scoped by store_url
    await db.query(`
      INSERT INTO otp_sessions (id, store_url, phone, otp, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [sessionId, shopUrl, phone, otp, expiresAt]);

    console.log(`[${shopUrl}] OTP for ${phone}: ${otp}`);

    res.json({ success: true, otpSessionId: sessionId, expiresIn: DEFAULT_OTP_EXPIRY_SECONDS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 3. Validate OTP
app.post('/api/otp/validate', requireStorefrontAuth, async (req, res) => {
  try {
    const { otpSessionId, otp } = req.body;
    const shopUrl = req.shopUrl;
    
    const result = await db.query(`
      SELECT * FROM otp_sessions 
      WHERE id = $1 AND otp = $2 AND store_url = $3 AND is_used = FALSE AND expires_at > NOW()
    `, [otpSessionId, otp, shopUrl]);

    if (result.rows.length > 0) {
      await db.query('UPDATE otp_sessions SET is_used = TRUE WHERE id = $1', [otpSessionId]);
      res.json({ success: true, verified: true });
    } else {
      res.json({ success: false, message: "Invalid or expired OTP" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 4. Apply Discount (Storefront/Public)
app.post('/api/wallet/apply-discount', requireStorefrontAuth, async (req, res) => {
  const { discount_code } = req.body;
  // In a real app, validate logic against req.shopUrl settings
  const code = discount_code?.code || `WALLET-DISCOUNT`;
  
  res.json({
    success: true,
    discountCode: code
  });
});

// 5. Deduct Coins (Storefront/Public)
app.post('/api/wallet/deduct', requireStorefrontAuth, async (req, res) => {
  try {
    const { phone, orderId, coins } = req.body;
    const shopUrl = req.shopUrl;
    const amount = parseFloat(coins);

    const walletRes = await db.query('SELECT * FROM wallets WHERE customer_phone = $1 AND store_url = $2', [phone, shopUrl]);
    if (walletRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    const wallet = walletRes.rows[0];
    if (parseFloat(wallet.balance) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct
    const newBalance = parseFloat(wallet.balance) - amount;
    await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [newBalance, wallet.id]);

    // Log Transaction
    await db.query(`
      INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status)
      VALUES ($1, $2, $3, $4, 'DEBIT', 'COMPLETED')
    `, [wallet.id, shopUrl, orderId || 'MANUAL', amount]);

    res.json({
      success: true,
      remainingCoins: newBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 6. Credit Coins (Admin Only)
app.post('/api/wallet/credit', requireAdminAuth, async (req, res) => {
  try {
    const { phone, coins, description } = req.body;
    const shopUrl = req.shopUrl;
    const amount = parseFloat(coins);

    if (!phone || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    // Check if wallet exists
    const walletRes = await db.query('SELECT * FROM wallets WHERE customer_phone = $1 AND store_url = $2', [phone, shopUrl]);
    let walletId;
    let currentBalance = 0;

    if (walletRes.rows.length === 0) {
      // Create new wallet
      const newWallet = await db.query(`
        INSERT INTO wallets (store_url, phone_hash, customer_name, customer_phone, balance)
        VALUES ($1, $2, 'Guest', $2, $3)
        RETURNING id, balance
      `, [shopUrl, phone, amount]); // phone used as hash for demo
      walletId = newWallet.rows[0].id;
      currentBalance = parseFloat(newWallet.rows[0].balance);
    } else {
      // Update existing
      const w = walletRes.rows[0];
      walletId = w.id;
      currentBalance = parseFloat(w.balance) + amount;
      await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [currentBalance, walletId]);
    }

    // Log Transaction
    await db.query(`
      INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status, order_amount)
      VALUES ($1, $2, $3, $4, 'CREDIT', 'COMPLETED', 0)
    `, [walletId, shopUrl, description || 'ADMIN_BONUS', amount]);

    res.json({
      success: true,
      newBalance: currentBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 7. Webhook: Orders Paid
app.post('/webhooks/orders/paid', async (req, res) => {
  try {
    const shopDomain = req.headers['x-shopify-shop-domain'];
    if (!shopDomain) {
        console.warn('Webhook missing shop domain header');
        return res.status(200).send('OK'); // Return 200 to Shopify anyway
    }

    const order = req.body;
    console.log(`Processing Order Webhook for ${shopDomain}:`, order.id);

    // Verify tenant exists
    const userCheck = await db.query('SELECT store_url FROM users WHERE store_url = $1', [shopDomain]);
    if (userCheck.rows.length === 0) {
         console.warn(`Tenant not found for ${shopDomain}`);
         return res.status(200).send('OK');
    }

    // Check for wallet discount codes
    const discountCodes = order.discount_codes || [];
    const walletCode = discountCodes.find(c => c.code.startsWith('WALLET-'));

    if (walletCode) {
      const phone = walletCode.code.replace('WALLET-', ''); // Simple parsing strategy
      const amount = parseFloat(walletCode.amount || 0);

      if (amount > 0) {
        // Find Wallet
        const walletRes = await db.query('SELECT * FROM wallets WHERE customer_phone = $1 AND store_url = $2', [phone, shopDomain]);
        if (walletRes.rows.length > 0) {
           const wallet = walletRes.rows[0];
           
           const orderIdStr = order.id ? order.id.toString() : '';
           const txnCheck = await db.query('SELECT * FROM transactions WHERE order_id = $1 AND type = \'DEBIT\' AND store_url = $2', [orderIdStr, shopDomain]);
           
           if (txnCheck.rows.length === 0) {
              const newBalance = parseFloat(wallet.balance) - amount;
              await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [newBalance, wallet.id]);
              
              await db.query(`
                INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status, order_amount)
                VALUES ($1, $2, $3, $4, 'DEBIT', 'COMPLETED', $5)
              `, [wallet.id, shopDomain, orderIdStr, amount, parseFloat(order.total_price)]);
              
              console.log(`Deducted ${amount} coins from ${phone} for order ${orderIdStr}`);
           }
        }
      }
    }

    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).send('Error');
  }
});


// --- ADMIN APIS (Scoped by User's Store) ---
// Note: In real setup, frontend sends Authorization header. Here we assume req.shopUrl is populated by requireAdminAuth

app.get('/api/stats', requireAdminAuth, async (req, res) => {
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

// Revenue Data for Chart
app.get('/api/revenue', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const result = await db.query(`
      SELECT TO_CHAR(created_at, 'Dy') as name, SUM(coins) as value
      FROM transactions 
      WHERE store_url = $1 AND type = 'DEBIT' AND created_at >= NOW() - INTERVAL '7 DAYS'
      GROUP BY TO_CHAR(created_at, 'Dy'), DATE(created_at)
      ORDER BY DATE(created_at)
    `, [shopUrl]);
    
    const data = result.rows.length > 0 ? result.rows : [];
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Paginated Transactions
app.get('/api/transactions', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.id::text, t.wallet_id::text, t.order_id, t.coins, t.type, t.status, t.order_amount, t.expires_at, t.created_at,
             w.customer_name, w.customer_phone 
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE t.store_url = $1
    `;
    const params = [shopUrl];

    if (search) {
      query += ` AND (w.customer_name ILIKE $2 OR t.order_id ILIKE $2 OR w.customer_phone ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    // Add pagination params
    params.push(limit, offset);

    const dataResult = await db.query(query, params);
    
    // Count query
    let countQuery = `SELECT COUNT(*) FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.store_url = $1`;
    const countParams = [shopUrl];
    if (search) {
        countQuery += ` AND (w.customer_name ILIKE $2 OR t.order_id ILIKE $2 OR w.customer_phone ILIKE $2)`;
        countParams.push(`%${search}%`);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      data: dataResult.rows,
      meta: {
        current_page: page,
        last_page: Math.ceil(parseInt(countResult.rows[0]?.count || 0) / limit),
        total: parseInt(countResult.rows[0]?.count || 0),
        per_page: limit
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// All Transactions (for reports)
app.get('/api/transactions/all', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    // Limit to 1000 for safety
    const result = await db.query(`
      SELECT t.id::text, t.wallet_id::text, t.order_id, t.coins, t.type, t.status, t.order_amount, t.expires_at, t.created_at, 
             w.customer_name, w.customer_phone 
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE t.store_url = $1
      ORDER BY t.created_at DESC LIMIT 1000
    `, [shopUrl]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/settings', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const result = await db.query('SELECT * FROM app_settings WHERE store_url = $1', [shopUrl]);
    
    if (result.rows.length === 0) {
        // Fallback: create default if missing
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

app.put('/api/settings', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const s = req.body;
    
    await db.query(`
      UPDATE app_settings SET
        is_wallet_enabled = $1,
        is_otp_enabled = $2,
        otp_expiry_seconds = $3,
        max_wallet_usage_percent = $4,
        sms_provider = $5,
        sms_api_key = $6,
        use_custom_api = $7,
        custom_api_wallet_balance_url = $8,
        custom_api_auth_header_key = $9,
        custom_api_auth_header_value = $10
      WHERE store_url = $11
    `, [
      s.isWalletEnabled, s.isOtpEnabled, s.otpExpirySeconds, s.maxWalletUsagePercent,
      s.smsProvider, s.smsApiKey, s.useCustomApi, 
      s.customApiConfig.walletBalanceUrl, s.customApiConfig.authHeaderKey, s.customApiConfig.authHeaderValue,
      shopUrl
    ]);
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Test Integration (Admin)
app.post('/api/settings/test-integration', requireAdminAuth, async (req, res) => {
    // ... (Use code from previous step, but just ensure it works inside the middleware context)
    try {
        const { url, authKey, authValue, testPhone } = req.body;
        // ... logic same as before ...
        if (!url || !testPhone) return res.status(400).json({ success: false, message: 'URL required' });
        
        const urlObj = new URL(url);
        urlObj.searchParams.append('phone', testPhone);
        urlObj.searchParams.append('shop', req.shopUrl); // Pass real shop url
        
        const headers = { 'Content-Type': 'application/json' };
        if (authKey) headers[authKey] = authValue || '';
        
        const apiRes = await fetch(urlObj.toString(), { headers });
        const apiData = await apiRes.json();
        
        if (apiRes.ok) res.json({ success: true, data: apiData });
        else res.json({ success: false, message: `Status: ${apiRes.status}`, data: apiData });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Customer Search (Admin)
app.get('/api/customers/search', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const { q } = req.query;
    if (!q) return res.json(null);

    const result = await db.query(`
      SELECT id::text, phone_hash, customer_name as name, customer_phone as phone, balance 
      FROM wallets 
      WHERE store_url = $1 AND (customer_name ILIKE $2 OR customer_phone ILIKE $2)
      LIMIT 1
    `, [shopUrl, `%${q}%`]);

    if (result.rows.length === 0) return res.json(null);
    const wallet = result.rows[0];

    const stats = await db.query(`
      SELECT COUNT(*) as total_orders, SUM(coins) as total_coins_used 
      FROM transactions WHERE wallet_id = $1 AND type = 'DEBIT'
    `, [wallet.id]);

    res.json({
      ...wallet,
      total_orders: parseInt(stats.rows[0]?.total_orders || 0),
      total_coins_used: parseFloat(stats.rows[0]?.total_coins_used || 0),
      total_spent: 0 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Customer Transactions
app.get('/api/customers/:id/transactions', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT t.id::text, t.wallet_id::text, t.order_id, t.coins, t.type, t.status, t.order_amount, t.expires_at, t.created_at,
             w.customer_name, w.customer_phone
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE t.store_url = $1 AND (w.id::text = $2 OR w.customer_phone = $2)
      ORDER BY t.created_at DESC
    `, [shopUrl, id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- AUTOMATION ENDPOINTS ---

app.get('/api/automations', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const result = await db.query('SELECT id::text, name, condition_type, condition_value, action_channel, status, last_run, created_at FROM automation_jobs WHERE store_url = $1 ORDER BY created_at DESC', [shopUrl]);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/automations', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const { name, condition_type, condition_value, action_channel, status } = req.body;
    const result = await db.query(`
      INSERT INTO automation_jobs (store_url, name, condition_type, condition_value, action_channel, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id::text, name, condition_type, condition_value, action_channel, status, last_run, created_at
    `, [shopUrl, name, condition_type, condition_value, action_channel, status]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/automations/:id', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    await db.query('DELETE FROM automation_jobs WHERE id = $1 AND store_url = $2', [req.params.id, shopUrl]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/automations/:id/toggle', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const { status } = req.body;
    await db.query('UPDATE automation_jobs SET status = $1 WHERE id = $2 AND store_url = $3', [status, req.params.id, shopUrl]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/automations/analytics', requireAdminAuth, async (req, res) => {
  try {
    const shopUrl = req.shopUrl;
    const period = req.query.period || 'DAILY';
    
    let intervalStr = '7 days';
    let dateFormat = 'Dy Mon DD';
    let groupBy = 'DATE(created_at)';
    let orderBy = 'DATE(created_at)';
    
    if (period === 'MONTHLY') {
       intervalStr = '12 months';
       dateFormat = 'Mon YYYY';
       groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
       orderBy = "TO_CHAR(created_at, 'YYYY-MM')";
    } else if (period === 'YEARLY') {
       intervalStr = '5 years';
       dateFormat = 'YYYY';
       groupBy = "TO_CHAR(created_at, 'YYYY')";
       orderBy = "TO_CHAR(created_at, 'YYYY')";
    }

    const chartQuery = `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as label,
        COUNT(*) as sent,
        COUNT(CASE WHEN converted THEN 1 END) as converted
      FROM automation_logs
      WHERE store_url = $1 AND created_at >= NOW() - INTERVAL '${intervalStr}'
      GROUP BY 1, ${groupBy}
      ORDER BY ${orderBy} ASC
    `;

    const summaryQuery = `
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN converted THEN 1 END) as total_converted,
        SUM(revenue) as revenue
      FROM automation_logs
      WHERE store_url = $1 AND created_at >= NOW() - INTERVAL '${intervalStr}'
    `;

    const [chartRes, summaryRes] = await Promise.all([
       db.query(chartQuery, [shopUrl]),
       db.query(summaryQuery, [shopUrl])
    ]);

    const s = summaryRes.rows[0];
    const totalSent = parseInt(s.total_sent || 0);
    const totalConverted = parseInt(s.total_converted || 0);
    const revenue = parseFloat(s.revenue || 0);

    res.json({
      summary: {
        totalSent,
        totalConverted,
        conversionRate: totalSent > 0 ? parseFloat(((totalConverted / totalSent) * 100).toFixed(1)) : 0,
        revenueGenerated: revenue
      },
      chartData: chartRes.rows.map(r => ({
        label: r.label,
        sent: parseInt(r.sent),
        converted: parseInt(r.converted)
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// --- SHOPIFY INTEGRATION ROUTES ---
// Mount Shopify coin/rewards routes
app.use('/api/shopify/coins', shopifyRoutes);

console.log('Shopify coin integration routes mounted at /api/shopify/coins');

// --- SHOPIFY APP OAUTH ROUTES ---

// Generate OAuth installation URL
app.post('/api/shopify/auth/install', async (req, res) => {
  try {
    const { shop } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'https://shopify-walletx-1.onrender.com/auth/callback';
    const scopes = 'read_orders,write_orders,read_customers,write_customers,read_discounts,write_discounts';
    
    // Generate nonce for security
    const nonce = Math.random().toString(36).substring(7);
    
    // Build OAuth URL
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${nonce}`;
    
    res.json({ authUrl });
  } catch (err) {
    console.error('Install error:', err);
    res.status(500).json({ error: 'Failed to generate installation URL' });
  }
});

// Handle OAuth callback and exchange code for access token
app.post('/api/shopify/auth/callback', async (req, res) => {
  try {
    const { shop, code, hmac } = req.body;
    
    if (!shop || !code) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code: code
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      // Store or update the shop's access token in database
      const checkShop = await db.query('SELECT * FROM users WHERE store_url = $1', [shop]);
      
      if (checkShop.rows.length > 0) {
        // Update existing shop
        await db.query(`
          UPDATE users 
          SET shopify_access_token = $1, shopify_api_key = $2
          WHERE store_url = $3
        `, [tokenData.access_token, apiKey, shop]);
      } else {
        // Create new shop entry
        const defaultPassword = await bcrypt.hash('changeme123', BCRYPT_SALT_ROUNDS);
        await db.query(`
          INSERT INTO users (store_url, shopify_access_token, shopify_api_key, email, password_hash, name, store_name)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [shop, tokenData.access_token, apiKey, `admin@${shop}`, defaultPassword, 'Admin', shop]);
        
        // Create default settings
        await db.query(`
          INSERT INTO app_settings (store_url, is_wallet_enabled) VALUES ($1, true)
        `, [shop]);
      }
      
      console.log(`✅ Shopify app installed for: ${shop}`);
      res.json({ success: true, shop });
    } else {
      console.error('Failed to get access token:', tokenData);
      res.status(400).json({ success: false, error: 'Failed to get access token' });
    }
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ success: false, error: 'Server error during OAuth' });
  }
});

// Start Server
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') startServer(port + 1);
  });
};
startServer(PORT);