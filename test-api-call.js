async function testAPI() {
  try {
    const url = 'https://shopify-walletx.onrender.com/api/wallet/balance?email=deepak@gmail.com';
    
    console.log('Testing API call...');
    console.log('URL:', url);
    console.log('Headers: x-shop-url: cmstestingg.myshopify.com');
    console.log('');
    
    const response = await fetch(url, {
      headers: {
        'x-shop-url': 'cmstestingg.myshopify.com',
      },
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAPI();
