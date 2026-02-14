# Google OAuth Setup Guide

## Current Issue: redirect_uri_mismatch

The error "Error 400: redirect_uri_mismatch" occurs because the redirect URI is not registered in Google Cloud Console.

## Required Steps:

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add these Authorized redirect URIs:
   - `http://localhost:8080/api/v1/auth/google/callback`
   - `http://localhost:3000/auth/callback` (for frontend)
7. Save the credentials

### 2. Environment Variables

Create a `.env` file in the backend directory with:

```bash
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your-google-client-id
GMAIL_CLIENT_SECRET=your-google-client-secret
GMAIL_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback

# Other required variables
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000
```

### 3. Test the Configuration

After setting up the environment variables:

```bash
# Restart the backend
npm run dev

# Test OAuth flow
curl -I http://localhost:8080/api/v1/auth/google/login
```

## Expected Behavior:

1. OAuth login should redirect to Google
2. After Google consent, should redirect back to `/dashboard`
3. No more "redirect_uri_mismatch" errors

## Troubleshooting:

- Ensure the redirect URI in Google Cloud Console exactly matches the one in your code
- Check that the environment variables are loaded correctly
- Verify the Google Cloud project has Gmail API enabled

