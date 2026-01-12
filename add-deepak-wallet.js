// Add deepak@gmail.com wallet with coins
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

async function addDeepakWallet() {
  console.log('Adding deepak@gmail.com wallet...\n');
  
  try {
    const storeUrl = 'https://cmstestingg.myshopify.com';
    const email = 'deepak@gmail.com';
    const balance = 150.00;
    
    // Insert wallet
    const result = await pool.query(`
      INSERT INTO wallets (store_url, phone_hash, customer_name, customer_email, balance)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (store_url, phone_hash) 
      DO UPDATE SET customer_email = $4, balance = $5
      RETURNING *
    `, [storeUrl, email, 'Deepak', email, balance]);
    
    console.log('✅ Wallet created/updated successfully!\n');
    console.log('Details:');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Store: ${result.rows[0].store_url}`);
    console.log(`  Name: ${result.rows[0].customer_name}`);
    console.log(`  Email: ${result.rows[0].customer_email}`);
    console.log(`  Balance: ${result.rows[0].balance} coins`);
    console.log('');
    
    // Verify
    console.log('Verifying...\n');
    const verify = await pool.query(`
      SELECT * FROM wallets 
      WHERE customer_email = $1 AND store_url = $2
    `, [email, storeUrl]);
    
    if (verify.rows.length > 0) {
      console.log('✅ Verification successful!');
      console.log(`   Found wallet with ${verify.rows[0].balance} coins`);
    } else {
      console.log('❌ Verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addDeepakWallet();
