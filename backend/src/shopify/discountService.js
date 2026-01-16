const db = require('../config/db');

/**
 * Format discount amount for Shopify API
 * Ensures proper decimal precision and string format
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted amount as string with 2 decimal places
 */
function formatDiscountAmount(amount) {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  // Format to 2 decimal places and return as string
  return amount.toFixed(2);
}

/**
 * Log discount amount discrepancy
 * @param {number} expectedAmount - Expected discount amount
 * @param {number} actualAmount - Actual discount amount from Shopify
 * @param {string} discountCode - Discount code for reference
 */
function logDiscrepancy(expectedAmount, actualAmount, discountCode) {
  const difference = Math.abs(expectedAmount - actualAmount);
  
  if (difference > 0.01) {
    console.warn('[Discount] ⚠️  AMOUNT MISMATCH DETECTED:', JSON.stringify({
      timestamp: new Date().toISOString(),
      discountCode,
      expectedAmount,
      actualAmount,
      difference,
      percentageDiff: ((difference / expectedAmount) * 100).toFixed(2) + '%'
    }, null, 2));
    return true;
  }
  
  return false;
}

/**
 * Query Shopify to get discount details after creation
 * @param {string} shopUrl - Store URL
 * @param {string} accessToken - Shopify access token
 * @param {string} discountId - Shopify discount node ID
 * @returns {Promise<Object>} - Discount details including actual amount
 */
