// Test script for email-based wallet balance API
const API_BASE = 'https://shopify-walletx.onrender.com/api';

async function testEmailBalance() {
  console.log('Testing email-based balance lookup...\n');
  
  const testEmail = 'test@example.com';
  const shopUrl = 'walttz.myshopify.com'; // Replace with actual shop URL
  
  try {
    console.log(`1. Testing balance lookup for: ${testEmail}`);
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
      console.log(`✅ Success! Balance: ${data.walletCoins} coins`);
    } else {
      console.log(`❌ Failed: ${data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function testPhoneBalance() {
  console.log('\n\nTesting phone-based balance lookup (backward compatibility)...\n');
  
  const testPhone = '+1234567890';
  const shopUrl = 'walttz.myshopify.com';
  
  try {
    console.log(`2. Testing balance lookup for: ${testPhone}`);
    const response = await fetch(
      `${API_BASE}/wallet/balance?phone=${encodeURIComponent(testPhone)}`,
      {
        headers: {
          'x-shop-url': shopUrl,
        },
      }
    );
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`✅ Success! Balance: ${data.walletCoins} coins`);
    } else {
      console.log(`❌ Failed: ${data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run tests
(async () => {
  await testEmailBalance();
  await testPhoneBalance();
  
  console.log('\n\n=== Test Complete ===');
  console.log('If you see errors, make sure:');
  console.log('1. Backend is deployed to Render');
  console.log('2. Database migration has been run (add customer_email column)');
  console.log('3. Shop URL is correct');
})();
