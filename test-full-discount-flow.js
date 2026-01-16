// Test the full discount creation flow
require('dotenv').config();

async function testDiscountFlow() {
  const API_BASE = 'https://shopify-walletx.onrender.com/api';
  const shop = 'www.kushals.com';
  
  // Test case: Customer wants to redeem 50 coins
  const coinsToRedeem = 50;
  const coinValue = 1; // 1 coin = ₹1
  const discountAmount = coinsToRedeem * coinValue; // Should be 50
  
  console.log('🧪 Testing Discount Creation Flow\n');
  console.log('Input:');
  console.log(`  Coins to redeem: ${coinsToRedeem}`);
  console.log(`  Coin value: ₹${coinValue}`);
  console.log(`  Calculated discount: ₹${discountAmount}`);
  console.log(`  Expected in Shopify: "${discountAmount.toFixed(2)}"\n`);
  
  const discountCode = `TEST${Date.now()}`;
  
  const requestBody = {
    email: 'debrajecomcure@gmail.com',
    coinsToRedeem: coinsToRedeem,
    discountAmount: discountAmount,
    discountCode: discountCode,
  };
  
  console.log('📤 Request body:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('');
  
  try {
    console.log('🌐 Sending request to:', `${API_BASE}/shopify/create-discount`);
    
    const response = await fetch(`${API_BASE}/shopify/create-discount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shop-url': shop,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`📥 Response status: ${response.status}\n`);
    
    const data = await response.json();
    console.log('📥 Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Discount created successfully!');
      console.log(`   Code: ${data.discountCode}`);
      console.log(`   Expected value: ₹${data.discountValue}`);
      
      if (data.actualDiscountValue !== undefined) {
        console.log(`   Actual value in Shopify: ₹${data.actualDiscountValue}`);
        console.log(`   Verified: ${data.verified ? 'Yes' : 'No'}`);
        
        if (data.amountMismatch) {
          console.log(`   ⚠️  MISMATCH DETECTED!`);
          const diff = Math.abs(data.discountValue - data.actualDiscountValue);
          console.log(`   Difference: ₹${diff.toFixed(2)}`);
        } else {
          console.log(`   ✅ Amounts match!`);
        }
      }
      
      if (data.discountId) {
        console.log(`   Shopify ID: ${data.discountId}`);
      }
      
      console.log(`   New balance: ${data.newBalance} coins`);
      console.log(`   Is automatic: ${data.isAutomatic ? 'Yes' : 'No'}`);
    } else {
      console.log('\n❌ Failed to create discount');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testDiscountFlow();
