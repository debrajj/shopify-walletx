// Simulate the exact browser API call
const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function simulateBrowserCall() {
  console.log('🌐 Simulating Browser API Call...\n');
  
  // Test different search terms
  const searchTerms = ['debraj', 'Debraj', 'debrajecomcure@gmail.com', 'debrajecocmure@gmail.com'];
  
  for (const searchTerm of searchTerms) {
    console.log(`\n🔍 Searching for: "${searchTerm}"`);
    console.log(`   URL: ${API_BASE}/customers/search?q=${encodeURIComponent(searchTerm)}`);
    
    try {
      const response = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-url': SHOP_URL,
        },
      });
      
      console.log(`   Status: ${response.status}`);
      
      const text = await response.text();
      console.log(`   Raw response: ${text.substring(0, 200)}`);
      
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.log(`   ❌ JSON parse error: ${e.message}`);
        continue;
      }
      
      if (data === null) {
        console.log(`   ❌ Result: null (not found)`);
      } else if (data && data.id) {
        console.log(`   ✅ Found: ${data.name} (${data.email || data.phone}) - Balance: ${data.balance}`);
      } else {
        console.log(`   ⚠️  Unexpected response:`, data);
      }
      
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }
  
  // Test the stats endpoint to verify API is working
  console.log('\n\n📊 Testing Stats Endpoint...');
  try {
    const response = await fetch(`${API_BASE}/stats`, {
      headers: {
        'Content-Type': 'application/json',
        'x-shop-url': SHOP_URL,
      },
    });
    
    const data = await response.json();
    console.log(`   Total Wallets: ${data.totalWallets}`);
    console.log(`   Total Coins: ${data.totalCoinsInCirculation}`);
    console.log('   ✅ API is working!');
  } catch (err) {
    console.log(`   ❌ API Error: ${err.message}`);
  }
}

simulateBrowserCall();
