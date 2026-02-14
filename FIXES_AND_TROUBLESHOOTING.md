# 🔧 **FIXES APPLIED & TROUBLESHOOTING GUIDE**

## **✅ Issue 1: Application Schema Error (FIXED)**

### **Problem:**
```
Application validation failed: events.0: Cast to [string] failed
```

### **Root Cause:**
The `events` array schema definition was too loose. Mongoose couldn't properly validate nested array objects.

### **Fix Applied:**
Changed from:
```typescript
events: [{ at: Date, type: String, message: String }]
```

To:
```typescript
const eventSchema = new Schema({
  at: { type: Date, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true }
}, { _id: false });

events: { type: [eventSchema], default: [] }
```

**Status:** ✅ **FIXED** - Restart backend for changes to take effect

---

## **❌ Issue 2: Emails Not Arriving in Test Inbox**

### **Possible Causes:**

#### **1. Worker Not Processing Queue**
**Check:** Are emails stuck in "queued" status?

**Diagnose:**
```bash
./diagnose-email-issues.sh
```

**Fix if needed:**
- Ensure Redis is running: `redis-cli ping`
- Restart backend: `npm run dev`
- Check backend logs for worker errors

---

#### **2. Redis Not Running**
**Check:**
```bash
redis-cli ping
```

**If not running:**
```bash
# Start Redis
redis-server
# OR if using Docker
docker-compose up redis -d
```

---

#### **3. Gmail OAuth Not Connected**
**Check:**
- Verify user has completed Gmail OAuth flow
- Check if `gmailRefreshToken` exists in User model

**Fix:**
- User needs to reconnect Gmail via frontend
- Verify Gmail OAuth credentials in `.env`

---

#### **4. Emails Queued but Worker Errors**
**Check logs for:**
```
❌ Email send failed
Error: ...
```

**Common errors:**
- `GMAIL_NOT_CONNECTED` - User needs to reconnect Gmail
- `MISSING_EMAIL` - User email not found
- Token refresh failures

**Fix:**
- Re-authenticate Gmail OAuth
- Check Gmail API quotas
- Verify Gmail credentials

---

#### **5. Test Mode Not Enabled**
**Check:**
```bash
grep EMAIL_TEST_MODE .env
```

**Should show:**
```
EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENTS=poliveg869@limtu.com,fsm2s@2200freefonts.com,jobhoho@forexiz.com
```

**If not set:**
```bash
echo "EMAIL_TEST_MODE=true" >> .env
echo "EMAIL_TEST_RECIPIENTS=poliveg869@limtu.com,fsm2s@2200freefonts.com,jobhoho@forexiz.com" >> .env
npm run dev  # Restart
```

---

## **🔍 Diagnostic Steps**

### **Step 1: Run Diagnostic Script**
```bash
./diagnose-email-issues.sh
```

This checks:
- ✅ Redis connection
- ✅ MongoDB connection
- ✅ Email queue status
- ✅ Test mode configuration
- ✅ Gmail OAuth setup

---

### **Step 2: Check Email Queue Status**

```bash
mongosh rizq_ai
```

```javascript
// Check queue status
db.emailsendqueues.find().sort({createdAt: -1}).limit(5).pretty()

// Count by status
db.emailsendqueues.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Check for errors
db.emailsendqueues.find({status: "failed"}).pretty()

// Check if emails are redirected
db.emailsendqueues.find({"metadata.isRedirected": true}).pretty()
```

---

### **Step 3: Check Backend Logs**

Look for:
- ✅ `🧪 TEST MODE: Email redirected` - Email was redirected
- ✅ `📩 Email queued` - Email added to queue
- ✅ `✅ Email sent successfully` - Email sent via Gmail
- ❌ `❌ Email send failed` - Error occurred

**Check worker logs:**
- Look for BullMQ worker processing messages
- Check for Gmail API errors
- Look for token refresh errors

---

### **Step 4: Verify Test Email Inboxes**

