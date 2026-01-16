# Checkout Discount Synchronization - Requirements

## Introduction

This specification addresses the issue where the discount amount displayed in Shopify checkout does not match the automatic discount amount that was created when customers redeem wallet coins. The system creates automatic discounts correctly, but there's a mismatch between the expected discount value and what actually applies at checkout.

## Glossary

- **Wallet_System**: The ShopWallet application that manages customer coin balances
- **Automatic_Discount**: A Shopify discount that applies automatically at checkout without requiring a code
- **Discount_Service**: The backend service that creates discounts via Shopify GraphQL API
- **Checkout_Page**: The Shopify checkout page where customers complete their purchase
- **Widget**: The frontend component that displays wallet balance and allows coin redemption
- **Discount_Amount**: The monetary value of the discount in the store's currency (₹)
- **Coin_Value**: The conversion rate between coins and currency (1 coin = ₹1)

## Requirements

### Requirement 1: Accurate Discount Creation

**User Story:** As a customer redeeming wallet coins, I want the discount created in Shopify to exactly match the coins I redeemed, so that I receive the correct discount amount at checkout.

#### Acceptance Criteria

1. WHEN a customer redeems N coins, THE Discount_Service SHALL create a discount for exactly N × Coin_Value in the store currency
2. WHEN creating an automatic discount via GraphQL, THE Discount_Service SHALL set the discount amount field to the exact calculated value
3. WHEN the discount is created, THE Discount_Service SHALL log the discount ID, amount, and customer email for verification
4. WHEN the discount creation response is received, THE Discount_Service SHALL validate that the created discount amount matches the requested amount

### Requirement 2: Checkout Discount Verification

**User Story:** As a store owner, I want to verify that discounts apply correctly at checkout, so that customers receive the exact discount they redeemed.

#### Acceptance Criteria

1. WHEN a customer with an automatic discount reaches checkout, THE Checkout_Page SHALL display the discount amount that matches the created discount
2. WHEN the discount is applied, THE Checkout_Page SHALL show the discount line item with the correct amount
3. IF the discount amount differs from expected, THE Wallet_System SHALL log the discrepancy with both expected and actual values
4. WHEN an order is completed, THE Wallet_System SHALL verify the discount amount applied matches the coins redeemed

### Requirement 3: Currency and Formatting Consistency

**User Story:** As a developer, I want consistent currency handling across the system, so that discount amounts are calculated and displayed correctly.

#### Acceptance Criteria

1. WHEN calculating discount amounts, THE Discount_Service SHALL use the exact coin-to-currency conversion rate without rounding errors
2. WHEN sending discount amounts to Shopify API, THE Discount_Service SHALL format amounts as strings with proper decimal precision
3. WHEN displaying discount amounts in the Widget, THE Widget SHALL format currency values consistently with Shopify's format
4. THE Discount_Service SHALL use the store's configured currency for all discount operations

### Requirement 4: Discount Type Configuration

**User Story:** As a system administrator, I want to ensure the correct discount type is used, so that discounts apply as fixed amounts rather than percentages.

#### Acceptance Criteria

1. WHEN creating an automatic discount, THE Discount_Service SHALL use the `discountAmount` type (not percentage)
2. WHEN setting the discount value, THE Discount_Service SHALL set `appliesOnEachItem` to false for order-level discounts
3. WHEN configuring the discount, THE Discount_Service SHALL set the minimum requirement to 0 to allow any cart total
4. THE Discount_Service SHALL configure the discount to combine with order discounts but not product or shipping discounts

### Requirement 5: Discount Validation and Error Handling

**User Story:** As a customer, I want clear feedback if my discount doesn't apply correctly, so that I can take appropriate action.

#### Acceptance Criteria

1. WHEN a discount creation fails, THE Discount_Service SHALL return a detailed error message indicating the failure reason
2. WHEN a discount amount is invalid, THE Discount_Service SHALL reject the request and return a validation error
3. IF the Shopify API returns an error, THE Discount_Service SHALL log the full error response for debugging
4. WHEN a discount mismatch is detected, THE Widget SHALL display a message to the customer with instructions to contact support

### Requirement 6: Discount Amount Logging and Debugging

**User Story:** As a developer, I want comprehensive logging of discount operations, so that I can diagnose and fix discount amount mismatches.

#### Acceptance Criteria

1. WHEN creating a discount, THE Discount_Service SHALL log the request payload including all discount parameters
2. WHEN receiving a Shopify API response, THE Discount_Service SHALL log the complete response including the created discount details
3. WHEN a customer applies coins, THE Widget SHALL log the coins redeemed, calculated discount amount, and discount code
4. THE Discount_Service SHALL log any discrepancies between requested and created discount amounts

### Requirement 7: Discount Amount Retrieval

**User Story:** As a system, I want to retrieve and verify the actual discount amount from Shopify, so that I can confirm it matches the expected amount.

#### Acceptance Criteria

1. WHEN a discount is created, THE Discount_Service SHALL query Shopify to retrieve the created discount details
2. WHEN retrieving discount details, THE Discount_Service SHALL extract the actual discount amount from the response
3. IF the retrieved amount differs from the requested amount, THE Discount_Service SHALL log a warning with both values
4. THE Discount_Service SHALL return the actual discount amount to the Widget for display confirmation

