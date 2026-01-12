// Test with real email from database
const API_BASE = 'https://shopify-walletx.onrender.com/api';

async function testRealEmail() {
  console.log('Testing with real email: deepak@gmail.com\n');
  
  const testEmail = 'deepak@gmail.com';
  
  // Try different shop URLs
  const shopUrls = [
    'walttz.myshopify.com',
    'quickstart-4c0d9f8f.myshopify.com',
    'your-store.myshopify.com'
  ];
  
  for (const shopUrl of shopUrls) {
    console.log(`\nTrying shop: ${shopUrl}`);
    try {
      const response = await fetch(
        `${API_BASE}/wallet/balance?email=${encodeURIComponent(testEmail)}`,
        {
          headers: {
            'x-shop-url': shopUrl,
          },
        }
      );
      
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log(`✅ SUCCESS! Balance: ${data.walletCoins} coins`);
        console.log(`✅ Shop URL: ${shopUrl}`);
        break;
      } else {
        console.log(`❌ Failed: ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('❌ Network error:', error.message);
    }
  }
}

// Also test with phone to see what data exists
async function testWithPhone() {
  console.log('\n\n=== Testing with phone numbers ===\n');
  
  const phones = [
    '+919876543210',
    '9876543210',
    '1234567890'
  ];
  
  const shopUrl = 'walttz.myshopify.com';
  
  for (const phone of phones) {
    console.log(`\nTrying phone: ${phone}`);
    try {
      const response = await fetch(
        `${API_BASE}/wallet/balance?phone=${encodeURIComponent(phone)}`,
        {
          headers: {
            'x-shop-url': shopUrl,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Found! Balance: ${data.walletCoins} coins`);
        break;
      } else {
        console.log(`❌ Not found`);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

(async () => {
  await testRealEmail();
  await testWithPhone();
  
  console.log('\n\n=== Test Complete ===');
})();
