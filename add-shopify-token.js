// Script to add Shopify API access token to database
const { Pool } = require('pg');

const pool = new Pool({
  host: 'family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com',
  port: 5432,
  database: 'shopify_wallet',
  user: 'postgres',
  password: 'v4HmYtmNgvsVkRrB81AT',
});

async function addShopifyToken() {
  const token = process.argv[2];
  const storeUrl = 'cmstestingg.myshopify.com';
  
  if (!token) {
    console.error('❌ Error: Please provide Shopify access token');
    console.log('\nUsage:');
    console.log('  node add-shopify-token.js YOUR_TOKEN_HERE');
    console.log('\nExample:');
    console.log('  node add-shopify-token.js shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
  }
  
  if (!token.startsWith('shpat_')) {
    console.warn('⚠️  Warning: Token should start with "shpat_"');
    console.log('   Make sure you copied the Admin API access token correctly');
  }
  
  console.log('🔧 Adding Shopify API token to database...\n');
  console.log('Store:', storeUrl);
  console.log('Token:', token.substring(0, 15) + '...' + token.substring(token.length - 5));
  console.log('');
  
  try {
    // First check the users table structure
    const schemaResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    // Check if store exists
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE store_url = $1',
      [storeUrl]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('📝 Store found in database, updating token...');
      
      await pool.query(
        'UPDATE users SET shopify_access_token = $1 WHERE store_url = $2',
        [token, storeUrl]
      );
      
      console.log('✅ Token updated successfully!');
    } else {
      console.log('📝 Store not found, creating new entry...');
      
      // Check what columns exist
      const hasCreatedAt = schemaResult.rows.some(col => col.column_name === 'created_at');
      const hasUpdatedAt = schemaResult.rows.some(col => col.column_name === 'updated_at');
      
      if (hasCreatedAt && hasUpdatedAt) {
        await pool.query(
          `INSERT INTO users (name, email, password_hash, store_url, shopify_access_token, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          ['Store Admin', 'admin@' + storeUrl, 'N/A', storeUrl, token]
        );
      } else if (hasCreatedAt) {
        await pool.query(
          `INSERT INTO users (name, email, password_hash, store_url, shopify_access_token, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          ['Store Admin', 'admin@' + storeUrl, 'N/A', storeUrl, token]
        );
      } else {
        await pool.query(
          `INSERT INTO users (name, email, password_hash, store_url, shopify_access_token)
           VALUES ($1, $2, $3, $4, $5)`,
          ['Store Admin', 'admin@' + storeUrl, 'N/A', storeUrl, token]
        );
      }
      
      console.log('✅ Token added successfully!');
    }
    
    // Verify
    const verifyResult = await pool.query(
      `SELECT store_url, 
              CASE 
                WHEN shopify_access_token IS NOT NULL 
                THEN 'Token exists' 
                ELSE 'No token' 
              END as token_status
       FROM users 
       WHERE store_url = $1`,
      [storeUrl]
    );
    
    console.log('\n📊 Verification:');
    console.log(verifyResult.rows[0]);
    
    console.log('\n🎉 Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Test automatic discount creation:');
    console.log('   node test-discount-creation.js');
    console.log('');
    console.log('2. Test in your store:');
    console.log('   - Go to cart');
    console.log('   - Enter email and coins');
    console.log('   - Press Enter');
    console.log('   - Discount will be created automatically!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetails:', error);
  } finally {
    await pool.end();
  }
}

addShopifyToken();
