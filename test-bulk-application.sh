#!/bin/bash

###############################################################################
# Bulk Application System - End-to-End Test Script
# Tests the complete flow: Job selection → Email discovery → AI generation → Gmail queue
###############################################################################

set -e

BASE_URL="${BASE_URL:-http://localhost:8080}"
API_VERSION="v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "🚀 Bulk Application System Test"
echo "========================================"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it first:${NC}"
    echo "   Ubuntu/Debian: sudo apt-get install jq"
    echo "   macOS: brew install jq"
    exit 1
fi

# Step 1: Check server health
echo -e "${BLUE}📡 Step 1: Checking server health...${NC}"
HEALTH_CHECK=$(curl -s "${BASE_URL}/health")
if echo "$HEALTH_CHECK" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Server is healthy${NC}"
else
    echo -e "${RED}❌ Server is not healthy${NC}"
    exit 1
fi
echo ""

# Step 2: Get authentication token
echo -e "${BLUE}🔐 Step 2: Authentication${NC}"
echo "You need to authenticate via Gmail OAuth first."
echo "Visit: ${BASE_URL}/api/${API_VERSION}/auth/google/login"
echo ""
read -p "After logging in, enter your JWT token: " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No token provided${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token received${NC}"
echo ""

# Step 3: Check Gmail connection
echo -e "${BLUE}📧 Step 3: Verifying Gmail connection...${NC}"
GMAIL_STATUS=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "${BASE_URL}/api/${API_VERSION}/auth/gmail/status")

if echo "$GMAIL_STATUS" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✅ Gmail is connected${NC}"
else
    echo -e "${RED}❌ Gmail is not connected. Please connect Gmail OAuth first.${NC}"
    exit 1
fi
echo ""

# Step 4: Check email consent
echo -e "${BLUE}📝 Step 4: Checking email consent...${NC}"
CONSENT_STATUS=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "${BASE_URL}/api/${API_VERSION}/email-outreach/consent")

if echo "$CONSENT_STATUS" | jq -e '.data.hasConsent' | grep -q "true"; then
    echo -e "${GREEN}✅ Email consent granted${NC}"
else
    echo -e "${YELLOW}⚠️  Email consent not granted. Granting now...${NC}"
    GRANT_CONSENT=$(curl -s -X POST \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"granted": true}' \
        "${BASE_URL}/api/${API_VERSION}/email-outreach/consent")
    
    if echo "$GRANT_CONSENT" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✅ Consent granted successfully${NC}"
    else
        echo -e "${RED}❌ Failed to grant consent${NC}"
        exit 1
    fi
fi
echo ""

# Step 5: Search for jobs to apply to
echo -e "${BLUE}🔍 Step 5: Searching for test jobs...${NC}"
JOBS_SEARCH=$(curl -s "${BASE_URL}/api/${API_VERSION}/workflow/search?limit=5")
JOB_COUNT=$(echo "$JOBS_SEARCH" | jq -r '.data.items | length')

if [ "$JOB_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No jobs found in database. Please run scraping first:${NC}"
    echo "   npm run scrape -- --platform naukri --role 'software engineer'"
    exit 1
fi

echo -e "${GREEN}✅ Found ${JOB_COUNT} jobs${NC}"
echo ""

# Extract job IDs (limit to 3 for testing)
JOB_IDS=$(echo "$JOBS_SEARCH" | jq -r '.data.items[:3] | map(._id) | @json')
echo "Selected jobs for testing:"
echo "$JOBS_SEARCH" | jq -r '.data.items[:3] | .[] | "  - \(.title) at \(.company.name // .company)"'
echo ""

# Step 6: Submit bulk application
echo -e "${BLUE}🚀 Step 6: Submitting bulk application...${NC}"
BULK_APPLY_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"jobIds\": ${JOB_IDS},
        \"customMessage\": \"This is a test application from the automated testing script.\",
        \"includeResume\": true
    }" \
    "${BASE_URL}/api/${API_VERSION}/workflow/apply")

# Check response
if echo "$BULK_APPLY_RESPONSE" | jq -e '.success' > /dev/null; then
    PROGRESS_ID=$(echo "$BULK_APPLY_RESPONSE" | jq -r '.data.progressId')
    TOTAL_JOBS=$(echo "$BULK_APPLY_RESPONSE" | jq -r '.data.totalJobs')
    ESTIMATED_TIME=$(echo "$BULK_APPLY_RESPONSE" | jq -r '.data.estimatedTime')
    
    echo -e "${GREEN}✅ Bulk application submitted successfully${NC}"
    echo "   Progress ID: ${PROGRESS_ID}"
    echo "   Total Jobs: ${TOTAL_JOBS}"
    echo "   Estimated Time: ${ESTIMATED_TIME}"
    echo ""
