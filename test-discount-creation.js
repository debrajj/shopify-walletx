// Using native fetch (Node 18+)

const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';
const TEST_EMAIL = 'debrajecomcure@gmail.com';

async function testDiscountCreation() {
  console.log('🧪 Testing discount creation...\n');
  
  // Test data
  const coinsToUse = 200;
  const discountAmount = 200; // 200 coins = ₹200
  const timestamp = Date.now().toString().slice(-6);
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const discountCode = `WALLET${timestamp}${randomNum}`.toUpperCase();
  
  console.log('📝 Request details:');
  console.log('  Email:', TEST_EMAIL);
  console.log('  Coins:', coinsToUse);
  console.log('  Discount Amount: ₹' + discountAmount);
  console.log('  Discount Code:', discountCode);
  console.log('  Shop:', SHOP_URL);
  console.log('');
  
  try {
    const response = await fetch(API_BASE + '/shopify/create-discount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shop-url': SHOP_URL,
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        coinsToRedeem: coinsToUse,
        discountAmount: discountAmount,
        discountCode: discountCode,
      }),
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    
    const data = await response.json();
    
    console.log('\n📦 Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ SUCCESS!');
      console.log('  Discount Code:', data.discountCode);
      console.log('  New Balance:', data.newBalance, 'coins');
      if (data.requiresManualSetup) {
        console.log('  ⚠️  Requires manual setup in Shopify admin');
      }
    } else {
      console.log('\n❌ FAILED!');
      console.log('  Error:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

testDiscountCreation();
