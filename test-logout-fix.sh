#!/bin/bash

# Test script to verify logout cookie clearing functionality
# This script tests the logout endpoint to ensure HttpOnly cookies are properly cleared

BASE_URL="${BASE_URL:-http://localhost:8080}"
API_VERSION="v1"

echo "========================================"
echo "🔐 Testing Logout Cookie Clearing Fix"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Login via Gmail OAuth (simulated - you'd need to do this manually via browser)
echo "📝 Step 1: Login Process"
echo "----------------------------------------"
echo "Please log in via Gmail OAuth first:"
echo "Visit: ${BASE_URL}/api/${API_VERSION}/auth/google/login"
echo ""
echo "After logging in, check your browser's cookies."
echo "You should see a 'token' cookie set with HttpOnly flag."
echo ""

# Wait for user to complete login
read -p "Press Enter after you've logged in via browser..."
echo ""

# Step 2: Get the token from cookie or use bearer token
echo "📝 Step 2: Test Authentication"
echo "----------------------------------------"
echo "Testing /auth/me endpoint to verify you're logged in..."
echo ""

# Ask user for token (since we can't get HttpOnly cookies from curl)
read -p "Enter your JWT token (from browser devtools or Authorization header): " TOKEN

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ No token provided. Exiting.${NC}"
  exit 1
fi

# Test /me endpoint
ME_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  "${BASE_URL}/api/${API_VERSION}/auth/me")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n 1)
BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Authentication successful${NC}"
  echo "User info: $(echo "$BODY" | jq -r '.user.email // .email')"
else
  echo -e "${RED}❌ Authentication failed (HTTP $HTTP_CODE)${NC}"
  echo "Response: $BODY"
  exit 1
fi

echo ""

# Step 3: Test logout
echo "📝 Step 3: Test Logout"
echo "----------------------------------------"
echo "Calling logout endpoint and checking if cookie is cleared..."
echo ""

# Perform logout and capture response with headers
LOGOUT_RESPONSE=$(curl -s -i -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  "${BASE_URL}/api/${API_VERSION}/auth/logout")

# Extract Set-Cookie header
COOKIE_HEADER=$(echo "$LOGOUT_RESPONSE" | grep -i "Set-Cookie: token=")

if [ -n "$COOKIE_HEADER" ]; then
  echo -e "${GREEN}✅ Set-Cookie header found in logout response${NC}"
  echo "Cookie header: $COOKIE_HEADER"
  echo ""
  
  # Check if cookie is being cleared (Max-Age=0 or Expires in the past)
  if echo "$COOKIE_HEADER" | grep -q "Max-Age=0\|Expires=Thu, 01 Jan 1970"; then
    echo -e "${GREEN}✅ Cookie is properly being cleared!${NC}"
    echo "The HttpOnly cookie will be removed from the browser."
  else
    echo -e "${RED}❌ Cookie is NOT being cleared properly${NC}"
    echo "Expected Max-Age=0 or past Expires date"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  No Set-Cookie header found${NC}"
  echo "This might mean cookies aren't being used, or there's an issue."
  echo ""
  echo "Full response:"
  echo "$LOGOUT_RESPONSE"
  exit 1
fi

echo ""
echo "========================================"
echo "✅ Logout Cookie Clearing Test Complete"
echo "========================================"
echo ""
echo "📋 Manual Verification Steps:"
echo "1. Open browser DevTools → Application → Cookies"
echo "2. Before logout: Verify 'token' cookie exists"
echo "3. After logout: Verify 'token' cookie is removed"
echo "4. Refresh the page: Verify user is NOT logged back in"
echo ""


