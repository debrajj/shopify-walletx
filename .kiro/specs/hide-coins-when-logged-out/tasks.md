# Implementation Plan: Hide Coins When Logged Out

## Overview

This implementation plan converts the wallet widget to be authentication-aware, showing different UI states for guest vs logged-in Shopify customers. The widget will provide email/phone toggle for guests and auto-load balance for authenticated customers.

## Tasks

- [x] 1. Update wallet widget authentication detection
  - Modify wallet-app-embed.liquid to detect Shopify customer login status
  - Extract customer email and phone from Shopify customer object
  - Add logic to determine if customer is authenticated
  - _Requirements: 2.1, 4.1, 4.2_

- [x] 2. Implement localStorage clearing on logout
  - Add function to clear all wallet-related localStorage keys
  - Call clearing function when no customer is detected
  - Ensure no cached data is displayed for guests
  - _Requirements: 1.4, 3.1, 3.2, 3.3_

- [ ] 3. Create balance check form with email/phone toggle
  - [x] 3.1 Add HTML structure for toggle/tabs UI
    - Create toggle buttons for "Email" and "Phone" modes
    - Add conditional input field that changes based on mode
    - Style toggle to be clear and accessible
    - _Requirements: 1.1, 1.2, 6.1_

  - [x] 3.2 Implement toggle functionality
    - Add click handlers for toggle buttons
    - Clear input field when switching modes
    - Update placeholder text based on selected mode
    - Track current input mode in widget state
    - _Requirements: 6.2, 6.3_

  - [x] 3.3 Add input validation
    - Validate email format (contains @)
    - Validate phone format (digits only, appropriate length)
    - Show validation errors to user
    - Prevent submission of invalid inputs
    - _Requirements: 5.1, 5.2_

- [ ] 4. Implement conditional balance fetching
  - [x] 4.1 Add logic to determine fetch method
    - Check if customer is authenticated (use Shopify email)
    - Check if guest submitted email (use email endpoint)
    - Check if guest submitted phone (use phone endpoint)
    - _Requirements: 2.1, 5.1, 5.2, 6.4_

  - [x] 4.2 Update checkBalance function
    - Modify to accept input mode parameter
    - Route to correct API endpoint based on mode
    - Handle responses from both email and phone endpoints
    - _Requirements: 5.1, 5.2_

- [x] 5. Implement auto-load for authenticated customers
  - Detect logged-in customer on widget initialization
  - Automatically call checkBalance with customer email
  - Skip balance check form and go directly to balance display
  - Show loading state during fetch
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Update UI state management
  - [x] 6.1 Define UI states
    - GUEST_INITIAL: Show balance check form
    - AUTHENTICATED_LOADING: Show loading indicator
    - BALANCE_DISPLAY: Show balance and redeem button
    - REDEMPTION_FORM: Show coin input
    - ERROR: Show error message
    - _Requirements: 1.1, 2.2, 2.3_

  - [x] 6.2 Implement state transitions
    - Add setState function to manage state changes
    - Update DOM based on current state
    - Ensure smooth transitions between states
    - _Requirements: 1.1, 2.2, 2.3_

- [x] 7. Update displayBalance function
  - Accept authentication source parameter ('shopify' or 'manual')
  - Only cache data if source is 'shopify'
  - Show appropriate UI based on authentication state
  - _Requirements: 2.2, 2.3_

- [x] 8. Add error handling for all scenarios
  - Handle network failures gracefully
  - Show user-friendly error messages
  - Allow retry for failed operations
  - Log errors to console for debugging
  - _Requirements: 5.5_

- [x] 9. Update CSS for new UI elements
  - Style toggle/tabs for email/phone selection
  - Add loading state styles
  - Ensure mobile responsiveness
  - Add smooth transitions between states
  - _Requirements: 1.1, 6.1_

- [ ] 10. Test guest user flow
  - Load widget as guest (not logged in)
  - Verify no cached data is shown
  - Test email input and balance check
  - Test phone input and balance check
  - Test toggle between email and phone
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 6.1, 6.2, 6.3_

- [ ] 11. Test authenticated user flow
  - Load widget as logged-in Shopify customer
  - Verify balance auto-loads
  - Verify no manual input required
  - Test redemption flow
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 12. Test logout behavior
  - Log in and load balance
  - Log out from Shopify
  - Reload page
  - Verify all cached data is cleared
  - Verify balance check form is shown
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Focus on maintaining backward compatibility with existing API endpoints
- Ensure the widget works across different Shopify themes
- Test on both desktop and mobile devices
- Verify behavior in cart drawer and cart page contexts
- Consider edge cases like customers with no email or phone in Shopify
