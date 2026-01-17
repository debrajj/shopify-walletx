const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function testActiveCustomersList() {
  console.log('🧪 Testing Active Customers List Feature\n');

  try {
    // Test 1: Get active customers list
    console.log('1️⃣ Fetching active customers list...');
    const response = await fetch(`${API_BASE}/customers/list?page=1&limit=20`, {
      headers: {
        'x-shop-url': SHOP_URL,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Response received');
    console.log(`   Total customers: ${data.meta.total}`);
    console.log(`   Current page: ${data.meta.current_page}`);
    console.log(`   Total pages: ${data.meta.last_page}`);
    console.log(`   Customers on this page: ${data.data.length}\n`);

    if (data.data.length > 0) {
      console.log('📋 Sample customer data:');
      const sample = data.data[0];
      console.log(`   Name: ${sample.name}`);
      console.log(`   Phone: ${sample.phone || 'N/A'}`);
      console.log(`   Email: ${sample.email || 'N/A'}`);
      console.log(`   Balance: ${sample.balance} coins`);
      console.log(`   Total Orders: ${sample.total_orders}`);
      console.log(`   Coins Used: ${sample.total_coins_used}`);
      console.log(`   Last Activity: ${sample.last_activity || 'N/A'}\n`);
    }

    // Test 2: Test pagination
    if (data.meta.total > 20) {
      console.log('2️⃣ Testing pagination (page 2)...');
      const page2Response = await fetch(`${API_BASE}/customers/list?page=2&limit=20`, {
        headers: {
          'x-shop-url': SHOP_URL,
          'Content-Type': 'application/json'
        }
      });

      const page2Data = await page2Response.json();
      console.log(`✅ Page 2 loaded with ${page2Data.data.length} customers\n`);
    }

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testActiveCustomersList();
