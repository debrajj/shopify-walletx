# Requirements Document

## Introduction

Fix the wallet widget "Redeem points" button functionality to properly show the coin input form and enable automatic coupon generation when users want to redeem their wallet coins.

## Glossary

- **Wallet_Widget**: The UI component displayed in the cart that shows wallet balance and redemption options
- **Redeem_Button**: The button labeled "Redeem points" that users click to start the redemption process
- **Coin_Input_Form**: The form containing an input field for entering the number of coins to redeem
- **Automatic_Coupon**: A discount code automatically generated and applied when coins are redeemed
- **Balance_Display**: The section showing the user's current wallet coin balance

## Requirements

### Requirement 1: Display Redeem Button

**User Story:** As a user with wallet coins, I want to see a "Redeem points" button, so that I can start the redemption process.

#### Acceptance Criteria

1. WHEN a user's wallet balance is loaded and greater than zero, THE Wallet_Widget SHALL display the Redeem_Button
2. WHEN the balance display is visible, THE Redeem_Button SHALL be positioned next to the balance information
3. THE Redeem_Button SHALL have clear, readable text saying "Redeem points"

### Requirement 2: Show Coin Input Form

**User Story:** As a user, I want to click the "Redeem points" button and see an input field, so that I can enter how many coins I want to redeem.

#### Acceptance Criteria

1. WHEN a user clicks the Redeem_Button, THE Wallet_Widget SHALL hide the Balance_Display
2. WHEN a user clicks the Redeem_Button, THE Wallet_Widget SHALL show the Coin_Input_Form
3. WHEN the Coin_Input_Form is displayed, THE input field SHALL be automatically focused
4. THE Coin_Input_Form SHALL include increment/decrement buttons for adjusting coin amounts
5. THE Coin_Input_Form SHALL include an apply button (arrow) to submit the redemption

### Requirement 3: Validate Coin Input

**User Story:** As a user, I want the system to validate my coin input, so that I don't enter invalid amounts.

#### Acceptance Criteria

1. WHEN a user enters coins, THE Wallet_Widget SHALL prevent entering more coins than the available balance
2. WHEN a user enters coins, THE Wallet_Widget SHALL prevent entering more coins than the cart total allows
3. WHEN a user enters zero or negative coins, THE Wallet_Widget SHALL show an error message
4. WHEN a user enters non-numeric values, THE Wallet_Widget SHALL reject the input

### Requirement 4: Generate Automatic Coupon

**User Story:** As a user, I want the system to automatically generate a discount code when I redeem coins, so that I don't have to manually enter codes.

#### Acceptance Criteria

1. WHEN a user clicks the apply button with valid coin input, THE Wallet_Widget SHALL generate a unique discount code
2. WHEN the discount code is generated, THE Wallet_Widget SHALL send a request to the backend to create the discount
3. WHEN the backend confirms discount creation, THE Wallet_Widget SHALL deduct the coins from the user's balance
4. WHEN the discount is ready, THE Wallet_Widget SHALL redirect the user to checkout with the discount code applied
5. IF the discount creation fails, THEN THE Wallet_Widget SHALL show an error message and not deduct coins

### Requirement 5: Button Click Handler Reliability

**User Story:** As a developer, I want the button click handlers to work reliably, so that users can consistently redeem their coins.

#### Acceptance Criteria

1. WHEN the widget is injected into the cart, THE Redeem_Button SHALL have a click event listener attached
2. WHEN a user clicks the Redeem_Button, THE click event SHALL be captured and processed
3. IF the widget is dynamically loaded, THEN THE event listeners SHALL still function correctly
4. THE click handlers SHALL use event delegation as a fallback to ensure reliability
5. THE click handlers SHALL prevent default behavior and stop event propagation

### Requirement 6: User Feedback

**User Story:** As a user, I want to see feedback during the redemption process, so that I know what's happening.

#### Acceptance Criteria

1. WHEN a user clicks apply, THE Wallet_Widget SHALL show a "Creating discount..." message
2. WHEN the discount is created successfully, THE Wallet_Widget SHALL show a success message
3. WHEN an error occurs, THE Wallet_Widget SHALL show a clear error message
4. WHEN redirecting to checkout, THE Wallet_Widget SHALL show a "Redirecting..." message
5. ALL messages SHALL automatically disappear after 4 seconds or when the user navigates away
