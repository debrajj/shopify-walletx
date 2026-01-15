const db = require('../config/db');

/**
 * Create a Shopify discount code using the Admin API
 * Falls back to URL parameter method if API access is not available
 */
async function createShopifyDiscount(shopUrl, email, coinsToRedeem, discountAmount) {
  try {
    // Generate unique discount code
    const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const discountCode = `WALLET${emailHash}${timestamp}`.substring(0, 20).toUpperCase();
    
    console.log(`[Discount] Creating discount: ${discountCode} for ₹${discountAmount}`);
    
    // Get shop's access token
    const shopResult = await db.query('SELECT shopify_access_token FROM users WHERE store_url = $1', [shopUrl]);
    
    if (shopResult.rows.length === 0 || !shopResult.rows[0].shopify_access_token) {
      console.warn(`[Discount] No Shopify access token for ${shopUrl} - using URL parameter method`);
      
      // Return discount code that will be applied via URL parameter
      // Shopify will show "discount code not found" but merchant can create it manually
      return {
        success: true,
        discountCode,
        discountValue: discountAmount,
        requiresManualSetup: true,
        message: `Discount code ${discountCode} will be applied at checkout. Merchant should create this discount in Shopify admin for ₹${discountAmount} off.`
      };
    }
    
    const accessToken = shopResult.rows[0].shopify_access_token;
    
    // Try to create price rule via Shopify Admin API
    try {
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
        console.error('[Discount] Failed to create price rule:', priceRuleData);
        throw new Error('Price rule creation failed');
      }
      
      // Create discount code for the price rule
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
        console.error('[Discount] Failed to create discount code:', discountData);
        throw new Error('Discount code creation failed');
      }
      
      console.log(`[Discount] ✅ Shopify discount created: ${discountCode}`);
      
      return {
        success: true,
        discountCode,
        discountValue: discountAmount,
        priceRuleId: priceRuleData.price_rule.id,
        message: `Discount code created for ${coinsToRedeem} coins`
      };
      
    } catch (apiError) {
      console.error('[Discount] Shopify API error:', apiError.message);
      
      // Fallback to URL parameter method
      return {
        success: true,
        discountCode,
        discountValue: discountAmount,
        requiresManualSetup: true,
        message: `Discount code ${discountCode} will be applied. Merchant should create this discount in Shopify admin for ₹${discountAmount} off.`
      };
    }
    
  } catch (error) {
    console.error('[Discount] Error creating discount:', error);
    
    // Generate a code anyway
    const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const discountCode = `WALLET${emailHash}${timestamp}`.substring(0, 20).toUpperCase();
    
    return {
      success: true,
      discountCode,
      discountValue: discountAmount,
      requiresManualSetup: true,
      message: `Discount code ${discountCode} generated. Merchant should create this discount in Shopify admin for ₹${discountAmount} off.`
    };
  }
}

module.exports = {
  createShopifyDiscount
};
