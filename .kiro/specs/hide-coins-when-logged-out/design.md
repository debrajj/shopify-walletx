# Design Document: Hide Coins When Logged Out

## Overview

This design implements authentication-aware wallet widget behavior that adapts based on Shopify customer login status. For logged-in customers, the widget auto-loads their balance. For guest customers, the widget provides a manual balance check form with email/phone toggle options. The design ensures no sensitive wallet data is displayed or cached when users are logged out.

## Architecture

### Component Structure

```
Wallet Widget (Liquid + JavaScript)
├── Authentication Detection Layer
│   ├── Shopify Customer Object Check
│   └── LocalStorage Session Management
├── UI State Manager
│   ├── Guest State (Balance Check Form)
│   ├── Authenticated State (Balance Display)
│   └── Redemption State (Coin Input)
└── API Integration Layer
    ├── Balance Fetch (Email)
    ├── Balance Fetch (Phone)
    └── Discount Creation
```

### State Flow

```
Page Load
    ↓
Check Shopify Customer Object
    ↓
    ├─→ Customer Logged In
    │       ↓
    │   Auto-fetch balance by email
    │       ↓
    │   Display balance + redemption UI
    │
    └─→ Guest (Not Logged In)
            ↓
        Clear cached data
            ↓
        Show balance check form
            ↓
        User enters email/phone
            ↓
        Fetch balance
            ↓
        Display balance + redemption UI
```

## Components and Interfaces

### 1. Authentication Detection Module

**Purpose:** Detect Shopify customer login status and extract customer information

**Interface:**
```javascript
{
  isCustomerLoggedIn(): boolean
  getCustomerEmail(): string | null
  getCustomerPhone(): string | null
  clearCachedData(): void
}
```

**Implementation Details:**
- Check Shopify's Liquid `{% if customer %}` object
- Extract `customer.email` and `customer.phone` if available
- Return null if customer is not logged in

### 2. UI State Manager

**Purpose:** Manage widget display states based on authentication and user actions

**States:**
- `GUEST_INITIAL`: Show balance check form with email/phone toggle
- `AUTHENTICATED_LOADING`: Show loading indicator while fetching balance
- `BALANCE_DISPLAY`: Show coin balance and redeem button
- `REDEMPTION_FORM`: Show coin input and apply button
- `ERROR`: Show error message

**Interface:**
```javascript
{
  currentState: State
  setState(newState: State): void
  renderState(): void
}
```

### 3. Balance Check Form Component

**Purpose:** Provide UI for guest customers to check balance using email or phone

**UI Elements:**
- Toggle/Tabs: Switch between "Email" and "Phone" input modes
- Input Field: Email or phone number input (changes based on toggle)
- Check Balance Button: Trigger balance fetch
- Validation: Basic email/phone format validation

**Interface:**
```javascript
{
  inputMode: 'email' | 'phone'
  toggleInputMode(): void
  validateInput(value: string): boolean
  submitBalanceCheck(): Promise<void>
}
```

### 4. API Integration Layer

**Purpose:** Handle communication with backend API for balance and discount operations

**Endpoints:**
- `GET /api/wallet/balance?email={email}` - Fetch balance by email
- `GET /api/wallet/balance?phone={phone}` - Fetch balance by phone
- `POST /api/shopify/create-discount` - Create discount code

**Interface:**
```javascript
{
  fetchBalanceByEmail(email: string): Promise<BalanceResponse>
  fetchBalanceByPhone(phone: string): Promise<BalanceResponse>
  createDiscount(data: DiscountRequest): Promise<DiscountResponse>
}
```

## Data Models

### Customer Session
```javascript
{
  isAuthenticated: boolean,
  email: string | null,
  phone: string | null,
  source: 'shopify' | 'manual' | null
}
```

### Balance Response
```javascript
{
  success: boolean,
  walletCoins: number,
  email?: string,
  phone?: string,
  error?: string
}
```

