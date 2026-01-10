import { Provider } from '@shopify/app-bridge-react';
import { ReactNode } from 'react';

interface AppBridgeProviderProps {
  children: ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  // Get shop and host from URL params (Shopify passes these when app is embedded)
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop') || '';
  const host = urlParams.get('host') || '';

  // Check if we're running inside Shopify (has shop param)
  const isEmbedded = !!shop;

  // If not embedded, just render children without App Bridge
  if (!isEmbedded) {
    return <>{children}</>;
  }

  const config = {
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY || '',
    host: host,
    forceRedirect: true,
  };

  return (
    <Provider config={config}>
      {children}
    </Provider>
  );
}
