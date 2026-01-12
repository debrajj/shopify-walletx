const { shopifyApp } = require('@shopify/shopify-app-express');
const { PostgreSQLSessionStorage } = require('@shopify/shopify-app-session-storage-postgresql');
const db = require('../config/db');

// Use existing database connection from db.js
// Session storage for Shopify - use the existing db.query connection
const sessionStorage = new PostgreSQLSessionStorage(db);

// Shopify app configuration
const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(',') || ['read_customers', 'write_customers', 'read_orders', 'write_orders'],
    hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
    hostScheme: process.env.HOST?.startsWith('https') ? 'https' : 'http',
    apiVersion: '2024-01',
    isEmbeddedApp: true,
  },
  auth: {
    path: '/api/shopify/auth',
    callbackPath: '/api/shopify/auth/callback',
  },
  webhooks: {
    path: '/api/shopify/webhooks',
  },
  sessionStorage,
  useOnlineTokens: true,
});

module.exports = { shopify, sessionStorage };
