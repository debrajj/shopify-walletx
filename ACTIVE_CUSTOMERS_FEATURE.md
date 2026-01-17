# Active Customers List Feature

## Overview
Added a new feature to the Customers page that displays a list of active customers ordered by most recent activity, complementing the existing search functionality.

## Changes Made

### Backend (`backend/src/index.js`)
- **New Endpoint**: `GET /api/customers/list`
  - Returns paginated list of active customers
  - Ordered by `updated_at` DESC (most recent first)
  - Includes customer stats: balance, total orders, coins used
  - Supports pagination (default 20 per page)
  - Scoped by store URL for multi-tenancy

### Frontend API Service (`services/api.ts`)
- **New Method**: `getCustomersList(params)`
  - Fetches paginated active customers
  - Parameters: `page` and `limit`
  - Returns `PaginatedResponse<CustomerSummary>`

### Types (`types.ts`)
- **Updated**: `CustomerSummary` interface
  - Added optional `last_activity` field for displaying last update timestamp

### Customers Page (`pages/Customers.tsx`)
- **New State Management**:
  - `activeCustomers`: stores list of customers
  - `customersLoading`: loading state for list
  - `currentPage` & `totalPages`: pagination state

- **New Features**:
  - Auto-loads active customers on page mount
  - Displays customers in a responsive grid (1/2/3 columns)
  - Each customer card shows:
    - Name and contact info
    - Current balance
    - Total orders
    - Coins used
    - Last activity timestamp
  - Click on any customer card to view full profile
  - Pagination controls (Previous/Next)
  - Hover effects for better UX
  - Empty state when no customers exist
  - Loading state with spinner

- **Integration**:
  - Clicking a customer card loads their full profile (same as search)
  - Refreshes list after adding coins to a customer
  - Works seamlessly with existing search functionality

## UI/UX Improvements
- Clean card-based layout for customer list
- Hover effects with color transitions
- Responsive grid (mobile → tablet → desktop)
- Clear visual hierarchy
- Loading and empty states
- Pagination for large customer bases

## Testing
Run the test script to verify the feature:
```bash
node test-active-customers.js
```

## Usage
1. Navigate to the Customers page
2. The active customers list loads automatically below the search bar
3. Click any customer card to view their full profile
4. Use pagination controls to browse through customers
5. Search functionality still works independently

## Benefits
- Quick access to recently active customers
- No need to remember customer details to search
- Better overview of customer base
- Improved admin workflow
- Maintains all existing functionality
