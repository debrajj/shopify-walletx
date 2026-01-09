import 'dotenv/config';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { shopify } from './config/shopify.js';
import { setupWebhooks } from './webhooks/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Routes
import authRoutes from './routes/auth.js';
import coinRoutes from './routes/coins.js';
import configRoutes from './routes/config.js';
import analyticsRoutes from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Shopify requires this
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for Shopify embedded app
app.use(cors({
  origin: process.env.SHOPIFY_APP_URL || '*',
  credentials: true
}));

// Body parsing middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Shopify OAuth routes
app.get('/api/auth', shopify.auth.begin());
app.get('/api/auth/callback', shopify.auth.callback(), (req, res) => {
  res.redirect('/');
});

// Verify Shopify session middleware
app.use('/api/*', shopify.validateAuthenticatedSession());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/config', configRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Setup webhooks
setupWebhooks(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Shopify Coin Rewards App server running on port ${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 App URL: ${process.env.HOST || `http://localhost:${PORT}`}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
