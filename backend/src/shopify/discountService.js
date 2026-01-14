const db = require('../config/db');

/**
 * Create a Shopify discount code using the Admin API
 */
async function createShopifyDiscount(shopUrl, email, coinsToRedeem, discountAmount) {
  try {
    // Generate unique discount code
    const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const discountCode = `WALLET${emailHash}${timestamp}`.substring(0, 20).toUpperCase();
    
    console.log(`[Discount] Creating Shopify discount: ${discountCode} for $${discountAmount}`);
    
    // Get shop's access token
    const shopResult = await db.query('SELECT shopify_access_token FROM users WHERE store_url = $1', [shopUrl]);
    
    if (shopResult.rows.length === 0 || !shopResult.rows[0].shopify_access_token) {
      console.warn(`[Discount] No Shopify access token for ${shopUrl} - using simple code`);
      
      // Return simple discount code that merchant can manually create
      return {
        success: true,
        discountCode,
        discountValue: discountAmount,
        requiresManualSetup: true,
        message: `Use code ${discountCode} at checkout (merchant must create this discount manually in Shopify admin)`
      };
    }
    
    const accessToken = shopResult.rows[0].shopify_access_token;
    
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
      console.error('[Discount] Failed to create price rule:', priceRuleData);
      return {
        success: false,
        discountCode,
        requiresManualSetup: true,
        message: 'Failed to create Shopify price rule',
        error: priceRuleData.errors
      };
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
      return {
        success: false,
        discountCode,
        requiresManualSetup: true,
        message: 'Failed to create Shopify discount code',
        error: discountData.errors
      };
    }
    
    console.log(`[Discount] ✅ Shopify discount created: ${discountCode}`);
    
    return {
      success: true,
      discountCode,
      discountValue: discountAmount,
      priceRuleId: priceRuleData.price_rule.id,
      message: `Discount code created for ${coinsToRedeem} coins`
    };
    
  } catch (error) {
    console.error('[Discount] Error creating Shopify discount:', error);
    return {
      success: false,
      discountCode: null,
      requiresManualSetup: true,
      message: 'Error creating discount',
      error: error.message
    };
  }
}

module.exports = {
  createShopifyDiscount
};
