import { shopify } from '../config/shopify.js';
import { pool } from '../config/shopify.js';
import { logger } from '../utils/logger.js';

/**
 * Customer Synchronization Service
 * Syncs customer data between Shopify and our database
 */

export class CustomerSyncService {
  /**
   * Sync a single customer from Shopify
   */
  async syncCustomer(session, shopifyCustomerId) {
    try {
      const client = new shopify.api.clients.Graphql({ session });
      
      // Fetch customer data from Shopify
      const response = await client.query({
        data: `{
          customer(id: "gid://shopify/Customer/${shopifyCustomerId}") {
            id
            email
            firstName
            lastName
            phone
            createdAt
            updatedAt
          }
        }`
      });
      
      const customer = response.body.data.customer;
      
      if (!customer) {
        logger.warn('Customer not found in Shopify', { shopifyCustomerId });
        return null;
      }
      
      // Check if customer coin account exists
      const accountResult = await pool.query(
        'SELECT * FROM customer_coin_accounts WHERE shopify_customer_id = $1 AND shop_id = $2',
        [shopifyCustomerId, session.shop]
      );
      
      if (accountResult.rows.length === 0) {
        // Create new coin account
        const configResult = await pool.query(
          'SELECT welcome_bonus FROM shop_configurations WHERE shop_id = $1',
          [session.shop]
        );
        
        const welcomeBonus = configResult.rows[0]?.welcome_bonus || 0;
        
        await pool.query(
          `INSERT INTO customer_coin_accounts (customer_id, shopify_customer_id, shop_id, total_coins, lifetime_earned)
           VALUES ($1, $2, $3, $4, $4)`,
          [shopifyCustomerId, shopifyCustomerId, session.shop, welcomeBonus]
        );
        
        logger.info('Customer coin account created', { shopifyCustomerId, shop: session.shop });
      }
      
      return customer;
    } catch (error) {
      logger.error('Customer sync error', { error: error.message, shopifyCustomerId });
      throw error;
    }
  }
  
  /**
   * Sync all customers from Shopify
   */
  async syncAllCustomers(session) {
    try {
      const client = new shopify.api.clients.Graphql({ session });
      let hasNextPage = true;
      let cursor = null;
      let syncedCount = 0;
      
      while (hasNextPage) {
        const response = await client.query({
          data: `{
            customers(first: 50${cursor ? `, after: "${cursor}"` : ''}) {
              edges {
                node {
                  id
                  email
                  firstName
                  lastName
                }
                cursor
              }
              pageInfo {
                hasNextPage
              }
            }
          }`
        });
        
        const customers = response.body.data.customers;
        
        for (const edge of customers.edges) {
          const customerId = edge.node.id.replace('gid://shopify/Customer/', '');
          await this.syncCustomer(session, customerId);
          syncedCount++;
        }
        
        hasNextPage = customers.pageInfo.hasNextPage;
        if (hasNextPage && customers.edges.length > 0) {
          cursor = customers.edges[customers.edges.length - 1].cursor;
        }
      }
      
      logger.info('All customers synced', { shop: session.shop, count: syncedCount });
      return syncedCount;
    } catch (error) {
      logger.error('Bulk customer sync error', { error: error.message });
      throw error;
    }
  }
}

export const customerSyncService = new CustomerSyncService();
