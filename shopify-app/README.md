# Shopify Coin Rewards App

A complete coin/points reward system for Shopify stores that enables customers to earn and redeem coins during checkout, with real-time updates and checkout extensions.

## Features

- 🪙 **Coin Earning System**: Customers earn coins through purchases, signups, referrals, and reviews
- 💳 **Checkout Integration**: Use coins as payment during checkout with partial payment support
- ⚡ **Real-time Updates**: Live synchronization of coin balances across all interfaces
- 📊 **Analytics Dashboard**: Track coin usage and customer engagement
- 🎨 **Checkout Extensions**: Display coin balances in cart and checkout
- 🔒 **Security**: Encrypted data, secure tokens, and audit logging
- 🛠️ **Configurable**: Store owners can customize earning rules and redemption limits

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher
- Shopify Partner account
- Shopify development store

## Installation

### 1. Clone and Install Dependencies

\`\`\`bash
cd shopify-app
npm install
\`\`\`

### 2. Database Setup

Create a PostgreSQL database:

\`\`\`bash
createdb shopify_coin_rewards
\`\`\`

Run migrations:

\`\`\`bash
npm run db:migrate
\`\`\`

Seed development data (optional):

\`\`\`bash
npm run db:seed
\`\`\`

### 3. Redis Setup

Make sure Redis is running:

\`\`\`bash
redis-server
\`\`\`

### 4. Environment Configuration

Copy the example environment file:

\`\`\`bash
cp .env.example .env
\`\`\`

Update the `.env` file with your configuration:

- **Shopify API credentials** from your Partner dashboard
- **Database connection** details
- **Redis connection** details
- **Session and JWT secrets** (generate secure random strings)
- **Encryption key** (32 character string)

### 5. Shopify App Setup

1. Create a new app in your Shopify Partner dashboard
2. Copy the API key and API secret to your `.env` file
3. Update `shopify.app.toml` with your app details
4. Set up ngrok or similar tunnel for local development:

\`\`\`bash
ngrok http 3000
\`\`\`

5. Update your app's URLs in the Partner dashboard with the ngrok URL

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Or use Shopify CLI:

\`\`\`bash
shopify app dev
\`\`\`

## Project Structure

\`\`\`
shopify-app/
├── server/
│   ├── config/          # App configuration
│   ├── database/        # Database schema and migrations
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   ├── webhooks/        # Webhook handlers
│   └── index.js         # Main server file
├── extensions/          # Shopify UI extensions
├── types/               # TypeScript type definitions
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── shopify.app.toml     # Shopify app configuration
└── tsconfig.json        # TypeScript configuration
\`\`\`

## API Endpoints

### Authentication
- `GET /api/auth` - Start OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/session` - Get current session

### Coins
- `GET /api/coins/balance/:customerId` - Get customer coin balance
- `GET /api/coins/transactions/:customerId` - Get transaction history
- `POST /api/coins/award` - Award coins to customer

### Configuration
- `GET /api/config` - Get shop configuration
- `PUT /api/config` - Update shop configuration
- `GET /api/config/rules` - Get earning rules
- `POST /api/config/rules` - Create earning rule
- `PUT /api/config/rules/:ruleId` - Update earning rule

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/trends` - Get transaction trends

## Development

### Running Tests

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

### Formatting

\`\`\`bash
npm run format
\`\`\`

## Deployment

1. Set up production database and Redis
2. Update environment variables for production
3. Build the app:

\`\`\`bash
npm run build
\`\`\`

4. Deploy using Shopify CLI:

\`\`\`bash
npm run deploy
\`\`\`

## Webhooks

The app listens to the following Shopify webhooks:

- `CUSTOMERS_CREATE` - Award welcome bonus
- `ORDERS_CREATE` - Track order creation
- `ORDERS_PAID` - Award purchase coins

## Security

- All sensitive data is encrypted at rest
- JWT tokens for API authentication
- Secure session management with PostgreSQL
- Audit logging for all coin transactions
- GDPR compliance features

## Support

For issues and questions, please refer to the [documentation](./docs) or create an issue in the repository.

## License

MIT
