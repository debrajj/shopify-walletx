# Automatic Discount Feature - Requirements

## Overview
Implement Shopify automatic discounts that apply at checkout without requiring customers to enter discount codes manually. This feature allows customers to redeem wallet coins and have the discount automatically applied to their order.

## User Stories

### US-1: Customer-Specific Automatic Discounts
**As a** customer who redeems wallet coins  
**I want** the discount to apply automatically at checkout  
**So that** I don't have to manually enter a discount code

**Acceptance Criteria:**
- Discount applies automatically when customer reaches checkout
- Only the customer who redeemed coins can use the discount
- Discount is tied to customer email address
- No manual code entry required

### US-2: Single-Use Per Customer
**As a** store owner  
**I want** each automatic discount to be single-use per customer  
**So that** customers cannot reuse the same discount multiple times

**Acceptance Criteria:**
- Each discount can only be used once
- After use, discount becomes invalid
- Customer must redeem more coins for new discount

### US-3: Discount Code Fallback
**As a** system  
**I want** to fallback to discount codes when automatic discounts fail  
**So that** customers can still redeem their coins

**Acceptance Criteria:**
- If automatic discount creation fails, generate discount code
- If customer lookup fails, use discount code method
- If Shopify API is unavailable, provide manual setup instructions
- System logs all fallback scenarios

### US-4: Discount Tracking
**As a** store owner  
**I want** all generated discounts tracked in the database  
**So that** I can prevent duplicate discounts and track usage

**Acceptance Criteria:**
- Store discount code, customer email, and amount in database
- Check for existing active discounts before creating new ones
- Track discount expiration (24 hours)
- Mark discounts as used after order completion

### US-5: Balance Persistence
**As a** logged-in customer  
**I want** my wallet balance to load automatically  
**So that** I don't have to enter my email every time

**Acceptance Criteria:**
- Auto-load balance for logged-in Shopify customers
- Store email in localStorage for faster loading
- Refresh balance from server in background
- Persist balance across page reloads

## Technical Requirements

### TR-1: Shopify GraphQL API Integration
- Use Shopify Admin GraphQL API 2024-01
- Implement `discountAutomaticBasicCreate` mutation
- Implement customer lookup by email query
- Handle API errors gracefully

### TR-2: Database Schema
- `discount_codes` table with columns:
  - `id` (serial primary key)
  - `store_url` (varchar, references users)
  - `discount_code` (varchar, unique)
  - `customer_email` (varchar)
  - `coins_redeemed` (decimal)
  - `discount_amount` (decimal)
  - `is_used` (boolean, default false)
  - `expires_at` (timestamp)
  - `created_at` (timestamp)

### TR-3: API Endpoints
- `POST /api/shopify/create-discount`
  - Input: email, coinsToRedeem, discountAmount, discountCode
  - Output: success, discountCode, discountValue, newBalance, isAutomatic
  - Validates customer balance
  - Checks for existing active discounts
  - Creates Shopify discount (automatic or code)
  - Deducts coins from wallet
  - Logs transaction

### TR-4: Widget Integration
- Widget version 2.3.0 or higher
- Auto-load balance for logged-in customers
- Real-time savings display
- Instant cart total update
- Support for Ella theme and other Shopify themes

### TR-5: Error Handling
- Network errors: Show user-friendly message
- Insufficient balance: Prevent redemption
- API failures: Fallback to discount code
- Duplicate discounts: Return existing code
- Manual setup: Provide clear instructions

## Business Rules

### BR-1: Discount Configuration
- Discount type: Fixed amount (not percentage)
- Currency: INR (₹)
- Conversion rate: 1 coin = ₹1
- Expiration: 24 hours from creation
- Combines with: Order discounts only
- Does not combine with: Product or shipping discounts

### BR-2: Customer Eligibility
- Customer must have sufficient wallet balance
- Customer must be registered in Shopify store
- Discount amount cannot exceed cart total
- One active discount per customer at a time

### BR-3: Store Configuration
- Store must have Shopify API access token configured
- Store URL must be normalized (no http:// or https://)
- Store must be registered in ShopWallet system

## Non-Functional Requirements

### NFR-1: Performance
- Discount creation completes within 3 seconds
- Widget loads balance within 1 second
- Cart total updates instantly (< 100ms)

### NFR-2: Reliability
- 99% success rate for discount creation
- Graceful degradation to discount codes
- No data loss on API failures

### NFR-3: Security
- Validate customer email format
- Verify wallet balance before deduction
- Prevent duplicate discount generation
- Sanitize all user inputs

### NFR-4: Logging
- Log all discount creation attempts
- Log API responses and errors
- Log fallback scenarios
- Include timestamps and customer identifiers

## Current Implementation Status

### ✅ Completed
- Discount service with automatic discount logic
- GraphQL API integration
- Customer lookup by email
- Fallback to discount code method
- Database schema for discount tracking
- Widget with balance persistence
- Real-time savings display
- Cart total update feature

### 🚧 In Progress
- Testing automatic discount creation with real store
- Verifying customer lookup functionality
- Testing fallback scenarios

### ❌ Not Started
- Backend deployment to production
- Widget update for automatic discount response
- Order webhook integration for marking discounts as used
- Admin dashboard for discount management

## Dependencies
- Shopify Admin API access token
- PostgreSQL database
- Node.js backend (Express)
- Shopify theme with cart drawer
- Customer email (from Shopify login or manual entry)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shopify API rate limits | High | Implement retry logic with exponential backoff |
| Customer not found in Shopify | Medium | Fallback to discount code for all customers |
| Automatic discount API changes | High | Monitor Shopify API changelog, maintain fallback |
| Database connection failures | High | Implement connection pooling and retry logic |
| Widget injection fails | Medium | Multiple injection strategies, mutation observer |

## Success Metrics
- 90%+ of discounts created as automatic (not codes)
- < 2 second average discount creation time
- 95%+ customer satisfaction with redemption flow
- Zero coin balance discrepancies
- < 1% manual intervention required

## Related Files
- `backend/src/shopify/discountService.js` - Discount creation logic
- `backend/src/index.js` - API endpoint
- `extensions/wallet-theme-app/blocks/wallet-app-embed.liquid` - Widget
- `backend/src/migrations/add_discount_codes_table.sql` - Database schema
