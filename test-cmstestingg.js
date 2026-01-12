// Test with cmstestingg.myshopify.com and deepak@gmail.com
const API_BASE = 'https://shopify-walletx.onrender.com/api';

async function testCmsTestingShop() {
  console.log('Testing with cmstestingg.myshopify.com\n');
  
  const shopUrl = 'cmstestingg.myshopify.com';
  const testEmail = 'deepak@gmail.com';
  
  console.log(`Shop: ${shopUrl}`);
  console.log(`Email: ${testEmail}\n`);
  
  try {
    console.log('Making API request...');
    const response = await fetch(
      `${API_BASE}/wallet/balance?email=${encodeURIComponent(testEmail)}`,
      {
        headers: {
          'x-shop-url': shopUrl,
        },
      }
    );
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\n✅ SUCCESS!`);
      console.log(`Balance: ${data.walletCoins} coins`);
      console.log(`Currency: ${data.currency || 'INR'}`);
    } else {
      console.log(`\n❌ Failed: ${data.error || 'Unknown error'}`);
      
      if (data.error === 'Store not registered with ShopWallet') {
        console.log('\n💡 The store needs to be registered first.');
        console.log('   Run the backend locally or check if store exists in users table.');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

// Also test if we can check what stores are registered
async function checkStoreRegistration() {
  console.log('\n\n=== Checking Store Registration ===\n');
  console.log('Note: This requires direct database access.');
  console.log('Check the users table for store_url = "cmstestingg.myshopify.com"');
}

(async () => {
  await testCmsTestingShop();
  await checkStoreRegistration();
  
  console.log('\n\n=== Next Steps ===');
  console.log('1. Make sure backend is deployed with latest code');
  console.log('2. Run database migration to add customer_email column');
  console.log('3. Ensure cmstestingg.myshopify.com is registered in users table');
  console.log('4. Add test data with deepak@gmail.com to wallets table');
})();
