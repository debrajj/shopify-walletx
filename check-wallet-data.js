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

async function checkWalletData() {
  try {
    console.log('🔍 Checking all wallets in database...\n');
    
    // Get all wallets
    const wallets = await pool.query(
      'SELECT * FROM wallets ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log(`Found ${wallets.rows.length} wallets:\n`);
    
    wallets.rows.forEach((wallet, index) => {
      console.log(`${index + 1}. Email: ${wallet.customer_email || 'N/A'}`);
      console.log(`   Phone: ${wallet.customer_phone || 'N/A'}`);
      console.log(`   Balance: ${wallet.balance} coins`);
      console.log(`   Store: ${wallet.store_url}`);
      console.log(`   Created: ${wallet.created_at}`);
      console.log('');
    });
    
    // Check specific email
    const email = 'debrajecomcure@gmail.com';
    console.log(`\n🔍 Checking specific email: ${email}\n`);
    
    const specific = await pool.query(
      'SELECT * FROM wallets WHERE customer_email = $1',
      [email]
    );
    
    if (specific.rows.length > 0) {
      console.log('✅ Found wallet:');
      console.log('   Email:', specific.rows[0].customer_email);
      console.log('   Balance:', specific.rows[0].balance, 'coins');
      console.log('   Store:', specific.rows[0].store_url);
      console.log('   ID:', specific.rows[0].id);
    } else {
      console.log('❌ No wallet found for this email');
    }
    
    // Check transactions
    if (specific.rows.length > 0) {
      const transactions = await pool.query(
        'SELECT * FROM transactions WHERE wallet_id = $1 ORDER BY created_at DESC',
        [specific.rows[0].id]
      );
      
      console.log(`\n📊 Transactions (${transactions.rows.length}):`);
      transactions.rows.forEach((txn, index) => {
        console.log(`   ${index + 1}. ${txn.type} ${txn.coins} coins - ${txn.order_id} (${txn.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkWalletData();
