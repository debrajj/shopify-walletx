// Consolidate wallets with different store URL formats
const { Pool } = require('pg');

const pool = new Pool({
  host: 'family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com',
  port: 5432,
  database: 'shopify_wallet',
  user: 'postgres',
  password: 'v4HmYtmNgvsVkRrB81AT',
});

async function consolidateWallets() {
  const email = 'debrajecomcure@gmail.com';
  const correctStoreUrl = 'cmstestingg.myshopify.com';
  
  console.log('🔧 Consolidating wallets for:', email);
  console.log('');
  
  try {
    // Find all wallets for this email
    const wallets = await pool.query(
      `SELECT * FROM wallets WHERE customer_email = $1 ORDER BY balance DESC`,
      [email]
    );
    
    console.log('📋 Found', wallets.rows.length, 'wallets:');
    wallets.rows.forEach((w, i) => {
      console.log(`  ${i + 1}. Store: ${w.store_url} | Balance: ${w.balance} coins`);
    });
    console.log('');
    
    if (wallets.rows.length <= 1) {
      console.log('✅ Only one wallet found, no consolidation needed');
      await pool.end();
      return;
    }
    
    // Calculate total balance
    const totalBalance = wallets.rows.reduce((sum, w) => sum + parseFloat(w.balance), 0);
    console.log('💰 Total balance across all wallets:', totalBalance, 'coins');
    console.log('');
    
    // Update the wallet with correct store URL
    const correctWallet = wallets.rows.find(w => w.store_url === correctStoreUrl);
    
    if (correctWallet) {
      console.log('✅ Found wallet with correct store URL');
      console.log('   Updating balance to:', totalBalance, 'coins');
      
      await pool.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
        [totalBalance, correctWallet.id]
      );
      
      console.log('✅ Balance updated!');
      console.log('');
      
      // Delete other wallets
      const otherWallets = wallets.rows.filter(w => w.id !== correctWallet.id);
      
      if (otherWallets.length > 0) {
        console.log('🔄 Moving transactions from duplicate wallets...');
        
        for (const w of otherWallets) {
          // Move transactions to correct wallet
          const txResult = await pool.query(
            'UPDATE transactions SET wallet_id = $1 WHERE wallet_id = $2',
            [correctWallet.id, w.id]
          );
          console.log('   Moved', txResult.rowCount, 'transaction(s) from wallet ID:', w.id);
        }
        
        console.log('');
        console.log('🗑️  Deleting', otherWallets.length, 'duplicate wallet(s)...');
        
        for (const w of otherWallets) {
          await pool.query('DELETE FROM wallets WHERE id = $1', [w.id]);
          console.log('   Deleted wallet ID:', w.id, '(Store:', w.store_url + ')');
        }
      }
    } else {
      console.log('⚠️  No wallet with correct store URL found');
      console.log('   Creating new wallet with total balance...');
      
      await pool.query(
        `INSERT INTO wallets (store_url, customer_email, customer_name, balance, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [correctStoreUrl, email, 'Debraj', totalBalance]
      );
      
      console.log('✅ New wallet created!');
      console.log('');
      
      // Delete old wallets
      console.log('🗑️  Deleting', wallets.rows.length, 'old wallet(s)...');
      
      for (const w of wallets.rows) {
        await pool.query('DELETE FROM wallets WHERE id = $1', [w.id]);
        console.log('   Deleted wallet ID:', w.id);
      }
    }
    
    console.log('');
    console.log('🎉 Consolidation complete!');
    console.log('');
    
    // Verify
    const verifyResult = await pool.query(
      `SELECT * FROM wallets WHERE customer_email = $1`,
      [email]
    );
    
    console.log('📊 Final result:');
    console.log('   Email:', verifyResult.rows[0].customer_email);
    console.log('   Store:', verifyResult.rows[0].store_url);
    console.log('   Balance:', verifyResult.rows[0].balance, 'coins');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

consolidateWallets();
