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

// --- DATABASE INIT (For Local Dev) ---
const initDb = async () => {
  try {
    console.log("Initializing database schema...");

    // 1. Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        store_name VARCHAR(255),
        store_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. App Settings Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        is_wallet_enabled BOOLEAN DEFAULT true,
        is_otp_enabled BOOLEAN DEFAULT true,
        otp_expiry_seconds INTEGER DEFAULT 300,
        max_wallet_usage_percent INTEGER DEFAULT 20,
        sms_provider VARCHAR(50) DEFAULT 'TWILIO',
        sms_api_key VARCHAR(255) DEFAULT '',
        use_custom_api BOOLEAN DEFAULT false,
        custom_api_base_url VARCHAR(255) DEFAULT '',
        custom_api_auth_header_key VARCHAR(100) DEFAULT '',
        custom_api_auth_header_value VARCHAR(255) DEFAULT ''
      );
    `);

    // 3. Wallets Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        phone_hash VARCHAR(255) UNIQUE,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        balance DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Transactions Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id),
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
        name VARCHAR(255) NOT NULL,
        condition_type VARCHAR(50) NOT NULL,
        condition_value INTEGER NOT NULL,
        action_channel VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        last_run TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Automation Logs Table (For Analytics)
    await db.query(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id SERIAL PRIMARY KEY,
        job_id INTEGER, 
        channel VARCHAR(20),
        status VARCHAR(20),
        converted BOOLEAN DEFAULT false,
        revenue DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. OTP Sessions Table (New)
    await db.query(`
      CREATE TABLE IF NOT EXISTS otp_sessions (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(50),
        otp VARCHAR(10),
        expires_at TIMESTAMP,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default settings if empty
    const settingsCheck = await db.query('SELECT * FROM app_settings WHERE id = 1');
    if (settingsCheck.rows.length === 0) {
      await db.query(`
        INSERT INTO app_settings (id, is_wallet_enabled) VALUES (1, true)
      `);
    }

    // Optional: Seed dummy wallet data if empty (for testing)
    const walletCheck = await db.query('SELECT COUNT(*) FROM wallets');
    if (parseInt(walletCheck.rows[0].count) === 0) {
        console.log("Seeding demo wallet data...");
        const w = await db.query(`
            INSERT INTO wallets (phone_hash, customer_name, customer_phone, balance) 
            VALUES ('hash123', 'Demo Customer', '+15550001234', 150.00) RETURNING id
        `);
        await db.query(`
            INSERT INTO transactions (wallet_id, order_id, coins, type, order_amount)
            VALUES ($1, '#1001', 150.00, 'CREDIT', 500.00)
        `, [w.rows[0].id]);
    }

    // Optional: Seed automation logs if empty (for analytics demo)
    const logsCheck = await db.query('SELECT COUNT(*) FROM automation_logs');
    if (parseInt(logsCheck.rows[0].count) === 0) {
       console.log("Seeding automation logs for analytics...");
       const logs = [];
       // Generate 200 logs over the last 60 days
       for(let i=0; i<200; i++) {
         const daysAgo = Math.floor(Math.random() * 60);
         const date = new Date();
         date.setDate(date.getDate() - daysAgo);
         
         const isConverted = Math.random() > 0.85; // 15% conversion rate
         const revenue = isConverted ? (Math.random() * 100 + 20).toFixed(2) : 0;
         
         // Format timestamp for PostgreSQL
         const timestamp = date.toISOString().replace('T', ' ').replace('Z', '');
         
         logs.push(`(1, 'SMS', 'SENT', ${isConverted}, ${revenue}, '${timestamp}')`);
       }
       
       // Bulk insert in chunks to be safe with string length
       const chunkSize = 50;
       for (let i = 0; i < logs.length; i += chunkSize) {
          const chunk = logs.slice(i, i + chunkSize);
          await db.query(`
            INSERT INTO automation_logs (job_id, channel, status, converted, revenue, created_at)
            VALUES ${chunk.join(',')}
          `);
       }
    }
    
    console.log("Database tables checked/initialized successfully.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
};

initDb();

// --- AUTH ROUTES ---

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Cast id to text for frontend compatibility
    const result = await db.query('SELECT id::text, name, email, password_hash, store_name, store_url FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user info (excluding password)
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storeName: user.store_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, storeName, storeUrl } = req.body;

    // Check if user exists
    const check = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Cast id to text
    const result = await db.query(`
      INSERT INTO users (name, email, password_hash, store_name, store_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id::text, name, email, store_name
    `, [name, email, hash, storeName, storeUrl]);

    res.status(201).json({
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing signup' });
  }
});

// --- STOREFRONT / APP PROXY ROUTES ---

// 1. Get Wallet Balance
app.get('/api/wallet/balance', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Get settings
    const settingsRes = await db.query('SELECT * FROM app_settings WHERE id = 1');
    const settings = settingsRes.rows[0];

    let balance = 0;
    let customerName = 'Guest';

    // Sync with Custom API if enabled
    if (settings.use_custom_api && settings.custom_api_base_url) {
       try {
         // Assume custom API takes phone as query param and returns { balance: number, name: string }
         const apiUrl = `${settings.custom_api_base_url}?phone=${phone}`;
         const headers = {};
         if (settings.custom_api_auth_header_key) {
           headers[settings.custom_api_auth_header_key] = settings.custom_api_auth_header_value;
         }
         
         const apiRes = await fetch(apiUrl, { headers });
         if (apiRes.ok) {
           const apiData = await apiRes.json();
           balance = parseFloat(apiData.balance || 0);
           customerName = apiData.name || customerName;
         }
       } catch (e) {
         console.error("Custom API Sync Failed:", e);
         // Fallback to local DB if custom API fails? Or just continue.
       }
    }

    // Upsert Wallet in Local DB
    // We use phone as hash for this demo to ensure uniqueness mapping
    const phoneHash = phone; 
    
    // Check if wallet exists
    const walletCheck = await db.query('SELECT * FROM wallets WHERE customer_phone = $1', [phone]);
    
    if (walletCheck.rows.length > 0) {
       // Update if custom API provided new data, or just fetch local if no custom API
       if (settings.use_custom_api) {
          await db.query('UPDATE wallets SET balance = $1 WHERE customer_phone = $2', [balance, phone]);
       } else {
          balance = parseFloat(walletCheck.rows[0].balance);
       }
    } else {
       // Create new wallet
       await db.query(`
         INSERT INTO wallets (phone_hash, customer_name, customer_phone, balance)
         VALUES ($1, $2, $3, $4)
       `, [phoneHash, customerName, phone, balance]);
    }

    res.json({
      success: true,
      walletCoins: balance,
      currency: "INR"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', success: false });
  }
});

// 2. Send OTP
app.post('/api/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = `OTP_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    // Expire in 2 minutes (120 seconds)
    const expiresAt = new Date(Date.now() + 120 * 1000);

    await db.query(`
      INSERT INTO otp_sessions (id, phone, otp, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [sessionId, phone, otp, expiresAt]);

    // In production: Integrate SMS Provider here (Twilio/AWS)
    console.log(`[MOCK SMS] OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      otpSessionId: sessionId,
      expiresIn: 120
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 3. Validate OTP
app.post('/api/otp/validate', async (req, res) => {
  try {
    const { otpSessionId, otp } = req.body;
    
    const result = await db.query(`
      SELECT * FROM otp_sessions 
      WHERE id = $1 AND otp = $2 AND is_used = FALSE AND expires_at > NOW()
    `, [otpSessionId, otp]);

    if (result.rows.length > 0) {
      // Mark as used
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

// 4. Apply Discount (Mock Shopify)
app.post('/api/wallet/apply-discount', async (req, res) => {
  // In a real app, this would make an admin API call to Shopify to create a PriceRule/DiscountCode
  // Here we just acknowledge and return the code structure expected by the frontend extension.
  const { discount_code } = req.body;
  const code = discount_code?.code || `WALLET-DISCOUNT`;
  
  res.json({
    success: true,
    discountCode: code
  });
});

// 5. Deduct Coins (Manual/API)
app.post('/api/wallet/deduct', async (req, res) => {
  try {
    const { phone, orderId, coins } = req.body;
    const amount = parseFloat(coins);

    const walletRes = await db.query('SELECT * FROM wallets WHERE customer_phone = $1', [phone]);
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
      INSERT INTO transactions (wallet_id, order_id, coins, type, status)
      VALUES ($1, $2, $3, 'DEBIT', 'COMPLETED')
    `, [wallet.id, orderId || 'MANUAL', amount]);

    res.json({
      success: true,
      remainingCoins: newBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 6. Credit Coins (Admin/API) - New
app.post('/api/wallet/credit', async (req, res) => {
  try {
    const { phone, coins, description } = req.body;
    const amount = parseFloat(coins);

    if (!phone || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    // Check if wallet exists
    const walletRes = await db.query('SELECT * FROM wallets WHERE customer_phone = $1', [phone]);
    let walletId;
    let currentBalance = 0;

    if (walletRes.rows.length === 0) {
      // Create new wallet
      // Use phone as hash for simplicity in this demo
      const newWallet = await db.query(`
        INSERT INTO wallets (phone_hash, customer_name, customer_phone, balance)
        VALUES ($1, $2, $3, $4)
        RETURNING id, balance
      `, [phone, 'Guest', phone, amount]);
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
      INSERT INTO transactions (wallet_id, order_id, coins, type, status, order_amount)
      VALUES ($1, $2, $3, 'CREDIT', 'COMPLETED', 0)
    `, [walletId, description || 'ADMIN_BONUS', amount]);

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
    const order = req.body;
    console.log("Processing Order Webhook:", order.id);

    // Check for wallet discount codes
    // Format assumed: WALLET-9999999999
    const discountCodes = order.discount_codes || [];
    const walletCode = discountCodes.find(c => c.code.startsWith('WALLET-'));

    if (walletCode) {
      const phone = walletCode.code.replace('WALLET-', '');
      // Calculate amount to deduct. 
      // In a real scenario, we need to know exactly how much the discount was worth.
      // Shopify payload: discount_codes: [{ code: '...', amount: '10.00', type: 'fixed_amount' }]
      const amount = parseFloat(walletCode.amount || 0);

      if (amount > 0) {
        // Find Wallet
        const walletRes = await db.query('SELECT * FROM wallets WHERE customer_phone = $1', [phone]);
        if (walletRes.rows.length > 0) {
           const wallet = walletRes.rows[0];
           
           // Check if transaction already exists (Idempotency)
           // Ensure order.id is treated as a string
           const orderIdStr = order.id ? order.id.toString() : '';
           const txnCheck = await db.query('SELECT * FROM transactions WHERE order_id = $1 AND type = \'DEBIT\'', [orderIdStr]);
           
           if (txnCheck.rows.length === 0) {
              const newBalance = parseFloat(wallet.balance) - amount;
              // Allow negative? Probably not, but if Shopify applied discount, we must deduct.
              // We'll update regardless to stay in sync.
              await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [newBalance, wallet.id]);
              
              await db.query(`
                INSERT INTO transactions (wallet_id, order_id, coins, type, status, order_amount)
                VALUES ($1, $2, $3, 'DEBIT', 'COMPLETED', $4)
              `, [wallet.id, orderIdStr, amount, parseFloat(order.total_price)]);
              
              console.log(`Deducted ${amount} coins from ${phone} for order ${orderIdStr}`);
           } else {
              console.log(`Transaction already processed for order ${orderIdStr}`);
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


// --- DATA ROUTES ---

// 1. Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const walletCount = await db.query('SELECT COUNT(*) FROM wallets');
    const coinsSum = await db.query('SELECT SUM(balance) FROM wallets');
    const todayTxns = await db.query("SELECT COUNT(*) FROM transactions WHERE created_at >= NOW() - INTERVAL '24 HOURS'");
    
    res.json({
      totalWallets: parseInt(walletCount.rows[0]?.count || 0),
      totalCoinsInCirculation: parseFloat(coinsSum.rows[0]?.sum || 0),
      totalTransactionsToday: parseInt(todayTxns.rows[0]?.count || 0),
      otpSuccessRate: 98.5
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error checking stats. Tables might be missing.' });
  }
});

// 2. Revenue Chart Data
app.get('/api/revenue', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT TO_CHAR(created_at, 'Dy') as name, SUM(coins) as value
      FROM transactions 
      WHERE type = 'DEBIT' AND created_at >= NOW() - INTERVAL '7 DAYS'
      GROUP BY TO_CHAR(created_at, 'Dy'), DATE(created_at)
      ORDER BY DATE(created_at)
    `);
    
    const data = result.rows.length > 0 ? result.rows : [];
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Transactions (Paginated)
app.get('/api/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Explicitly select and cast id fields to text
    let query = `
      SELECT t.id::text, t.wallet_id::text, t.order_id, t.coins, t.type, t.status, t.order_amount, t.expires_at, t.created_at,
             w.customer_name, w.customer_phone 
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE w.customer_name ILIKE $1 OR t.order_id ILIKE $1 OR w.customer_phone ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const countQuery = `
      SELECT COUNT(*) FROM transactions t JOIN wallets w ON t.wallet_id = w.id
      ${search ? 'WHERE w.customer_name ILIKE $1 OR t.order_id ILIKE $1 OR w.customer_phone ILIKE $1' : ''}
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(query, [...params, limit, offset]),
      db.query(countQuery, params)
    ]);

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

// 4. All Transactions (Export)
app.get('/api/transactions/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.id::text, t.wallet_id::text, t.order_id, t.coins, t.type, t.status, t.order_amount, t.expires_at, t.created_at, 
             w.customer_name, w.customer_phone 
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      ORDER BY t.created_at DESC LIMIT 1000
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Customer Search
app.get('/api/customers/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json(null);

    // Cast id to text
    const result = await db.query(`
      SELECT id::text, phone_hash, customer_name, customer_phone, balance, created_at, updated_at
      FROM wallets 
      WHERE customer_name ILIKE $1 OR customer_phone ILIKE $1 
      LIMIT 1
    `, [`%${q}%`]);

    if (result.rows.length === 0) return res.json(null);

    const wallet = result.rows[0];
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN type = 'DEBIT' THEN coins ELSE 0 END) as total_coins_used,
        SUM(order_amount) as total_spent
      FROM transactions WHERE wallet_id = $1
    `, [wallet.id]);

    res.json({
      ...wallet,
      total_orders: parseInt(stats.rows[0]?.total_orders || 0),
      total_coins_used: parseFloat(stats.rows[0]?.total_coins_used || 0),
      total_spent: parseFloat(stats.rows[0]?.total_spent || 0)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Customer Transactions
app.get('/api/customers/:id/transactions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.id::text, t.wallet_id::text, t.order_id, t.coins, t.type, t.status, t.order_amount, t.expires_at, t.created_at,
             w.customer_name, w.customer_phone
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE w.id::text = $1 OR w.customer_phone = $1
      ORDER BY t.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Settings GET
app.get('/api/settings', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM app_settings WHERE id = 1');
    if (result.rows.length === 0) return res.json({});
    
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
        baseUrl: row.custom_api_base_url,
        authHeaderKey: row.custom_api_auth_header_key,
        authHeaderValue: row.custom_api_auth_header_value
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 8. Settings UPDATE
app.put('/api/settings', async (req, res) => {
  try {
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
        custom_api_base_url = $8,
        custom_api_auth_header_key = $9,
        custom_api_auth_header_value = $10
      WHERE id = 1
    `, [
      s.isWalletEnabled, s.isOtpEnabled, s.otpExpirySeconds, s.maxWalletUsagePercent,
      s.smsProvider, s.smsApiKey, s.useCustomApi, 
      s.customApiConfig.baseUrl, s.customApiConfig.authHeaderKey, s.customApiConfig.authHeaderValue
    ]);
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 9. Automations GET
app.get('/api/automations', async (req, res) => {
  try {
    const result = await db.query('SELECT id::text, name, condition_type, condition_value, action_channel, status, last_run, created_at FROM automation_jobs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

// 10. Automations POST
app.post('/api/automations', async (req, res) => {
  try {
    const { name, condition_type, condition_value, action_channel, status } = req.body;
    const result = await db.query(`
      INSERT INTO automation_jobs (name, condition_type, condition_value, action_channel, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id::text, name, condition_type, condition_value, action_channel, status, last_run, created_at
    `, [name, condition_type, condition_value, action_channel, status]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 11. Automations Toggle
app.put('/api/automations/:id/toggle', async (req, res) => {
  try {
    const { status } = req.body;
    await db.query('UPDATE automation_jobs SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 12. Automations Delete
app.delete('/api/automations/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM automation_jobs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 13. Automation Analytics (Dynamic)
app.get('/api/automations/analytics', async (req, res) => {
  try {
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

    // 1. Chart Data Query
    const chartQuery = `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as label,
        COUNT(*) as sent,
        COUNT(CASE WHEN converted THEN 1 END) as converted
      FROM automation_logs
      WHERE created_at >= NOW() - INTERVAL '${intervalStr}'
      GROUP BY 1, ${groupBy}
      ORDER BY ${orderBy} ASC
    `;

    // 2. Summary Query
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN converted THEN 1 END) as total_converted,
        SUM(revenue) as revenue
      FROM automation_logs
      WHERE created_at >= NOW() - INTERVAL '${intervalStr}'
    `;

    const [chartRes, summaryRes] = await Promise.all([
       db.query(chartQuery),
       db.query(summaryQuery)
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});