import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ShopifyAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Authenticating with Shopify...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        const code = urlParams.get('code');
        const hmac = urlParams.get('hmac');

        if (!shop || !code) {
          setError('Missing required OAuth parameters');
          return;
        }

        setStatus('Exchanging authorization code...');

        // Exchange code for access token via backend
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/shopify/auth/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop, code, hmac })
        });

        const data = await response.json();

        if (data.success) {
          setStatus('Authentication successful! Redirecting...');
          
          // Store shop info
          localStorage.setItem('shopify_shop', shop);
          localStorage.setItem('shopify_embedded', 'true');
          
          // Redirect to dashboard with shop param
          setTimeout(() => {
            window.location.href = `/?shop=${shop}&host=${urlParams.get('host') || ''}`;
          }, 1000);
        } else {
          setError(data.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('OAuth error:', err);
        setError('Failed to authenticate with Shopify');
      }
    };

    handleOAuth();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
        {error ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#d72c0d' }}>Authentication Error</h2>
            <p style={{ color: '#666' }}>{error}</p>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#008060',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
            <h2>{status}</h2>
            <div style={{ 
              marginTop: '20px',
              width: '100%',
              height: '4px',
              background: '#e1e3e5',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '50%',
                height: '100%',
                background: '#008060',
                animation: 'loading 1.5s ease-in-out infinite'
              }} />
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
