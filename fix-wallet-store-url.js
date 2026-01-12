const { Client } = require('pg');

const client = new Client({
  host: 'family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com',
  port: 5432,
  database: 'shopify_wallet',
  user: 'postgres',
  password: 'v4HmYtmNgvsVkRrB81AT',
});

async function fix() {
  try {
    await client.connect();
    
    // Delete the duplicate with 0 coins first
    await client.query(`
      DELETE FROM wallets 
      WHERE customer_email = 'deepak@gmail.com' 
      AND store_url = 'https://cmstestingg.myshopify.com'
      AND balance = 0
    `);
    
    console.log('✓ Deleted duplicate wallet entry');
    
    // Update the wallet with 150 coins to use https:// prefix
    await client.query(`
      UPDATE wallets 
      SET store_url = 'https://cmstestingg.myshopify.com'
      WHERE customer_email = 'deepak@gmail.com' 
      AND store_url = 'cmstestingg.myshopify.com'
    `);
    
    console.log('✓ Updated wallet store URL to include https://');
    
    // Verify
    const result = await client.query(
      'SELECT customer_email, balance, store_url FROM wallets WHERE customer_email = $1',
      ['deepak@gmail.com']
    );
    
    console.log('\n✓ Final wallet state:');
    console.log('  Email:', result.rows[0].customer_email);
    console.log('  Balance:', result.rows[0].balance, 'coins');
    console.log('  Store:', result.rows[0].store_url);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fix();
