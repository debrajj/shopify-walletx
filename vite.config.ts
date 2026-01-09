import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '', '')
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_DEV_PORT || '5173'),
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
    // Make sure environment variables are available
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
    }
  }
})