### Requirement 8: Widget Discount Display

**User Story:** As a customer, I want to see the exact discount amount that will apply at checkout, so that I know what to expect.

#### Acceptance Criteria

1. WHEN coins are entered in the Widget, THE Widget SHALL calculate and display the expected discount amount
2. WHEN the discount is created, THE Widget SHALL display a confirmation message with the exact discount amount
3. WHEN redirecting to checkout, THE Widget SHALL inform the customer that the discount will apply automatically
4. IF the discount is automatic, THE Widget SHALL not display a discount code to avoid confusion

## Technical Requirements

### TR-1: GraphQL Mutation Parameters

- Use `discountAutomaticBasicCreate` mutation
- Set `customerGets.value.discountAmount.amount` as a string with exact decimal value
- Set `customerGets.value.discountAmount.appliesOnEachItem` to `false`
- Set `minimumRequirement.greaterThanOrEqualToSubtotal` to `"0"`
- Include proper currency code if required by API

### TR-2: Discount Amount Calculation

- Calculate discount as: `discountAmount = coinsToRedeem * coinValue`
- Format as string with 2 decimal places: `discountAmount.toFixed(2)`
- Validate that discount amount is positive and non-zero
- Validate that discount amount does not exceed cart total

### TR-3: API Response Validation

- Extract discount ID from response: `data.discountAutomaticBasicCreate.automaticDiscountNode.id`
- Extract discount amount from response: `data.discountAutomaticBasicCreate.automaticDiscountNode.automaticDiscount.customerGets.value.amount.amount`
- Compare extracted amount with requested amount
- Log validation results

### TR-4: Error Response Handling

- Check for `userErrors` array in GraphQL response
- Log all error codes and messages
- Return user-friendly error messages to Widget
- Implement fallback to discount code if automatic discount fails

## Business Rules

### BR-1: Discount Amount Limits

- Minimum discount: ₹1 (1 coin)
- Maximum discount: Customer's wallet balance or cart total, whichever is lower
- Discount must be a positive integer or decimal value
- Discount cannot exceed the cart subtotal

### BR-2: Currency Handling

- All amounts in Indian Rupees (₹)
- Use 2 decimal places for all currency values
- No rounding during calculation (use exact values)
- Format for display: "₹X.XX"

### BR-3: Discount Application Rules

- One automatic discount per customer at a time
- Discount applies to order subtotal
- Discount does not apply to shipping or taxes
- Discount combines with order-level discounts only

## Non-Functional Requirements

### NFR-1: Accuracy

- 100% accuracy in discount amount calculation
- Zero tolerance for rounding errors
- Exact match between requested and applied discount amounts

### NFR-2: Logging

- Log all discount creation requests with full parameters
- Log all Shopify API responses with full details
- Log any amount mismatches with expected vs actual values
- Include timestamps and customer identifiers in all logs

### NFR-3: Validation

- Validate discount amounts before API calls
- Validate API responses before returning success
- Validate that discount was created with correct parameters
- Fail fast with clear error messages on validation failures

## Current Implementation Issues

### Issue 1: Discount Amount Mismatch
- **Problem**: Discount amount in checkout doesn't match coins redeemed
- **Possible Causes**:
  - Incorrect amount format in GraphQL mutation
  - Currency conversion issues
  - API parameter misconfiguration
  - Rounding errors in calculation

### Issue 2: Insufficient Logging
- **Problem**: Difficult to diagnose why amounts don't match
- **Impact**: Cannot determine if issue is in creation or application
- **Need**: Comprehensive logging of all discount operations

### Issue 3: No Verification Step
- **Problem**: System doesn't verify created discount amount
- **Impact**: Mismatches go undetected until customer complains
- **Need**: Post-creation verification of discount details

## Success Metrics

- 100% of discounts apply with correct amount at checkout
- Zero customer complaints about incorrect discount amounts
- All discount amount mismatches logged and detected
- < 1 second to create and verify discount amount

## Dependencies

- Shopify Admin GraphQL API 2024-01 or later
- Shopify automatic discount feature enabled
- Customer must exist in Shopify store
- Store must have valid API access token

## Related Files

- `backend/src/shopify/discountService.js` - Discount creation logic
- `extensions/wallet-theme-app/blocks/wallet-app-embed.liquid` - Widget with redemption UI
- `backend/src/index.js` - API endpoint for discount creation
- `backend/database/schema.sql` - Discount tracking database

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shopify API changes discount format | High | Monitor API changelog, add version checks |
| Currency conversion errors | High | Use exact decimal arithmetic, no floating point |
| Discount doesn't apply at checkout | Critical | Add verification step, query discount after creation |
| Logging overhead | Low | Use structured logging, log levels |

## Next Steps

1. Add comprehensive logging to discount creation
2. Implement discount amount verification after creation
3. Add GraphQL query to retrieve created discount details
4. Update Widget to display verified discount amount
5. Add automated tests for discount amount accuracy
