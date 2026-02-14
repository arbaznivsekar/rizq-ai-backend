#!/bin/bash

# Simple test script to debug recommendations

echo "🔍 Testing Recommendations Endpoint"
echo "===================================="
echo ""

API_BASE="http://localhost:8080/api/v1"

echo "1. Checking if backend is running..."
if curl -s "$API_BASE/ops/health" > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it with: npm run dev"
    exit 1
fi

echo ""
echo "2. Testing recommendations endpoint (unauthenticated)..."
echo "   This should fail with 401:"
curl -s "$API_BASE/recommendations/quick" | jq '.' || echo "   Response received"

echo ""
echo "3. To test with authentication:"
echo "   - Open browser DevTools"
echo "   - Go to Application/Storage > Cookies"
echo "   - Copy the 'token' cookie value"
echo "   - Run: curl -s '$API_BASE/recommendations/quick' --cookie 'token=YOUR_TOKEN' | jq '.'"
echo ""
echo "4. Check backend logs for:"
echo "   - 'Searching jobs with params'"
echo "   - 'Generated X recommendations'"
echo "   - Any errors"
