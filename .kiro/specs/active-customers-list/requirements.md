# Requirements Document

## Introduction

This feature enhances the Customers page by adding a list of active customers displayed in reverse chronological order (most recent first), complementing the existing customer lookup/search functionality. This allows administrators to quickly see and access recently active customers without needing to search for them individually.

## Glossary

- **Active_Customer**: A customer who has a wallet record in the system with at least one transaction or non-zero balance
- **Customer_List**: A paginated display of active customers ordered by most recent activity
- **Recent_Activity**: The timestamp of the customer's most recent transaction or wallet update
- **Customer_Card**: A clickable UI component displaying summary information for a single customer
- **System**: The wallet management application

## Requirements

### Requirement 1: Display Active Customers List

**User Story:** As an administrator, I want to see a list of active customers on the Customers page, so that I can quickly access customer profiles without searching.

#### Acceptance Criteria

1. WHEN the Customers page loads, THE System SHALL display a list of active customers below the search section
2. THE System SHALL order customers by most recent activity first (reverse chronological order)
3. WHEN displaying each customer, THE System SHALL show their name, contact information (phone or email), current balance, and last activity timestamp
4. THE System SHALL limit the initial display to 20 customers per page
5. WHEN a customer has no recent activity timestamp, THE System SHALL use their wallet creation date as the sorting criterion

### Requirement 2: Customer List Interaction

**User Story:** As an administrator, I want to click on a customer in the list, so that I can view their full profile and transaction history.

#### Acceptance Criteria

1. WHEN an administrator clicks on a customer card, THE System SHALL load and display that customer's full profile
2. WHEN a customer profile is loaded from the list, THE System SHALL populate the search field with the customer's identifier
3. WHEN a customer profile is displayed, THE System SHALL show the same information as if the customer was found via search
4. THE System SHALL provide visual feedback (hover state) when the cursor is over a customer card

### Requirement 3: Pagination Support

**User Story:** As an administrator, I want to navigate through multiple pages of customers, so that I can access all customers in the system.

#### Acceptance Criteria

1. WHEN more than 20 active customers exist, THE System SHALL display pagination controls
2. WHEN an administrator clicks "Next", THE System SHALL load the next 20 customers
3. WHEN an administrator clicks "Previous", THE System SHALL load the previous 20 customers
4. THE System SHALL display the current page number and total number of pages
5. WHEN navigating between pages, THE System SHALL maintain the reverse chronological ordering

### Requirement 4: Loading and Error States

**User Story:** As an administrator, I want clear feedback when the customer list is loading or if an error occurs, so that I understand the system state.

#### Acceptance Criteria

1. WHEN the customer list is loading, THE System SHALL display a loading indicator
2. IF the customer list fails to load, THEN THE System SHALL display an error message with retry option
3. WHEN no active customers exist, THE System SHALL display an empty state message
4. THE System SHALL not block the search functionality while the customer list is loading

### Requirement 5: Search and List Coexistence

**User Story:** As an administrator, I want the customer list and search functionality to work together seamlessly, so that I can use both features without confusion.

#### Acceptance Criteria

1. WHEN a customer is selected from the list, THE System SHALL display their profile above the customer list
2. WHEN a search is performed, THE System SHALL display the search result above the customer list
3. THE System SHALL keep the customer list visible at all times (unless explicitly hidden by user preference)
4. WHEN the page is refreshed, THE System SHALL reload the customer list but not auto-select any customer
