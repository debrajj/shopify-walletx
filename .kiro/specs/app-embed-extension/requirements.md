# Requirements Document

## Introduction

This document specifies the requirements for creating a Shopify app embed extension that will appear in the theme editor's "App embeds" section, allowing merchants to enable/disable the wallet widget globally across their store without manually adding it to specific pages.

## Glossary

- **App_Embed**: A Shopify theme extension type that appears in the theme editor's "App embeds" section and can be enabled/disabled globally
- **Theme_Block**: A Shopify theme extension type that must be manually added to specific sections or pages
- **Theme_Editor**: Shopify's interface where merchants customize their store's appearance
- **Wallet_Widget**: The coin wallet interface that allows customers to check balance and apply coins at checkout

## Requirements

### Requirement 1: App Embed Extension Structure

**User Story:** As a merchant, I want the wallet widget to appear in the "App embeds" section of my theme editor, so that I can enable it globally across my store with one click.

#### Acceptance Criteria

1. THE Extension SHALL be configured with type "theme" and target "body"
2. THE Extension SHALL include an app embed liquid file in the correct directory structure
3. THE Extension SHALL appear in the theme editor under "App embeds" section
4. WHEN the merchant enables the app embed, THE Extension SHALL load on all pages where enabled

### Requirement 2: Global Widget Functionality

**User Story:** As a merchant, I want the wallet widget to work consistently across all pages, so that customers can access their wallet from anywhere in the store.

#### Acceptance Criteria

1. WHEN the app embed is enabled, THE Wallet_Widget SHALL render on all store pages
2. THE Wallet_Widget SHALL maintain the same functionality as the existing block version
3. THE Wallet_Widget SHALL include phone verification, OTP validation, and balance display
4. THE Wallet_Widget SHALL allow customers to apply coins to their checkout

### Requirement 3: Merchant Customization

**User Story:** As a merchant, I want to customize the wallet widget appearance, so that it matches my store's branding.

#### Acceptance Criteria

1. THE Extension SHALL provide settings for widget title customization
2. THE Extension SHALL provide settings for background color customization
3. THE Extension SHALL provide settings for widget position (if applicable)
4. WHEN settings are changed in the theme editor, THE Wallet_Widget SHALL reflect changes immediately in preview

### Requirement 4: Extension Configuration

**User Story:** As a developer, I want the extension properly configured in the Shopify app structure, so that it deploys correctly and appears in the theme editor.

#### Acceptance Criteria

1. THE Extension SHALL have a valid shopify.extension.toml configuration file
2. THE Extension SHALL specify the correct extension type as "theme"
3. THE Extension SHALL include proper metadata (name, UID)
4. THE Extension SHALL be located in the correct directory structure under extensions/

### Requirement 5: Backward Compatibility

**User Story:** As a merchant, I want both the app embed and theme block versions available, so that I can choose the implementation that works best for my store.

#### Acceptance Criteria

1. THE System SHALL maintain the existing theme block extension
2. THE System SHALL provide the new app embed extension as an alternative
3. WHEN both extensions are installed, THE System SHALL allow merchants to use either or both
4. THE Extensions SHALL not conflict with each other when both are enabled