async function getDiscountDetails(shopUrl, accessToken, discountId) {
  try {
    console.log(`[Discount] 🔍 Verifying discount details for ID: ${discountId}`);
    
    const query = `
      query getDiscountNode($id: ID!) {
        discountNode(id: $id) {
          id
          discount {
            ... on DiscountAutomaticBasic {
              title
              status
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await fetch(`https://${shopUrl}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: discountId }
      })
    });
    
    const result = await response.json();
    
    console.log('[Discount] 📥 Verification Response:', JSON.stringify(result, null, 2));
    
    if (result.data?.discountNode) {
      const discount = result.data.discountNode.discount;
      const actualAmount = parseFloat(discount.customerGets?.value?.amount?.amount || 0);
      
      return {
        success: true,
        id: discountId,
        title: discount.title,
        status: discount.status,
        actualAmount,
        currencyCode: discount.customerGets?.value?.amount?.currencyCode
      };
    }
    
    return {
      success: false,
      error: 'Discount not found or invalid response'
    };
    
  } catch (error) {
    console.error('[Discount] ❌ Verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify discount amount matches expected value
 * @param {number} expectedAmount - Amount we requested
 * @param {number} actualAmount - Amount Shopify created
 * @param {number} tolerance - Acceptable difference (default: 0.01)
 * @returns {boolean} - True if amounts match within tolerance
 */
function verifyDiscountAmount(expectedAmount, actualAmount, tolerance = 0.01) {
  const difference = Math.abs(expectedAmount - actualAmount);
  return difference <= tolerance;
}

/**
 * Create a Shopify AUTOMATIC discount that applies at checkout
 * Uses GraphQL Admin API to create customer-specific automatic discounts
 * 
 * Benefits:
 * - No discount code needed
 * - Applies automatically at checkout
 * - Customer-specific (only for the email that redeemed coins)
 * - Single-use per customer
 * - Combines with other discounts
 */
async function createShopifyDiscount(shopUrl, email, coinsToRedeem, discountAmount, discountCode) {
  const requestTimestamp = new Date().toISOString();
  
  try {
    // Log comprehensive request details
    console.log('[Discount] 📝 Request Details:', JSON.stringify({
      timestamp: requestTimestamp,
      shopUrl,
      customerEmail: email,
      coinsToRedeem,
      discountAmount,
      discountCode,
      formattedAmount: formatDiscountAmount(discountAmount)
    }, null, 2));
    
    console.log(`[Discount] 🎫 Creating AUTOMATIC discount for ${email}: ₹${discountAmount}`);
    
    // Get shop's access token and get customer ID
    const shopResult = await db.query('SELECT shopify_access_token FROM users WHERE store_url = $1', [shopUrl]);
    
    if (shopResult.rows.length === 0 || !shopResult.rows[0].shopify_access_token) {
      console.warn(`[Discount] ⚠️  No Shopify API access for ${shopUrl}`);
      
      // Fallback to discount code method
      return {
        success: true,
        discountCode,
        discountValue: discountAmount,
        requiresManualSetup: true,
        message: `Discount code ${discountCode} generated. Create it manually in Shopify admin for ₹${discountAmount} off.`
      };
    }
    
    const accessToken = shopResult.rows[0].shopify_access_token;
    
    // Step 1: Get customer ID from Shopify by email
    console.log(`[Discount] 🔍 Looking up customer ID for ${email}...`);
    const customerQuery = `
      query getCustomer($email: String!) {
        customers(first: 1, query: $email) {
          edges {
            node {
              id
              email
            }
          }
        }
      }
    `;
    
    const customerResponse = await fetch(`https://${shopUrl}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: customerQuery,
        variables: { email: `email:${email}` }
      })
    });
    
    const customerResult = await customerResponse.json();
    const customerId = customerResult.data?.customers?.edges?.[0]?.node?.id;
    
    if (!customerId) {
      console.warn(`[Discount] ⚠️  Customer ${email} not found in Shopify`);
      // Fallback to discount code for all customers
      return await createDiscountCodeFallback(shopUrl, accessToken, email, coinsToRedeem, discountAmount, discountCode);
    }
    
    console.log(`[Discount] ✅ Found customer ID: ${customerId}`);
    
    // Step 2: Create AUTOMATIC discount for this specific customer
    console.log(`[Discount] 🔑 Creating automatic discount via GraphQL API...`);
    
    const graphqlQuery = `
      mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
          automaticDiscountNode {
            id
            automaticDiscount {
              ... on DiscountAutomaticBasic {
                title
                startsAt
                endsAt
                status
                customerGets {
                  value {
                    ... on DiscountAmount {
                      amount {
                        amount
                      }
                    }
                  }
                }
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
      automaticBasicDiscount: {
        title: `Coin Wallet Discount - ${discountCode}`,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        customerSelection: {
          customers: {
            add: [customerId]
          }
        },
        customerGets: {
          value: {
            discountAmount: {
              amount: formatDiscountAmount(discountAmount),
              appliesOnEachItem: false
            }
          },
          items: {
            all: true
          }
        },
        minimumRequirement: {
          greaterThanOrEqualToSubtotal: {
            greaterThanOrEqualToSubtotal: "0"
          }
        },
        combinesWith: {
          orderDiscounts: true,
          productDiscounts: true,
          shippingDiscounts: false
        }
      }
    };
    
    // Log the exact payload being sent to Shopify
    console.log('[Discount] 📤 GraphQL Mutation Variables:', JSON.stringify({
      discountAmount: discountAmount,
      formattedAmount: formatDiscountAmount(discountAmount),
      fullVariables: variables
    }, null, 2));
    
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
    
    // Log complete response
    console.log('[Discount] 📥 GraphQL Response:', JSON.stringify({
      timestamp: new Date().toISOString(),
      success: !!result.data?.discountAutomaticBasicCreate?.automaticDiscountNode,
      hasErrors: !!result.data?.discountAutomaticBasicCreate?.userErrors?.length,
      response: result
    }, null, 2));
    
    if (result.data?.discountAutomaticBasicCreate?.automaticDiscountNode) {
      console.log(`[Discount] ✅ AUTOMATIC discount created successfully!`);
      
      const discountId = result.data.discountAutomaticBasicCreate.automaticDiscountNode.id;
      
      // Verify the created discount amount
      const verificationResult = await getDiscountDetails(shopUrl, accessToken, discountId);
      
      let verified = false;
      let actualDiscountValue = discountAmount;
      let amountMismatch = false;
      
      if (verificationResult.success) {
        actualDiscountValue = verificationResult.actualAmount;
        verified = verifyDiscountAmount(discountAmount, actualDiscountValue);
        amountMismatch = !verified;
        
        if (amountMismatch) {
          logDiscrepancy(discountAmount, actualDiscountValue, discountCode);
        } else {
          console.log(`[Discount] ✅ Amount verified: ₹${actualDiscountValue} matches expected ₹${discountAmount}`);
        }
      } else {
        console.warn(`[Discount] ⚠️  Could not verify discount amount: ${verificationResult.error}`);
      }
      
      return {
        success: true,
        discountCode: discountCode,
        discountValue: discountAmount,
        actualDiscountValue,
        discountId,
        isAutomatic: true,
        verified,
        amountMismatch,
        message: `Automatic discount ₹${discountAmount} will apply at checkout!`
      };
    }
    
    if (result.data?.discountAutomaticBasicCreate?.userErrors?.length > 0) {
      const errors = result.data.discountAutomaticBasicCreate.userErrors;
      console.error('[Discount] ❌ GraphQL errors:', errors);
      
      // Fallback to discount code
      return await createDiscountCodeFallback(shopUrl, accessToken, email, coinsToRedeem, discountAmount, discountCode);
    }
    
    // If automatic discount fails, fallback to discount code
    console.log('[Discount] ⚠️  Automatic discount failed, using discount code...');
    return await createDiscountCodeFallback(shopUrl, accessToken, email, coinsToRedeem, discountAmount, discountCode);
    
  } catch (error) {
    console.error('[Discount] ❌ Error:', error);
    
    // Fallback to discount code
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
 * Fallback: Create discount code (not automatic)
 */
async function createDiscountCodeFallback(shopUrl, accessToken, email, coinsToRedeem, discountAmount, discountCode) {
  console.log('[Discount] 🔄 Creating discount CODE as fallback...');
  
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
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    basicCodeDiscount: {
      title: `Coin Wallet - ${discountCode}`,
      code: discountCode,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      customerSelection: {
        all: true
      },
      customerGets: {
        value: {
          discountAmount: {
            amount: formatDiscountAmount(discountAmount),
            appliesOnEachItem: false
          }
        },
        items: {
          all: true
        }
      },
      appliesOncePerCustomer: true,
      usageLimit: 1,
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: false,
        shippingDiscounts: false
      }
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
    
    if (result.data?.discountCodeBasicCreate?.codeDiscountNode) {
      console.log(`[Discount] ✅ Discount code created!`);
      return {
        success: true,
        discountCode,
        discountValue: discountAmount,
        message: `Discount code ${discountCode} created! Use at checkout.`
      };
    }
    
    throw new Error('Failed to create discount code');
    
  } catch (error) {
    console.error('[Discount] ❌ Fallback failed:', error);
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
  createShopifyDiscount,
  formatDiscountAmount,
  getDiscountDetails,
  verifyDiscountAmount,
  logDiscrepancy
};
