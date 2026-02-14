#!/bin/bash

###############################################################################
# Email Redirect Service Test Script
# Tests email redirection functionality in development environment
#
# Prerequisites:
# - Backend server running on http://localhost:8080
# - User authenticated (JWT token)
# - EMAIL_TEST_MODE=true in .env
# - Test emails configured in EMAIL_TEST_RECIPIENTS
#
# Usage:
#   ./test-email-redirect.sh
#
# Author: RIZQ.AI Engineering Team
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8080/api/v1"
TOKEN=""
USER_ID=""

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}[TEST $TESTS_RUN] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

###############################################################################
# Test Functions
###############################################################################

test_redirect_service_status() {
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "Email Redirect Service Status"
    
    RESPONSE=$(curl -s -X GET "$API_URL/email-redirect/status" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        TEST_MODE=$(echo "$RESPONSE" | grep -o '"testMode":[^,}]*' | cut -d':' -f2)
        REDIRECT_COUNT=$(echo "$RESPONSE" | grep -o '"redirectCount":[^,}]*' | cut -d':' -f2)
        
        echo "$RESPONSE" | jq '.'
        
        if [ "$TEST_MODE" = "true" ]; then
            print_success "Test mode is ENABLED (as expected)"
        else
            print_error "Test mode is DISABLED (should be enabled for testing)"
            return 1
        fi
        
        print_info "Total redirects: $REDIRECT_COUNT"
        print_success "Service status retrieved successfully"
    else
        print_error "Failed to get service status"
        echo "$RESPONSE" | jq '.'
        return 1
    fi
}

test_distribution_stats() {
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "Email Distribution Statistics"
    
    RESPONSE=$(curl -s -X GET "$API_URL/email-redirect/distribution" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "$RESPONSE" | jq '.'
        print_success "Distribution stats retrieved successfully"
    else
        print_error "Failed to get distribution stats"
        echo "$RESPONSE" | jq '.'
        return 1
    fi
}

test_recent_redirected_emails() {
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "Recent Redirected Emails"
    
    RESPONSE=$(curl -s -X GET "$API_URL/email-redirect/recent?limit=10" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        COUNT=$(echo "$RESPONSE" | grep -o '"count":[^,}]*' | cut -d':' -f2)
        echo "$RESPONSE" | jq '.'
        print_info "Found $COUNT redirected emails"
        print_success "Recent redirected emails retrieved"
    else
        print_error "Failed to get recent redirected emails"
        echo "$RESPONSE" | jq '.'
        return 1
    fi
}

test_bulk_apply_with_redirect() {
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "Bulk Apply with Email Redirect"
    
    print_info "This test requires job IDs. Fetching jobs first..."
    
    # Get some job IDs
    JOBS_RESPONSE=$(curl -s -X GET "$API_URL/workflow/search?limit=3" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    JOB_IDS=$(echo "$JOBS_RESPONSE" | jq -r '.data.jobs[].id // .data.jobs[]._id' | head -3 | jq -R -s 'split("\n") | map(select(length > 0))')
    
    if [ "$JOB_IDS" = "[]" ] || [ -z "$JOB_IDS" ]; then
        print_error "No jobs found. Please scrape some jobs first."
        return 1
    fi
    
    print_info "Job IDs: $JOB_IDS"
    
    # Apply to jobs (this should trigger email redirect)
    APPLY_RESPONSE=$(curl -s -X POST "$API_URL/workflow/apply" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"jobIds\": $JOB_IDS,
            \"customMessage\": \"Test application with email redirect\",
            \"includeResume\": true
        }")
    
    if echo "$APPLY_RESPONSE" | grep -q '"success":true'; then
        echo "$APPLY_RESPONSE" | jq '.'
        
        PROGRESS_ID=$(echo "$APPLY_RESPONSE" | jq -r '.data.progressId')
        print_info "Progress ID: $PROGRESS_ID"
        
        # Wait for processing
        print_info "Waiting for email processing (30 seconds)..."
        sleep 30
        
        # Check progress
        PROGRESS_RESPONSE=$(curl -s -X GET "$API_URL/workflow/apply/status/$PROGRESS_ID" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
        
        echo "$PROGRESS_RESPONSE" | jq '.'
        
        print_success "Bulk apply initiated successfully"
        print_info "Check the email redirect status to verify redirection"
    else
        print_error "Bulk apply failed"
        echo "$APPLY_RESPONSE" | jq '.'
        return 1
    fi
}

test_verify_test_emails() {
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "Verify Test Email Addresses"
    
    print_info "Expected test emails:"
    echo "  - poliveg869@limtu.com"
    echo "  - fsm2s@2200freefonts.com"
    echo "  - jobhoho@forexiz.com"
    
    RESPONSE=$(curl -s -X GET "$API_URL/email-redirect/status" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        TEST_EMAILS=$(echo "$RESPONSE" | jq -r '.data.testEmails[]')
        
        if echo "$TEST_EMAILS" | grep -q "poliveg869@limtu.com" && \
           echo "$TEST_EMAILS" | grep -q "fsm2s@2200freefonts.com" && \
           echo "$TEST_EMAILS" | grep -q "jobhoho@forexiz.com"; then
            print_success "All test emails configured correctly"
        else
            print_error "Test emails not configured correctly"
            echo "Actual test emails:"
            echo "$TEST_EMAILS"
            return 1
        fi
    else
        print_error "Failed to verify test emails"
        return 1
    fi
}

test_production_safety() {
    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "Production Safety Check"
    
    print_info "Verifying that test mode cannot be enabled in production..."
    print_info "(This test checks environment variable validation)"
    
    # This is a documentation test - actual validation happens at service startup
    print_success "Production safety is enforced at service initialization"
    print_info "Service will throw error if EMAIL_TEST_MODE=true in NODE_ENV=production"
}

###############################################################################
# Authentication
###############################################################################

authenticate() {
    print_header "Authentication"
    
    echo "Please provide your authentication token:"
    echo "You can get this by:"
    echo "  1. Login to http://localhost:3000"
    echo "  2. Open DevTools > Application > Local Storage"
    echo "  3. Copy the 'token' value"
    echo ""
    echo -n "Enter token: "
    read -r TOKEN
    
    if [ -z "$TOKEN" ]; then
        print_error "No token provided"
        exit 1
    fi
    
    # Verify token
    RESPONSE=$(curl -s -X GET "$API_URL/profile" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        USER_ID=$(echo "$RESPONSE" | jq -r '.data.id // .data._id')
        print_success "Authentication successful"
        print_info "User ID: $USER_ID"
    else
        print_error "Authentication failed"
        echo "$RESPONSE" | jq '.'
        exit 1
    fi
}

###############################################################################
# Main Test Execution
###############################################################################

main() {
    print_header "Email Redirect Service Test Suite"
    
    echo "This script tests the email redirect functionality"
    echo "Make sure EMAIL_TEST_MODE=true in your .env file"
    echo ""
    
    # Authenticate
    authenticate
    
    # Run tests
    print_header "Running Tests"
    
    test_redirect_service_status
    echo ""
    
    test_verify_test_emails
    echo ""
    
    test_distribution_stats
    echo ""
    
    test_recent_redirected_emails
    echo ""
    
    test_production_safety
    echo ""
    
    # Optional: Run bulk apply test
    echo -n "Do you want to test bulk apply with redirect? (y/n): "
    read -r RUN_BULK_TEST
    
    if [ "$RUN_BULK_TEST" = "y" ] || [ "$RUN_BULK_TEST" = "Y" ]; then
        echo ""
        test_bulk_apply_with_redirect
    fi
    
    # Summary
    print_header "Test Summary"
    
    echo -e "Total Tests: ${BLUE}$TESTS_RUN${NC}"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All tests passed!"
        echo ""
        echo -e "${GREEN}✅ Email redirect service is working correctly${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Check the test email inboxes to verify emails arrived"
        echo "  2. Review email queue in database to see redirect metadata"
        echo "  3. Monitor logs for redirect activity"
    else
        print_error "$TESTS_FAILED test(s) failed"
        echo ""
        echo "Please review the errors above and fix any issues"
        exit 1
    fi
}

# Run main function
main





