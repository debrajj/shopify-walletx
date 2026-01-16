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

async function fixAllDuplicates() {
  try {
    console.log('🔧 FIXING ALL DUPLICATES\n');
    
    const normalize = (url) => url ? url.replace(/^https?:\/\//, '') : url;
    
    // Step 1: Check current state
    console.log('1️⃣ Current state:');
    const users = await pool.query('SELECT id, email, store_url FROM users ORDER BY id');
    users.rows.forEach(u => {
      console.log(`   User ID ${u.id}: ${u.email} → ${u.store_url}`);
    });
    
    const settings = await pool.query('SELECT id, store_url FROM app_settings ORDER BY id');
    console.log('\n   App Settings:');
    settings.rows.forEach(s => {
      console.log(`   Settings ID ${s.id}: ${s.store_url}`);
    });
    
    // Step 2: Delete duplicate app_settings first
    console.log('\n2️⃣ Removing duplicate app_settings...');
    const duplicateSettings = await pool.query(`
      SELECT store_url FROM app_settings 
      WHERE store_url IN ('https://cmstestingg.myshopify.com', 'cmstestingg.myshopify.com')
    `);
    
    if (duplicateSettings.rows.length > 1) {
      // Keep the one without https://, delete the one with https://
      await pool.query(`DELETE FROM app_settings WHERE store_url = 'https://cmstestingg.myshopify.com'`);
      console.log('   ✓ Deleted settings for https://cmstestingg.myshopify.com');
    }
    
    // Step 3: Migrate all data from https:// version to non-https version
    console.log('\n3️⃣ Migrating data...');
    
    const fromUrl = 'https://cmstestingg.myshopify.com';
    const toUrl = 'cmstestingg.myshopify.com';
    
    // Wallets
    const walletsResult = await pool.query('UPDATE wallets SET store_url = $1 WHERE store_url = $2', [toUrl, fromUrl]);
    console.log(`   ✓ Wallets: ${walletsResult.rowCount} rows updated`);
    
    // Transactions
    const txnResult = await pool.query('UPDATE transactions SET store_url = $1 WHERE store_url = $2', [toUrl, fromUrl]);
    console.log(`   ✓ Transactions: ${txnResult.rowCount} rows updated`);
    
    // Automation jobs
    const jobsResult = await pool.query('UPDATE automation_jobs SET store_url = $1 WHERE store_url = $2', [toUrl, fromUrl]);
    console.log(`   ✓ Automation jobs: ${jobsResult.rowCount} rows updated`);
    
    // Automation logs
    const logsResult = await pool.query('UPDATE automation_logs SET store_url = $1 WHERE store_url = $2', [toUrl, fromUrl]);
    console.log(`   ✓ Automation logs: ${logsResult.rowCount} rows updated`);
    
    // OTP sessions
    const otpResult = await pool.query('UPDATE otp_sessions SET store_url = $1 WHERE store_url = $2', [toUrl, fromUrl]);
    console.log(`   ✓ OTP sessions: ${otpResult.rowCount} rows updated`);
    
    // Step 4: Delete duplicate user
    console.log('\n4️⃣ Removing duplicate user...');
    await pool.query(`DELETE FROM users WHERE store_url = 'https://cmstestingg.myshopify.com'`);
    console.log('   ✓ Deleted user with https://cmstestingg.myshopify.com');
    
    // Step 5: Verify final state
    console.log('\n5️⃣ Final state:');
    const finalUsers = await pool.query('SELECT id, email, store_url FROM users ORDER BY id');
    finalUsers.rows.forEach(u => {
      console.log(`   User ID ${u.id}: ${u.email} → ${u.store_url}`);
    });
    
    const finalSettings = await pool.query('SELECT id, store_url FROM app_settings ORDER BY id');
    console.log('\n   App Settings:');
    finalSettings.rows.forEach(s => {
      console.log(`   Settings ID ${s.id}: ${s.store_url}`);
    });
    
    // Step 6: Test search
    console.log('\n6️⃣ Testing customer search...');
    const testEmail = 'debrajecomcure@gmail.com';
    const searchResult = await pool.query(`
      SELECT id::text, customer_name as name, customer_email as email, balance, store_url
      FROM wallets 
      WHERE store_url = $1 AND customer_email ILIKE $2
      LIMIT 1
    `, [toUrl, `%${testEmail}%`]);
    
    if (searchResult.rows.length > 0) {
      console.log(`   ✅ Search successful!`);
      console.log(`      Name: ${searchResult.rows[0].name}`);
      console.log(`      Email: ${searchResult.rows[0].email}`);
      console.log(`      Balance: ${searchResult.rows[0].balance}`);
      console.log(`      Store: ${searchResult.rows[0].store_url}`);
    } else {
      console.log(`   ❌ Search failed`);
    }
    
    console.log('\n✅ All duplicates fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixAllDuplicates();