### Widget State
```javascript
{
  currentBalance: number,
  currentEmail: string,
  currentPhone: string,
  isLoggedIn: boolean,
  inputMode: 'email' | 'phone',
  uiState: 'guest' | 'loading' | 'balance' | 'redeem' | 'error'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No Cached Data Display for Guests
*For any* page load where no Shopify customer is logged in, the widget should not display any cached balance or pre-filled email/phone data.
**Validates: Requirements 1.3, 1.4**

### Property 2: Auto-Load for Authenticated Customers
*For any* page load where a Shopify customer is logged in, the widget should automatically fetch and display the customer's balance using their Shopify email.
**Validates: Requirements 2.1, 2.2**

### Property 3: Data Cleared on Logout
*For any* logout event, all wallet-related data (balance, email, phone) should be removed from localStorage.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Email and Phone Toggle
*For any* input mode switch in the balance check form, the previous input value should be cleared and the placeholder should update appropriately.
**Validates: Requirements 6.2, 6.3**

### Property 5: Balance Fetch by Identifier Type
*For any* balance check submission, the system should use the correct API endpoint (email or phone) based on the current input mode.
**Validates: Requirements 5.1, 5.2, 6.4**

### Property 6: Authentication State Detection
*For any* widget initialization, the system should correctly detect whether a Shopify customer is logged in by checking the customer object.
**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

### Error Scenarios

1. **Network Failure**
   - Display: "Network error. Please try again."
   - Action: Allow user to retry

2. **Invalid Email/Phone Format**
   - Display: "Please enter a valid email/phone"
   - Action: Prevent submission until valid

3. **No Balance Found**
   - Display: "No coins available for this email/phone"
   - Action: Allow user to try different identifier

4. **API Error**
   - Display: Error message from API
   - Action: Log error, show user-friendly message

5. **Shopify Customer Object Missing**
   - Fallback: Treat as guest user
   - Action: Show balance check form

### Error Recovery

- All errors should be non-blocking
- Users should be able to retry operations
- Error messages should be clear and actionable
- Console logging for debugging

## Testing Strategy

### Unit Tests

1. **Authentication Detection**
   - Test with Shopify customer object present
   - Test with Shopify customer object absent
   - Test email extraction from customer object

2. **Input Validation**
   - Test valid email formats
   - Test invalid email formats
   - Test valid phone formats
   - Test invalid phone formats

3. **State Transitions**
   - Test guest → loading → balance display
   - Test authenticated → loading → balance display
   - Test balance display → redemption form
   - Test error states

4. **LocalStorage Management**
   - Test data clearing on logout
   - Test no data pre-fill for guests
   - Test data persistence for authenticated users

### Property-Based Tests

Each correctness property should be tested with property-based testing to verify behavior across many inputs:

1. **Property 1 Test**: Generate random page loads with no customer object, verify no cached data is displayed
2. **Property 2 Test**: Generate random customer objects with emails, verify auto-load occurs
3. **Property 3 Test**: Generate random logout events, verify localStorage is cleared
4. **Property 4 Test**: Generate random toggle events, verify input clearing
5. **Property 5 Test**: Generate random email/phone inputs, verify correct API endpoint usage
6. **Property 6 Test**: Generate random customer object states, verify correct authentication detection

### Integration Tests

1. **End-to-End Guest Flow**
   - Load widget as guest
   - Enter email
   - Check balance
   - Redeem coins

2. **End-to-End Authenticated Flow**
   - Load widget as logged-in customer
   - Verify auto-loaded balance
   - Redeem coins

3. **Toggle Between Email and Phone**
   - Switch from email to phone
   - Verify input cleared
   - Check balance with phone
   - Switch back to email

## Implementation Notes

### Liquid Template Considerations

- Use `{% if customer %}` to detect logged-in state
- Access customer data via `{{ customer.email | json }}`
- Ensure proper escaping of customer data

### JavaScript Considerations

- Use IIFE to avoid global namespace pollution
- Implement debouncing for input validation
- Use async/await for API calls
- Handle promise rejections gracefully

### LocalStorage Keys

- `walletEmail`: Cached email (cleared on logout)
- `walletPhone`: Cached phone (cleared on logout)
- `walletBalance`: Cached balance (cleared on logout)
- `walletAuthSource`: 'shopify' or 'manual' (cleared on logout)

### CSS Considerations

- Smooth transitions between states
- Clear visual distinction between input modes
- Accessible focus states
- Mobile-responsive design

## Security Considerations

1. **No Sensitive Data in LocalStorage**: Only store non-sensitive identifiers
2. **API Authentication**: All API calls include shop URL header
3. **Input Sanitization**: Validate and sanitize all user inputs
4. **HTTPS Only**: All API calls over HTTPS
5. **No Password Storage**: Never store passwords or tokens in widget

## Performance Considerations

1. **Lazy Loading**: Only fetch balance when needed
2. **Caching**: Cache balance for authenticated users (cleared on logout)
3. **Debouncing**: Debounce input validation
4. **Minimal DOM Manipulation**: Update only changed elements
5. **Async Operations**: Non-blocking API calls

## Deployment Strategy

1. **Update Liquid Template**: Modify wallet-app-embed.liquid
2. **Update JavaScript**: Modify widget initialization and state management
3. **Test in Development**: Verify both guest and authenticated flows
4. **Deploy to Production**: Push changes to Shopify theme
5. **Monitor**: Watch for errors in console logs and API responses
