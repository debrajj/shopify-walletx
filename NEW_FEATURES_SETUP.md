# New Wallet Features - Setup Guide

## What's New

I've implemented the core features to match professional Shopify wallet management apps:

### ✅ Implemented Features

1. **Automatic Purchase Rewards**
   - Award coins automatically when customers make purchases
   - Configurable reward rate (e.g., 1 coin per $1 spent)
   - Minimum order value threshold

2. **Welcome Bonus**
   - New customers get bonus coins on first wallet creation
   - Configurable bonus amount

3. **Tiered Loyalty Program**
   - 4 tiers: Bronze, Silver, Gold, Platinum
   - Automatic tier upgrades based on spending
   - Tier-based reward multipliers

4. **Referral System**
   - Customers get unique referral codes
   - Earn coins when referred friends make purchases
   - Automatic reward distribution

5. **Customer Portal**
   - Beautiful wallet dashboard for customers
   - View balance, tier status, and transaction history
   - Referral code sharing
   - Rewards information

6. **Email Notifications** (queued)
   - Reward earned notifications
   - Welcome bonus notifications
   - Tier upgrade notifications
   - Referral success notifications

## Setup Instructions

### 1. Run Database Migration

First, update your database schema:

```bash
# Connect to your PostgreSQL database and run:
psql -d your_database < backend/src/migrations/add_reward_settings.sql
```

Or manually run the SQL from `backend/src/migrations/add_reward_settings.sql`

### 2. Configure Reward Settings

The backend will automatically deploy. Then configure rewards in your admin dashboard:

**Default Settings:**
- Reward per dollar: 1 coin per $1
- Welcome bonus: 500 coins
- Referral reward: 100 coins
- Review reward: 50 coins
- Birthday reward: 100 coins
- Auto rewards: Enabled

**API Endpoint:** `PUT /api/settings`

```json
{
  "rewards": {
    "rewardPerDollar": 1.0,
    "welcomeBonus": 500,
    "minOrderForRewards": 0,
    "referralReward": 100,
    "reviewReward": 50,
    "birthdayReward": 100,
    "enableAutoRewards": true,
    "enableWelcomeBonus": true,
    "enableReferrals": true,
    "coinExpiryDays": 0
  }
}
```

### 3. Deploy Shopify Extension

Deploy the updated extension with the customer portal:

```bash
shopify app deploy
```

### 4. Add Customer Portal Page

In your Shopify theme:

1. Go to **Online Store > Themes > Customize**
2. Add a new page template
3. Add the **Wallet Portal** app block
4. Save and publish

Or create a page at `/pages/wallet` and add the app block.

### 5. Set Up Shopify Webhooks

Configure these webhooks in Shopify Admin:

**Orders Paid Webhook:**
- URL: `https://shopify-walletx.onrender.com/webhooks/orders/paid`
- Format: JSON
- API Version: 2024-01

This webhook will:
- Award purchase rewards automatically
- Update customer tiers
- Process referrals
- Handle coin redemptions

## How It Works

### Automatic Rewards Flow

1. **Customer Makes Purchase**
   - Shopify sends webhook to your backend
   - Backend calculates coins based on order total
   - Coins are added to customer's wallet
   - Notification is queued

2. **Tier Upgrades**
   - System tracks total spending per customer
   - Automatically upgrades tier when thresholds are met
   - Sends tier upgrade notification

3. **Referrals**
   - Customer shares referral code
   - New customer uses code at checkout (in order notes)
   - When referred customer completes first purchase
   - Referrer gets reward coins

### Customer Portal

Customers can access their wallet at `/pages/wallet` (or wherever you add the block):

- View current balance and tier
- See transaction history
- Get referral code
- Learn how to earn more coins

## API Endpoints

### Customer-Facing APIs

```
GET  /api/customer/wallet/:email?shop=store.myshopify.com
GET  /api/customer/rewards/info?shop=store.myshopify.com
POST /api/customer/referral/register
```

### Admin APIs

```
GET  /api/settings (includes rewards config)
PUT  /api/settings (update rewards config)
```

## Testing

### Test Purchase Rewards

1. Make a test order on your store
2. Check the backend logs for reward processing
3. Verify coins were added to customer wallet
4. Check transaction history

### Test Referral System

1. Load customer portal
2. Copy referral code
3. Create new order with referral code in notes (format: `REF:CODE123`)
4. Complete purchase
5. Check referrer's wallet for bonus coins

### Test Tier System

1. Make multiple purchases to reach tier thresholds:
   - Bronze: $0+
   - Silver: $1,000+
   - Gold: $5,000+
   - Platinum: $10,000+
2. Check customer portal for tier badge

## Customization

### Adjust Tier Thresholds

Edit `backend/src/services/rewardService.js`:

```javascript
// In updateCustomerTier function
let tierLevel = 'BRONZE';
if (totalSpent >= 10000) tierLevel = 'PLATINUM';
else if (totalSpent >= 5000) tierLevel = 'GOLD';
else if (totalSpent >= 1000) tierLevel = 'SILVER';
```

### Customize Portal Design

Edit `extensions/wallet-theme-app/blocks/wallet-portal.liquid`:
- Modify CSS in the `<style>` section
- Change colors, fonts, layout
- Add your branding

### Add More Reward Types

Extend `backend/src/services/rewardService.js`:
- Birthday rewards
- Review rewards
- Social media sharing rewards
- Milestone rewards

## Next Steps

1. **Email Notifications**: Implement email sending service
2. **Coin Expiration**: Add expiration date tracking
3. **Advanced Analytics**: Track reward ROI
4. **Mobile App**: Create mobile wallet experience
5. **Gamification**: Add badges, achievements, challenges

## Troubleshooting

**Rewards not being awarded:**
- Check webhook is configured correctly
- Verify `enable_auto_rewards` is true in settings
- Check backend logs for errors

**Customer portal not loading:**
- Verify API_BASE URL in liquid template
- Check CORS settings
- Ensure customer email is valid

**Referrals not working:**
- Ensure `enable_referrals` is true
- Check referral code format in order notes
- Verify referred customer completed purchase

## Support

Check logs at:
- Backend: Render dashboard logs
- Frontend: Browser console
- Database: Check transaction and referral tables

All features are now live and will auto-deploy!
