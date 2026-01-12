const { Client } = require('pg');

const client = new Client({
  host: 'family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com',
  port: 5432,
  database: 'shopify_wallet',
  user: 'postgres',
  password: 'v4HmYtmNgvsVkRrB81AT',
});

async function debug() {
  try {
    await client.connect();
    
    // Check all wallets with deepak email
    const result = await client.query(
      'SELECT customer_email, balance, store_url FROM wallets WHERE customer_email LIKE $1',
      ['%deepak%']
    );

    console.log('Found wallets:');
    result.rows.forEach(row => {
      console.log('  Email:', row.customer_email);
      console.log('  Balance:', row.balance);
      console.log('  Store URL:', row.store_url);
      console.log('---');
    });

    // Check users table for store registration
    const users = await client.query('SELECT store_url FROM users');
    console.log('\nRegistered stores:');
    users.rows.forEach(row => {
      console.log('  -', row.store_url);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

debug();
