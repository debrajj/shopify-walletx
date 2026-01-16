// Check if backend deployment is complete

const API_BASE = 'https://shopify-walletx.onrender.com/api';
const SHOP_URL = 'cmstestingg.myshopify.com';

async function checkDeployment() {
  console.log('🚀 CHECKING BACKEND DEPLOYMENT STATUS\n');
  console.log('=' .repeat(60));
  
  console.log('\n⏳ Waiting for Render to deploy the new code...');
  console.log('   This usually takes 2-3 minutes.\n');
  
  let attempts = 0;
  const maxAttempts = 20;
  const delayMs = 10000; // 10 seconds
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n🔍 Attempt ${attempts}/${maxAttempts}...`);
    
    try {
      // Test customer search
      const response = await fetch(`${API_BASE}/customers/search?q=debraj`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-url': SHOP_URL
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
          console.log(`   Customer search is working: ${data.name} (${data.email})`);
          console.log('\n🎯 Next Steps:');
          console.log('   1. Refresh your browser (or clear localStorage)');
          console.log('   2. Go to Customers section');
          console.log('   3. Search for: debrajecomcure@gmail.com');
          console.log('   4. You should see the customer now!\n');
          return;
        }
      }
      
      console.log('   ⏳ Still deploying...');
      
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
    }
    
    if (attempts < maxAttempts) {
      console.log(`   Waiting ${delayMs/1000} seconds before next check...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log('\n⚠️  Deployment check timed out.');
  console.log('   Please check Render dashboard manually:');
  console.log('   https://dashboard.render.com/\n');
}

checkDeployment();