Check these inboxes:
1. **poliveg869@limtu.com**
2. **fsm2s@2200freefonts.com**
3. **jobhoho@forexiz.com**

**What to check:**
- Inbox folder (not spam)
- Sent folder (if you have access)
- Date/time stamps
- Subject lines match job applications

---

### **Step 5: Check Gmail OAuth Status**

```bash
# Using API (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/auth/gmail/status | jq '.'
```

**Expected response:**
```json
{
  "connected": true,
  "email": "your-email@gmail.com",
  "lastConnected": "2025-11-03T10:00:00Z"
}
```

If `connected: false`, user needs to reconnect Gmail.

---

## **🚀 Quick Fix Checklist**

Run through these in order:

- [ ] **Restart backend** (to apply schema fix)
  ```bash
  # Stop (Ctrl+C)
  npm run dev
  ```

- [ ] **Run diagnostic script**
  ```bash
  ./diagnose-email-issues.sh
  ```

- [ ] **Check Redis is running**
  ```bash
  redis-cli ping
  # Should return: PONG
  ```

- [ ] **Check test mode is enabled**
  ```bash
  grep EMAIL_TEST_MODE .env
  # Should show: EMAIL_TEST_MODE=true
  ```

- [ ] **Check queue status**
  ```bash
  mongosh rizq_ai --eval "db.emailsendqueues.countDocuments({status: 'queued'})"
  # If > 0, emails are waiting to be processed
  ```

- [ ] **Check for failed emails**
  ```bash
  mongosh rizq_ai --eval "db.emailsendqueues.find({status: 'failed'}).pretty()"
  # Check error messages
  ```

- [ ] **Verify Gmail OAuth**
  - Frontend: Check if Gmail is connected
  - Re-authenticate if needed

- [ ] **Test email sending again**
  - Apply to a few jobs
  - Watch backend logs
  - Check test inboxes after 1-2 minutes

---

## **📊 Expected Flow**

When everything works correctly:

1. **User applies to jobs** → Frontend sends request
2. **Emails discovered** → Hunter.io finds recruiter emails
3. **Emails redirected** → Service redirects to test emails
4. **Queue created** → EmailSendQueue record created
5. **BullMQ job added** → Redis queue receives job
6. **Worker processes** → Background worker picks up job
7. **Gmail API called** → Email sent via Gmail
8. **Status updated** → Queue status → "sent"
9. **Email arrives** → Test inbox receives email ✅

---

## **🐛 Common Error Messages**

### **Error: "GMAIL_NOT_CONNECTED"**
**Fix:** User needs to complete Gmail OAuth flow

### **Error: "MISSING_EMAIL"**
**Fix:** User record is missing email address

### **Error: "Redis connection failed"**
**Fix:** Start Redis: `redis-server`

### **Error: "Token refresh failed"**
**Fix:** Re-authenticate Gmail OAuth

### **Error: "Rate limit exceeded"**
**Fix:** Wait a few minutes, then retry

---

## **📞 Still Having Issues?**

### **Collect Debug Information:**

```bash
# 1. Run diagnostic
./diagnose-email-issues.sh > debug-info.txt

# 2. Check queue
mongosh rizq_ai --eval "db.emailsendqueues.find().sort({createdAt: -1}).limit(5).pretty()" >> debug-info.txt

# 3. Check logs (from backend terminal)
# Copy last 50 lines of backend logs

# 4. Check environment
grep -E "EMAIL_TEST|GMAIL|REDIS" .env >> debug-info.txt
```

**Share:**
- `debug-info.txt` file
- Backend logs
- Steps to reproduce

---

## **✅ Success Indicators**

You'll know it's working when:

- ✅ Diagnostic script shows all green checks
- ✅ Backend logs show "Email sent successfully"
- ✅ Database shows `status: "sent"`
- ✅ Test inboxes receive emails
- ✅ Email content matches job applications
- ✅ Metadata shows redirect information

---

**Good luck! 🎯**



