#!/bin/bash

echo "🧪 Testing OAuth Flow"
echo "======================"

# Test 1: Check if OAuth login endpoint is accessible
echo "1. Testing OAuth login endpoint..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/auth/google/login
echo " - OAuth login endpoint status"

# Test 2: Check if auth/me endpoint requires authentication
echo "2. Testing auth/me endpoint (should return 401)..."
response=$(curl -s -w "%{http_code}" http://localhost:8080/api/v1/auth/me)
status_code="${response: -3}"
echo " - Auth/me endpoint status: $status_code"

if [ "$status_code" = "401" ]; then
    echo "✅ Auth/me correctly requires authentication"
else
    echo "❌ Auth/me should return 401 for unauthenticated requests"
fi

# Test 3: Check if server is running
echo "3. Testing server health..."
health_response=$(curl -s http://localhost:8080/health)
if [[ $health_response == *"ok"* ]]; then
    echo "✅ Server is running and healthy"
else
    echo "❌ Server health check failed"
fi

echo ""
echo "🔗 To test the complete OAuth flow:"
echo "1. Open browser to: http://localhost:3000/auth/login"
echo "2. Click 'Continue with Gmail'"
echo "3. Complete Gmail OAuth"
echo "4. Should redirect to: http://localhost:3000/dashboard"
echo ""
echo "Expected behavior:"
echo "- OAuth redirects to /dashboard"
echo "- Dashboard shows user profile"
echo "- No redirect back to login page"

