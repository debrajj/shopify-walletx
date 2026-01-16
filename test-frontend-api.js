// Test the exact API call the frontend makes
const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function testFrontendAPI() {
  console.log('🔍 Testing Frontend API Call...\n');
  
  const searchTerm = 'debraj';
  
  console.log(`Search term: "${searchTerm}"`);
  console.log(`API URL: ${API_BASE}/customers/search?q=${encodeURIComponent(searchTerm)}`);
  console.log(`Headers: x-shop-url: ${SHOP_URL}\n`);
  
  try {
    const response = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-shop-url': SHOP_URL,
      },
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    
    console.log('\n📊 Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data === null) {
      console.log('\n❌ API returned null - customer not found');
    } else if (data) {
      console.log('\n✅ Customer found!');
      console.log(`   ID: ${data.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Phone: ${data.phone}`);
      console.log(`   Balance: ${data.balance}`);
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
  
  // Test with email
  console.log('\n\n🔍 Testing with email...\n');
  const emailSearch = 'debrajecomcure@gmail.com';
  
  try {
    const response = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(emailSearch)}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-shop-url': SHOP_URL,
      },
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    
    console.log('\n📊 Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data === null) {
      console.log('\n❌ API returned null - customer not found');
    } else if (data) {
      console.log('\n✅ Customer found!');
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
}

testFrontendAPI();
