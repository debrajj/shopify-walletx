# Implementation Plan: Checkout Discount Synchronization

## Overview

This implementation plan addresses the discount amount mismatch issue by enhancing the discount creation flow with proper formatting, verification, and comprehensive logging. Tasks are organized into phases to minimize risk and enable incremental deployment.

## Tasks

- [x] 1. Set up testing infrastructure
  - Install fast-check library for property-based testing
  - Create test directory structure
  - Set up test configuration
  - _Requirements: All (testing foundation)_

- [ ]* 1.1 Write property test for discount calculation accuracy
  - **Property 1: Exact Discount Calculation**
  - **Validates: Requirements 1.1, 3.1**
  - Test that for any valid coin amount and coin value, discount = coins × coinValue with no rounding

- [ ]* 1.2 Write property test for amount formatting
  - **Property 2: Correct Amount Formatting**
  - **Validates: Requirements 1.2, 3.2**
  - Test that any amount formats to string with exactly 2 decimal places

- [x] 2. Implement amount formatting function
  - [x] 2.1 Create formatDiscountAmount() function in discountService.js
    - Accept numeric amount as input
    - Return string with 2 decimal places
    - Handle edge cases (0.1, 0.99, large numbers)
    - _Requirements: 1.2, 3.2_

- [ ]* 2.2 Write unit tests for formatDiscountAmount()
  - Test with various amounts (0.1, 1.5, 100, 1000.99)
  - Test edge cases (0, negative numbers)
  - Verify string format matches pattern
  - _Requirements: 1.2, 3.2_

- [x] 3. Enhance logging in discount service
  - [x] 3.1 Add comprehensive request logging
    - Log discount code, amount, customer email
    - Log timestamp and shop URL
    - Use structured logging format
    - _Requirements: 1.3, 6.1_

- [x] 3.2 Add complete response logging
  - Log full Shopify API response
  - Log success/failure status
  - Log any error details
  - _Requirements: 6.2_

- [x] 3.3 Add discrepancy logging
  - Log when amounts don't match
  - Include both expected and actual values
  - Use warning level for mismatches
  - _Requirements: 2.3, 6.4, 7.3_

- [ ]* 3.4 Write property test for complete request logging
  - **Property 3: Complete Request Logging**
  - **Validates: Requirements 1.3, 6.1**
  - Test that any discount creation logs all required fields

- [ ]* 3.5 Write property test for complete response logging
  - **Property 15: Complete Response Logging**
  - **Validates: Requirements 6.2**
  - Test that any API response is logged completely

- [x] 4. Update GraphQL mutation payload
  - [x] 4.1 Use formatDiscountAmount() for amount field
    - Update customerGets.value.discountAmount.amount
    - Ensure it's a string with 2 decimals
    - _Requirements: 1.2, 3.2_

- [x] 4.2 Verify discount type configuration
  - Ensure using discountAmount (not percentage)
  - Set appliesOnEachItem to false
    - Set minimumRequirement to "0"
    - Configure combinesWith correctly
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 4.3 Write property tests for payload configuration
  - **Property 9: Discount Type Correctness**
  - **Property 10: Order-Level Discount Configuration**
  - **Property 11: Zero Minimum Requirement**
  - **Property 12: Correct Combination Settings**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - Test that all payloads have correct structure

- [x] 5. Checkpoint - Test enhanced logging and formatting
  - Deploy to staging environment
  - Create test discounts
  - Verify logs contain all required information
  - Verify amounts are formatted correctly
  - Check Shopify admin for created discounts
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement discount verification system
  - [x] 6.1 Create getDiscountDetails() function
    - Implement GraphQL query for discount node
    - Parse response to extract amount
    - Handle query errors gracefully
    - _Requirements: 7.1, 7.2_

- [ ]* 6.2 Write property test for discount details extraction
  - **Property 4: Response Amount Validation**
  - **Validates: Requirements 1.4, 7.2**
  - Test that amount is correctly extracted from any valid response

- [x] 6.3 Create verifyDiscountAmount() function
  - Compare expected vs actual amounts
  - Use tolerance of 0.01 for comparison
  - Return boolean indicating match
  - _Requirements: 1.4_

- [ ]* 6.4 Write unit tests for verifyDiscountAmount()
  - Test with matching amounts
  - Test with mismatched amounts
  - Test tolerance handling
  - _Requirements: 1.4_

- [x] 6.5 Integrate verification into createShopifyDiscount()
  - Call getDiscountDetails() after creation
  - Compare amounts using verifyDiscountAmount()
  - Log results
  - Return verification status
  - _Requirements: 7.1, 7.3, 7.4_

- [ ]* 6.6 Write property test for post-creation verification
  - **Property 17: Post-Creation Verification Query**
  - **Validates: Requirements 7.1**
  - Test that any successful creation triggers verification query

- [ ]* 6.7 Write property test for discrepancy logging
  - **Property 5: Discrepancy Logging**
  - **Validates: Requirements 2.3, 6.4, 7.3**
  - Test that mismatches are logged with both values

- [x] 7. Update database schema
  - [x] 7.1 Add new columns to discount_codes table
    - Add actual_discount_amount column
    - Add shopify_discount_id column
    - Add amount_verified boolean column
    - Add amount_mismatch boolean column
    - Add verified_at timestamp column
    - _Requirements: 7.4_

- [x] 7.2 Create database migration script
  - Write SQL migration
    - Test migration on staging database
    - _Requirements: 7.4_

- [x] 7.3 Update discount code insertion query
  - Include new fields in INSERT statement
  - Store verification results
  - _Requirements: 7.4_

