# Checkout Discount Synchronization - Design Document

## Overview

This design addresses the critical issue where discount amounts displayed in Shopify checkout do not match the automatic discount amounts created when customers redeem wallet coins. The root cause is likely a combination of incorrect amount formatting in GraphQL mutations, lack of post-creation verification, and insufficient logging to diagnose mismatches.

The solution implements a three-phase approach:
1. **Accurate Creation**: Ensure discount amounts are calculated and formatted correctly
2. **Verification**: Query Shopify after creation to verify the actual discount amount
3. **Comprehensive Logging**: Log all operations to enable debugging and monitoring

## Architecture

### System Components

```
┌─────────────────┐
│  Widget (UI)    │
│  - Coin input   │
│  - Calculation  │
│  - Display      │
└────────┬────────┘
         │ POST /api/shopify/create-discount
         │ { email, coinsToRedeem, discountAmount, discountCode }
         ▼
┌─────────────────────────────────────────┐
│  Backend API (/api/shopify/create-discount) │
│  - Validate input                       │
│  - Check wallet balance                 │
│  - Calculate discount amount            │
│  - Call Discount Service                │
│  - Deduct coins                         │
│  - Return response                      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Discount Service                       │
│  1. Format amount correctly             │
│  2. Create GraphQL mutation             │
│  3. Send to Shopify API                 │
│  4. Parse response                      │
│  5. Query created discount (NEW)        │
│  6. Verify amount matches (NEW)         │
│  7. Log all operations (ENHANCED)       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Shopify GraphQL API                    │
│  - discountAutomaticBasicCreate         │
│  - discountNode query (NEW)             │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Customer Action**: Customer enters coins to redeem in widget
2. **Widget Calculation**: Widget calculates discount amount (coins × coinValue)
3. **API Request**: Widget sends request to backend with email, coins, and calculated amount
4. **Backend Validation**: Backend validates balance and input
5. **Discount Creation**: Discount service creates discount via GraphQL
6. **Verification** (NEW): Service queries Shopify to get actual discount amount
7. **Comparison** (NEW): Service compares requested vs actual amount
8. **Logging** (ENHANCED): All steps logged with full details
9. **Response**: Backend returns actual discount amount to widget
10. **Display**: Widget shows confirmation with verified amount

## Components and Interfaces

### 1. Discount Service (backend/src/shopify/discountService.js)

#### Current Issues
- Amount formatting may not be correct for Shopify API
- No verification step after creation
- Insufficient logging of request/response details
- No comparison between requested and actual amounts

#### Enhanced Interface

```javascript
/**
 * Create and verify a Shopify automatic discount
 * @param {string} shopUrl - Store URL
 * @param {string} email - Customer email
 * @param {number} coinsToRedeem - Coins being redeemed
 * @param {number} discountAmount - Calculated discount amount
 * @param {string} discountCode - Generated discount code
 * @returns {Promise<DiscountResult>}
 */
async function createShopifyDiscount(shopUrl, email, coinsToRedeem, discountAmount, discountCode)

interface DiscountResult {
  success: boolean;
  discountCode: string;
  discountValue: number;          // Requested amount
  actualDiscountValue?: number;   // NEW: Verified amount from Shopify
  discountId?: string;            // NEW: Shopify discount ID
  isAutomatic: boolean;
  isExisting?: boolean;
  requiresManualSetup?: boolean;
  message: string;
  verified?: boolean;             // NEW: Whether amount was verified
  amountMismatch?: boolean;       // NEW: Whether amounts don't match
}
```

#### New Functions

```javascript
/**
 * Query Shopify to get discount details after creation
 * @param {string} shopUrl - Store URL
 * @param {string} accessToken - Shopify access token
 * @param {string} discountId - Shopify discount node ID
 * @returns {Promise<DiscountDetails>}
 */
async function getDiscountDetails(shopUrl, accessToken, discountId)

interface DiscountDetails {
  id: string;
  title: string;
  amount: number;
  customerEmail?: string;
  status: string;
}

/**
 * Verify discount amount matches expected value
 * @param {number} expectedAmount - Amount we requested
 * @param {number} actualAmount - Amount Shopify created
 * @param {number} tolerance - Acceptable difference (default: 0.01)
 * @returns {boolean}
 */
