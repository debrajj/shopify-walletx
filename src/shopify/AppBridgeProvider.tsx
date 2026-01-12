import { ReactNode, useEffect } from 'react';
import createApp from '@shopify/app-bridge';

interface AppBridgeProviderProps {
  children: ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  useEffect(() => {
    // Get shop and host from URL params (Shopify passes these when app is embedded)
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop') || '';
    const host = urlParams.get('host') || '';

    // Check if we're running inside Shopify (has shop param)
    const isEmbedded = !!shop;

    // If embedded, initialize App Bridge
    if (isEmbedded && import.meta.env.VITE_SHOPIFY_API_KEY) {
      const config = {
        apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
        host: host,
        forceRedirect: true,
      };

      try {
        const app = createApp(config);
        console.log('Shopify App Bridge initialized', app);
      } catch (error) {
        console.error('Failed to initialize App Bridge:', error);
      }
    }
  }, []);

  // Just render children - App Bridge is initialized via useEffect
  return <>{children}</>;
}
