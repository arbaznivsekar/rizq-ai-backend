#!/bin/bash

# 🧪 GMAIL-ONLY AUTHENTICATION TEST SCRIPT
# Tests the new Gmail-only authentication system

set -e

echo "🚀 Testing Gmail-Only Authentication System..."
echo "=============================================="

# Configuration
BASE_URL="http://localhost:8080/api/v1"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Test 1: Check if backend is running
echo ""
print_status "INFO" "Testing Backend Connectivity..."
if curl -s -f "$BASE_URL/workflow/sources" > /dev/null 2>&1; then
    print_status "SUCCESS" "Backend server is running"
else
    print_status "ERROR" "Backend server is not running. Please start it with: npm run dev"
    exit 1
fi

# Test 2: Check if frontend is running
echo ""
print_status "INFO" "Testing Frontend Connectivity..."
if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    print_status "SUCCESS" "Frontend server is running"
else
    print_status "WARNING" "Frontend server is not running. Please start it with: npm run dev"
fi

# Test 3: Test Gmail OAuth Login Endpoint
echo ""
print_status "INFO" "Testing Gmail OAuth Login Endpoint..."
OAUTH_RESPONSE=$(curl -s -I -X GET "$BASE_URL/auth/google/login" 2>/dev/null || echo "{}")

if echo "$OAUTH_RESPONSE" | grep -q "302\|Location.*google"; then
    print_status "SUCCESS" "Gmail OAuth login endpoint is working (redirects to Google)"
elif echo "$OAUTH_RESPONSE" | grep -q "500\|error"; then
    print_status "ERROR" "Gmail OAuth login endpoint has errors"
    echo "Response: $OAUTH_RESPONSE"
else
    print_status "WARNING" "Gmail OAuth login endpoint returned unexpected response"
    echo "Response: $OAUTH_RESPONSE"
fi

# Test 4: Check Environment Variables
echo ""
print_status "INFO" "Checking Gmail OAuth Environment Variables..."

if [ -n "$GMAIL_CLIENT_ID" ]; then
    print_status "SUCCESS" "GMAIL_CLIENT_ID is set"
else
    print_status "WARNING" "GMAIL_CLIENT_ID is not set - Gmail OAuth will not work"
fi

if [ -n "$GMAIL_CLIENT_SECRET" ]; then
    print_status "SUCCESS" "GMAIL_CLIENT_SECRET is set"
else
    print_status "WARNING" "GMAIL_CLIENT_SECRET is not set - Gmail OAuth will not work"
fi

if [ -n "$GMAIL_REDIRECT_URI" ]; then
    print_status "SUCCESS" "GMAIL_REDIRECT_URI is set"
else
    print_status "WARNING" "GMAIL_REDIRECT_URI is not set - Gmail OAuth will not work"
fi

if [ -n "$JWT_SECRET" ]; then
    print_status "SUCCESS" "JWT_SECRET is set"
else
    print_status "WARNING" "JWT_SECRET is not set - Authentication will not work"
fi

if [ -n "$CORS_ORIGIN" ]; then
    print_status "SUCCESS" "CORS_ORIGIN is set"
else
    print_status "WARNING" "CORS_ORIGIN is not set - Frontend integration may not work"
fi

# Test 5: Check Hunter.io API Key
echo ""
print_status "INFO" "Checking Hunter.io Configuration..."

if [ -n "$HUNTER_API_KEY" ]; then
    print_status "SUCCESS" "HUNTER_API_KEY is set"
else
    print_status "WARNING" "HUNTER_API_KEY is not set - Email discovery will not work"
fi

# Test 6: Test Auth Routes
echo ""
print_status "INFO" "Testing Authentication Routes..."

# Test /auth/me endpoint (should require auth)
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" 2>/dev/null || echo "{}")
if echo "$ME_RESPONSE" | grep -q "unauthorized\|Unauthorized"; then
    print_status "SUCCESS" "/auth/me endpoint requires authentication (expected)"
else
    print_status "WARNING" "/auth/me endpoint returned unexpected response"
    echo "Response: $ME_RESPONSE"
fi

# Test /auth/gmail/status endpoint (should require auth)
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/gmail/status" 2>/dev/null || echo "{}")
if echo "$STATUS_RESPONSE" | grep -q "unauthorized\|Unauthorized"; then
    print_status "SUCCESS" "/auth/gmail/status endpoint requires authentication (expected)"
else
    print_status "WARNING" "/auth/gmail/status endpoint returned unexpected response"
    echo "Response: $STATUS_RESPONSE"
fi

# Summary
echo ""
echo "=============================================="
print_status "INFO" "Gmail-Only Authentication Test Complete!"
echo ""
print_status "INFO" "Next Steps:"
echo "1. Ensure all environment variables are set"
echo "2. Start frontend: cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend && npm run dev"
echo "3. Open browser: http://localhost:3000"
echo "4. Click 'Continue with Gmail' to test OAuth flow"
echo "5. Complete Gmail authorization"
echo "6. Test email outreach feature"
echo ""
print_status "SUCCESS" "Gmail-only authentication system is ready for testing!"

# Test 7: Provide Testing Instructions
echo ""
print_status "INFO" "Manual Testing Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Click 'Sign In' or navigate to /auth/login"
echo "3. Click 'Continue with Gmail' button"
echo "4. Complete Gmail OAuth authorization"
echo "5. Verify you're logged in and redirected to dashboard"
echo "6. Search for jobs and select 15+ jobs"
echo "7. Click 'Email Outreach' - should work immediately (no Gmail connection needed)"
echo ""
print_status "SUCCESS" "Ready for end-to-end testing!"


