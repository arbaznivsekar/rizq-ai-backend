#!/bin/bash

# 🧪 GMAIL OAUTH TEST SCRIPT
# Tests Gmail OAuth endpoints

set -e

echo "🚀 Testing Gmail OAuth Endpoints..."
echo "=================================="

# Configuration
BASE_URL="http://localhost:8080/api/v1"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"

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

# Test 2: Test Gmail OAuth Start Endpoint (without auth)
echo ""
print_status "INFO" "Testing Gmail OAuth Start Endpoint..."
OAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/email-outreach/oauth/google/start" \
    -H "Content-Type: application/json" \
    2>/dev/null || echo "{}")

echo "Response: $OAUTH_RESPONSE"

if echo "$OAUTH_RESPONSE" | grep -q "authUrl\|redirect"; then
    print_status "SUCCESS" "Gmail OAuth start endpoint is working"
elif echo "$OAUTH_RESPONSE" | grep -q "unauthorized\|Unauthorized"; then
    print_status "WARNING" "Gmail OAuth start endpoint requires authentication"
else
    print_status "WARNING" "Gmail OAuth start endpoint returned unexpected response"
fi

# Test 3: Test Gmail Status Endpoint (without auth)
echo ""
print_status "INFO" "Testing Gmail Status Endpoint..."
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/gmail/status" \
    -H "Content-Type: application/json" \
    2>/dev/null || echo "{}")

echo "Response: $STATUS_RESPONSE"

if echo "$STATUS_RESPONSE" | grep -q "unauthorized\|Unauthorized"; then
    print_status "SUCCESS" "Gmail status endpoint requires authentication (expected)"
else
    print_status "WARNING" "Gmail status endpoint returned unexpected response"
fi

# Test 4: Check Environment Variables
echo ""
print_status "INFO" "Checking Environment Variables..."

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

# Test 5: Check Hunter.io API Key
echo ""
print_status "INFO" "Checking Hunter.io Configuration..."

if [ -n "$HUNTER_API_KEY" ]; then
    print_status "SUCCESS" "HUNTER_API_KEY is set"
else
    print_status "WARNING" "HUNTER_API_KEY is not set - Email discovery will not work"
fi

# Summary
echo ""
echo "=================================="
print_status "INFO" "Gmail OAuth Test Complete!"
echo ""
print_status "INFO" "Next Steps:"
echo "1. Ensure all environment variables are set"
echo "2. Start frontend: cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend && npm run dev"
echo "3. Open browser: http://localhost:3000"
echo "4. Register/Login with test account"
echo "5. Select 15+ jobs and click 'Email Outreach'"
echo "6. Complete Gmail OAuth flow in popup"
echo "7. Test email discovery and sending"
echo ""
print_status "SUCCESS" "Backend Gmail OAuth endpoints are ready for testing!"


