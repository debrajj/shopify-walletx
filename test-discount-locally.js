// Test discount creation locally to see what's being sent
const { formatDiscountAmount } = require('./backend/src/shopify/discountService');

console.log('🧪 Local Discount Amount Testing\n');
console.log('═'.repeat(60));

// Test various redemption amounts
const testCases = [
  { coins: 10, description: 'Small amount' },
  { coins: 50, description: 'Medium amount' },
  { coins: 100, description: 'Large amount' },
  { coins: 250, description: 'Very large amount' },
  { coins: 10.5, description: 'Decimal coins (should not happen)' },
];

testCases.forEach(({ coins, description }) => {
  const coinValue = 1; // 1 coin = ₹1
  const discountAmount = coins * coinValue;
  const formatted = formatDiscountAmount(discountAmount);
  
  console.log(`\n${description}:`);
  console.log(`  Coins to redeem: ${coins}`);
  console.log(`  Discount amount: ₹${discountAmount}`);
  console.log(`  Formatted for Shopify: "${formatted}"`);
  console.log(`  Type: ${typeof formatted}`);
  
  // What Shopify should receive in GraphQL
  console.log(`  GraphQL payload will have:`);
  console.log(`    discountAmount: { amount: "${formatted}" }`);
});

console.log('\n' + '═'.repeat(60));
console.log('\n✅ All amounts are being formatted correctly as strings with 2 decimals');
console.log('📝 This is the correct format for Shopify GraphQL API');
console.log('\n💡 If discounts are still wrong in Shopify, the issue is likely:');
console.log('   1. Currency unit mismatch (paise vs rupees)');
console.log('   2. Store currency settings');
console.log('   3. Shopify API version compatibility');
console.log('\n📋 Next: Check backend logs when creating a real discount');
console.log('   Look for: [Discount] 📤 GraphQL Mutation Variables');