- [-] 8. Update API endpoint response
  - [ ] 8.1 Modify /api/shopify/create-discount response
    - Include actualDiscountValue field
    - Include verified boolean field
    - Include amountMismatch boolean field
    - Include discountId field
    - _Requirements: 7.4_

- [ ]* 8.2 Write property test for actual amount return
  - **Property 18: Actual Amount Return**
  - **Validates: Requirements 7.4**
  - Test that any successful creation returns actual amount

- [ ] 9. Checkpoint - Test verification system
  - Deploy to staging with verification enabled
  - Create test discounts
  - Verify amounts are checked
  - Verify mismatches are detected and logged
  - Check database records include verification data
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Enhance widget display
  - [ ] 10.1 Update applyCoins() function
    - Display verified amount in confirmation
    - Show warning if amounts don't match
    - Log redemption details
    - _Requirements: 8.1, 8.2_

- [ ]* 10.2 Write property test for widget calculation display
  - **Property 19: Widget Calculation Display**
  - **Validates: Requirements 8.1**
  - Test that any coin input shows correct calculated discount

- [ ] 10.3 Update displayDiscountConfirmation() function
  - Show verified amount from API response
  - Display mismatch warning if needed
    - Provide clear messaging about automatic application
    - _Requirements: 8.2_

- [ ]* 10.4 Write property test for confirmation message amount
  - **Property 20: Confirmation Message Amount**
  - **Validates: Requirements 8.2**
  - Test that confirmation includes exact amount from response

- [ ] 10.5 Update automatic discount messaging
  - Don't show discount code for automatic discounts
  - Show "will apply automatically" message
  - _Requirements: 8.4_

- [ ]* 10.6 Write property test for no code display
  - **Property 21: No Code Display for Automatic Discounts**
  - **Validates: Requirements 8.4**
  - Test that automatic discounts don't show codes

- [ ] 11. Add input validation
  - [ ] 11.1 Implement amount validation in API endpoint
    - Reject negative amounts
    - Reject zero amounts
    - Reject non-numeric values
    - Return clear error messages
    - _Requirements: 5.2_

- [ ]* 11.2 Write property test for invalid amount rejection
  - **Property 13: Invalid Amount Rejection**
  - **Validates: Requirements 5.2**
  - Test that invalid amounts are rejected

- [ ] 11.3 Add balance validation
  - Check wallet balance before creation
    - Return available balance in error
    - _Requirements: 5.2_

- [ ] 12. Enhance error handling
  - [ ] 12.1 Add API error logging
    - Log complete error objects
    - Include error codes and messages
    - Use appropriate log levels
    - _Requirements: 5.3_

- [ ]* 12.2 Write property test for API error logging
  - **Property 14: API Error Logging**
  - **Validates: Requirements 5.3**
  - Test that any API error is logged completely

- [ ] 12.3 Implement error response format
  - Return structured error responses
    - Include error codes
    - Provide helpful messages
    - _Requirements: 5.1_

- [ ] 13. Add order webhook verification
  - [ ] 13.1 Update webhook handler
    - Extract discount amount from order
    - Compare with coins redeemed
    - Log any mismatches
    - _Requirements: 2.4_

- [ ]* 13.2 Write property test for order verification
  - **Property 6: Order Verification**
  - **Validates: Requirements 2.4**
  - Test that any order with discount is verified

- [ ] 14. Implement currency handling
  - [ ] 14.1 Add store currency lookup
    - Query store settings for currency
    - Use in discount creation
    - _Requirements: 3.4_

- [ ]* 14.2 Write property test for store currency usage
  - **Property 8: Store Currency Usage**
  - **Validates: Requirements 3.4**
  - Test that correct currency is used for each store

- [ ] 14.3 Update widget currency formatting
  - Format amounts with correct currency symbol
    - Match Shopify's format
    - _Requirements: 3.3_

- [ ]* 14.4 Write property test for currency formatting
  - **Property 7: Currency Formatting Consistency**
  - **Validates: Requirements 3.3**
  - Test that widget formats match expected pattern

- [ ] 15. Add widget logging
  - [ ] 15.1 Log coin redemption attempts
    - Log coins, amount, and code
    - Include timestamp
    - _Requirements: 6.3_

- [ ]* 15.2 Write property test for widget redemption logging
  - **Property 16: Widget Redemption Logging**
  - **Validates: Requirements 6.3**
  - Test that any redemption logs required fields

- [ ] 16. Checkpoint - Integration testing
  - Test complete flow end-to-end
  - Create discount via widget
  - Verify in Shopify checkout
  - Check all logs
  - Verify database records
  - Test error scenarios
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Set up monitoring
  - [ ] 17.1 Create monitoring dashboard
    - Track discount accuracy rate
    - Monitor verification success rate
    - Display mismatch trends
    - Show creation time metrics

- [ ] 17.2 Configure alerts
  - Alert on amount mismatches
    - Alert on verification failures
    - Alert on high error rates

- [ ] 18. Documentation
  - [ ] 18.1 Update API documentation
    - Document new response fields
    - Document error codes
    - Provide examples

- [ ] 18.2 Create troubleshooting guide
  - Document common issues
    - Provide resolution steps
    - Include log examples

- [ ] 18.3 Update deployment guide
  - Document deployment steps
    - Include rollback procedures
    - Provide testing checklist

- [ ] 19. Final checkpoint - Production readiness
  - All tests passing (unit and property tests)
  - Staging environment fully tested
  - Monitoring and alerts configured
  - Documentation complete
  - Rollback plan ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Deploy in phases to minimize risk
- Monitor closely after each phase deployment
