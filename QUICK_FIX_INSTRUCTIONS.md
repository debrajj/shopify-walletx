# 🚀 QUICK FIX - Customer Search Not Working

## The Problem
You're seeing "Customer Not Found" because your browser has an old user session with a mismatched store URL.

## The Solution (Choose ONE)

### ⚡ FASTEST FIX (30 seconds)
Open your browser console (F12) and paste this:

```javascript
localStorage.clear();
location.reload();
```

This will clear your session and use the default store URL that matches your data.

---

### 🔧 ALTERNATIVE FIX (If you want to keep your session)
Open browser console (F12) and paste this:

```javascript
const user = JSON.parse(localStorage.getItem('shopwallet_user') || '{}');
user.storeUrl = 'cmstestingg.myshopify.com';
localStorage.setItem('shopwallet_user', JSON.stringify(user));
location.reload();
```

---

## After the Fix

1. Go to **Customers** section
2. Search for: `debrajecomcure@gmail.com`
3. You should see Debraj with 2120 coins ✅

## What Was Fixed in the Code

✅ Database cleaned up (removed duplicate store URLs)
✅ Backend now normalizes all store URLs automatically
✅ Frontend now normalizes store URLs before sending to API
✅ This issue won't happen again

## Need Help?

If the issue persists:
1. Check browser console for errors
2. Verify you're using the correct store URL: `cmstestingg.myshopify.com`
3. Try logging out and back in
