# Shopify App Integration Guide

## Goal
Embed your admin dashboard (https://shopify-walletx-1.onrender.com/) as a Shopify App so merchants can access it from their Shopify admin panel.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Shopify Admin Panel                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Your App (Embedded iFrame)                            │ │
│  │  https://shopify-walletx-1.onrender.com/               │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Dashboard   │  │ Transactions │  │  Settings   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Backend API Calls
                              │
                              ▼
              https://shopify-walletx.onrender.com/api
```

## Prerequisites

1. ✅ Backend deployed: https://shopify-walletx.onrender.com
2. ✅ Frontend deployed: https://shopify-walletx-1.onrender.com
3. ⚠️ Need: Shopify Partner Account
4. ⚠️ Need: Create Shopify App in Partner Dashboard

---

## Step 1: Create Shopify Partner Account

1. Go to: https://partners.shopify.com/signup
2. Sign up for a free Partner account
3. Verify your email

---

## Step 2: Create a New Shopify App

1. **Go to Partner Dashboard**: https://partners.shopify.com/
2. **Click "Apps"** in the left sidebar
3. **Click "Create app"**
4. **Select "Create app manually"**
5. **Fill in details**:
   - **App name**: `ShopWallet Admin`
   - **App URL**: `https://shopify-walletx-1.onrender.com`
   - **Allowed redirection URL(s)**: 
     ```
     https://shopify-walletx-1.onrender.com/auth/callback
     https://shopify-walletx-1.onrender.com/auth/shopify/callback
     ```

6. **Click "Create app"**

---

## Step 3: Configure App Settings

After creating the app, you'll get:
- **API Key** (Client ID)
- **API Secret Key** (Client Secret)

### Configure App URLs:
1. Go to **"App setup"** tab
2. Set **App URL**: `https://shopify-walletx-1.onrender.com`
3. Set **Allowed redirection URL(s)**:
   ```
   https://shopify-walletx-1.onrender.com/auth/callback
   https://shopify-walletx-1.onrender.com/auth/shopify/callback
   ```

### Configure Embedded App:
1. Go to **"App setup"** → **"Embedded app"**
2. ✅ Enable "Embed your app in Shopify admin"
3. This allows your React app to load inside Shopify's admin panel

### Configure App Scopes:
1. Go to **"Configuration"** → **"Scopes"**
2. Select these scopes:
   - `read_orders` - Read order data
   - `write_orders` - Modify orders (for discount codes)
   - `read_customers` - Read customer data
   - `write_customers` - Update customer data
   - `read_discounts` - Read discount codes
   - `write_discounts` - Create discount codes

3. **Save** the configuration

---

## Step 4: Update Your Frontend for Shopify App Bridge

Your React app needs to use **Shopify App Bridge** to work inside the Shopify admin iframe.

### Install Shopify App Bridge:
```bash
npm install @shopify/app-bridge @shopify/app-bridge-react
```

### Update Your App to Use App Bridge:

Create a new file `src/shopify/AppBridgeProvider.tsx`:

```typescript
import { Provider } from '@shopify/app-bridge-react';
import { ReactNode } from 'react';

interface AppBridgeProviderProps {
  children: ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  // Get shop and host from URL params (Shopify passes these)
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop') || '';
  const host = urlParams.get('host') || '';

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
```

### Wrap Your App:

Update `App.tsx`:

```typescript
import { AppBridgeProvider } from './shopify/AppBridgeProvider';

function App() {
  return (
    <AppBridgeProvider>
      <AuthProvider>
        {/* Your existing app */}
      </AuthProvider>
    </AppBridgeProvider>
  );
}
```

---

## Step 5: Add Environment Variables

### Frontend (Render Static Site):

Add these to your frontend environment variables on Render:

```bash
VITE_SHOPIFY_API_KEY=your_api_key_from_step_3
VITE_APP_URL=https://shopify-walletx-1.onrender.com
```

### Backend (Already deployed):

Your backend already has the necessary setup for multi-tenancy with `store_url`.

---

## Step 6: Handle Shopify OAuth Flow

When a merchant installs your app, Shopify will redirect them through an OAuth flow.

### Create OAuth Handler:

Create `src/pages/AuthCallback.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const code = urlParams.get('code');

    if (shop && code) {
      // Exchange code for access token
      fetch(`${import.meta.env.VITE_API_BASE_URL}/shopify/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, code })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Store shop info and redirect to dashboard
          localStorage.setItem('shopify_shop', shop);
          navigate('/dashboard');
        }
      })
      .catch(err => {
        console.error('OAuth error:', err);
      });
    }
  }, [navigate]);

  return <div>Authenticating with Shopify...</div>;
}
```

### Add Route:

Update your router to include the callback route:

```typescript
<Route path="/auth/callback" element={<AuthCallback />} />
<Route path="/auth/shopify/callback" element={<AuthCallback />} />
```

---

## Step 7: Backend OAuth Endpoint

Your backend needs to handle the OAuth callback and exchange the code for an access token.

Add to `backend/src/index.js`:

```javascript
// Shopify OAuth Callback
app.post('/api/shopify/auth/callback', async (req, res) => {
  try {
    const { shop, code } = req.body;
    
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code: code
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      // Store or update the shop's access token in your database
      await db.query(`
        INSERT INTO users (store_url, shopify_access_token, email, password_hash, name, store_name)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (store_url) 
        DO UPDATE SET shopify_access_token = $2
      `, [shop, tokenData.access_token, `admin@${shop}`, '', 'Admin', shop]);
      
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Failed to get access token' });
    }
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
```

### Add Environment Variables to Backend:

On Render backend service, add:

```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
```

---

## Step 8: Test Your App

### Install on Development Store:

1. Go to Partner Dashboard → Your App
2. Click "Test your app"
3. Select a development store (or create one)
4. Click "Install app"
5. Shopify will redirect to your app URL with OAuth params
6. Your app should handle the OAuth flow and load inside Shopify admin

### Access Your App:

After installation, merchants can access your app from:
- Shopify Admin → Apps → ShopWallet Admin

---

## Step 9: App Distribution

### For Testing:
- Use development stores (free)
- Share app link with specific stores

### For Public Release:
1. Complete app listing in Partner Dashboard
2. Submit for Shopify App Store review
3. Once approved, merchants can install from App Store

---

## Current Status

✅ Backend API deployed and working
✅ Frontend deployed and working
⚠️ Need to add Shopify App Bridge integration
⚠️ Need to create Shopify Partner account
⚠️ Need to register app in Partner Dashboard
⚠️ Need to implement OAuth flow

---

## Next Steps

1. Create Shopify Partner account
2. Register your app and get API credentials
3. Install Shopify App Bridge packages
4. Update frontend to use App Bridge
5. Implement OAuth callback handler
6. Test on development store
7. Submit for App Store review (optional)

---

## Important Notes

- Your app will load inside an iframe in Shopify admin
- Use Shopify App Bridge for navigation and UI components
- All API calls go to your backend (already set up)
- Shopify handles authentication via OAuth
- Your backend stores the shop's access token for API calls

