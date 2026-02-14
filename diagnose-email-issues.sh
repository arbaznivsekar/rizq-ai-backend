#!/bin/bash

###############################################################################
# Email System Diagnostic Script
# Checks all components of the email sending system
###############################################################################

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  EMAIL SYSTEM DIAGNOSTICS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Check 1: Redis Connection
echo -e "${YELLOW}[1/6] Checking Redis connection...${NC}"
if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is NOT running${NC}"
    echo "   Fix: Start Redis with: redis-server or docker-compose up redis"
    exit 1
fi

# Check 2: MongoDB Connection
echo -e "${YELLOW}[2/6] Checking MongoDB connection...${NC}"
if mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null | grep -q ok; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB is NOT running${NC}"
    echo "   Fix: Start MongoDB with: mongod or docker-compose up mongo"
fi

# Check 3: Email Queue Records
echo -e "${YELLOW}[3/6] Checking email queue records...${NC}"
QUEUE_COUNT=$(mongosh rizq_ai --quiet --eval "db.emailsendqueues.countDocuments()" 2>/dev/null)
echo "   Total emails in queue: $QUEUE_COUNT"

QUEUED_COUNT=$(mongosh rizq_ai --quiet --eval "db.emailsendqueues.countDocuments({status: 'queued'})" 2>/dev/null)
echo "   Status 'queued': $QUEUED_COUNT"

SENT_COUNT=$(mongosh rizq_ai --quiet --eval "db.emailsendqueues.countDocuments({status: 'sent'})" 2>/dev/null)
echo "   Status 'sent': $SENT_COUNT"

FAILED_COUNT=$(mongosh rizq_ai --quiet --eval "db.emailsendqueues.countDocuments({status: 'failed'})" 2>/dev/null)
echo "   Status 'failed': $FAILED_COUNT"

if [ "$QUEUED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $QUEUED_COUNT emails are queued but not sent${NC}"
    echo "   This might mean the worker is not processing them"
fi

# Check 4: Recent Queued Emails
echo -e "${YELLOW}[4/6] Checking recent queued emails...${NC}"
RECENT=$(mongosh rizq_ai --quiet --eval "db.emailsendqueues.find().sort({createdAt: -1}).limit(3).forEach(doc => print('  ID:', doc._id, '| Status:', doc.status, '| To:', doc.recipientEmail, '| Created:', doc.createdAt))" 2>/dev/null)
if [ -n "$RECENT" ]; then
    echo "$RECENT"
else
    echo "   No emails found in queue"
fi

# Check 5: Test Mode Configuration
echo -e "${YELLOW}[5/6] Checking test mode configuration...${NC}"
if grep -q "EMAIL_TEST_MODE=true" .env 2>/dev/null; then
    echo -e "${GREEN}✅ Test mode is ENABLED${NC}"
    TEST_EMAILS=$(grep "EMAIL_TEST_RECIPIENTS" .env | cut -d'=' -f2)
    echo "   Test emails: $TEST_EMAILS"
else
    echo -e "${YELLOW}⚠️  Test mode might not be enabled${NC}"
    echo "   Check your .env file for EMAIL_TEST_MODE=true"
fi

# Check 6: Environment Variables
echo -e "${YELLOW}[6/6] Checking required environment variables...${NC}"
if grep -q "GMAIL_CLIENT_ID" .env 2>/dev/null && grep -q "GMAIL_CLIENT_SECRET" .env 2>/dev/null; then
    echo -e "${GREEN}✅ Gmail OAuth configured${NC}"
else
    echo -e "${RED}❌ Gmail OAuth not configured${NC}"
    echo "   Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to .env"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  RECOMMENDATIONS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

if [ "$QUEUED_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}📧 $QUEUED_COUNT emails are stuck in queue${NC}"
    echo "   1. Check backend logs for worker errors"
    echo "   2. Verify Redis is running: redis-cli ping"
    echo "   3. Restart backend to restart worker"
    echo ""
fi

if [ "$FAILED_COUNT" -gt 0 ]; then
    echo -e "${RED}❌ $FAILED_COUNT emails failed to send${NC}"
    echo "   1. Check error field in database:"
    echo "      mongosh rizq_ai --eval \"db.emailsendqueues.find({status: 'failed'}).pretty()\""
    echo ""
fi

echo -e "${GREEN}Next steps:${NC}"
echo "   1. Check backend logs for detailed errors"
echo "   2. Verify Gmail OAuth tokens are valid"
echo "   3. Test with: curl -H 'Authorization: Bearer TOKEN' http://localhost:8080/api/v1/email-redirect/status"
echo ""



