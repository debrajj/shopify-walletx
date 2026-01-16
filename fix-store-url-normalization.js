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

async function normalizeStoreUrls() {
  try {
    console.log('🔧 NORMALIZING STORE URLs\n');
    
    // Normalize function: remove http:// and https://
    const normalize = (url) => {
      if (!url) return url;
      return url.replace(/^https?:\/\//, '');
    };
    
    // 1. Update users table
    console.log('1️⃣ Updating users table...');
    const users = await pool.query('SELECT id, email, store_url FROM users');
    
    for (const user of users.rows) {
      const normalized = normalize(user.store_url);
      if (normalized !== user.store_url) {
        console.log(`   ${user.email}: "${user.store_url}" → "${normalized}"`);
        await pool.query('UPDATE users SET store_url = $1 WHERE id = $2', [normalized, user.id]);
      }
    }
    
    // 2. Update wallets table
    console.log('\n2️⃣ Updating wallets table...');
    const wallets = await pool.query('SELECT DISTINCT store_url FROM wallets');
    
    for (const wallet of wallets.rows) {
      const normalized = normalize(wallet.store_url);
      if (normalized !== wallet.store_url) {
        console.log(`   "${wallet.store_url}" → "${normalized}"`);
        await pool.query('UPDATE wallets SET store_url = $1 WHERE store_url = $2', [normalized, wallet.store_url]);
      }
    }
    
    // 3. Update transactions table
    console.log('\n3️⃣ Updating transactions table...');
    const transactions = await pool.query('SELECT DISTINCT store_url FROM transactions');
    
    for (const txn of transactions.rows) {
      const normalized = normalize(txn.store_url);
      if (normalized !== txn.store_url) {
        console.log(`   "${txn.store_url}" → "${normalized}"`);
        await pool.query('UPDATE transactions SET store_url = $1 WHERE store_url = $2', [normalized, txn.store_url]);
      }
    }
    
    // 4. Update app_settings table
    console.log('\n4️⃣ Updating app_settings table...');
    const settings = await pool.query('SELECT id, store_url FROM app_settings');
    
    for (const setting of settings.rows) {
      const normalized = normalize(setting.store_url);
      if (normalized !== setting.store_url) {
        console.log(`   "${setting.store_url}" → "${normalized}"`);
        await pool.query('UPDATE app_settings SET store_url = $1 WHERE id = $2', [normalized, setting.id]);
      }
    }
    
    // 5. Update automation_jobs table
    console.log('\n5️⃣ Updating automation_jobs table...');
    const jobs = await pool.query('SELECT DISTINCT store_url FROM automation_jobs');
    
    for (const job of jobs.rows) {
      const normalized = normalize(job.store_url);
      if (normalized !== job.store_url) {
        console.log(`   "${job.store_url}" → "${normalized}"`);
        await pool.query('UPDATE automation_jobs SET store_url = $1 WHERE store_url = $2', [normalized, job.store_url]);
      }
    }
    
    // 6. Update automation_logs table
    console.log('\n6️⃣ Updating automation_logs table...');
    const logs = await pool.query('SELECT DISTINCT store_url FROM automation_logs');
    
    for (const log of logs.rows) {
      const normalized = normalize(log.store_url);
      if (normalized !== log.store_url) {
        console.log(`   "${log.store_url}" → "${normalized}"`);
        await pool.query('UPDATE automation_logs SET store_url = $1 WHERE store_url = $2', [normalized, log.store_url]);
      }
    }
    
    // 7. Update otp_sessions table
    console.log('\n7️⃣ Updating otp_sessions table...');
    const otps = await pool.query('SELECT DISTINCT store_url FROM otp_sessions');
    
    for (const otp of otps.rows) {
      const normalized = normalize(otp.store_url);
      if (normalized !== otp.store_url) {
        console.log(`   "${otp.store_url}" → "${normalized}"`);
        await pool.query('UPDATE otp_sessions SET store_url = $1 WHERE store_url = $2', [normalized, otp.store_url]);
      }
    }
    
    console.log('\n✅ All store URLs normalized!');
    console.log('\n📊 Final state:');
    
    const finalUsers = await pool.query('SELECT email, store_url FROM users');
    finalUsers.rows.forEach(u => {
      console.log(`   ${u.email}: ${u.store_url}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

normalizeStoreUrls();
