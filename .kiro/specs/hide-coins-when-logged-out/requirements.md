# Requirements Document

## Introduction

This feature ensures that wallet coin balances and redemption functionality are only visible when a Shopify customer is logged in. The wallet widget should check Shopify's customer authentication status and only display coin information for authenticated customers, preventing unauthorized access and protecting user privacy.

## Glossary

- **Wallet_Widget**: The UI component embedded in Shopify theme that displays coin balances and allows redemption
- **Shopify_Customer**: A customer account in Shopify with email/phone authentication
- **Authenticated_Customer**: A Shopify customer who is currently logged in to their account
- **Coin_Balance**: The number of coins/points available in a customer's wallet
- **Customer_Session**: Shopify's customer login session managed by Shopify's authentication system
- **Guest_Customer**: A visitor who is not logged in to a Shopify customer account

## Requirements

### Requirement 1: Show Balance Check Form for Guest Customers

**User Story:** As a guest customer, I want to check my coin balance by entering my email or phone, so that I can see my rewards without creating a Shopify account.

#### Acceptance Criteria

1. WHEN a Shopify customer is not logged in, THE Wallet_Widget SHALL display a balance check form
2. WHEN a Shopify customer is not logged in, THE Wallet_Widget SHALL provide options to check balance using email OR phone
3. WHEN a Shopify customer is not logged in, THE Wallet_Widget SHALL NOT display any coin balance until the customer enters their credentials
4. WHEN a Shopify customer is not logged in, THE Wallet_Widget SHALL NOT pre-fill any cached email or phone data

### Requirement 2: Auto-Load Balance for Authenticated Customers

**User Story:** As a logged-in Shopify customer, I want my coin balance to load automatically, so that I can see my rewards without entering my email or phone.

#### Acceptance Criteria

1. WHEN a Shopify customer is logged in, THE Wallet_Widget SHALL automatically detect the customer's email from Shopify
2. WHEN a Shopify customer is logged in, THE Wallet_Widget SHALL automatically fetch and display the customer's coin balance
3. WHEN a Shopify customer is logged in, THE Wallet_Widget SHALL enable the redemption interface
4. WHEN the coin balance is loaded, THE Wallet_Widget SHALL display the balance prominently

### Requirement 3: Clear Cached Data on Logout

**User Story:** As a Shopify customer, I want my wallet data cleared when I log out, so that the next user on the same device cannot see my information.

#### Acceptance Criteria

1. WHEN a Shopify customer logs out, THE System SHALL clear all cached wallet balance data from localStorage
2. WHEN a Shopify customer logs out, THE System SHALL clear the stored email from localStorage
3. WHEN a Shopify customer logs out, THE Wallet_Widget SHALL return to the logged-out state showing the login prompt

### Requirement 4: Detect Shopify Customer Authentication

**User Story:** As a developer, I want the widget to detect Shopify's customer authentication status, so that the widget behavior matches the customer's login state.

#### Acceptance Criteria

1. WHEN the widget initializes, THE System SHALL check if a Shopify customer is logged in using Shopify's customer object
2. IF a Shopify customer is logged in, THEN THE System SHALL extract the customer's email from Shopify's customer object
3. IF no Shopify customer is logged in, THEN THE System SHALL show the logged-out state
4. WHEN Shopify customer authentication state changes, THE Wallet_Widget SHALL update its display accordingly

### Requirement 5: Support Email and Phone Balance Check

**User Story:** As a customer, I want to check my coins using either my email or phone number, so that I can access my wallet regardless of which identifier I used during signup.

#### Acceptance Criteria

1. WHEN a guest customer enters an email, THE Wallet_Widget SHALL fetch and display the balance for that email
2. WHEN a guest customer enters a phone number, THE Wallet_Widget SHALL fetch and display the balance for that phone
3. WHEN the widget displays the balance check form, THE Wallet_Widget SHALL provide separate input options for email and phone
4. WHEN a balance is found via either method, THE Wallet_Widget SHALL display the balance and enable redemption
5. IF neither email nor phone returns a balance, THEN THE Wallet_Widget SHALL display a "no coins available" message

### Requirement 6: Toggle Between Email and Phone Input

**User Story:** As a customer, I want to easily switch between email and phone input methods, so that I can use whichever identifier I prefer.

#### Acceptance Criteria

1. WHEN the balance check form is displayed, THE Wallet_Widget SHALL show a toggle or tabs to switch between email and phone input
2. WHEN a customer switches input methods, THE Wallet_Widget SHALL clear the previous input field
3. WHEN a customer switches input methods, THE Wallet_Widget SHALL update the placeholder text appropriately
4. WHEN a customer submits one input type, THE Wallet_Widget SHALL use the appropriate API endpoint for that type
