// Add store settings for cmstestingg.myshopify.com
const { Pool } = require('pg');

const pool = new Pool({
  host: 'family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com',
  port: 5432,
  database: 'shopify_wallet',
  user: 'postgres',
  password: 'v4HmYtmNgvsVkRrB81AT',
});

async function addStoreSettings() {
  const storeUrl = 'cmstestingg.myshopify.com';
  
  console.log('🔧 Adding store settings for:', storeUrl);
  console.log('');
  
  try {
    // Check if settings exist
    const checkResult = await pool.query(
      'SELECT * FROM app_settings WHERE store_url = $1',
      [storeUrl]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Store settings already exist');
      console.log(checkResult.rows[0]);
    } else {
      console.log('📝 Creating default store settings...');
      
      await pool.query(
        `INSERT INTO app_settings (
          store_url,
          use_custom_api,
          custom_api_wallet_balance_url,
          custom_api_auth_header_key,
          custom_api_auth_header_value
        ) VALUES ($1, $2, $3, $4, $5)`,
        [storeUrl, false, null, null, null]
      );
      
      console.log('✅ Store settings created!');
    }
    
    console.log('\n🎉 Setup complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

addStoreSettings();
