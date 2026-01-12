// Add customer_email column to database
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

async function addEmailColumn() {
  console.log('Adding customer_email column to wallets table...\n');
  
  try {
    // Add column
    await pool.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)');
    console.log('✅ Added customer_email column');
    
    // Create index
    await pool.query('CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(customer_email, store_url)');
    console.log('✅ Created index on customer_email');
    
    // Now check the data
    console.log('\nChecking wallets data...\n');
    const wallets = await pool.query(`
      SELECT id, store_url, customer_name, customer_phone, customer_email, phone_hash, balance 
      FROM wallets 
      WHERE store_url LIKE '%cmstestingg%'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${wallets.rows.length} wallet(s) for cmstestingg store:\n`);
    wallets.rows.forEach((w, i) => {
      console.log(`Wallet ${i + 1}:`);
      console.log(`  ID: ${w.id}`);
      console.log(`  Store: ${w.store_url}`);
      console.log(`  Name: ${w.customer_name}`);
      console.log(`  Phone: ${w.customer_phone || 'NULL'}`);
      console.log(`  Email: ${w.customer_email || 'NULL'}`);
      console.log(`  Phone Hash: ${w.phone_hash}`);
      console.log(`  Balance: ${w.balance}`);
      console.log('');
    });
    
    // Look for deepak
    const deepak = await pool.query(`
      SELECT * FROM wallets 
      WHERE (customer_name ILIKE '%deepak%' 
         OR customer_phone ILIKE '%deepak%'
         OR phone_hash ILIKE '%deepak%'
         OR customer_email ILIKE '%deepak%')
      AND store_url LIKE '%cmstestingg%'
    `);
    
    if (deepak.rows.length > 0) {
      console.log('✅ Found deepak record(s):\n');
      deepak.rows.forEach(d => {
        console.log(`  ID: ${d.id}`);
        console.log(`  Name: ${d.customer_name}`);
        console.log(`  Phone: ${d.customer_phone}`);
        console.log(`  Email: ${d.customer_email || 'NOT SET'}`);
        console.log(`  Balance: ${d.balance}`);
        console.log('');
        
        // Update email if not set
        if (!d.customer_email && (d.customer_phone === 'deepak@gmail.com' || d.phone_hash === 'deepak@gmail.com')) {
          console.log(`  → Updating email to deepak@gmail.com...`);
          pool.query('UPDATE wallets SET customer_email = $1 WHERE id = $2', ['deepak@gmail.com', d.id])
            .then(() => console.log('  ✅ Email updated!'));
        }
      });
    } else {
      console.log('❌ No deepak records found');
      console.log('\nSearching all wallets for any data...\n');
      
      const all = await pool.query('SELECT * FROM wallets LIMIT 5');
      all.rows.forEach((w, i) => {
        console.log(`Wallet ${i + 1}:`);
        console.log(`  Name: ${w.customer_name}`);
        console.log(`  Phone: ${w.customer_phone}`);
        console.log(`  Hash: ${w.phone_hash}`);
        console.log(`  Balance: ${w.balance}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addEmailColumn();
