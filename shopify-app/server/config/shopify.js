import { shopifyApp } from '@shopify/shopify-app-express';
import { PostgreSQLSessionStorage } from '@shopify/shopify-app-session-storage-postgresql';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-01';
import pg from 'pg';

const { Pool } = pg;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Session storage configuration
const sessionStorage = new PostgreSQLSessionStorage(pool);

// Shopify app configuration
export const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(',') || [],
    hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
    hostScheme: process.env.HOST?.startsWith('https') ? 'https' : 'http',
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
    isEmbeddedApp: true,
    restResources,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage,
  useOnlineTokens: true,
});

export { pool };
