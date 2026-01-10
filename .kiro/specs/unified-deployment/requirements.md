# Requirements Document

## Introduction

This specification defines the requirements for deploying a unified full-stack application where both the React frontend and Express backend API are served from a single domain/URL using Netlify's serverless functions.

## Glossary

- **Frontend**: The React-based admin dashboard UI
- **Backend**: The Express.js API server handling authentication, wallet operations, and database queries
- **Netlify_Function**: A serverless function that runs the Express backend
- **Unified_Deployment**: A single deployment where frontend and backend share the same domain
- **API_Route**: HTTP endpoints prefixed with `/api` that route to the backend
- **Static_Route**: All other routes that serve the React frontend

## Requirements

### Requirement 1: Single Domain Deployment

**User Story:** As a developer, I want to deploy both frontend and backend to a single Netlify URL, so that I don't need to manage separate deployments or CORS configurations.

#### Acceptance Criteria

1. WHEN a user visits the root URL, THE System SHALL serve the React frontend application
2. WHEN a user navigates to any frontend route (e.g., `/dashboard`, `/settings`), THE System SHALL serve the React frontend with client-side routing
3. WHEN a request is made to `/api/*`, THE System SHALL route it to the Netlify serverless function
4. THE System SHALL handle all routing through a single domain without external API URLs

### Requirement 2: API Request Routing

**User Story:** As a frontend developer, I want API requests to automatically route to the backend function, so that I can use relative URLs without configuration.

#### Acceptance Criteria

1. WHEN the frontend makes a request to `/api/auth/login`, THE System SHALL route it to the Express backend function
2. WHEN the frontend makes a request to `/api/wallet/balance`, THE System SHALL route it to the Express backend function
3. WHEN an API route is accessed, THE Netlify_Function SHALL process the request and return the response
4. THE System SHALL preserve request headers, body, and query parameters during routing

### Requirement 3: Environment Configuration

**User Story:** As a developer, I want environment variables to be properly configured for both frontend and backend, so that the application works correctly in production.

#### Acceptance Criteria

1. WHEN the frontend is built, THE System SHALL use VITE_ prefixed environment variables
2. WHEN the backend function runs, THE System SHALL access database credentials from Netlify environment variables
3. THE System SHALL not expose backend environment variables to the frontend
4. WHEN environment variables are missing, THE System SHALL provide clear error messages

### Requirement 4: Database Connectivity

**User Story:** As a backend developer, I want the Netlify function to connect to the PostgreSQL database, so that API requests can read and write data.

#### Acceptance Criteria

1. WHEN the Netlify function initializes, THE System SHALL establish a connection pool to the PostgreSQL database
2. WHEN a database query is executed, THE System SHALL use SSL connections for security
3. IF the database connection fails, THEN THE System SHALL return a 500 error with appropriate logging
4. THE System SHALL reuse database connections across function invocations for performance

### Requirement 5: CORS Configuration

**User Story:** As a developer, I want CORS to be properly configured, so that the frontend can communicate with the backend without cross-origin issues.

#### Acceptance Criteria

1. WHEN frontend and backend are on the same domain, THE System SHALL not require CORS headers
2. WHEN API requests are made, THE System SHALL include appropriate CORS headers if needed
3. THE System SHALL allow credentials (cookies, authorization headers) in API requests
4. THE System SHALL handle preflight OPTIONS requests correctly

### Requirement 6: Build and Deployment Process

**User Story:** As a developer, I want a simple build process that deploys both frontend and backend together, so that deployment is straightforward.

#### Acceptance Criteria

1. WHEN `npm run build` is executed, THE System SHALL compile the React frontend to static files
2. WHEN Netlify deploys, THE System SHALL bundle the Express backend as a serverless function
3. THE System SHALL install all required dependencies for both frontend and backend
4. WHEN deployment completes, THE System SHALL serve both frontend and backend from the same URL

### Requirement 7: Static Asset Serving

**User Story:** As a user, I want static assets (CSS, JS, images) to load quickly, so that the application performs well.

#### Acceptance Criteria

1. WHEN the frontend is accessed, THE System SHALL serve static assets from Netlify's CDN
2. WHEN a static asset is requested, THE System SHALL return it with appropriate caching headers
3. THE System SHALL serve the React app's index.html for all non-API routes
4. THE System SHALL handle 404s by serving the React app (for client-side routing)

### Requirement 8: Error Handling and Logging

**User Story:** As a developer, I want clear error messages and logs, so that I can debug issues quickly.

#### Acceptance Criteria

1. WHEN an API error occurs, THE System SHALL log the error to Netlify function logs
2. WHEN a database error occurs, THE System SHALL return a 500 status with a generic error message
3. WHEN authentication fails, THE System SHALL return a 401 status with an appropriate message
4. THE System SHALL not expose sensitive information (database credentials, stack traces) in error responses

### Requirement 9: Performance Optimization

**User Story:** As a user, I want the application to load and respond quickly, so that I have a good experience.

#### Acceptance Criteria

1. WHEN the frontend loads, THE System SHALL serve minified and optimized JavaScript bundles
2. WHEN API requests are made, THE System SHALL respond within 2 seconds under normal load
3. THE System SHALL use connection pooling to minimize database connection overhead
4. THE System SHALL cache static assets with appropriate cache headers

### Requirement 10: Security Configuration

**User Story:** As a security-conscious developer, I want the deployment to follow security best practices, so that the application is protected.

#### Acceptance Criteria

1. WHEN database connections are made, THE System SHALL use SSL/TLS encryption
2. WHEN passwords are stored, THE System SHALL use bcrypt hashing with appropriate salt rounds
3. THE System SHALL not expose database credentials in frontend code or logs
4. WHEN API requests are made, THE System SHALL validate and sanitize inputs
