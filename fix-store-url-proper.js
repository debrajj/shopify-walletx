// Fix store URL properly - update child tables first
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
  console.log('Fixing store URLs (proper order)...\n');
  
  try {
    const oldUrl = 'https://cmstestingg.myshopify.com';
    const newUrl = 'cmstestingg.myshopify.com';
    
    // 1. Update wallets first (no foreign key)
    await pool.query('UPDATE wallets SET store_url = $1 WHERE store_url = $2', [newUrl, oldUrl]);
    console.log('✅ Updated wallets table');
    
    // 2. Update app_settings (has foreign key to users)
    await pool.query('UPDATE app_settings SET store_url = $1 WHERE store_url = $2', [newUrl, oldUrl]);
    console.log('✅ Updated app_settings table');
    
    // 3. Update users last
    await pool.query('UPDATE users SET store_url = $1 WHERE store_url = $2', [newUrl, oldUrl]);
    console.log('✅ Updated users table');
    
    // Verify
    console.log('\nVerifying...\n');
    
    const user = await pool.query('SELECT * FROM users WHERE store_url = $1', [newUrl]);
    if (user.rows.length > 0) {
      console.log(`✅ User found: ${user.rows[0].store_url}`);
    }
    
    const wallet = await pool.query(`
      SELECT * FROM wallets 
      WHERE customer_email = 'deepak@gmail.com' AND store_url = $1
    `, [newUrl]);
    
    if (wallet.rows.length > 0) {
      console.log(`✅ Deepak wallet found:`);
      console.log(`   Store: ${wallet.rows[0].store_url}`);
      console.log(`   Email: ${wallet.rows[0].customer_email}`);
      console.log(`   Balance: ${wallet.rows[0].balance} coins`);
    }
    
    console.log('\n✅ All done! Store URL fixed.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixStoreUrl();
