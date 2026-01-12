// Fix store URL by temporarily disabling constraints
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
  
  const client = await pool.connect();
  
  try {
    const oldUrl = 'https://cmstestingg.myshopify.com';
    const newUrl = 'cmstestingg.myshopify.com';
    
    // Start transaction
    await client.query('BEGIN');
    
    // Temporarily disable triggers
    await client.query('SET CONSTRAINTS ALL DEFERRED');
    
    // Update all tables
    await client.query('UPDATE users SET store_url = $1 WHERE store_url = $2', [newUrl, oldUrl]);
    console.log('✅ Updated users');
    
    await client.query('UPDATE app_settings SET store_url = $1 WHERE store_url = $2', [newUrl, oldUrl]);
    console.log('✅ Updated app_settings');
    
    await client.query('UPDATE wallets SET store_url = $1 WHERE store_url = $2', [newUrl, oldUrl]);
    console.log('✅ Updated wallets');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed');
    
    // Verify
    console.log('\nVerifying...\n');
    
    const wallet = await client.query(`
      SELECT * FROM wallets 
      WHERE customer_email = 'deepak@gmail.com' AND store_url = $1
    `, [newUrl]);
    
    if (wallet.rows.length > 0) {
      console.log(`✅ SUCCESS! Deepak wallet ready:`);
      console.log(`   Store: ${wallet.rows[0].store_url}`);
      console.log(`   Email: ${wallet.rows[0].customer_email}`);
      console.log(`   Balance: ${wallet.rows[0].balance} coins`);
      console.log('\n✅ Database is ready for testing!');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixStoreUrl();
