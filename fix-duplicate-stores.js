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

async function fixDuplicateStores() {
  try {
    console.log('🔧 FIXING DUPLICATE STORES\n');
    
    // Check for duplicates
    const users = await pool.query('SELECT id, email, store_url FROM users ORDER BY id');
    console.log('Current users:');
    users.rows.forEach(u => {
      console.log(`   ID ${u.id}: ${u.email} → ${u.store_url}`);
    });
    
    // Find duplicates (normalized)
    const normalize = (url) => url ? url.replace(/^https?:\/\//, '') : url;
    const storeMap = new Map();
    
    users.rows.forEach(user => {
      const normalized = normalize(user.store_url);
      if (!storeMap.has(normalized)) {
        storeMap.set(normalized, []);
      }
      storeMap.get(normalized).push(user);
    });
    
    console.log('\n📊 Duplicates found:');
    for (const [normalized, userList] of storeMap.entries()) {
      if (userList.length > 1) {
        console.log(`\n   Store: ${normalized}`);
        userList.forEach(u => {
          console.log(`      - ID ${u.id}: ${u.email} (${u.store_url})`);
        });
        
        // Keep the one WITHOUT https:// prefix (admin@cmstestingg.myshopify.com)
        // Delete the one WITH https:// prefix (deepak@gmail.com)
        const toKeep = userList.find(u => u.store_url === normalized);
        const toDelete = userList.filter(u => u.store_url !== normalized);
        
        if (toKeep && toDelete.length > 0) {
          console.log(`\n   ✅ Keeping: ${toKeep.email} (ID ${toKeep.id})`);
          console.log(`   ❌ Deleting: ${toDelete.map(u => `${u.email} (ID ${u.id})`).join(', ')}`);
          
          for (const user of toDelete) {
            // First, update all related data to point to the kept user's store_url
            console.log(`\n   Migrating data from ${user.store_url} to ${toKeep.store_url}...`);
            
            // Update wallets
            await pool.query('UPDATE wallets SET store_url = $1 WHERE store_url = $2', [toKeep.store_url, user.store_url]);
            console.log('      ✓ Wallets updated');
            
            // Update transactions
            await pool.query('UPDATE transactions SET store_url = $1 WHERE store_url = $2', [toKeep.store_url, user.store_url]);
            console.log('      ✓ Transactions updated');
            
            // Update app_settings
            await pool.query('UPDATE app_settings SET store_url = $1 WHERE store_url = $2', [toKeep.store_url, user.store_url]);
            console.log('      ✓ App settings updated');
            
            // Update automation_jobs
            await pool.query('UPDATE automation_jobs SET store_url = $1 WHERE store_url = $2', [toKeep.store_url, user.store_url]);
            console.log('      ✓ Automation jobs updated');
            
            // Update automation_logs
            await pool.query('UPDATE automation_logs SET store_url = $1 WHERE store_url = $2', [toKeep.store_url, user.store_url]);
            console.log('      ✓ Automation logs updated');
            
            // Update otp_sessions
            await pool.query('UPDATE otp_sessions SET store_url = $1 WHERE store_url = $2', [toKeep.store_url, user.store_url]);
            console.log('      ✓ OTP sessions updated');
            
            // Now delete the duplicate user
            await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
            console.log(`      ✓ User ${user.email} deleted`);
          }
        }
      }
    }
    
    console.log('\n✅ Duplicate stores fixed!');
    console.log('\n📊 Final users:');
    const finalUsers = await pool.query('SELECT id, email, store_url FROM users ORDER BY id');
    finalUsers.rows.forEach(u => {
      console.log(`   ID ${u.id}: ${u.email} → ${u.store_url}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixDuplicateStores();
