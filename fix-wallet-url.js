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

async function fixWalletUrl() {
  try {
    console.log('Setting all wallets to 1000 coins...\n');
    
    // Update ALL wallets to have 1000 coins
    const result = await pool.query(
      `UPDATE wallets 
       SET balance = 1000.00, updated_at = NOW()
       WHERE store_url LIKE '%cmstestingg%'`
    );
    
    console.log(`✅ Updated ${result.rowCount} wallets\n`);
    
    // Show all wallets
    const verify = await pool.query(
      `SELECT customer_email, customer_phone, balance, store_url 
       FROM wallets 
       WHERE store_url LIKE '%cmstestingg%'
       ORDER BY created_at DESC`
    );
    
    console.log('📊 All wallets now have 1000 coins:\n');
    verify.rows.forEach((wallet, index) => {
      console.log(`${index + 1}. ${wallet.customer_email || wallet.customer_phone || 'Unknown'}`);
      console.log(`   Balance: ${wallet.balance} coins`);
      console.log(`   Store: ${wallet.store_url}\n`);
    });
    
    console.log('✅ Done! All wallets updated.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixWalletUrl();
