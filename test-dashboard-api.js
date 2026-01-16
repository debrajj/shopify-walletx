// Test dashboard API endpoints
const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API...\n');
  
  // Test 1: Stats
  console.log('1️⃣ Testing /stats endpoint...');
  try {
    const statsResponse = await fetch(`${API_BASE}/stats`, {
      headers: {
        'x-shop-url': SHOP_URL,
      },
    });
    
    console.log('   Status:', statsResponse.status);
    const statsData = await statsResponse.json();
    console.log('   Data:', JSON.stringify(statsData, null, 2));
    console.log('');
  } catch (err) {
    console.error('   ❌ Error:', err.message);
    console.log('');
  }
  
  // Test 2: Customer Search
  console.log('2️⃣ Testing /customers/search endpoint...');
  try {
    const searchResponse = await fetch(`${API_BASE}/customers/search?q=debrajecomcure@gmail.com`, {
      headers: {
        'x-shop-url': SHOP_URL,
      },
    });
    
    console.log('   Status:', searchResponse.status);
    const searchData = await searchResponse.json();
    console.log('   Data:', JSON.stringify(searchData, null, 2));
    console.log('');
  } catch (err) {
    console.error('   ❌ Error:', err.message);
    console.log('');
  }
  
  // Test 3: Transactions
  console.log('3️⃣ Testing /transactions endpoint...');
  try {
    const txResponse = await fetch(`${API_BASE}/transactions?page=1&limit=10`, {
      headers: {
        'x-shop-url': SHOP_URL,
      },
    });
    
    console.log('   Status:', txResponse.status);
    const txData = await txResponse.json();
    console.log('   Transactions found:', txData.meta.total);
    console.log('');
  } catch (err) {
    console.error('   ❌ Error:', err.message);
    console.log('');
  }
  
  console.log('✅ Test complete!');
}

testDashboardAPI();
