#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8080/api/v1/auth"
TEST_EMAIL="testuser$(date +%s)@example.com"
TEST_PASSWORD="test123456"
TEST_NAME="Test User"

echo -e "${YELLOW}=== RIZQ AI Authentication Flow Test ===${NC}\n"

# Test 1: Register a new user
echo -e "${YELLOW}Test 1: Registering new user${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

echo "$REGISTER_RESPONSE" | jq .

if echo "$REGISTER_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Registration successful${NC}\n"
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
  USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
else
  echo -e "${RED}✗ Registration failed${NC}\n"
  exit 1
fi

# Test 2: Try to register with same email (should fail)
echo -e "${YELLOW}Test 2: Attempting to register duplicate user${NC}"
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

echo "$DUPLICATE_RESPONSE" | jq .

if echo "$DUPLICATE_RESPONSE" | jq -e '.error' | grep -q "already exists"; then
  echo -e "${GREEN}✓ Duplicate registration correctly blocked${NC}\n"
else
  echo -e "${RED}✗ Duplicate check failed${NC}\n"
fi

# Test 3: Login with correct credentials
echo -e "${YELLOW}Test 3: Login with correct credentials${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq .

if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Login successful${NC}\n"
  LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
else
  echo -e "${RED}✗ Login failed${NC}\n"
  exit 1
fi

# Test 4: Login with wrong password (should fail)
echo -e "${YELLOW}Test 4: Login with wrong password${NC}"
WRONG_PASSWORD_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")

echo "$WRONG_PASSWORD_RESPONSE" | jq .

if echo "$WRONG_PASSWORD_RESPONSE" | jq -e '.error' | grep -q "Invalid credentials"; then
  echo -e "${GREEN}✓ Wrong password correctly rejected${NC}\n"
else
  echo -e "${RED}✗ Wrong password check failed${NC}\n"
fi

# Test 5: Login with non-existent user (should fail)
echo -e "${YELLOW}Test 5: Login with non-existent user${NC}"
NONEXISTENT_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"nonexistent@example.com\",\"password\":\"test123456\"}")

echo "$NONEXISTENT_RESPONSE" | jq .

if echo "$NONEXISTENT_RESPONSE" | jq -e '.error' | grep -q "Invalid credentials"; then
  echo -e "${GREEN}✓ Non-existent user correctly rejected${NC}\n"
else
  echo -e "${RED}✗ Non-existent user check failed${NC}\n"
fi

# Test 6: Access protected endpoint with token
echo -e "${YELLOW}Test 6: Access protected /me endpoint${NC}"
ME_RESPONSE=$(curl -s -X GET "$API_URL/me" \
  -H "Authorization: Bearer $LOGIN_TOKEN")

echo "$ME_RESPONSE" | jq .

if echo "$ME_RESPONSE" | jq -e '.user' > /dev/null; then
  echo -e "${GREEN}✓ Protected endpoint access successful${NC}\n"
else
  echo -e "${RED}✗ Protected endpoint access failed${NC}\n"
fi

echo -e "${GREEN}=== All tests completed ===${NC}"
echo -e "User ID: $USER_ID"
echo -e "Email: $TEST_EMAIL"




