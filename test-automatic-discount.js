/**
 * Test script for automatic discount creation
 * Tests the full flow: balance check, discount creation, and database tracking
 */

const { createShopifyDiscount } = require('./backend/src/shopify/discountService');
const db = require('./backend/src/config/db');
require('dotenv').config();

async function testAutomaticDiscount() {
  console.log('🧪 Testing Automatic Discount Feature\n');
  
  const testData = {
    shopUrl: 'cmstestingg.myshopify.com',
    email: 'debraj@example.com', // Replace with actual test email
    coinsToRedeem: 100,
    discountAmount: 100,
    discountCode: `WALLET${Date.now()}`
  };
  
  console.log('📋 Test Data:', testData);
  console.log('');
  
  try {
    // Step 1: Check if store exists and has API token
    console.log('1️⃣  Checking store configuration...');
    const storeCheck = await db.query(
      'SELECT store_url, shopify_access_token FROM users WHERE store_url = $1',
      [testData.shopUrl]
    );
    
    if (storeCheck.rows.length === 0) {
      console.log('❌ Store not found in database');
      console.log('💡 Run: node add-shopify-token.js to configure store');
      return;
    }
    
    const hasToken = !!storeCheck.rows[0].shopify_access_token;
    console.log(`✅ Store found: ${testData.shopUrl}`);
    console.log(`${hasToken ? '✅' : '⚠️ '} API Token: ${hasToken ? 'Configured' : 'Missing'}`);
    console.log('');
    
    // Step 2: Check wallet balance
    console.log('2️⃣  Checking wallet balance...');
    const walletCheck = await db.query(
      'SELECT * FROM wallets WHERE customer_email = $1 AND store_url = $2',
      [testData.email, testData.shopUrl]
    );
    
    if (walletCheck.rows.length === 0) {
      console.log('❌ Wallet not found for email:', testData.email);
      console.log('💡 Create a wallet first or use a different email');
      return;
    }
    
    const wallet = walletCheck.rows[0];
    const currentBalance = parseFloat(wallet.balance);
    console.log(`✅ Wallet found: ${wallet.customer_email}`);
    console.log(`💰 Current balance: ${currentBalance} coins`);
    
    if (currentBalance < testData.coinsToRedeem) {
      console.log(`❌ Insufficient balance (need ${testData.coinsToRedeem} coins)`);
      return;
    }
    console.log('');
    
    // Step 3: Check for existing active discounts
    console.log('3️⃣  Checking for existing discounts...');
    const existingCheck = await db.query(`
      SELECT * FROM discount_codes 
      WHERE store_url = $1 AND customer_email = $2 AND is_used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `, [testData.shopUrl, testData.email]);
    
    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      console.log('⚠️  Active discount already exists:');
      console.log(`   Code: ${existing.discount_code}`);
      console.log(`   Amount: ₹${existing.discount_amount}`);
      console.log(`   Expires: ${existing.expires_at}`);
      console.log('');
      console.log('💡 Use the existing code or wait for it to expire');
      return;
    }
    
    console.log('✅ No active discounts found');
    console.log('');
    
    // Step 4: Create discount
    console.log('4️⃣  Creating discount...');
    console.log(`   Type: ${hasToken ? 'Automatic Discount (GraphQL)' : 'Manual Setup'}`);
    console.log(`   Amount: ₹${testData.discountAmount}`);
    console.log(`   Code: ${testData.discountCode}`);
    console.log('');
    
    const result = await createShopifyDiscount(
      testData.shopUrl,
      testData.email,
      testData.coinsToRedeem,
      testData.discountAmount,
      testData.discountCode
    );
    
    console.log('📥 Result:', result);
    console.log('');
    
    if (result.success) {
      console.log('✅ Discount created successfully!');
      
      if (result.isAutomatic) {
        console.log('🎉 Type: AUTOMATIC (no code needed)');
      } else if (result.requiresManualSetup) {
        console.log('⚠️  Type: MANUAL SETUP REQUIRED');
        console.log('');
        console.log('📝 Next Steps:');
        console.log('1. Go to Shopify Admin → Discounts');
        console.log(`2. Create new discount code: ${result.discountCode}`);
        console.log(`3. Set amount: ₹${result.discountValue} off`);
        console.log('4. Set usage limit: 1 per customer');
        console.log('5. Set expiration: 24 hours');
      } else {
        console.log('✅ Type: DISCOUNT CODE');
        console.log(`   Code: ${result.discountCode}`);
      }
      
      console.log('');
      
      // Step 5: Verify database entry
      console.log('5️⃣  Verifying database entry...');
      const dbCheck = await db.query(
        'SELECT * FROM discount_codes WHERE discount_code = $1 AND store_url = $2',
        [result.discountCode, testData.shopUrl]
      );
      
      if (dbCheck.rows.length > 0) {
        console.log('✅ Discount tracked in database');
        console.log('   Entry:', dbCheck.rows[0]);
      } else {
        console.log('⚠️  Discount not found in database (may need to be added by API endpoint)');
      }
      
      console.log('');
      console.log('🎉 Test completed successfully!');
      
    } else {
      console.log('❌ Discount creation failed');
      console.log('Error:', result.error || result.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error(error.stack);
  } finally {
    await db.end();
  }
}

// Run test
testAutomaticDiscount();
