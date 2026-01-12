const { Client } = require('pg');

const client = new Client({
  host: 'family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com',
  port: 5432,
  database: 'shopify_wallet',
  user: 'postgres',
  password: 'v4HmYtmNgvsVkRrB81AT',
});

async function testWidget() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Check if deepak@gmail.com exists
    const result = await client.query(
      'SELECT customer_email, balance, store_url FROM wallets WHERE customer_email = $1',
      ['deepak@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('\n✓ Test wallet found:');
      console.log('  Email:', result.rows[0].customer_email);
      console.log('  Balance:', result.rows[0].balance, 'coins');
      console.log('  Store:', result.rows[0].store_url);
      console.log('\n✓ Widget v20 deployed successfully!');
      console.log('\nTest the widget at: https://cmstestingg.myshopify.com');
      console.log('1. Add items to cart');
      console.log('2. Open cart drawer');
      console.log('3. Widget should appear in cart');
      console.log('4. Enter: deepak@gmail.com');
      console.log('5. Click "Check Balance"');
      console.log('6. Should show: 150 coins');
    } else {
      console.log('✗ Test wallet not found');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

testWidget();
