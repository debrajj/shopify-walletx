// Final test after backend deployment and database migration
const API_BASE = 'https://shopify-walletx.onrender.com/api';

async function finalTest() {
  console.log('='.repeat(60));
  console.log('FINAL TEST - Email Support for Wallet Widget');
  console.log('='.repeat(60));
  console.log('\n');
  
  const shopUrl = 'cmstestingg.myshopify.com';
  const testEmail = 'deepak@gmail.com';
  
  console.log('Configuration:');
  console.log(`  Shop URL: ${shopUrl}`);
  console.log(`  Test Email: ${testEmail}`);
  console.log(`  API Base: ${API_BASE}`);
  console.log('\n');
  
  console.log('Testing API endpoint...\n');
  
  try {
    const url = `${API_BASE}/wallet/balance?email=${encodeURIComponent(testEmail)}`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'x-shop-url': shopUrl,
      },
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}\n`);
    
    const data = await response.json();
    console.log('Response Data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');
    
    if (data.success) {
      console.log('✅ SUCCESS! API is working correctly!');
      console.log(`   Balance: ${data.walletCoins} coins`);
      console.log(`   Currency: ${data.currency || 'INR'}`);
      console.log('\n');
      console.log('Next Steps:');
      console.log('1. Go to https://cmstestingg.myshopify.com');
      console.log('2. Add items to cart');
      console.log('3. Open cart drawer');
      console.log('4. Enter deepak@gmail.com in the widget');
      console.log('5. Click "Check Balance"');
      console.log(`6. Should see: ${data.walletCoins} coins`);
    } else {
      console.log('❌ FAILED!');
      console.log(`   Error: ${data.error}`);
      console.log('\n');
      console.log('Troubleshooting:');
      
      if (data.error === 'Store not registered with ShopWallet') {
        console.log('• Store not registered in users table');
        console.log('• Run: INSERT INTO users (store_url, ...) VALUES (\'cmstestingg.myshopify.com\', ...)');
      } else if (data.error === 'Email or phone number is required') {
        console.log('• Backend has old code (not deployed yet)');
        console.log('• Wait for Render to deploy latest code');
      } else {
        console.log('• Check backend logs on Render');
        console.log('• Verify database migration ran successfully');
        console.log('• Ensure deepak@gmail.com exists in wallets table');
      }
    }
    
  } catch (error) {
    console.log('❌ NETWORK ERROR!');
    console.log(`   ${error.message}`);
    console.log('\n');
    console.log('Possible causes:');
    console.log('• Backend is down');
    console.log('• Network connectivity issue');
    console.log('• CORS issue (unlikely for API calls)');
  }
  
  console.log('\n');
  console.log('='.repeat(60));
}

// Run the test
finalTest();
