const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

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
        console.log("Seeding demo data...");
        const w = await db.query(`
            INSERT INTO wallets (phone_hash, customer_name, customer_phone, balance) 
            VALUES ('hash123', 'Demo Customer', '+15550001234', 150.00) RETURNING id
        `);
        await db.query(`
            INSERT INTO transactions (wallet_id, order_id, coins, type, order_amount)
            VALUES ($1, '#1001', 150.00, 'CREDIT', 500.00)
        `, [w.rows[0].id]);
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
    
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
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

    const result = await db.query(`
      INSERT INTO users (name, email, password_hash, store_name, store_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, store_name
    `, [name, email, hash, storeName, storeUrl]);

    res.status(201).json({
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error processing signup' });
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

    let query = `
      SELECT t.*, w.customer_name, w.customer_phone 
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
      SELECT t.*, w.customer_name, w.customer_phone 
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

    const result = await db.query(`
      SELECT * FROM wallets 
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
      SELECT t.*, w.customer_name, w.customer_phone
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
    const result = await db.query('SELECT * FROM automation_jobs ORDER BY created_at DESC');
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
      RETURNING *
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

// 13. Automation Analytics
app.get('/api/automations/analytics', async (req, res) => {
  // Logic remains similar to the mock generator for now, as we don't have an automation_logs table in this schema yet.
  const period = req.query.period || 'DAILY';
  let labels = [], sent = [], converted = [];
  
  if (period === 'DAILY') {
    labels = Array.from({length: 7}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    });
    sent = [40, 55, 30, 80, 45, 60, 90];
    converted = [4, 10, 3, 12, 8, 9, 15];
  } else {
    // ... logic for monthly/yearly
    labels = ['Jan', 'Feb', 'Mar']; sent = [500, 600, 750]; converted = [50, 70, 90];
  }
  
  res.json({
    summary: { totalSent: 2500, totalConverted: 350, conversionRate: 14.0, revenueGenerated: 15750 },
    chartData: labels.map((l, i) => ({ label: l, sent: sent[i], converted: converted[i] }))
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});