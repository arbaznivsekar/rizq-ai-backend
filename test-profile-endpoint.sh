#!/bin/bash
# Test Profile Endpoint

echo "🔍 Testing Profile Endpoint Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running!${NC}"
    echo -e "${YELLOW}   Fix: cd rizq-ai-backend && npm run dev${NC}"
    exit 1
fi

# Check if profile route file exists
echo ""
echo "2. Checking if profile routes file exists..."
if [ -f "src/routes/profile.routes.ts" ]; then
    echo -e "${GREEN}✅ Profile routes file exists${NC}"
else
    echo -e "${RED}❌ Profile routes file missing!${NC}"
    exit 1
fi

# Check if profile route is registered
echo ""
echo "3. Checking if profile route is registered..."
if grep -q "profile" src/routes/index.ts; then
    echo -e "${GREEN}✅ Profile route is registered${NC}"
else
    echo -e "${RED}❌ Profile route is NOT registered!${NC}"
    exit 1
fi

# Check if built files exist
echo ""
echo "4. Checking if TypeScript is compiled..."
if [ -f "dist/src/routes/profile.routes.js" ]; then
    echo -e "${GREEN}✅ Profile routes compiled${NC}"
else
    echo -e "${YELLOW}⚠️  Profile routes not compiled${NC}"
    echo -e "${YELLOW}   Fix: npm run build${NC}"
fi

# Test profile endpoint (will fail without auth, but 401 is better than 404)
echo ""
echo "5. Testing profile endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/profile)

if [ "$HTTP_CODE" == "404" ]; then
    echo -e "${RED}❌ Profile endpoint returns 404 - NOT FOUND!${NC}"
    echo -e "${YELLOW}   Fix: Restart backend server (Ctrl+C then npm run dev)${NC}"
    exit 1
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✅ Profile endpoint exists (401 = needs authentication)${NC}"
else
    echo -e "${GREEN}✅ Profile endpoint responds (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure backend is running: npm run dev"
echo "2. Login to frontend: http://localhost:3000/auth/login"
echo "3. Visit profile page: http://localhost:3000/profile"
echo ""
