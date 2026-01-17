const { Client } = require('pg');
require('dotenv').config();

async function verifyWalletAccuracy() {
  console.log('🔍 Verifying Wallet and Coins Accuracy\n');

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
    
    // Get all wallets with calculated values
    console.log('📊 Wallet Accuracy Report:\n');
    console.log('='.repeat(100));
    
    const result = await client.query(`
      SELECT 
        w.id,
        w.customer_name,
        w.customer_email,
        w.customer_phone,
        w.balance as current_balance,
        COUNT(t.id) as total_transactions,
        COALESCE(SUM(CASE WHEN t.type = 'CREDIT' THEN t.coins ELSE 0 END), 0) as total_credited,
        COALESCE(SUM(CASE WHEN t.type = 'DEBIT' THEN t.coins ELSE 0 END), 0) as total_debited,
        COALESCE(SUM(CASE WHEN t.type = 'CREDIT' THEN t.coins ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN t.type = 'DEBIT' THEN t.coins ELSE 0 END), 0) as calculated_balance
      FROM wallets w
      LEFT JOIN transactions t ON w.id = t.wallet_id
      WHERE w.store_url = $1
      GROUP BY w.id, w.customer_name, w.customer_email, w.customer_phone, w.balance
      ORDER BY w.id
    `, [SHOP_URL]);
    
    let allAccurate = true;
    let totalDiscrepancies = 0;
    
    result.rows.forEach((row, index) => {
      const currentBalance = parseFloat(row.current_balance);
      const calculatedBalance = parseFloat(row.calculated_balance);
      const difference = Math.abs(currentBalance - calculatedBalance);
      const isAccurate = difference < 0.01; // Allow for floating point precision
      
      console.log(`\n${index + 1}. ${row.customer_name} (ID: ${row.id})`);
      console.log(`   Contact: ${row.customer_email || row.customer_phone}`);
      console.log(`   Current Balance: ${currentBalance} coins`);
      console.log(`   Total Credited: ${parseFloat(row.total_credited)} coins`);
      console.log(`   Total Debited: ${parseFloat(row.total_debited)} coins`);
      console.log(`   Calculated Balance: ${calculatedBalance} coins`);
      console.log(`   Total Transactions: ${row.total_transactions}`);
      
      if (!isAccurate) {
        console.log(`   ❌ DISCREPANCY: ${difference.toFixed(2)} coins difference!`);
        allAccurate = false;
        totalDiscrepancies++;
      } else {
        console.log(`   ✅ ACCURATE`);
      }
    });
    
    console.log('\n' + '='.repeat(100));
    console.log('\n📈 Summary:');
    console.log(`   Total Wallets: ${result.rows.length}`);
    console.log(`   Accurate Wallets: ${result.rows.length - totalDiscrepancies}`);
    console.log(`   Discrepancies Found: ${totalDiscrepancies}`);
    
    if (allAccurate) {
      console.log('\n✅ ALL WALLETS ARE PERFECTLY ACCURATE!');
    } else {
      console.log(`\n❌ ${totalDiscrepancies} wallet(s) have discrepancies that need fixing!`);
      console.log('\n💡 Recommendation: Run wallet balance recalculation script');
    }
    
    // Check for orphaned transactions
    console.log('\n\n🔍 Checking for orphaned transactions...');
    const orphanedCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM transactions t
      LEFT JOIN wallets w ON t.wallet_id = w.id
      WHERE w.id IS NULL AND t.store_url = $1
    `, [SHOP_URL]);
    
    const orphanedCount = parseInt(orphanedCheck.rows[0].count);
    if (orphanedCount > 0) {
      console.log(`❌ Found ${orphanedCount} orphaned transactions (transactions without wallets)`);
    } else {
      console.log('✅ No orphaned transactions found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyWalletAccuracy();
