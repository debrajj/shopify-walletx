# Implementation Plan: Unified Deployment

## Overview

This plan implements a unified full-stack deployment where the React frontend and Express backend are deployed together on Netlify. The frontend serves as static files, and the backend runs as a Netlify serverless function, all accessible from a single domain.

## Tasks

- [ ] 1. Configure environment variables in Netlify
  - Log into Netlify dashboard at https://app.netlify.com
  - Navigate to Site settings → Environment variables
  - Add all required backend environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, BCRYPT_SALT_ROUNDS, DEFAULT_OTP_EXPIRY_SECONDS, CORS_ORIGIN)
  - Verify variables are set correctly
  - _Requirements: 3.1, 3.2, 3.3, 10.3_

- [x] 2. Update frontend API configuration
  - [x] 2.1 Verify API base URL is set to relative path
    - Check `config/env.ts` has `baseUrl: '/api'`
    - Ensure no hardcoded absolute URLs in API client
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Update API client to use relative URLs
    - Modify `services/api.ts` to use relative `/api` prefix
    - Remove any references to external backend URLs
    - Test that requests format correctly
    - _Requirements: 1.4, 2.1, 2.2, 2.3_

- [ ] 3. Verify Netlify function configuration
  - [ ] 3.1 Check netlify.toml routing rules
    - Verify `/api/*` redirects to `/.netlify/functions/api/:splat`
    - Verify `/*` fallback serves `index.html`
    - Ensure `force = true` on API redirect
    - _Requirements: 1.3, 2.3, 7.3_
  
  - [ ] 3.2 Verify function dependencies
    - Check `package.json` includes all backend dependencies
    - Ensure `serverless-http`, `express`, `pg`, `bcryptjs`, `cors`, `body-parser` are listed
    - _Requirements: 6.3_

- [x] 4. Update backend function for proper routing
  - [x] 4.1 Ensure Express routes don't include /api prefix
    - Routes should be `/auth/login` not `/api/auth/login`
    - Netlify redirect strips `/api` before passing to function
    - _Requirements: 2.3, 2.4_
  
  - [x] 4.2 Add error handling for missing environment variables
    - Check for required env vars on function initialization
    - Log clear error messages if vars are missing
    - Return 500 with generic message to client
    - _Requirements: 3.4, 8.1, 8.3_

- [ ] 5. Test database connectivity from Netlify function
  - [ ] 5.1 Add database connection test endpoint
    - Create GET `/health` endpoint that tests DB connection
    - Return connection status and any errors
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 5.2 Write integration test for database connection
    - Test that connection pool initializes correctly
    - Test that SSL is enabled
    - Test error handling when DB is unreachable
    - _Requirements: 4.1, 4.2, 4.3, 10.1_

- [ ] 6. Optimize CORS configuration
  - [ ] 6.1 Update CORS settings for same-domain deployment
    - Since frontend and backend are same domain, CORS may not be needed
    - Keep CORS middleware but configure for production URL
    - Set `credentials: true` for cookie support
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Build and deploy
  - [ ] 7.1 Test build process locally
    - Run `npm run build`
    - Verify `dist/` folder is created with frontend assets
    - Verify `netlify/functions/api.js` exists
    - _Requirements: 6.1, 6.2_
  
  - [ ] 7.2 Deploy to Netlify
    - Push changes to git repository
    - Wait for Netlify automatic deployment
    - Monitor build logs for errors
    - _Requirements: 6.3, 6.4_

- [ ] 8. Checkpoint - Verify deployment works
  - Visit deployed URL and test login
  - Check browser network tab for API requests
  - Verify requests go to `/api/*` on same domain
  - Check Netlify function logs for any errors
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add monitoring and logging
  - [ ] 9.1 Enhance backend logging
    - Add structured logging for all API requests
    - Log database query execution times
    - Log authentication attempts (success/failure)
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 9.2 Add frontend error tracking
    - Implement global error boundary
    - Log API errors to console with context
    - Track failed authentication attempts
    - _Requirements: 8.1_

- [ ] 10. Security hardening
  - [ ] 10.1 Remove .env file from git tracking
    - Add `.env` to `.gitignore` if not already there
    - Run `git rm --cached .env` to remove from tracking
    - Commit and push changes
    - _Requirements: 10.3_
  
  - [ ] 10.2 Verify SSL database connections
    - Check that `ssl: { rejectUnauthorized: false }` is set
    - Test that connections use TLS
    - _Requirements: 10.1_
  
  - [ ] 10.3 Audit error responses for sensitive data
    - Review all error handlers
    - Ensure no database credentials in responses
    - Ensure no stack traces sent to client
    - _Requirements: 8.3, 10.3_

- [ ] 11. Performance optimization
  - [ ] 11.1 Verify static asset caching
    - Check that Netlify serves assets with cache headers
    - Verify CDN is being used for static files
    - _Requirements: 7.2, 9.4_
  
  - [ ] 11.2 Optimize database connection pooling
    - Verify connection pool is configured correctly
    - Test that connections are reused across requests
    - Monitor connection pool size in logs
    - _Requirements: 4.4, 9.3_

- [ ] 12. Final checkpoint - Production verification
  - Test all major features (login, dashboard, wallet operations)
  - Verify API response times are acceptable
  - Check Netlify function logs for any warnings
  - Confirm database connections are stable
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Environment variables must be set in Netlify dashboard before deployment
- The Netlify function will have a cold start on first request (may be slower)
- Database security group must allow connections from Netlify's IP ranges
- Monitor Netlify function logs during initial deployment for any issues
