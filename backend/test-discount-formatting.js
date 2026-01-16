const { formatDiscountAmount } = require('./src/shopify/discountService');

console.log('Testing formatDiscountAmount function...\n');

// Test cases
const testCases = [
  { input: 100, expected: '100.00' },
  { input: 0.1, expected: '0.10' },
  { input: 0.99, expected: '0.99' },
  { input: 1000.99, expected: '1000.99' },
  { input: 50.5, expected: '50.50' },
  { input: 123.456, expected: '123.46' }, // Should round
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  try {
    const result = formatDiscountAmount(input);
    if (result === expected) {
      console.log(`✅ PASS: formatDiscountAmount(${input}) = "${result}"`);
      passed++;
    } else {
      console.log(`❌ FAIL: formatDiscountAmount(${input}) = "${result}", expected "${expected}"`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: formatDiscountAmount(${input}) threw error: ${error.message}`);
    failed++;
  }
});

// Test error cases
console.log('\nTesting error cases...');

try {
  formatDiscountAmount(-10);
  console.log('❌ FAIL: Should throw error for negative amount');
  failed++;
} catch (error) {
  console.log(`✅ PASS: Correctly throws error for negative amount: ${error.message}`);
  passed++;
}

try {
  formatDiscountAmount('not a number');
  console.log('❌ FAIL: Should throw error for non-numeric input');
  failed++;
} catch (error) {
  console.log(`✅ PASS: Correctly throws error for non-numeric input: ${error.message}`);
  passed++;
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
