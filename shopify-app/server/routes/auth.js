import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get current session info
router.get('/session', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    res.json({
      shop: session.shop,
      isOnline: session.isOnline,
      scope: session.scope,
      accessToken: session.accessToken ? '***' : null // Don't expose actual token
    });
  } catch (error) {
    logger.error('Session fetch error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export default router;
