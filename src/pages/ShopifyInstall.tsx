import { useState } from 'react';

export function ShopifyInstall() {
  const [shopDomain, setShopDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate shop domain
      if (!shopDomain.includes('.myshopify.com')) {
        setError('Please enter a valid Shopify store URL (e.g., your-store.myshopify.com)');
        setLoading(false);
        return;
      }

      // Request installation URL from backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/shopify/auth/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: shopDomain })
      });

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Shopify OAuth page
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to generate installation URL');
        setLoading(false);
      }
    } catch (err) {
      console.error('Install error:', err);
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#333' }}>
            ShopWallet Admin
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Install the app to manage your wallet system
          </p>
        </div>

        <form onSubmit={handleInstall}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#333'
            }}>
              Shopify Store URL
            </label>
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="your-store.myshopify.com"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e1e3e5',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e3e5'}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#5568d3';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#667eea';
            }}
          >
            {loading ? 'Connecting...' : 'Install App'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e1e3e5',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Don't have a Shopify store?
          </p>
          <a
            href="https://www.shopify.com/free-trial"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Start a free trial →
          </a>
        </div>
      </div>
    </div>
  );
}
