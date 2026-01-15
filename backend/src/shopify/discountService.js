const db = require('../config/db');

/**
 * Create a Shopify discount code that works immediately at checkout
 * Uses GraphQL Admin API for better reliability
 */
async function createShopifyDiscount(shopUrl, email, coinsToRedeem, discountAmount) {
  try {
    // Generate unique discount code with random component
    const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const discountCode = `WALLET${emailHash}${randomNum}`.toUpperCase();
    
    console.log(`[Discount] 🎫 Creating discount: ${discountCode} for ₹${discountAmount}`);
    
    // Get shop's access token
    const shopResult = await db.query('SELECT shopify_access_token FROM users WHERE store_url = $1', [shopUrl]);
    
    if (shopResult.rows.length === 0 || !shopResult.rows[0].shopify_access_token) {
      console.warn(`[Discount] ⚠️  No Shopify API access for ${shopUrl}`);
      
      // Return code anyway - merchant must create it manually
      return {
        success: true,
        discountCode,
        discountValue: discountAmount,
        requiresManualSetup: true,
        message: `Discount code ${discountCode} generated. Create it manually in Shopify admin for ₹${discountAmount} off.`
      };
    }
    
    const accessToken = shopResult.rows[0].shopify_access_token;
    console.log(`[Discount] 🔑 Creating via Shopify GraphQL API...`);
    
    // Use GraphQL API to create automatic discount
    const graphqlQuery = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                codes(first: 1) {
                  nodes {
                    code
                  }
                }
                startsAt
                endsAt
                customerSelection {
                  ... on DiscountCustomerAll {
                    allCustomers
                  }
                }
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
                appliesOncePerCustomer
                usageLimit
              }
            }
          }
          userErrors {
            field
            code
            message
          }
        }
      }
    `;
    
    const variables = {
      basicCodeDiscount: {
        title: `Wallet Coins - ${discountCode}`,
        code: discountCode,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        customerSelection: {
          all: true
        },
        customerGets: {
          value: {
            discountAmount: {
              amount: discountAmount.toString(),
              appliesOnEachItem: false
            }
          },
          items: {
            all: true
          }
        },
        appliesOncePerCustomer: true,
        usageLimit: 1
      }
    };
    
    try {
      const response = await fetch(`https://${shopUrl}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: variables
        })
      });
      
      const result = await response.json();
      
      console.log('[Discount] 📥 GraphQL response:', JSON.stringify(result, null, 2));
      
      if (result.data?.discountCodeBasicCreate?.codeDiscountNode) {
        console.log(`[Discount] ✅ Discount created successfully via GraphQL!`);
        return {
          success: true,
          discountCode,
          discountValue: discountAmount,
          message: `Discount ₹${discountAmount} applied!`
        };
      }
      
      if (result.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
        const errors = result.data.discountCodeBasicCreate.userErrors;
        console.error('[Discount] ❌ GraphQL errors:', errors);
        throw new Error(errors.map(e => e.message).join(', '));
      }
      
      // If GraphQL fails, try REST API as fallback
      console.log('[Discount] ⚠️  GraphQL failed, trying REST API...');
      return await createViaRestAPI(shopUrl, accessToken, discountCode, discountAmount, coinsToRedeem);
      
    } catch (apiError) {
      console.error('[Discount] ❌ API error:', apiError.message);
      
      // Try REST API as fallback
      console.log('[Discount] 🔄 Falling back to REST API...');
      return await createViaRestAPI(shopUrl, accessToken, discountCode, discountAmount, coinsToRedeem);
    }
    
  } catch (error) {
    console.error('[Discount] ❌ Error:', error);
    
    // Generate code anyway
    const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const discountCode = `WALLET${emailHash}${randomNum}`.toUpperCase();
    
    return {
      success: true,
      discountCode,
      discountValue: discountAmount,
      requiresManualSetup: true,
      message: `Discount code ${discountCode} generated. Create it manually in Shopify admin for ₹${discountAmount} off.`
    };
  }
}

/**
 * Fallback: Create discount using REST API
 */
async function createViaRestAPI(shopUrl, accessToken, discountCode, discountAmount, coinsToRedeem) {
  try {
    // Create price rule first
    const priceRuleResponse = await fetch(`https://${shopUrl}/admin/api/2024-01/price_rules.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_rule: {
          title: `Wallet Coins - ${discountCode}`,
          target_type: 'line_item',
          target_selection: 'all',
          allocation_method: 'across',
          value_type: 'fixed_amount',
          value: `-${discountAmount}`,
          customer_selection: 'all',
          once_per_customer: true,
          usage_limit: 1,
          starts_at: new Date().toISOString(),
        }
      })
    });
    
    const priceRuleData = await priceRuleResponse.json();
    
    if (!priceRuleData.price_rule) {
      console.error('[Discount] ❌ REST API price rule failed:', priceRuleData);
      throw new Error('Price rule creation failed');
    }
    
    // Create discount code
    const discountResponse = await fetch(
      `https://${shopUrl}/admin/api/2024-01/price_rules/${priceRuleData.price_rule.id}/discount_codes.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discount_code: {
            code: discountCode
          }
        })
      }
    );
    
    const discountData = await discountResponse.json();
    
    if (!discountData.discount_code) {
      console.error('[Discount] ❌ REST API discount code failed:', discountData);
      throw new Error('Discount code creation failed');
    }
    
    console.log(`[Discount] ✅ Discount created via REST API!`);
    
    return {
      success: true,
      discountCode,
      discountValue: discountAmount,
      priceRuleId: priceRuleData.price_rule.id,
      message: `Discount ₹${discountAmount} applied!`
    };
    
  } catch (error) {
    console.error('[Discount] ❌ REST API failed:', error.message);
    
    return {
      success: true,
      discountCode,
      discountValue: discountAmount,
      requiresManualSetup: true,
      message: `Discount code ${discountCode} generated. Create it manually in Shopify admin for ₹${discountAmount} off.`
    };
  }
}

module.exports = {
  createShopifyDiscount
};
