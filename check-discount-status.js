#!/usr/bin/env node

/**
 * Quick status check for automatic discount feature
 */

const db = require('./backend/src/config/db');

async function checkStatus() {
  console.log('🔍 Automatic Discount Feature - Status Check\n');
  
  try {
    // Check if table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'discount_codes'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ discount_codes table does not exist');
      console.log('💡 Run: node deploy-automatic-discount.js\n');
      return;
    }
    
    console.log('✅ discount_codes table exists\n');
    
    // Get statistics
    const stats = await db.query(`
      SELECT 
        store_url,
        COUNT(*) as total_discounts,
        COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_discounts,
        COUNT(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 END) as active_discounts,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_discounts,
        SUM(discount_amount) as total_savings
      FROM discount_codes
      GROUP BY store_url
      ORDER BY total_discounts DESC;
    `);
    
    if (stats.rows.length === 0) {
      console.log('📊 No discounts created yet\n');
    } else {
      console.log('📊 Discount Statistics by Store:\n');
      stats.rows.forEach(row => {
        console.log(`Store: ${row.store_url}`);
        console.log(`  Total Discounts: ${row.total_discounts}`);
        console.log(`  Used: ${row.used_discounts}`);
        console.log(`  Active: ${row.active_discounts}`);
        console.log(`  Expired: ${row.expired_discounts}`);
        console.log(`  Total Savings: ₹${parseFloat(row.total_savings || 0).toFixed(2)}`);
        console.log('');
      });
    }
    
    // Get recent discounts
    const recent = await db.query(`
      SELECT 
        discount_code,
        customer_email,
        discount_amount,
        is_used,
        created_at,
        expires_at
      FROM discount_codes
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    if (recent.rows.length > 0) {
      console.log('🕐 Recent Discounts:\n');
      recent.rows.forEach(row => {
        const status = row.is_used ? '✅ Used' : 
                      new Date(row.expires_at) < new Date() ? '⏰ Expired' : 
                      '🟢 Active';
        console.log(`${status} ${row.discount_code}`);
        console.log(`  Customer: ${row.customer_email}`);
        console.log(`  Amount: ₹${parseFloat(row.discount_amount).toFixed(2)}`);
        console.log(`  Created: ${new Date(row.created_at).toLocaleString()}`);
        console.log(`  Expires: ${new Date(row.expires_at).toLocaleString()}`);
        console.log('');
      });
    }
    
    // Check store configuration
    const stores = await db.query(`
      SELECT 
        store_url,
        CASE WHEN shopify_access_token IS NOT NULL THEN 'Yes' ELSE 'No' END as has_token
      FROM users;
    `);
    
    console.log('🏪 Store Configuration:\n');
    stores.rows.forEach(row => {
      const icon = row.has_token === 'Yes' ? '✅' : '⚠️ ';
      console.log(`${icon} ${row.store_url} - API Token: ${row.has_token}`);
    });
    
    console.log('\n✅ Status check complete\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkStatus();
