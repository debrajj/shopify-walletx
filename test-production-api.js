const https = require('https');

const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

console.log('🧪 Testing Production API\n');
console.log(`API Base: ${API_BASE}`);
console.log(`Shop: ${SHOP_URL}\n`);

// Test the new customers/list endpoint
const url = `${API_BASE}/customers/list?page=1&limit=20`;

https.get(url, {
  headers: {
    'x-shop-url': SHOP_URL,
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.data) {
        console.log(`\n✅ Found ${json.data.length} customers`);
      } else if (json.error) {
        console.log(`\n❌ Error: ${json.error}`);
      }
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Request failed:', err.message);
});
