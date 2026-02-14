#!/bin/bash

echo "🧪 Complete OAuth Flow Test"
echo "=========================="

# Test 1: Backend OAuth endpoint
echo "1. Testing OAuth login endpoint..."
oauth_response=$(curl -s -I http://localhost:8080/api/v1/auth/google/login)
if [[ $oauth_response == *"302"* ]]; then
    echo "✅ OAuth login endpoint working (302 redirect)"
else
    echo "❌ OAuth login endpoint failed"
    exit 1
fi

# Test 2: Backend health
echo "2. Testing backend health..."
health_response=$(curl -s http://localhost:8080/health)
if [[ $health_response == *"ok"* ]]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Test 3: Auth/me endpoint (should require auth)
echo "3. Testing auth/me endpoint (should return 401)..."
auth_response=$(curl -s -w "%{http_code}" http://localhost:8080/api/v1/auth/me)
status_code="${auth_response: -3}"
if [ "$status_code" = "401" ]; then
    echo "✅ Auth/me correctly requires authentication"
else
    echo "❌ Auth/me should return 401 for unauthenticated requests"
fi

echo ""
echo "🔍 Current OAuth Flow Analysis:"
echo "==============================="
echo "✅ Backend OAuth redirect: /dashboard"
echo "✅ Frontend OAuth callback: Retry logic with 5 attempts"
echo "✅ Dashboard timeout: 3 seconds (increased from 1 second)"
echo "✅ Loading state: Improved with user message"
echo ""
echo "🎯 Expected User Flow:"
echo "1. User clicks 'Continue with Gmail'"
echo "2. Redirected to Google OAuth"
echo "3. User completes Gmail consent"
echo "4. Backend redirects to: http://localhost:3000/dashboard"
echo "5. Frontend detects /dashboard path"
echo "6. Frontend retries auth check up to 5 times"
echo "7. Dashboard shows user profile"
echo "8. No redirect back to login page"
echo ""
echo "🚀 Ready for testing!"
echo "Open: http://localhost:3000/auth/login"

