# Environment Configuration Guide

This project uses a **single .env file** at the project root containing only the **essential environment variables** that are actually used by the application.

## Minimal .env File Structure

The .env file contains only variables that are actively used in the code:

```
# Frontend (28 variables total)
VITE_APP_NAME=ShopWallet
VITE_BACKEND_URL=http://localhost:3000
# ... other VITE_ variables

# Backend (8 variables total)  
PORT=3000
DB_HOST=your-database-host
# ... other backend variables
```

## Essential Variables Only

### Frontend Variables (VITE_ prefix)
| Variable | Used In | Purpose |
|----------|---------|---------|
| `VITE_APP_NAME` | config/env.ts | Application name |
| `VITE_APP_VERSION` | config/env.ts, vite.config.ts | Version display |
| `VITE_API_BASE_URL` | config/env.ts | API endpoint path |
| `VITE_BACKEND_URL` | config/env.ts, vite.config.ts | Backend server URL |
| `VITE_DEV_PORT` | config/env.ts, vite.config.ts | Dev server port |
| `VITE_STORAGE_KEY` | config/env.ts | LocalStorage key |
| `VITE_USER_STORAGE_KEY` | config/env.ts | User data storage |

### Backend Variables
| Variable | Used In | Purpose |
|----------|---------|---------|
| `PORT` | backend/src/index.js | Server port |
| `DB_HOST` | backend/src/config/db.js | Database host |
| `DB_PORT` | backend/src/config/db.js | Database port |
| `DB_NAME` | backend/src/config/db.js | Database name |
| `DB_USER` | backend/src/config/db.js | Database user |
| `DB_PASSWORD` | backend/src/config/db.js | Database password |
| `BCRYPT_SALT_ROUNDS` | backend/src/index.js | Password hashing |
| `DEFAULT_OTP_EXPIRY_SECONDS` | backend/src/index.js | OTP timeout |
| `CORS_ORIGIN` | backend/src/index.js | CORS configuration |
| `CORS_CREDENTIALS` | backend/src/index.js | CORS credentials |

## AWS RDS Configuration

This project is configured to use AWS RDS PostgreSQL by default. The current setup uses:

- **RDS Endpoint:** `family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com`
- **Database:** `shopify_wallet`
- **Port:** `5432`

### RDS Security Group Settings

Make sure your AWS RDS security group allows connections from your application servers:

1. **Inbound Rules:** Allow PostgreSQL (port 5432) from your application's IP addresses
2. **VPC Configuration:** Ensure your RDS instance is accessible from your deployment environment
3. **SSL/TLS:** Consider enabling SSL connections for production

### Local Development with RDS

You can develop locally while connecting to the remote RDS instance, or set up a local PostgreSQL for development:

```bash
# For local PostgreSQL development
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_local_password

# For AWS RDS (current default)
DB_HOST=family-tree-db.cuafddu82hzq.ap-south-1.rds.amazonaws.com
DB_USER=postgres
DB_PASSWORD=v4HmYtmNgvsVkRrB81AT
```

## Setup Instructions

### Development Setup

1. **Frontend:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your development settings
   nano .env
   ```

2. **Backend:**
   ```bash
   # Copy the example file
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your database settings
   nano backend/.env
   ```

### Production Setup

1. **Frontend:**
   ```bash
   # Use production environment file
   cp .env.production .env.production.local
   
   # Edit with your production settings
   nano .env.production.local
   
   # Build with production environment
   npm run build
   ```

2. **Backend:**
   ```bash
   # Use production environment file
   cp backend/.env.production backend/.env.production.local
   
   # Edit with your production settings
   nano backend/.env.production.local
   
   # Start with production environment
   NODE_ENV=production npm start
   ```

## Security Best Practices

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Use strong secrets** - Generate random strings for JWT_SECRET and SESSION_SECRET
3. **Use different secrets per environment** - Development and production should have different secrets
4. **Restrict CORS origins** - Only allow your actual frontend domains
5. **Use environment-specific database credentials** - Don't use the same database for dev and prod
6. **Enable HTTPS in production** - Set `VITE_ENABLE_HTTPS=true` and use HTTPS URLs

## Environment Variable Loading

### Frontend (Vite)
- Vite automatically loads `.env` files based on the mode
- Variables are available via `import.meta.env.VITE_*`
- The `config/env.ts` file provides a centralized configuration object

### Backend (Node.js)
- Uses `dotenv` package to load environment variables
- Variables are available via `process.env.*`
- Loads `.env` file automatically when the application starts

## Troubleshooting

### Frontend Issues
- **Variables not loading:** Ensure they start with `VITE_`
- **Build issues:** Check that all required variables are set in production
- **CORS errors:** Verify `VITE_BACKEND_URL` matches your backend server

### Backend Issues
- **Database connection:** Verify database credentials in `backend/.env`
- **Port conflicts:** Change `PORT` if 3000 is already in use
- **CORS errors:** Ensure `CORS_ORIGIN` matches your frontend URL

### Common Solutions
1. Restart development servers after changing environment variables
2. Check for typos in variable names
3. Ensure `.env` files are in the correct directories
4. Verify file permissions on `.env` files