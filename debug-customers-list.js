const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function debugCustomersList() {
  console.log('🔍 Debugging Customers List Issue\n');

  try {
    // Step 1: Check if there are wallets in the database
    console.log('1️⃣ Checking wallets in database...');
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/shopwallet'
    });
    
    await client.connect();
    
    const walletsResult = await client.query(`
      SELECT COUNT(*) as total, store_url 
      FROM wallets 
      GROUP BY store_url
    `);
    
    console.log('   Database wallets by store:');
    walletsResult.rows.forEach(row => {
      console.log(`   - ${row.store_url}: ${row.total} wallets`);
    });
    
    // Step 2: Check specific store
    console.log(`\n2️⃣ Checking wallets for store: ${SHOP_URL}`);
    const storeWallets = await client.query(`
      SELECT id, customer_name, customer_phone, customer_email, balance, updated_at
      FROM wallets 
      WHERE store_url = $1
      ORDER BY updated_at DESC
      LIMIT 5
    `, [SHOP_URL]);
    
    console.log(`   Found ${storeWallets.rows.length} wallets for this store`);
    if (storeWallets.rows.length > 0) {
      console.log('   Sample wallets:');
      storeWallets.rows.forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.customer_name} (${w.customer_phone || w.customer_email}) - Balance: ${w.balance}`);
      });
    }
    
    await client.end();
    
    // Step 3: Test the API endpoint
    console.log('\n3️⃣ Testing API endpoint...');
    const response = await fetch(`${API_BASE}/customers/list?page=1&limit=20`, {
      headers: {
        'x-shop-url': SHOP_URL,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    // Step 4: Check authentication/headers
    console.log('\n4️⃣ Checking authentication...');
    console.log(`   Shop URL header: ${SHOP_URL}`);
    console.log(`   API Base: ${API_BASE}`);
    
    // Step 5: Recommendations
    console.log('\n📋 Diagnosis:');
    if (storeWallets.rows.length === 0) {
      console.log('   ❌ No wallets found for this store in database');
      console.log('   💡 Solution: Create test wallets or check store_url normalization');
    } else if (data.data && data.data.length === 0) {
      console.log('   ❌ Wallets exist but API returns empty');
      console.log('   💡 Solution: Check store_url matching in API middleware');
    } else if (data.data && data.data.length > 0) {
      console.log('   ✅ API working correctly!');
      console.log('   💡 Issue might be in frontend - check browser console');
    } else {
      console.log('   ❌ Unexpected response format');
      console.log('   💡 Check backend logs for errors');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error);
  }
}

debugCustomersList();
