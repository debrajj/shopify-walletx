// Use native fetch (Node 18+)

const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function verifyFix() {
  console.log('🔍 VERIFYING CUSTOMER SEARCH FIX\n');
  console.log('=' .repeat(60));
  
  const testCases = [
    { query: 'debrajecomcure@gmail.com', expected: true },
    { query: 'Debraj', expected: true },
    { query: 'debraj', expected: true },
    { query: 'nonexistent@email.com', expected: false }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    console.log(`\n📝 Test: Search for "${test.query}"`);
    console.log(`   Expected: ${test.expected ? 'Found' : 'Not Found'}`);
    
    try {
      const response = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(test.query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-url': SHOP_URL
        }
      });
      
      const data = await response.json();
      const found = !!(data && data.id);
      
      if (found === test.expected) {
        console.log(`   ✅ PASS - ${found ? `Found: ${data.name} (${data.email})` : 'Not found as expected'}`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Expected ${test.expected ? 'found' : 'not found'}, got ${found ? 'found' : 'not found'}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED! Customer search is working correctly.\n');
    console.log('🎯 Next Steps:');
    console.log('   1. Open your browser to http://localhost:5173');
    console.log('   2. Open DevTools (F12) and run: localStorage.clear(); location.reload();');
    console.log('   3. Go to Customers section');
    console.log('   4. Search for: debrajecomcure@gmail.com');
    console.log('   5. You should see Debraj with 2120 coins!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend deployment.\n');
  }
}

verifyFix();
