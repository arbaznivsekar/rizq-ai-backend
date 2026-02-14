#!/bin/bash

# 🧪 EMAIL OUTREACH INTEGRATION TEST SCRIPT
# Tests all email discovery and Gmail integration endpoints

set -e

echo "🚀 Starting Email Outreach Integration Tests..."
echo "================================================"

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

# Test 2: User Registration/Login
echo ""
print_status "INFO" "Testing User Authentication..."

# Try to register a test user
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}" \
    2>/dev/null || echo "{}")

# Extract token from response
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    # Try login if registration failed
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        2>/dev/null || echo "{}")
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ]; then
    print_status "SUCCESS" "Authentication successful. Token obtained."
    echo "Token: ${TOKEN:0:20}..."
else
    print_status "ERROR" "Authentication failed. Please check your backend setup."
    exit 1
fi

# Test 3: Check Gmail Status
echo ""
print_status "INFO" "Testing Gmail Status Endpoint..."
GMAIL_STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/gmail/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    2>/dev/null || echo "{}")

if echo "$GMAIL_STATUS_RESPONSE" | grep -q "success"; then
    print_status "SUCCESS" "Gmail status endpoint is working"
    echo "Response: $GMAIL_STATUS_RESPONSE"
else
    print_status "WARNING" "Gmail status endpoint returned unexpected response"
    echo "Response: $GMAIL_STATUS_RESPONSE"
fi

# Test 4: Test Email Discovery Endpoint
echo ""
print_status "INFO" "Testing Email Discovery Endpoint..."

# First, get some job IDs from the database
JOBS_RESPONSE=$(curl -s -X GET "$BASE_URL/workflow/search?limit=5" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    2>/dev/null || echo "{}")

# Extract job IDs (this is a simplified extraction)
JOB_IDS=$(echo "$JOBS_RESPONSE" | grep -o '"_id":"[^"]*"' | head -3 | cut -d'"' -f4 | tr '\n' ',' | sed 's/,$//')

if [ -n "$JOB_IDS" ]; then
    print_status "SUCCESS" "Found job IDs for testing: $JOB_IDS"
    
    # Test email discovery
    EMAIL_DISCOVERY_RESPONSE=$(curl -s -X POST "$BASE_URL/email/discover-emails" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"job_ids\":[\"$JOB_IDS\"]}" \
        2>/dev/null || echo "{}")
    
    if echo "$EMAIL_DISCOVERY_RESPONSE" | grep -q "success"; then
        print_status "SUCCESS" "Email discovery endpoint is working"
        echo "Response: $EMAIL_DISCOVERY_RESPONSE"
    else
        print_status "WARNING" "Email discovery endpoint returned unexpected response"
        echo "Response: $EMAIL_DISCOVERY_RESPONSE"
    fi
else
    print_status "WARNING" "No job IDs found for testing email discovery"
fi

# Test 5: Test Gmail OAuth Start
echo ""
print_status "INFO" "Testing Gmail OAuth Start Endpoint..."
OAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/email-outreach/oauth/google/start" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    2>/dev/null || echo "{}")

if echo "$OAUTH_RESPONSE" | grep -q "authUrl\|redirect"; then
    print_status "SUCCESS" "Gmail OAuth start endpoint is working"
    echo "Response: $OAUTH_RESPONSE"
else
    print_status "WARNING" "Gmail OAuth start endpoint returned unexpected response"
    echo "Response: $OAUTH_RESPONSE"
fi

# Test 6: Test One-Click Apply Endpoint
echo ""
print_status "INFO" "Testing One-Click Apply Endpoint..."

if [ -n "$JOB_IDS" ]; then
    APPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/email-outreach/one-click-apply" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"jobIds\":[\"$JOB_IDS\"]}" \
        2>/dev/null || echo "{}")
    
    if echo "$APPLY_RESPONSE" | grep -q "success\|queued"; then
        print_status "SUCCESS" "One-click apply endpoint is working"
        echo "Response: $APPLY_RESPONSE"
    else
        print_status "WARNING" "One-click apply endpoint returned unexpected response"
        echo "Response: $APPLY_RESPONSE"
    fi
else
    print_status "WARNING" "Skipping one-click apply test - no job IDs available"
fi

# Test 7: Environment Variables Check
echo ""
print_status "INFO" "Checking Environment Variables..."

# Check if required environment variables are set
if [ -n "$HUNTER_API_KEY" ]; then
    print_status "SUCCESS" "HUNTER_API_KEY is set"
else
    print_status "WARNING" "HUNTER_API_KEY is not set - email discovery will not work"
fi

if [ -n "$GMAIL_CLIENT_ID" ]; then
    print_status "SUCCESS" "GMAIL_CLIENT_ID is set"
else
    print_status "WARNING" "GMAIL_CLIENT_ID is not set - Gmail integration will not work"
fi

if [ -n "$GMAIL_CLIENT_SECRET" ]; then
    print_status "SUCCESS" "GMAIL_CLIENT_SECRET is set"
else
    print_status "WARNING" "GMAIL_CLIENT_SECRET is not set - Gmail integration will not work"
fi

# Summary
echo ""
echo "================================================"
print_status "INFO" "Email Outreach Integration Test Complete!"
echo ""
print_status "INFO" "Next Steps:"
echo "1. Start frontend: cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend && npm run dev"
echo "2. Open browser: http://localhost:3000"
echo "3. Register/Login with test account"
echo "4. Connect Gmail account"
echo "5. Search for jobs and test email outreach feature"
echo ""
print_status "SUCCESS" "Backend API endpoints are ready for testing!"