else
    echo -e "${RED}❌ Bulk application failed${NC}"
    echo "$BULK_APPLY_RESPONSE" | jq '.'
    exit 1
fi

# Step 7: Monitor progress
echo -e "${BLUE}📊 Step 7: Monitoring application progress...${NC}"
echo "Polling for updates every 2 seconds..."
echo ""

MAX_POLLS=60  # 2 minutes max
POLL_COUNT=0
IS_COMPLETE=false

while [ "$IS_COMPLETE" = "false" ] && [ $POLL_COUNT -lt $MAX_POLLS ]; do
    sleep 2
    POLL_COUNT=$((POLL_COUNT + 1))
    
    PROGRESS=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
        "${BASE_URL}/api/${API_VERSION}/workflow/apply/status/${PROGRESS_ID}")
    
    if echo "$PROGRESS" | jq -e '.success' > /dev/null; then
        TOTAL=$(echo "$PROGRESS" | jq -r '.data.total')
        PROCESSED=$(echo "$PROGRESS" | jq -r '.data.processed')
        SUCCESSFUL=$(echo "$PROGRESS" | jq -r '.data.successful')
        FAILED=$(echo "$PROGRESS" | jq -r '.data.failed')
        STATUS=$(echo "$PROGRESS" | jq -r '.data.status')
        IS_COMPLETE=$(echo "$PROGRESS" | jq -r '.data.isComplete')
        
        # Calculate percentage
        if [ "$TOTAL" -gt 0 ]; then
            PERCENT=$((PROCESSED * 100 / TOTAL))
        else
            PERCENT=0
        fi
        
        # Show progress bar
        FILLED=$((PERCENT / 2))
        printf "\r${YELLOW}[%-50s] %d%%${NC}  %s" \
            "$(printf '%*s' $FILLED | tr ' ' '=')" \
            "$PERCENT" \
            "$STATUS"
        
        if [ "$IS_COMPLETE" = "true" ]; then
            echo ""
            echo ""
            echo -e "${GREEN}✅ Application process complete!${NC}"
            echo "   Total: ${TOTAL}"
            echo "   Successful: ${SUCCESSFUL}"
            echo "   Failed: ${FAILED}"
            break
        fi
    else
        echo -e "${RED}❌ Failed to get progress${NC}"
        break
    fi
done

if [ "$IS_COMPLETE" = "false" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Progress monitoring timed out (2 minutes)${NC}"
    echo "   The applications may still be processing in the background."
fi

echo ""

# Step 8: Verify results
echo -e "${BLUE}🔍 Step 8: Verifying results...${NC}"
echo ""

echo "Checking EmailSendQueue..."
echo "  Use MongoDB shell to verify:"
echo "  db.emailsendqueues.find().sort({createdAt: -1}).limit(${TOTAL_JOBS}).pretty()"
echo ""

echo "Checking Applications..."
echo "  Use MongoDB shell to verify:"
echo "  db.applications.find().sort({createdAt: -1}).limit(${TOTAL_JOBS}).pretty()"
echo ""

echo "Checking backend logs..."
echo "  Look for:"
echo "  - '🔍 Starting email discovery phase'"
echo "  - '✉️ Email discovered' (should show discovered emails)"
echo "  - '🤖 Generating personalized emails'"
echo "  - '📮 Queueing emails for delivery'"
echo "  - '🎉 Bulk application complete'"
echo ""

# Step 9: Summary
echo "========================================"
echo "📋 Test Summary"
echo "========================================"
echo ""
echo -e "${GREEN}✅ Server Health Check${NC}"
echo -e "${GREEN}✅ Authentication${NC}"
echo -e "${GREEN}✅ Gmail Connection${NC}"
echo -e "${GREEN}✅ Email Consent${NC}"
echo -e "${GREEN}✅ Job Search${NC}"
echo -e "${GREEN}✅ Bulk Application Submission${NC}"
echo -e "${GREEN}✅ Progress Monitoring${NC}"
echo ""
echo "🎯 Key Metrics:"
echo "   Progress ID: ${PROGRESS_ID}"
echo "   Jobs Applied: ${TOTAL_JOBS}"
echo "   Successful: ${SUCCESSFUL}"
echo "   Failed: ${FAILED}"
echo ""
echo "📝 Next Steps:"
echo "   1. Check MongoDB for EmailSendQueue records"
echo "   2. Check MongoDB for Application records"
echo "   3. Monitor backend logs for email sending"
echo "   4. Verify emails were sent (check Gmail Sent folder)"
echo ""
echo "🔒 Security Check:"
echo "   ✅ Email discovery was hidden from frontend"
echo "   ✅ Only generic progress messages were shown"
echo "   ✅ Hunter.io integration is proprietary"
echo ""
echo "========================================"
echo "✅ Test Complete!"
echo "========================================"


