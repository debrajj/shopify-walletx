// Check discount amounts in database to diagnose the issue
require('dotenv').config();
const db = require('./backend/src/config/db');

async function checkDiscountAmounts() {
  try {
    console.log('Checking discount amounts in database...\n');
    
    // Check if discount_codes table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'discount_codes'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ discount_codes table does not exist yet.');
      console.log('Run the migration first: node backend/run-discount-verification-migration.js');
      process.exit(0);
    }
    
    // Get recent discount codes with amount comparison
    const result = await db.query(`
      SELECT 
        discount_code,
        customer_email,
        coins_redeemed,
        discount_amount as expected_amount,
        actual_discount_amount,
        amount_verified,
        amount_mismatch,
        created_at,
        CASE 
          WHEN actual_discount_amount IS NOT NULL 
          THEN ABS(discount_amount - actual_discount_amount)
          ELSE NULL
        END as difference
      FROM discount_codes
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    if (result.rows.length === 0) {
      console.log('No discount codes found in database yet.');
      console.log('Create a discount through the widget to test.');
      process.exit(0);
    }
    
    console.log(`Found ${result.rows.length} recent discount codes:\n`);
    console.log('═'.repeat(120));
    
    let mismatchCount = 0;
    
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Code: ${row.discount_code}`);
      console.log(`   Email: ${row.customer_email}`);
      console.log(`   Coins Redeemed: ${row.coins_redeemed}`);
      console.log(`   Expected Amount: ₹${parseFloat(row.expected_amount).toFixed(2)}`);
      
      if (row.actual_discount_amount) {
        console.log(`   Actual Amount: ₹${parseFloat(row.actual_discount_amount).toFixed(2)}`);
        console.log(`   Difference: ₹${parseFloat(row.difference || 0).toFixed(2)}`);
        console.log(`   Verified: ${row.amount_verified ? '✅ Yes' : '❌ No'}`);
        
        if (row.amount_mismatch) {
          console.log(`   ⚠️  MISMATCH DETECTED!`);
          mismatchCount++;
        }
      } else {
        console.log(`   Actual Amount: Not verified yet`);
      }
      
      console.log(`   Created: ${row.created_at}`);
      console.log('─'.repeat(120));
    });
    
    console.log(`\n\nSummary:`);
    console.log(`  Total discounts: ${result.rows.length}`);
    console.log(`  Mismatches: ${mismatchCount}`);
    console.log(`  Match rate: ${((result.rows.length - mismatchCount) / result.rows.length * 100).toFixed(1)}%`);
    
    if (mismatchCount > 0) {
      console.log(`\n⚠️  Found ${mismatchCount} amount mismatches!`);
      console.log('This indicates the discount amounts in Shopify don\'t match what was requested.');
    } else {
      console.log('\n✅ All verified discounts match expected amounts!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDiscountAmounts();
