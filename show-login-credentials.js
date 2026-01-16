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

async function showCredentials() {
  try {
    console.log('🔐 AVAILABLE LOGIN CREDENTIALS\n');
    console.log('=' .repeat(60));
    
    const users = await pool.query('SELECT id, name, email, store_name, store_url FROM users ORDER BY id');
    
    console.log('\n📋 Users in database:\n');
    
    for (const user of users.rows) {
      console.log(`${user.id}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Store: ${user.store_name}`);
      console.log(`   Store URL: ${user.store_url}`);
      
      // Count wallets for this store
      const wallets = await pool.query('SELECT COUNT(*) FROM wallets WHERE store_url = $1', [user.store_url]);
      console.log(`   Wallets: ${wallets.rows[0].count}`);
      console.log('');
    }
    
    console.log('=' .repeat(60));
    console.log('\n💡 TO FIX THE CUSTOMER SEARCH ISSUE:\n');
    console.log('1. Log out of the current session');
    console.log('2. Log in with: admin@cmstestingg.myshopify.com');
    console.log('3. Password: (use the password you set during signup)');
    console.log('\nOR\n');
    console.log('Clear your browser localStorage and the app will use');
    console.log('the default store: cmstestingg.myshopify.com\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

showCredentials();
