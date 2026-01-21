const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function checkCoins(emailOrPhone) {
  try {
    console.log(`\n🔍 Searching for customer: ${emailOrPhone}\n`);
    
    // Search by email or phone
    const wallet = await pool.query(
      `SELECT * FROM wallets 
       WHERE customer_email = $1 OR customer_phone = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [emailOrPhone]
    );
    
    if (wallet.rows.length === 0) {
      console.log('❌ No wallet found for this email/phone number');
      console.log('\n💡 Tip: Make sure the email/phone matches exactly as stored in the database');
      return;
    }
    
    const walletData = wallet.rows[0];
    
    console.log('✅ WALLET FOUND\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:        ${walletData.customer_email || 'N/A'}`);
    console.log(`📱 Phone:        ${walletData.customer_phone || 'N/A'}`);
    console.log(`💰 Balance:      ${walletData.balance} coins`);
    console.log(`🏪 Store:        ${walletData.store_url}`);
    console.log(`🆔 Wallet ID:    ${walletData.id}`);
    console.log(`📅 Created:      ${walletData.created_at}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get recent transactions
    const transactions = await pool.query(
      `SELECT * FROM transactions 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [walletData.id]
    );
    
    if (transactions.rows.length > 0) {
      console.log(`📊 RECENT TRANSACTIONS (${transactions.rows.length}):\n`);
      transactions.rows.forEach((txn, index) => {
        const sign = txn.type === 'credit' ? '+' : '-';
        const emoji = txn.type === 'credit' ? '💚' : '💸';
        console.log(`${index + 1}. ${emoji} ${sign}${txn.coins} coins - ${txn.type.toUpperCase()}`);
        console.log(`   Order: ${txn.order_id || 'N/A'}`);
        console.log(`   Status: ${txn.status}`);
        console.log(`   Date: ${txn.created_at}`);
        console.log('');
      });
    } else {
      console.log('📊 No transactions found for this wallet\n');
    }
    
    // Get pending redemptions
    const pending = await pool.query(
      `SELECT * FROM pending_redemptions 
       WHERE wallet_id = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [walletData.id]
    );
    
    if (pending.rows.length > 0) {
      console.log(`⏳ PENDING REDEMPTIONS (${pending.rows.length}):\n`);
      pending.rows.forEach((redemption, index) => {
        console.log(`${index + 1}. ${redemption.coins_redeemed} coins`);
        console.log(`   Order: ${redemption.order_id}`);
        console.log(`   Date: ${redemption.created_at}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Get email/phone from command line argument
const searchTerm = process.argv[2];

if (!searchTerm) {
  console.log('\n❌ Please provide an email or phone number\n');
  console.log('Usage: node check-coins.js <email-or-phone>\n');
  console.log('Examples:');
  console.log('  node check-coins.js customer@example.com');
  console.log('  node check-coins.js +1234567890\n');
  process.exit(1);
}

checkCoins(searchTerm);
