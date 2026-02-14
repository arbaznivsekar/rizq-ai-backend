#!/bin/bash

# Job Recommendations System Test Script
# Tests all recommendation endpoints

echo "🎯 Testing Job Recommendations System"
echo "======================================"
echo ""

# Configuration
API_BASE="http://localhost:8080/api/v1"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1️⃣  Checking backend server..."
if curl -s "$API_BASE/ops/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend server is running"
else
    echo -e "${RED}✗${NC} Backend server is not running"
    echo "Please start the backend server: npm run dev"
    exit 1
fi

# Get authentication token
echo ""
echo "2️⃣  Authentication"
echo "Please login first to get a token"
echo "Visit: http://localhost:3000/auth/login"
echo ""
read -p "Enter your JWT token (from browser cookies): " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗${NC} No token provided"
    exit 1
fi

echo -e "${GREEN}✓${NC} Token received"

# Test 1: Get Quick Recommendations
echo ""
echo "3️⃣  Testing Quick Recommendations (Dashboard)"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    --cookie "token=$TOKEN" \
    "$API_BASE/recommendations/quick")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Quick recommendations successful (HTTP 200)"
    echo "$BODY" | jq -r '.data.total' | xargs -I {} echo "   Found {} recommendations"
    echo ""
    echo "Sample recommendation:"
    echo "$BODY" | jq '.data.jobs[0]' 2>/dev/null || echo "   No recommendations found"
else
    echo -e "${RED}✗${NC} Quick recommendations failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

# Test 2: Get Full Recommendations
echo ""
echo "4️⃣  Testing Full Recommendations"
echo "--------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    --cookie "token=$TOKEN" \
    "$API_BASE/recommendations?limit=20&minScore=30&diversify=true")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Full recommendations successful (HTTP 200)"
    echo "$BODY" | jq -r '.data.total' | xargs -I {} echo "   Found {} recommendations"
    echo ""
    echo "Top 3 match scores:"
    echo "$BODY" | jq -r '.data.jobs[0:3] | .[] | "   \(.matchScore)% - \(.title) at \(.company)"' 2>/dev/null || echo "   No recommendations"
else
    echo -e "${RED}✗${NC} Full recommendations failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

# Test 3: Refresh Recommendations
echo ""
echo "5️⃣  Testing Refresh Recommendations"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    --cookie "token=$TOKEN" \
    "$API_BASE/recommendations/refresh")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Refresh recommendations successful (HTTP 200)"
    echo "$BODY" | jq -r '.data.message' 2>/dev/null || echo "   Refreshed successfully"
else
    echo -e "${RED}✗${NC} Refresh recommendations failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

# Test 4: Check Profile Completeness
echo ""
echo "6️⃣  Checking Profile Completeness"
echo "--------------------------------"
RESPONSE=$(curl -s --cookie "token=$TOKEN" "$API_BASE/profile")

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    SKILLS_COUNT=$(echo "$RESPONSE" | jq -r '.profile.skills | length' 2>/dev/null || echo "0")
    EXP_COUNT=$(echo "$RESPONSE" | jq -r '.profile.experience | length' 2>/dev/null || echo "0")
    
    echo "   Skills: $SKILLS_COUNT"
    echo "   Experience: $EXP_COUNT"
    
    COMPLETENESS=0
    [ "$SKILLS_COUNT" -gt 0 ] && COMPLETENESS=$((COMPLETENESS + 30))
    [ "$EXP_COUNT" -gt 0 ] && COMPLETENESS=$((COMPLETENESS + 25))
    
    if [ $COMPLETENESS -lt 30 ]; then
        echo -e "${YELLOW}⚠${NC}  Profile completeness: ~$COMPLETENESS% (Low)"
        echo "   ${YELLOW}Tip:${NC} Add more skills and experience for better recommendations"
    elif [ $COMPLETENESS -lt 60 ]; then
        echo -e "${GREEN}✓${NC} Profile completeness: ~$COMPLETENESS% (Good)"
    else
        echo -e "${GREEN}✓${NC} Profile completeness: ~$COMPLETENESS% (Excellent)"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Could not check profile"
fi

# Summary
echo ""
echo "======================================"
echo "🎯 Test Summary"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/dashboard"
echo "2. Scroll to 'AI-Powered Recommendations' section"
echo "3. Review match scores and reasons"
echo "4. Click 'Refresh' to recalculate"
echo "5. Click on job cards to view details"
echo ""
echo "To improve recommendations:"
echo "- Add more skills to your profile"
echo "- Add detailed work experience"
echo "- Set location and salary preferences"
echo "- Add projects and education"
echo ""
echo "✅ Testing complete!"
