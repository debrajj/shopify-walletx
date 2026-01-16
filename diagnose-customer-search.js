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

async function diagnose() {
  try {
    console.log('🔍 CUSTOMER SEARCH DIAGNOSTIC\n');
    console.log('=' .repeat(60));
    
    // 1. Check all store URLs in users table
    console.log('\n1️⃣ REGISTERED STORES:');
    const stores = await pool.query('SELECT id, email, store_url FROM users');
    stores.rows.forEach(store => {
      console.log(`   - ${store.email}: ${store.store_url}`);
    });
    
    // 2. Check all wallets and their store URLs
    console.log('\n2️⃣ WALLETS BY STORE:');
    const wallets = await pool.query(`
      SELECT store_url, COUNT(*) as count 
      FROM wallets 
      GROUP BY store_url
    `);
    wallets.rows.forEach(row => {
      console.log(`   - ${row.store_url}: ${row.count} wallets`);
    });
    
    // 3. Test search with different shop URL formats
    const searchEmail = 'debrajecomcure@gmail.com';
    console.log(`\n3️⃣ TESTING SEARCH FOR: ${searchEmail}`);
    
    const shopUrls = [
      'cmstestingg.myshopify.com',
      'https://cmstestingg.myshopify.com',
      'http://cmstestingg.myshopify.com'
    ];
    
    for (const shopUrl of shopUrls) {
      console.log(`\n   Testing with shop URL: "${shopUrl}"`);
      
      const result = await pool.query(`
        SELECT id::text, customer_name as name, customer_phone as phone, customer_email as email, balance 
        FROM wallets 
        WHERE store_url = $1 AND (customer_name ILIKE $2 OR customer_phone ILIKE $2 OR customer_email ILIKE $2)
        LIMIT 1
      `, [shopUrl, `%${searchEmail}%`]);
      
      if (result.rows.length > 0) {
        console.log(`   ✅ FOUND: ${result.rows[0].name} (${result.rows[0].email}) - Balance: ${result.rows[0].balance}`);
      } else {
        console.log(`   ❌ NOT FOUND`);
      }
    }
    
    // 4. Check what the actual store_url is for this email
    console.log(`\n4️⃣ ACTUAL STORE URL FOR ${searchEmail}:`);
    const actual = await pool.query(
      'SELECT store_url FROM wallets WHERE customer_email = $1',
      [searchEmail]
    );
    if (actual.rows.length > 0) {
      console.log(`   Store URL: "${actual.rows[0].store_url}"`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 SOLUTION:');
    console.log('   The issue is likely a mismatch between:');
    console.log('   - The store_url in the users table');
    console.log('   - The store_url in the wallets table');
    console.log('   - The x-shop-url header sent by the frontend\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnose();