function verifyDiscountAmount(expectedAmount, actualAmount, tolerance = 0.01)

/**
 * Format discount amount for Shopify API
 * Ensures proper decimal precision and string format
 * @param {number} amount - Amount to format
 * @returns {string}
 */
function formatDiscountAmount(amount)
```

### 2. API Endpoint (backend/src/index.js)

#### Enhanced Endpoint

```javascript
app.post('/api/shopify/create-discount', requireStorefrontAuth, async (req, res) => {
  // 1. Extract and validate input
  // 2. Check wallet balance
  // 3. Call discount service with enhanced logging
  // 4. Handle verification results
  // 5. Return actual discount amount to widget
})
```

#### Response Format

```javascript
{
  success: true,
  discountCode: "COIN1234567890",
  discountValue: 100.00,        // Requested amount
  actualDiscountValue: 100.00,  // NEW: Verified amount
  newBalance: 715,
  isAutomatic: true,
  verified: true,               // NEW: Verification status
  amountMismatch: false,        // NEW: Mismatch indicator
  message: "Automatic discount ₹100.00 will apply at checkout!"
}
```

### 3. Widget (extensions/wallet-theme-app/blocks/wallet-app-embed.liquid)

#### Enhanced Functions

```javascript
/**
 * Apply coins with enhanced verification display
 */
async function applyCoins() {
  // 1. Validate input
  // 2. Calculate expected discount
  // 3. Send request to backend
  // 4. Display verified amount (NEW)
  // 5. Show warning if mismatch (NEW)
  // 6. Redirect to checkout
}

/**
 * Display discount confirmation with verification status
 * @param {DiscountResult} result - Result from backend
 */
