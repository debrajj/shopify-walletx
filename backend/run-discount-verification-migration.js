const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running discount verification migration...\n');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'src/migrations/add_discount_verification_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('\nAdded columns:');
    console.log('  - actual_discount_amount');
    console.log('  - shopify_discount_id');
    console.log('  - amount_verified');
    console.log('  - amount_mismatch');
    console.log('  - verified_at');
    console.log('\nAdded indexes:');
    console.log('  - idx_discount_codes_shopify_id');
    console.log('  - idx_discount_codes_mismatch');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
