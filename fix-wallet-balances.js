const { Client } = require('pg');
require('dotenv').config();

async function fixWalletBalances() {
  console.log('🔧 Fixing Wallet Balances to Match Transactions\n');

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    const SHOP_URL = 'cmstestingg.myshopify.com';
    
    // Get all wallets with their calculated balances
    const result = await client.query(`
      SELECT 
        w.id,
        w.customer_name,
        w.customer_email,
        w.customer_phone,
        w.balance as current_balance,
        COALESCE(SUM(CASE WHEN t.type = 'CREDIT' THEN t.coins ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN t.type = 'DEBIT' THEN t.coins ELSE 0 END), 0) as calculated_balance
      FROM wallets w
      LEFT JOIN transactions t ON w.id = t.wallet_id
      WHERE w.store_url = $1
      GROUP BY w.id, w.customer_name, w.customer_email, w.customer_phone, w.balance
    `, [SHOP_URL]);
    
    console.log(`Found ${result.rows.length} wallets to check\n`);
    
    let fixed = 0;
    let alreadyCorrect = 0;
    
    for (const row of result.rows) {
      const currentBalance = parseFloat(row.current_balance);
      const calculatedBalance = parseFloat(row.calculated_balance);
      const difference = Math.abs(currentBalance - calculatedBalance);
      
      if (difference >= 0.01) {
        console.log(`Fixing: ${row.customer_name} (${row.customer_email || row.customer_phone})`);
        console.log(`  Current: ${currentBalance} → Correct: ${calculatedBalance}`);
        
        await client.query(`
          UPDATE wallets 
          SET balance = $1, updated_at = NOW()
          WHERE id = $2
        `, [calculatedBalance, row.id]);
        
        console.log(`  ✅ Fixed!\n`);
        fixed++;
      } else {
        console.log(`✓ ${row.customer_name}: Already correct (${currentBalance} coins)`);
        alreadyCorrect++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Wallets: ${result.rows.length}`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Already Correct: ${alreadyCorrect}`);
    console.log(`\n✅ All wallet balances are now perfectly accurate!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

fixWalletBalances();