function displayDiscountConfirmation(result) {
  // Show verified amount
  // Show warning if amounts don't match
  // Provide clear messaging
}
```

## Data Models

### GraphQL Mutation Payload

```graphql
mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
  discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
    automaticDiscountNode {
      id
      automaticDiscount {
        ... on DiscountAutomaticBasic {
          title
          startsAt
          endsAt
          status
          customerGets {
            value {
              ... on DiscountAmount {
                amount {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
    userErrors {
      field
      code
      message
    }
  }
}
```

#### Critical Fields

```javascript
{
  automaticBasicDiscount: {
    title: `Coin Wallet Discount - ${discountCode}`,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customerSelection: {
      customers: {
        add: [customerId]
      }
    },
    customerGets: {
      value: {
        discountAmount: {
          amount: formatDiscountAmount(discountAmount),  // CRITICAL: Must be string with 2 decimals
          appliesOnEachItem: false                       // CRITICAL: Order-level discount
        }
      },
      items: {
        all: true
      }
    },
    minimumRequirement: {
      greaterThanOrEqualToSubtotal: {
        greaterThanOrEqualToSubtotal: "0"               // CRITICAL: No minimum
      }
    },
    combinesWith: {
      orderDiscounts: true,
      productDiscounts: true,
      shippingDiscounts: false
    }
  }
}
```

### GraphQL Query for Verification (NEW)

```graphql
query getDiscountNode($id: ID!) {
  discountNode(id: $id) {
    id
    discount {
      ... on DiscountAutomaticBasic {
        title
        status
        customerGets {
          value {
            ... on DiscountAmount {
              amount {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
}
```

### Database Schema

#### discount_codes Table (Existing)

```sql
CREATE TABLE discount_codes (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  discount_code VARCHAR(255) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  coins_redeemed DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  actual_discount_amount DECIMAL(10, 2),        -- NEW: Verified amount
  shopify_discount_id VARCHAR(255),             -- NEW: Shopify ID
  amount_verified BOOLEAN DEFAULT FALSE,        -- NEW: Verification status
  amount_mismatch BOOLEAN DEFAULT FALSE,        -- NEW: Mismatch flag
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP                         -- NEW: When verified
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Exact Discount Calculation

*For any* valid number of coins N and coin value V, when calculating the discount amount, the result SHALL be exactly N × V with no rounding errors.

**Validates: Requirements 1.1, 3.1**

### Property 2: Correct Amount Formatting

*For any* discount amount A, when formatting for the Shopify API, the result SHALL be a string with exactly 2 decimal places in the format "A.XX".

**Validates: Requirements 1.2, 3.2**

### Property 3: Complete Request Logging

*For any* discount creation request, the logs SHALL contain the discount code, requested amount, customer email, and timestamp.

**Validates: Requirements 1.3, 6.1**

### Property 4: Response Amount Validation

*For any* discount creation response from Shopify, if the response contains a discount amount, the service SHALL extract and compare it with the requested amount.

**Validates: Requirements 1.4, 7.2**

### Property 5: Discrepancy Logging

*For any* discount creation where the actual amount differs from the requested amount by more than 0.01, the system SHALL log both the expected and actual values with a warning level.

**Validates: Requirements 2.3, 6.4, 7.3**

### Property 6: Order Verification

*For any* completed order with a wallet discount code, the webhook handler SHALL verify that the discount amount applied matches the coins redeemed within a tolerance of 0.01.

**Validates: Requirements 2.4**

### Property 7: Currency Formatting Consistency

*For any* discount amount displayed in the widget, the format SHALL match the pattern "₹X.XX" where X is the amount with 2 decimal places.

**Validates: Requirements 3.3**

### Property 8: Store Currency Usage

*For any* discount creation request, the service SHALL use the currency configured for that store's Shopify account.

**Validates: Requirements 3.4**

### Property 9: Discount Type Correctness

*For any* automatic discount creation payload, the `customerGets.value` field SHALL use `discountAmount` type (not `discountPercentage`).

**Validates: Requirements 4.1**

### Property 10: Order-Level Discount Configuration

*For any* automatic discount creation payload, the `customerGets.value.discountAmount.appliesOnEachItem` field SHALL be set to `false`.

**Validates: Requirements 4.2**

### Property 11: Zero Minimum Requirement

*For any* automatic discount creation payload, the `minimumRequirement.greaterThanOrEqualToSubtotal` field SHALL be set to the string "0".

**Validates: Requirements 4.3**

### Property 12: Correct Combination Settings

*For any* automatic discount creation payload, the `combinesWith` field SHALL have `orderDiscounts: true`, `productDiscounts: true`, and `shippingDiscounts: false`.

**Validates: Requirements 4.4**

### Property 13: Invalid Amount Rejection

*For any* discount creation request with an amount that is negative, zero, or non-numeric, the service SHALL reject the request and return a validation error.

**Validates: Requirements 5.2**

### Property 14: API Error Logging

*For any* Shopify API error response, the service SHALL log the complete error object including all error codes and messages.

**Validates: Requirements 5.3**

### Property 15: Complete Response Logging

*For any* Shopify API response (success or error), the service SHALL log the complete response body.

**Validates: Requirements 6.2**

### Property 16: Widget Redemption Logging

*For any* coin redemption in the widget, the logs SHALL contain the coins redeemed, calculated discount amount, and generated discount code.

**Validates: Requirements 6.3**

### Property 17: Post-Creation Verification Query

*For any* successful discount creation that returns a discount ID, the service SHALL immediately query Shopify to retrieve the created discount details.

**Validates: Requirements 7.1**

### Property 18: Actual Amount Return

*For any* successful discount creation, the API response SHALL include the actual discount amount retrieved from Shopify.

**Validates: Requirements 7.4**

### Property 19: Widget Calculation Display

*For any* coin amount entered in the widget, the widget SHALL calculate the discount as coins × coinValue and display it before submission.

**Validates: Requirements 8.1**

### Property 20: Confirmation Message Amount

*For any* successful discount creation, the widget confirmation message SHALL include the exact discount amount from the API response.

**Validates: Requirements 8.2**

### Property 21: No Code Display for Automatic Discounts

*For any* discount creation response where `isAutomatic` is true, the widget SHALL not display a discount code to the customer.

**Validates: Requirements 8.4**

## Error Handling

### Error Scenarios

1. **Invalid Input**
   - Negative or zero coin amount
   - Non-numeric values
   - Missing required fields
   - **Action**: Return 400 error with validation message

2. **Insufficient Balance**
   - Coins requested exceed wallet balance
   - **Action**: Return 400 error with available balance

3. **Customer Not Found**
   - Email not found in Shopify
   - **Action**: Fallback to discount code method

4. **API Failure**
   - Shopify API returns error
   - Network timeout
   - **Action**: Log error, fallback to discount code

5. **Amount Mismatch** (NEW)
   - Created amount differs from requested
   - **Action**: Log warning, return both amounts, flag for review

6. **Verification Failure** (NEW)
   - Cannot query created discount
   - **Action**: Log warning, proceed with unverified discount

### Error Response Format

```javascript
{
  success: false,
  error: "Detailed error message",
  errorCode: "INSUFFICIENT_BALANCE",
  details: {
    available: 50,
    requested: 100
  }
}
```

## Testing Strategy

### Unit Tests

1. **Amount Formatting Tests**
   - Test formatDiscountAmount() with various inputs
   - Verify 2 decimal places
   - Test edge cases (0.1, 0.99, 1000.00)

2. **Calculation Tests**
   - Test discount calculation with various coin amounts
   - Verify no rounding errors
   - Test large numbers

3. **Validation Tests**
   - Test input validation with invalid amounts
   - Test balance checking logic
   - Test email validation

4. **Verification Tests**
   - Test verifyDiscountAmount() with matching amounts
   - Test with mismatched amounts
   - Test tolerance handling

### Property-Based Tests

Each property listed in the Correctness Properties section should be implemented as a property-based test with minimum 100 iterations.

**Example Property Test (Property 1)**:
```javascript
// Feature: checkout-discount-sync, Property 1: Exact Discount Calculation
test('discount calculation is exact for any valid coin amount', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 10000 }),  // coins
      fc.float({ min: 0.01, max: 100 }),   // coin value
      (coins, coinValue) => {
        const discount = calculateDiscount(coins, coinValue);
        const expected = coins * coinValue;
        return Math.abs(discount - expected) < 0.0001;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Example Property Test (Property 2)**:
```javascript
// Feature: checkout-discount-sync, Property 2: Correct Amount Formatting
test('amount formatting produces correct string format', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0.01, max: 100000 }),
      (amount) => {
        const formatted = formatDiscountAmount(amount);
        // Must be a string
        expect(typeof formatted).toBe('string');
        // Must match pattern: digits.2decimals
        expect(formatted).toMatch(/^\d+\.\d{2}$/);
        // Must parse back to same value (within tolerance)
        const parsed = parseFloat(formatted);
        return Math.abs(parsed - amount) < 0.01;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

1. **End-to-End Discount Creation**
   - Create discount via API
   - Verify in Shopify admin
   - Check database record
   - Verify amount matches

2. **Verification Flow**
   - Create discount
   - Query discount details
   - Compare amounts
   - Check logging

3. **Widget Integration**
   - Enter coins
   - Submit redemption
   - Verify response
   - Check UI display

### Manual Testing Checklist

- [ ] Create discount with 100 coins
- [ ] Verify checkout shows ₹100 discount
- [ ] Check logs for all required fields
- [ ] Test with decimal coin amounts (50.5 coins)
- [ ] Test with large amounts (10000 coins)
- [ ] Verify mismatch detection works
- [ ] Test fallback to discount code
- [ ] Verify widget displays correct amounts

## Implementation Plan

### Phase 1: Enhanced Logging (Low Risk)

1. Add comprehensive logging to discount service
2. Log request payloads with all parameters
3. Log complete API responses
4. Log calculated vs requested amounts
5. Add structured logging with levels

**Risk**: Low - Only adds logging, no behavior changes

### Phase 2: Amount Formatting Fix (Medium Risk)

1. Implement formatDiscountAmount() function
2. Ensure 2 decimal places
3. Convert to string format
4. Update mutation payload to use formatted amount
5. Add unit tests for formatting

**Risk**: Medium - Changes API payload format

### Phase 3: Verification System (Medium Risk)

1. Implement getDiscountDetails() query
2. Add verification after discount creation
3. Compare requested vs actual amounts
4. Log mismatches
5. Update database schema
6. Return actual amount in API response

**Risk**: Medium - Adds new API call, may slow down creation

### Phase 4: Widget Updates (Low Risk)

1. Update widget to display verified amounts
2. Show warnings for mismatches
3. Enhance confirmation messages
4. Add verification status indicators

**Risk**: Low - Only UI changes

### Phase 5: Monitoring and Alerts (Low Risk)

1. Set up monitoring for amount mismatches
2. Create alerts for verification failures
3. Dashboard for discount accuracy metrics
4. Regular audit reports

**Risk**: Low - Observability only

## Deployment Strategy

1. **Deploy Phase 1** (Logging) to production
   - Monitor logs for 24 hours
   - Identify any immediate issues

2. **Deploy Phase 2** (Formatting) to staging
   - Test with real Shopify store
   - Verify discounts apply correctly
   - Check checkout amounts

3. **Deploy Phase 2** to production
   - Monitor for 48 hours
   - Check for any amount mismatches in logs

4. **Deploy Phase 3** (Verification) to staging
   - Test verification queries
   - Verify performance impact
   - Check mismatch detection

5. **Deploy Phase 3** to production
   - Monitor verification success rate
   - Track any mismatches detected
   - Analyze patterns

6. **Deploy Phases 4-5** (Widget & Monitoring)
   - Roll out widget updates
   - Enable monitoring dashboards
   - Set up alerts

## Performance Considerations

### Current Performance
- Discount creation: ~2-3 seconds
- No verification step

### With Verification
- Additional GraphQL query: ~500ms
- Total time: ~2.5-3.5 seconds
- Still within acceptable range (<5 seconds)

### Optimization Opportunities
- Cache store access tokens
- Batch verification for multiple discounts
- Async verification (verify after response)
- Use Shopify webhooks for verification

## Security Considerations

1. **Input Validation**
   - Validate all numeric inputs
   - Sanitize email addresses
   - Check for SQL injection in discount codes

2. **Amount Tampering**
   - Recalculate discount amount on backend
   - Don't trust client-provided amounts
   - Verify against wallet balance

3. **API Token Security**
   - Store tokens encrypted
   - Use environment variables
   - Rotate tokens regularly

4. **Logging Security**
   - Don't log sensitive customer data
   - Redact API tokens in logs
   - Use structured logging

## Monitoring and Metrics

### Key Metrics

1. **Discount Accuracy Rate**
   - % of discounts where actual = requested
   - Target: 100%

2. **Verification Success Rate**
   - % of discounts successfully verified
   - Target: >99%

3. **Average Amount Mismatch**
   - Average difference when mismatch occurs
   - Target: 0

4. **Creation Time**
   - Average time to create and verify
   - Target: <3.5 seconds

### Alerts

1. **Critical**: Amount mismatch detected
2. **Warning**: Verification failed
3. **Info**: Fallback to discount code used

### Dashboard

- Real-time discount creation rate
- Accuracy metrics
- Mismatch trends
- Verification performance
- Error rates by type

## Rollback Plan

If issues occur after deployment:

1. **Phase 2 Issues** (Formatting)
   - Revert to previous formatting
   - Investigate specific cases
   - Fix and redeploy

2. **Phase 3 Issues** (Verification)
   - Disable verification queries
   - Continue with creation only
   - Fix verification logic
   - Re-enable gradually

3. **Database Issues**
   - Rollback schema changes
   - Restore from backup if needed
   - Migrate data carefully

## Future Enhancements

1. **Async Verification**
   - Return response immediately
   - Verify in background
   - Update database asynchronously

2. **Webhook-Based Verification**
   - Use Shopify discount webhooks
   - Verify when discount is applied
   - Track actual usage

3. **Automatic Correction**
   - If mismatch detected, recreate discount
   - Automatic retry with correct amount
   - Notify customer of correction

4. **Analytics Dashboard**
   - Discount usage patterns
   - Amount distribution
   - Customer redemption behavior
   - ROI metrics

## Dependencies

- Shopify Admin GraphQL API 2024-01
- Node.js 14+
- PostgreSQL 12+
- Express.js
- fast-check (for property-based testing)

## References

- [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Discount API Reference](https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountAutomaticBasicCreate)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check)
