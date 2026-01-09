/**
 * Test script for Shopify integration
 * Run with: node backend/test-shopify-integration.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const testShopifyIntegration = async () => {
  console.log('🧪 Testing Shopify Integration...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Checking Environment Variables:');
  const requiredVars = ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'HOST', 'DB_HOST'];
  let allVarsPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value && value !== 'your-shopify-api-key' && value !== 'your-actual-api-key' ? '✅' : '❌';
    console.log(`   ${status} ${varName}: ${value ? (value.includes('your-') ? 'NOT SET' : 'SET') : 'MISSING'}`);
    if (!value || value.includes('your-')) allVarsPresent = false;
  });
  
  if (!allVarsPresent) {
    console.log('\n⚠️  Please update .env file with your actual Shopify credentials\n');
  }

  // Test 2: Database Connection
  console.log('\n2️⃣ Testing Database Connection:');
  try {
    const db = require('./src/config/db');
    const result = await db.query('SELECT NOW()');
    console.log('   ✅ Database connected successfully');
    console.log(`   ⏰ Server time: ${result.rows[0].now}`);
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    return;
  }

  // Test 3: Check Tables
  console.log('\n3️⃣ Checking Database Tables:');
  try {
    const db = require('./src/config/db');
    const tables = ['users', 'wallets', 'transactions', 'shopify_sessions'];
    
    for (const table of tables) {
      const result = await db.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ✅ ${table}: ${result.rows[0].count} records`);
    }
  } catch (error) {
    console.log('   ❌ Table check failed:', error.message);
    console.log('   💡 Run your backend server once to initialize tables');
  }

  // Test 4: Shopify Coin Service
  console.log('\n4️⃣ Testing Shopify Coin Service:');
  try {
    const coinService = require('./src/shopify/coinService');
    console.log('   ✅ Coin service loaded successfully');
    console.log('   📦 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(coinService)).filter(m => m !== 'constructor'));
  } catch (error) {
    console.log('   ❌ Coin service failed:', error.message);
  }

  // Test 5: Routes
  console.log('\n5️⃣ Testing Shopify Routes:');
  try {
    const shopifyRoutes = require('./src/shopify/routes');
    console.log('   ✅ Shopify routes loaded successfully');
  } catch (error) {
    console.log('   ❌ Routes failed:', error.message);
  }

  console.log('\n✨ Integration test complete!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Update .env with your Shopify API credentials');
  console.log('   2. Start your backend: npm run dev --prefix backend');
  console.log('   3. Test endpoints using the API documentation in SHOPIFY_INTEGRATION_STATUS.md');
  console.log('   4. Configure webhooks in Shopify admin panel\n');

  process.exit(0);
};

testShopifyIntegration().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
