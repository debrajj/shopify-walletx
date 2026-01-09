import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Seed shop configuration
    await client.query(`
      INSERT INTO shop_configurations (shop_id, shop_domain, exchange_rate, currency, minimum_redemption, maximum_redemption, welcome_bonus)
      VALUES ('dev-shop-001', 'dev-store.myshopify.com', 100.00, 'USD', 100, 10000, 500)
      ON CONFLICT (shop_id) DO NOTHING;
    `);
    console.log('✅ Shop configuration seeded');
    
    // Seed earning rules
    const rules = [
      {
        type: 'purchase',
        name: 'Purchase Reward',
        description: 'Earn coins for every purchase',
        coin_amount: 100
      },
      {
        type: 'signup',
        name: 'Welcome Bonus',
        description: 'Get coins when you create an account',
        coin_amount: 500
      },
      {
        type: 'referral',
        name: 'Referral Bonus',
        description: 'Earn coins when you refer a friend',
        coin_amount: 250
      },
      {
        type: 'review',
        name: 'Review Reward',
        description: 'Get coins for leaving product reviews',
        coin_amount: 50
      }
    ];
    
    for (const rule of rules) {
      await client.query(`
        INSERT INTO earning_rules (shop_id, type, name, description, coin_amount, is_active)
        VALUES ('dev-shop-001', $1, $2, $3, $4, true)
        ON CONFLICT DO NOTHING;
      `, [rule.type, rule.name, rule.description, rule.coin_amount]);
    }
    console.log('✅ Earning rules seeded');
    
    // Seed test customer accounts
    const testCustomers = [
      { customer_id: 'test-customer-001', shopify_customer_id: '1001', total_coins: 1500 },
      { customer_id: 'test-customer-002', shopify_customer_id: '1002', total_coins: 2500 },
      { customer_id: 'test-customer-003', shopify_customer_id: '1003', total_coins: 500 }
    ];
    
    for (const customer of testCustomers) {
      await client.query(`
        INSERT INTO customer_coin_accounts (customer_id, shopify_customer_id, shop_id, total_coins, lifetime_earned)
        VALUES ($1, $2, 'dev-shop-001', $3, $3)
        ON CONFLICT (shopify_customer_id, shop_id) DO NOTHING;
      `, [customer.customer_id, customer.shopify_customer_id, customer.total_coins]);
    }
    console.log('✅ Test customer accounts seeded');
    
    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
seedDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
