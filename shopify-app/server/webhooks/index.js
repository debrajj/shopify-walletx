import { shopify } from '../config/shopify.js';
import { logger } from '../utils/logger.js';
import { handleCustomerCreate } from './handlers/customerCreate.js';
import { handleOrderCreate } from './handlers/orderCreate.js';
import { handleOrderPaid } from './handlers/orderPaid.js';

export function setupWebhooks(app) {
  // Customer creation webhook
  shopify.webhooks.addHandlers({
    CUSTOMERS_CREATE: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/customers/create',
      callback: async (topic, shop, body, webhookId) => {
        try {
          await handleCustomerCreate(shop, JSON.parse(body));
          logger.info('Customer create webhook processed', { shop, webhookId });
        } catch (error) {
          logger.error('Customer create webhook error', { error: error.message, shop });
        }
      }
    },
    ORDERS_CREATE: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/orders/create',
      callback: async (topic, shop, body, webhookId) => {
        try {
          await handleOrderCreate(shop, JSON.parse(body));
          logger.info('Order create webhook processed', { shop, webhookId });
        } catch (error) {
          logger.error('Order create webhook error', { error: error.message, shop });
        }
      }
    },
    ORDERS_PAID: {
      deliveryMethod: 'http',
      callbackUrl: '/api/webhooks/orders/paid',
      callback: async (topic, shop, body, webhookId) => {
        try {
          await handleOrderPaid(shop, JSON.parse(body));
          logger.info('Order paid webhook processed', { shop, webhookId });
        } catch (error) {
          logger.error('Order paid webhook error', { error: error.message, shop });
        }
      }
    }
  });

  // Webhook endpoint
  app.post('/api/webhooks/:topic', async (req, res) => {
    try {
      await shopify.webhooks.process({
        rawBody: req.body,
        rawRequest: req,
        rawResponse: res,
      });
    } catch (error) {
      logger.error('Webhook processing error', { error: error.message });
      res.status(500).send('Webhook processing failed');
    }
  });

  logger.info('Webhooks configured');
}
