// Fix store URL - remove https:// prefix
const { Pool } = require('pg');

const pool = new Pool({
  host: 'family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com',
  port: 5432,
  database: 'shopify_wallet',
  user: 'postgres',
  password: 'v4HmYtmNgvsVkRrB81AT',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixStoreUrl() {
  console.log('Fixing store URLs...\n');
  
  try {
    // Check current users
    const users = await pool.query('SELECT * FROM users');
    console.log('Current users:');
    users.rows.forEach(u => {
      console.log(`  - ${u.store_url}`);
    });
    console.log('');
    
    // Update users table
    await pool.query(`
      UPDATE users 
      SET store_url = REPLACE(REPLACE(store_url, 'https://', ''), 'http://', '')
      WHERE store_url LIKE 'http%'
    `);
    console.log('✅ Updated users table');
    
    // Update wallets table
    await pool.query(`
      UPDATE wallets 
      SET store_url = REPLACE(REPLACE(store_url, 'https://', ''), 'http://', '')
      WHERE store_url LIKE 'http%'
    `);
    console.log('✅ Updated wallets table');
    
    // Update app_settings table
    await pool.query(`
      UPDATE app_settings 
      SET store_url = REPLACE(REPLACE(store_url, 'https://', ''), 'http://', '')
      WHERE store_url LIKE 'http%'
    `);
    console.log('✅ Updated app_settings table');
    
    // Verify
    console.log('\nVerifying updates...\n');
    const updatedUsers = await pool.query('SELECT store_url FROM users');
    console.log('Updated users:');
    updatedUsers.rows.forEach(u => {
      console.log(`  - ${u.store_url}`);
    });
    
    const deepakWallet = await pool.query(`
      SELECT * FROM wallets 
      WHERE customer_email = 'deepak@gmail.com'
    `);
    
    if (deepakWallet.rows.length > 0) {
      console.log('\n✅ Deepak wallet found:');
      console.log(`   Store: ${deepakWallet.rows[0].store_url}`);
      console.log(`   Email: ${deepakWallet.rows[0].customer_email}`);
      console.log(`   Balance: ${deepakWallet.rows[0].balance} coins`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixStoreUrl();
