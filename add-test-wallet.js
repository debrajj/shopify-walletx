const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function addTestWallet() {
  const email = 'debrajecomcure@gmail.com'; // Corrected email
  const shopUrl = 'cmstestingg.myshopify.com'; // Your store URL
  const initialBalance = 1000; // Give 1000 coins for testing
  
  try {
    console.log('Adding test wallet for:', email);
    
    // Check if wallet exists
    const existing = await pool.query(
      'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
      [email, shopUrl]
    );
    
    if (existing.rows.length > 0) {
      console.log('✅ Wallet already exists with balance:', existing.rows[0].balance);
      
      // Update balance
      await pool.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE customer_email = $2 AND store_url = $3',
        [initialBalance, email, shopUrl]
      );
      console.log('✅ Updated balance to:', initialBalance);
    } else {
      // Create new wallet
      const result = await pool.query(
        `INSERT INTO wallets (store_url, phone_hash, customer_email, customer_name, balance)
         VALUES ($1, $2, $2, 'Debraj', $3)
         RETURNING id, balance`,
        [shopUrl, email, initialBalance]
      );
      
      console.log('✅ Created new wallet with ID:', result.rows[0].id);
      console.log('✅ Initial balance:', result.rows[0].balance);
      
      // Add welcome bonus transaction
      await pool.query(
        `INSERT INTO transactions (wallet_id, store_url, order_id, coins, type, status)
         VALUES ($1, $2, 'WELCOME_BONUS', $3, 'CREDIT', 'COMPLETED')`,
        [result.rows[0].id, shopUrl, initialBalance]
      );
      
      console.log('✅ Added welcome bonus transaction');
    }
    
    // Verify
    const verify = await pool.query(
      'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
      [email, shopUrl]
    );
    
    console.log('\n📊 Final wallet data:');
    console.log('Email:', verify.rows[0].customer_email);
    console.log('Balance:', verify.rows[0].balance, 'coins');
    console.log('Store:', verify.rows[0].store_url);
    console.log('\n✅ Done! You can now check balance in the widget.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addTestWallet();
