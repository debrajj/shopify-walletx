const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkBalanceMismatch() {
  try {
    console.log('\n=== Checking Balance Mismatch ===\n');
    
    const email = 'debrajecomcure@gmail.com';
    
    // Check all wallets for this email
    const result = await pool.query(`
      SELECT 
        id,
        store_url,
        customer_name,
        customer_email,
        customer_phone,
        balance,
        created_at,
        updated_at
      FROM wallets 
      WHERE customer_email = $1
      ORDER BY updated_at DESC
    `, [email]);
    
    console.log(`Found ${result.rows.length} wallet(s) for ${email}:\n`);
    
    result.rows.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1}:`);
      console.log(`  ID: ${wallet.id}`);
      console.log(`  Store: ${wallet.store_url}`);
      console.log(`  Name: ${wallet.customer_name}`);
      console.log(`  Email: ${wallet.customer_email}`);
      console.log(`  Phone: ${wallet.customer_phone}`);
      console.log(`  Balance: ${wallet.balance} coins`);
      console.log(`  Created: ${wallet.created_at}`);
      console.log(`  Updated: ${wallet.updated_at}`);
      console.log('');
    });
    
    // Check recent transactions
    const txResult = await pool.query(`
      SELECT 
        t.id,
        t.wallet_id,
        t.coins,
        t.type,
        t.status,
        t.created_at,
        w.customer_email
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE w.customer_email = $1
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [email]);
    
    console.log(`\nRecent transactions (${txResult.rows.length}):\n`);
    
    txResult.rows.forEach((tx, index) => {
      console.log(`Transaction ${index + 1}:`);
      console.log(`  Wallet ID: ${tx.wallet_id}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Coins: ${tx.coins}`);
      console.log(`  Status: ${tx.status}`);
      console.log(`  Date: ${tx.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkBalanceMismatch();
