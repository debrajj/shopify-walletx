// Check actual discount in Shopify to see what amount is set
require('dotenv').config();
const db = require('./backend/src/config/db');

async function checkShopifyDiscount() {
  try {
    console.log('Checking Shopify discount details...\n');
    
    // Get store credentials
    const storeResult = await db.query(`
      SELECT store_url, shopify_access_token 
      FROM users 
      LIMIT 1
    `);
    
    if (storeResult.rows.length === 0) {
      console.log('❌ No store found in database');
      process.exit(1);
    }
    
    const { store_url, shopify_access_token } = storeResult.rows[0];
    
    if (!shopify_access_token) {
      console.log('❌ No Shopify access token configured');
      process.exit(1);
    }
    
    console.log(`Store: ${store_url}\n`);
    
    // Get recent discount with shopify_discount_id
    const discountResult = await db.query(`
      SELECT 
        discount_code,
        shopify_discount_id,
        discount_amount,
        actual_discount_amount,
        customer_email
      FROM discount_codes
      WHERE shopify_discount_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (discountResult.rows.length === 0) {
      console.log('❌ No discounts with Shopify ID found');
      console.log('Create a new discount to test');
      process.exit(0);
    }
    
    const discount = discountResult.rows[0];
    console.log(`Checking discount: ${discount.discount_code}`);
    console.log(`Shopify ID: ${discount.shopify_discount_id}`);
    console.log(`Expected: ₹${discount.discount_amount}`);
    console.log(`Recorded Actual: ₹${discount.actual_discount_amount || 'N/A'}\n`);
    
    // Query Shopify for the actual discount
    const query = `
      query getDiscountNode($id: ID!) {
        discountNode(id: $id) {
          id
          discount {
            ... on DiscountAutomaticBasic {
              title
              status
              startsAt
              endsAt
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                    appliesOnEachItem
                  }
                }
                items {
                  ... on AllDiscountItems {
                    allItems
                  }
                }
              }
              customerSelection {
                ... on DiscountCustomers {
                  customers(first: 5) {
                    edges {
                      node {
                        id
                        email
                      }
                    }
                  }
                }
              }
              minimumRequirement {
                ... on DiscountMinimumSubtotal {
                  greaterThanOrEqualToSubtotal {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await fetch(`https://${store_url}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shopify_access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: discount.shopify_discount_id }
      })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.log('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
      process.exit(1);
    }
    
    if (!result.data?.discountNode) {
      console.log('❌ Discount not found in Shopify');
      console.log('Response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }
    
    const shopifyDiscount = result.data.discountNode.discount;
    const actualAmount = parseFloat(shopifyDiscount.customerGets?.value?.amount?.amount || 0);
    const currency = shopifyDiscount.customerGets?.value?.amount?.currencyCode;
    const appliesOnEachItem = shopifyDiscount.customerGets?.value?.appliesOnEachItem;
    
    console.log('✅ Found in Shopify:');
    console.log(`   Title: ${shopifyDiscount.title}`);
    console.log(`   Status: ${shopifyDiscount.status}`);
    console.log(`   Amount: ${currency} ${actualAmount}`);
    console.log(`   Applies on each item: ${appliesOnEachItem}`);
    console.log(`   Starts: ${shopifyDiscount.startsAt}`);
    console.log(`   Ends: ${shopifyDiscount.endsAt}`);
    
    if (shopifyDiscount.customerSelection?.customers) {
      console.log(`   Customers:`);
      shopifyDiscount.customerSelection.customers.edges.forEach(edge => {
        console.log(`     - ${edge.node.email}`);
      });
    }
    
    console.log(`\n📊 Comparison:`);
    console.log(`   Expected: ₹${parseFloat(discount.discount_amount).toFixed(2)}`);
    console.log(`   Actual in Shopify: ${currency} ${actualAmount.toFixed(2)}`);
    
    const difference = Math.abs(parseFloat(discount.discount_amount) - actualAmount);
    if (difference > 0.01) {
      console.log(`   ⚠️  MISMATCH: Difference of ${currency} ${difference.toFixed(2)}`);
    } else {
      console.log(`   ✅ MATCH: Amounts are identical`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkShopifyDiscount();
