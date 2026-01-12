// Check database directly for existing data
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

async function checkDatabase() {
  console.log('='.repeat(60));
  console.log('CHECKING DATABASE FOR EXISTING DATA');
  console.log('='.repeat(60));
  console.log('\n');
  
  try {
    // Check users table
    console.log('1. Checking USERS table (stores)...\n');
    const users = await pool.query('SELECT id, name, email, store_name, store_url FROM users LIMIT 10');
    console.log(`Found ${users.rows.length} stores:`);
    users.rows.forEach(u => {
      console.log(`  - ${u.store_url} (${u.store_name})`);
    });
    console.log('\n');
    
    // Check wallets table
    console.log('2. Checking WALLETS table...\n');
    const wallets = await pool.query(`
      SELECT id, store_url, customer_name, customer_phone, customer_email, balance 
      FROM wallets 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log(`Found ${wallets.rows.length} wallets:`);
    wallets.rows.forEach(w => {
      console.log(`  - ${w.customer_name || 'N/A'} | Phone: ${w.customer_phone || 'N/A'} | Email: ${w.customer_email || 'N/A'} | Balance: ${w.balance} | Store: ${w.store_url}`);
    });
    console.log('\n');
    
    // Check for deepak specifically
    console.log('3. Searching for "deepak"...\n');
    const deepak = await pool.query(`
      SELECT * FROM wallets 
      WHERE customer_name ILIKE '%deepak%' 
         OR customer_phone ILIKE '%deepak%'
         OR customer_email ILIKE '%deepak%'
         OR phone_hash ILIKE '%deepak%'
    `);
    
    if (deepak.rows.length > 0) {
      console.log(`✅ Found ${deepak.rows.length} record(s) for deepak:`);
      deepak.rows.forEach(d => {
        console.log('\n  Record:');
        console.log(`    ID: ${d.id}`);
        console.log(`    Store: ${d.store_url}`);
        console.log(`    Name: ${d.customer_name}`);
        console.log(`    Phone: ${d.customer_phone}`);
        console.log(`    Email: ${d.customer_email || 'NOT SET'}`);
        console.log(`    Phone Hash: ${d.phone_hash}`);
        console.log(`    Balance: ${d.balance}`);
      });
    } else {
      console.log('❌ No records found for deepak');
    }
    console.log('\n');
    
    // Check if customer_email column exists
    console.log('4. Checking if customer_email column exists...\n');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wallets'
      ORDER BY ordinal_position
    `);
    console.log('Wallets table columns:');
    columns.rows.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type})`);
    });
    
    const hasEmailColumn = columns.rows.some(c => c.column_name === 'customer_email');
    if (hasEmailColumn) {
      console.log('\n✅ customer_email column EXISTS');
    } else {
      console.log('\n❌ customer_email column MISSING - need to run migration');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n');
  console.log('='.repeat(60));
}

checkDatabase();
