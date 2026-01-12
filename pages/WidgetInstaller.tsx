import { useState } from 'react';
import { api } from '../services/api';

export default function WidgetInstaller() {
  const [loading, setLoading] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const shopDomain = window.location.hostname.includes('myshopify.com') 
    ? new URLSearchParams(window.location.search).get('shop') || ''
    : 'cmstestingg.myshopify.com'; // Default for testing

  const installWidget = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('https://shopify-walletx.onrender.com/api/shopify/install-widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop: shopDomain }),
      });

      const data = await response.json();

      if (data.success) {
        setInstalled(true);
        setMessage(data.message || 'Widget installed successfully! It will now appear on your cart page.');
      } else {
        setError(data.error || 'Failed to install widget');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uninstallWidget = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('https://shopify-walletx.onrender.com/api/shopify/uninstall-widget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop: shopDomain }),
      });

      const data = await response.json();

      if (data.success) {
        setInstalled(false);
        setMessage('Widget uninstalled successfully.');
      } else {
        setError(data.error || 'Failed to uninstall widget');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '40px',
        color: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '32px', fontWeight: '700' }}>
          💰 Wallet Widget Installer
        </h1>
        <p style={{ margin: '0 0 32px 0', fontSize: '16px', opacity: 0.9 }}>
          Install the wallet widget on your storefront with one click. No code editing required!
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
            What does this do?
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Adds a wallet widget to your cart page automatically</li>
            <li>Customers can check their balance and apply coins</li>
            <li>Works on all themes without code changes</li>
            <li>Can be uninstalled anytime with one click</li>
          </ul>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>
            Store:
          </p>
          <p style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>
            {shopDomain || 'Not detected'}
          </p>
        </div>

        {message && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.3)',
            border: '1px solid rgba(76, 175, 80, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '14px',
          }}>
            ✅ {message}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(244, 67, 54, 0.3)',
            border: '1px solid rgba(244, 67, 54, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '14px',
          }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          {!installed ? (
            <button
              onClick={installWidget}
              disabled={loading || !shopDomain}
              style={{
                flex: 1,
                padding: '16px 32px',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: loading || !shopDomain ? 'not-allowed' : 'pointer',
                opacity: loading || !shopDomain ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Installing...' : '🚀 Install Widget'}
            </button>
          ) : (
            <button
              onClick={uninstallWidget}
              disabled={loading}
              style={{
                flex: 1,
                padding: '16px 32px',
                background: 'rgba(244, 67, 54, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Uninstalling...' : '🗑️ Uninstall Widget'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        marginTop: '32px',
        padding: '24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#333' }}>
          📋 Manual Installation (Alternative)
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#666', lineHeight: '1.6' }}>
          If automatic installation doesn't work, you can add the widget manually:
        </p>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
          <li>Go to: <strong>Online Store → Themes → Actions → Edit code</strong></li>
          <li>Open <strong>Layout/theme.liquid</strong></li>
          <li>Before the closing <code>&lt;/body&gt;</code> tag, add:</li>
        </ol>
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#333',
          overflowX: 'auto',
        }}>
          &lt;script src="https://shopify-walletx.onrender.com/widget.js"&gt;&lt;/script&gt;
        </div>
      </div>
    </div>
  );
}
