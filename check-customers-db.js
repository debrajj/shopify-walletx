const { Client } = require('pg');
require('dotenv').config();

async function checkCustomers() {
  console.log('🔍 Checking Customers in Database\n');

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Check all wallets
    console.log('1️⃣ Total wallets by store:');
    const totalResult = await client.query(`
      SELECT store_url, COUNT(*) as count 
      FROM wallets 
      GROUP BY store_url
      ORDER BY count DESC
    `);
    
    if (totalResult.rows.length === 0) {
      console.log('   ❌ No wallets found in database!\n');
    } else {
      totalResult.rows.forEach(row => {
        console.log(`   - ${row.store_url}: ${row.count} wallets`);
      });
      console.log('');
    }
    
    // Check cmstestingg store specifically
    const SHOP_URL = 'cmstestingg.myshopify.com';
    console.log(`2️⃣ Wallets for ${SHOP_URL}:`);
    const storeResult = await client.query(`
      SELECT 
        id, 
        customer_name, 
        customer_phone, 
        customer_email, 
        balance, 
        created_at,
        updated_at
      FROM wallets 
      WHERE store_url = $1
      ORDER BY updated_at DESC
      LIMIT 10
    `, [SHOP_URL]);
    
    if (storeResult.rows.length === 0) {
      console.log(`   ❌ No wallets found for ${SHOP_URL}\n`);
      
      // Check if there are wallets with similar store URLs
      console.log('3️⃣ Checking for similar store URLs:');
      const similarResult = await client.query(`
        SELECT DISTINCT store_url 
        FROM wallets 
        WHERE store_url LIKE '%cmstestingg%' OR store_url LIKE '%myshopify%'
      `);
      
      if (similarResult.rows.length > 0) {
        console.log('   Found similar URLs:');
        similarResult.rows.forEach(row => {
          console.log(`   - "${row.store_url}"`);
        });
      } else {
        console.log('   No similar URLs found');
      }
    } else {
      console.log(`   ✅ Found ${storeResult.rows.length} wallets:\n`);
      storeResult.rows.forEach((wallet, i) => {
        console.log(`   ${i + 1}. ${wallet.customer_name}`);
        console.log(`      Contact: ${wallet.customer_phone || wallet.customer_email || 'N/A'}`);
        console.log(`      Balance: ${wallet.balance} coins`);
        console.log(`      Last Updated: ${wallet.updated_at}`);
        console.log('');
      });
    }
    
    // Check logged in user's store
    console.log('4️⃣ Checking users table:');
    const usersResult = await client.query(`
      SELECT store_url, email, name 
      FROM users 
      LIMIT 5
    `);
    
    if (usersResult.rows.length > 0) {
      console.log('   Registered stores:');
      usersResult.rows.forEach(user => {
        console.log(`   - ${user.store_url} (${user.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkCustomers();
