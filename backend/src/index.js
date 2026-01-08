const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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
// To keep it simple and working with the current frontend that mocks auth:
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

    const salt = await bcrypt.genSalt(10);
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
    const expiresAt = new Date(Date.now() + 120 * 1000);

    // Scoped by store_url
    await db.query(`
      INSERT INTO otp_sessions (id, store_url, phone, otp, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [sessionId, shopUrl, phone, otp, expiresAt]);

    console.log(`[${shopUrl}] OTP for ${phone}: ${otp}`);

    res.json({ success: true, otpSessionId: sessionId, expiresIn: 120 });
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
