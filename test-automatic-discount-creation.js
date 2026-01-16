async function testAutomaticDiscountCreation() {
  const shopUrl = 'cmstestingg.myshopify.com';
  const email = 'debrajecomcure@gmail.com';
  const coinsToRedeem = 50;
  const discountAmount = 50;
  const discountCode = `COIN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  console.log('🧪 Testing Automatic Discount Creation');
  console.log('=====================================');
  console.log('Shop:', shopUrl);
  console.log('Email:', email);
  console.log('Coins:', coinsToRedeem);
  console.log('Amount:', discountAmount);
  console.log('Code:', discountCode);
  console.log('');

  try {
    const response = await fetch('https://shopify-walletx.onrender.com/api/shopify/create-discount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shop-url': shopUrl,
      },
      body: JSON.stringify({
        email,
        coinsToRedeem,
        discountAmount,
        discountCode,
      }),
    });

    const data = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('');
      console.log('✅ SUCCESS!');
      console.log('Discount Type:', data.isAutomatic ? 'AUTOMATIC' : 'CODE');
      console.log('Discount Value:', data.discountValue);
      console.log('Message:', data.message);
      
      if (data.isAutomatic) {
        console.log('');
        console.log('🎉 Automatic discount created!');
        console.log('The discount will apply automatically at checkout for', email);
      } else if (data.requiresManualSetup) {
        console.log('');
        console.log('⚠️  Manual setup required');
        console.log('Please create discount in Shopify admin:');
        console.log('Code:', discountCode);
        console.log('Amount: ₹' + discountAmount);
      }
    } else {
      console.log('');
      console.log('❌ FAILED');
      console.log('Error:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
  }
}

testAutomaticDiscountCreation();
