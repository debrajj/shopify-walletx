// Test customer search with the exact same setup as the frontend
const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function testCustomerSearch() {
  console.log('🔍 Testing Customer Search...\n');
  
  const searchTerm = 'debrajecomcure@gmail.com';
  
  console.log(`Searching for: ${searchTerm}`);
  console.log(`API: ${API_BASE}/customers/search?q=${encodeURIComponent(searchTerm)}`);
  console.log(`Shop: ${SHOP_URL}\n`);
  
  try {
    const response = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-shop-url': SHOP_URL,
      },
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    console.log('\n📊 Customer Data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data) {
      console.log('\n✅ Customer found!');
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Phone: ${data.phone}`);
      console.log(`   Balance: ${data.balance} coins`);
      console.log(`   Total Orders: ${data.total_orders}`);
      console.log(`   Coins Used: ${data.total_coins_used}`);
    } else {
      console.log('\n❌ No customer found');
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
}

testCustomerSearch();
