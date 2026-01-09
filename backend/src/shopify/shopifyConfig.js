const { shopifyApp } = require('@shopify/shopify-app-express');
const { PostgreSQLSessionStorage } = require('@shopify/shopify-app-session-storage-postgresql');
const { Pool } = require('pg');

// Use existing database pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Session storage for Shopify
const sessionStorage = new PostgreSQLSessionStorage(pool);

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

module.exports = { shopify, pool };
