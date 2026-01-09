// Environment configuration utility
// All environment variables must be prefixed with VITE_ to be accessible in the browser

export const config = {
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'ShopWallet',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  },

  // Development Server Configuration
  dev: {
    port: parseInt(import.meta.env.VITE_DEV_PORT || '5173'),
  },

  // Storage Configuration
  storage: {
    apiConfigKey: import.meta.env.VITE_STORAGE_KEY || 'shopwallet_api_config',
    userKey: import.meta.env.VITE_USER_STORAGE_KEY || 'shopwallet_user',
  },

  // Security Configuration
  security: {
    enableHttps: import.meta.env.VITE_ENABLE_HTTPS === 'true',
    corsOrigin: import.meta.env.VITE_CORS_ORIGIN || 'http://localhost:5173',
  },
} as const;

// Helper function to check if we're in development mode
export const isDevelopment = import.meta.env.DEV;

// Helper function to check if we're in production mode
export const isProduction = import.meta.env.PROD;

// Helper function to get the current environment
export const getEnvironment = () => {
  if (isDevelopment) return 'development';
  if (isProduction) return 'production';
  return 'unknown';
};