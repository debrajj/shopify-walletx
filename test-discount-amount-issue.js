// Test script to diagnose discount amount mismatch
const { formatDiscountAmount } = require('./backend/src/shopify/discountService');

console.log('Testing formatDiscountAmount function:\n');

// Test various amounts
const testAmounts = [
  10,
  10.5,
  10.50,
  100,
  100.99,
  0.1,
  0.99,
  1.5,
  50.25
];

testAmounts.forEach(amount => {
  const formatted = formatDiscountAmount(amount);
  console.log(`Input: ${amount} (${typeof amount}) -> Output: "${formatted}" (${typeof formatted})`);
});

console.log('\n\nTesting what Shopify receives:');
console.log('If input is 10 coins = ₹10 discount:');
console.log('  Formatted:', formatDiscountAmount(10));
console.log('  Expected in Shopify: "10.00"');

console.log('\nIf input is 50.5 coins = ₹50.50 discount:');
console.log('  Formatted:', formatDiscountAmount(50.5));
console.log('  Expected in Shopify: "50.50"');
