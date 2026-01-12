// Check what's in the database
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabase() {
  try {
    console.log('Connecting to database...\n');
    
    // Check users/stores
    console.log('=== REGISTERED STORES ===');
    const users = await pool.query('SELECT store_url, store_name, email FROM users LIMIT 5');
    console.log(`Found ${users.rows.length} stores:`);
    users.rows.forEach(u => {
      console.log(`  - ${u.store_url} (${u.store_name || 'No name'})`);
    });
    
    // Check wallets
    console.log('\n=== WALLETS ===');
    const wallets = await pool.query('SELECT store_url, customer_name, customer_phone, customer_email, balance FROM wallets LIMIT 10');
    console.log(`Found ${wallets.rows.length} wallets:`);
    wallets.rows.forEach(w => {
      console.log(`  - Store: ${w.store_url}`);
      console.log(`    Name: ${w.customer_name || 'N/A'}`);
      console.log(`    Phone: ${w.customer_phone || 'N/A'}`);
      console.log(`    Email: ${w.customer_email || 'N/A'}`);
      console.log(`    Balance: ${w.balance} coins\n`);
    });
    
    // Check if customer_email column exists
    console.log('=== CHECKING SCHEMA ===');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wallets'
      ORDER BY ordinal_position
    `);
    console.log('Wallets table columns:');
    columns.rows.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
