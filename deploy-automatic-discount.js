#!/usr/bin/env node

/**
 * Automated deployment script for automatic discount feature
 * Runs all necessary checks and migrations
 */

const db = require('./backend/src/config/db');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDatabaseConnection() {
  log('\n1️⃣  Checking database connection...', 'cyan');
  try {
    const result = await db.query('SELECT NOW()');
    log('✅ Database connected', 'green');
    return true;
  } catch (error) {
    log('❌ Database connection failed: ' + error.message, 'red');
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

async function runMigration() {
  log('\n2️⃣  Running database migration...', 'cyan');
  
  const exists = await checkTableExists('discount_codes');
  
  if (exists) {
    log('⚠️  Table discount_codes already exists', 'yellow');
    log('   Skipping migration', 'yellow');
    return true;
  }
  
  try {
    const migrationPath = path.join(__dirname, 'backend/src/migrations/add_discount_codes_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(sql);
    log('✅ Migration completed successfully', 'green');
    return true;
  } catch (error) {
    log('❌ Migration failed: ' + error.message, 'red');
    return false;
  }
}

async function verifyTableStructure() {
  log('\n3️⃣  Verifying table structure...', 'cyan');
  
  try {
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'discount_codes'
      ORDER BY ordinal_position;
    `);
    
    const expectedColumns = [
      'id', 'store_url', 'discount_code', 'customer_email',
      'coins_redeemed', 'discount_amount', 'is_used', 'used_at',
      'created_at', 'expires_at'
    ];
    
    const actualColumns = result.rows.map(r => r.column_name);
    const missing = expectedColumns.filter(col => !actualColumns.includes(col));
    
    if (missing.length > 0) {
      log('⚠️  Missing columns: ' + missing.join(', '), 'yellow');
      return false;
    }
    
    log('✅ Table structure verified', 'green');
    log('   Columns: ' + actualColumns.join(', '), 'blue');
    return true;
  } catch (error) {
    log('❌ Verification failed: ' + error.message, 'red');
    return false;
  }
}

async function checkStoreConfiguration() {
  log('\n4️⃣  Checking store configuration...', 'cyan');
  
  try {
    const result = await db.query(`
      SELECT 
        store_url,
        store_name,
        CASE WHEN shopify_access_token IS NOT NULL THEN 'Configured' ELSE 'Missing' END as api_token
      FROM users
      LIMIT 5;
    `);
    
    if (result.rows.length === 0) {
      log('⚠️  No stores found in database', 'yellow');
      return false;
    }
    
    log('✅ Found ' + result.rows.length + ' store(s)', 'green');
    result.rows.forEach(store => {
      const tokenStatus = store.api_token === 'Configured' ? '✅' : '⚠️ ';
      log(`   ${tokenStatus} ${store.store_url} - Token: ${store.api_token}`, 
          store.api_token === 'Configured' ? 'green' : 'yellow');
    });
    
    const hasToken = result.rows.some(s => s.api_token === 'Configured');
    if (!hasToken) {
      log('\n💡 Tip: Run "node add-shopify-token.js" to configure API token', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('❌ Check failed: ' + error.message, 'red');
    return false;
  }
}

async function testDiscountService() {
  log('\n5️⃣  Testing discount service...', 'cyan');
  
  try {
    const { createShopifyDiscount } = require('./backend/src/shopify/discountService');
    log('✅ Discount service loaded successfully', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to load discount service: ' + error.message, 'red');
    return false;
  }
}

async function checkExistingDiscounts() {
  log('\n6️⃣  Checking existing discounts...', 'cyan');
  
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used,
        COUNT(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 END) as active,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired
      FROM discount_codes;
    `);
    
    const stats = result.rows[0];
    log('✅ Discount statistics:', 'green');
    log(`   Total: ${stats.total}`, 'blue');
    log(`   Used: ${stats.used}`, 'blue');
    log(`   Active: ${stats.active}`, 'blue');
    log(`   Expired: ${stats.expired}`, 'blue');
    
    return true;
  } catch (error) {
    log('⚠️  Could not fetch discount stats: ' + error.message, 'yellow');
    return true; // Non-critical
  }
}

async function displaySummary(results) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 DEPLOYMENT SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const checks = [
    { name: 'Database Connection', passed: results.dbConnection },
    { name: 'Migration', passed: results.migration },
    { name: 'Table Structure', passed: results.tableStructure },
    { name: 'Store Configuration', passed: results.storeConfig },
    { name: 'Discount Service', passed: results.discountService },
    { name: 'Existing Discounts', passed: results.existingDiscounts }
  ];
  
  checks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    const color = check.passed ? 'green' : 'red';
    log(`${status} ${check.name}`, color);
  });
  
  const allPassed = checks.every(c => c.passed);
  
  log('\n' + '='.repeat(60), 'cyan');
  
  if (allPassed) {
    log('🎉 ALL CHECKS PASSED!', 'green');
    log('\n✅ Automatic discount feature is ready to use', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('   1. Test with: node test-automatic-discount.js', 'blue');
    log('   2. Deploy backend: git push origin main', 'blue');
    log('   3. Deploy widget: shopify theme push', 'blue');
    log('   4. Monitor logs in Render dashboard', 'blue');
  } else {
    log('⚠️  SOME CHECKS FAILED', 'yellow');
    log('\n📝 Please fix the issues above before deploying', 'yellow');
  }
  
  log('');
}

async function main() {
  log('🚀 Automatic Discount Feature - Deployment Script', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const results = {
    dbConnection: false,
    migration: false,
    tableStructure: false,
    storeConfig: false,
    discountService: false,
    existingDiscounts: false
  };
  
  try {
    results.dbConnection = await checkDatabaseConnection();
    if (!results.dbConnection) {
      log('\n❌ Cannot proceed without database connection', 'red');
      return;
    }
    
    results.migration = await runMigration();
    results.tableStructure = await verifyTableStructure();
    results.storeConfig = await checkStoreConfiguration();
    results.discountService = await testDiscountService();
    results.existingDiscounts = await checkExistingDiscounts();
    
    await displaySummary(results);
    
  } catch (error) {
    log('\n❌ Deployment script failed: ' + error.message, 'red');
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Run deployment
main();
