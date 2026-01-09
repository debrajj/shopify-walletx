import { logger } from '../../utils/logger.js';

export async function handleOrderCreate(shop, orderData) {
  try {
    // Log order creation for tracking
    logger.info('Order created', { 
      shop, 
      orderId: orderData.id,
      customerId: orderData.customer?.id,
      total: orderData.total_price
    });
    
    // Order creation logic can be added here if needed
    // For now, we'll handle coin awards when order is paid
  } catch (error) {
    logger.error('Order create handler error', { error: error.message, shop });
    throw error;
  }
}
