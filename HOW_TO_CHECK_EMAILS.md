# 📧 **HOW TO CHECK WHERE YOUR EMAILS ARE BEING SENT**

## **🎯 Quick Answer**

Emails are stored in **MongoDB database** in the `emailsendqueues` collection with complete redirect metadata showing:
- Where they were sent (test email)
- Where they were supposed to go (original recruiter email)
- Company name, job title, subject, and status

---

## **Method 1: Use the Script (Easiest)**

```bash
./check-email-status.sh
```

This script shows you:
- ✅ Current service status (test mode enabled?)
- ✅ Recent redirected emails with details
- ✅ Distribution statistics (how many emails per test address)

---

## **Method 2: Check Database Directly**

### **Using MongoDB Shell**

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use rizq_ai

# Check recent emails (last 10)
db.emailsendqueues.find().sort({ createdAt: -1 }).limit(10).pretty()

# Check redirected emails only
db.emailsendqueues.find({ "metadata.isRedirected": true }).sort({ createdAt: -1 }).limit(10).pretty()

# Count total emails
db.emailsendqueues.countDocuments()

# Count redirected emails
db.emailsendqueues.countDocuments({ "metadata.isRedirected": true })

# See distribution across test emails
db.emailsendqueues.aggregate([
  { $match: { "metadata.isRedirected": true } },
  { $group: { _id: "$recipientEmail", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

---

## **Method 3: Use API Endpoints**

### **Check Recent Redirected Emails**

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/email-redirect/recent?limit=10 | jq '.'
```

**Response shows:**
```json
{
  "success": true,
  "data": {
    "count": 10,
    "emails": [
      {
        "id": "...",
        "testRecipient": "poliveg869@limtu.com",        ← WHERE IT WAS SENT
        "originalRecipient": "recruiter@techcorp.com",  ← ORIGINAL DESTINATION
        "company": "TechCorp",
        "jobTitle": "Software Engineer",
        "subject": "Application: Software Engineer at TechCorp",
        "status": "sent",
        "queuedAt": "2025-11-03T10:30:00Z",
        "sentAt": "2025-11-03T10:31:00Z"
      }
    ]
  }
}
```

### **Check Service Status**

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/email-redirect/status | jq '.'
```

**Response shows:**
```json
{
  "success": true,
  "data": {
    "testMode": true,              ← Test mode enabled
    "environment": "development",
    "testEmailCount": 3,
    "redirectCount": 42,           ← Total emails redirected
    "currentDistributionIndex": 1,
    "testEmails": [
      "poliveg869@limtu.com",
      "fsm2s@2200freefonts.com",
      "jobhoho@forexiz.com"
    ],
    "message": "⚠️  TEST MODE ACTIVE - Emails redirected to test addresses"
  }
}
```

### **Check Distribution Stats**

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/email-redirect/distribution | jq '.'
```

**Response shows:**
```json
{
  "success": true,
  "data": {
    "distribution": [
      {
        "testEmail": "poliveg869@limtu.com",
        "totalEmails": 15,
        "sent": 14,
        "failed": 1,
        "queued": 0
      },
      {
        "testEmail": "fsm2s@2200freefonts.com",
        "totalEmails": 14,
        "sent": 13,
        "failed": 1,
        "queued": 0
      },
      {
        "testEmail": "jobhoho@forexiz.com",
        "totalEmails": 13,
        "sent": 12,
        "failed": 0,
        "queued": 1
      }
    ]
  }
}
```

---

## **Method 4: Check Backend Logs**

Look in your terminal where the backend is running:

```bash
# You should see logs like:
🧪 TEST MODE: Email redirected
  originalRecipient: 'recruiter@techcorp.com'
  testRecipient: 'poliveg869@limtu.com'
  distributionIndex: 0
  redirectCount: 42
  company: 'TechCorp'
  jobTitle: 'Software Engineer'
```

**Every email redirect is logged with full details!**

---

## **Method 5: Check Test Email Inboxes**

The emails actually arrive at your test email addresses:

1. **poliveg869@limtu.com**
2. **fsm2s@2200freefonts.com**
3. **jobhoho@forexiz.com**

Go to these inboxes and you'll see:
- ✅ Subject line with job details
- ✅ Personalized email content
- ✅ Sent from your Gmail account
- ✅ Full application content

---

## **📍 Database Schema Details**

Each email in the database looks like this:

```javascript
{
  _id: ObjectId("673a1b2c3d4e5f6g7h8i9j0k"),
  userId: ObjectId("user_id_here"),
  jobId: ObjectId("job_id_here"),
  recipientEmail: "poliveg869@limtu.com",    // ← WHERE EMAIL WAS SENT
  emailContent: {
    subject: "Application: Software Engineer at TechCorp",
    body: "Dear Hiring Team,\n\nI'm interested..."
  },
  status: "sent",                             // queued | sending | sent | failed
  metadata: {                                 // ← REDIRECT INFORMATION
    isRedirected: true,                       // Was this redirected?
    originalRecipient: "recruiter@techcorp.com",  // ← ORIGINAL DESTINATION
    redirectMode: "test",                     // test or production
    company: "TechCorp",                      // Company name
    jobTitle: "Software Engineer"            // Job title
  },
  scheduledAt: ISODate("2025-11-03T10:30:00Z"),
  createdAt: ISODate("2025-11-03T10:30:00Z"),
  sentAt: ISODate("2025-11-03T10:31:00Z")
}
```

---

## **🔍 What Each Field Means**

| Field | Description |
|-------|-------------|
| **recipientEmail** | Where the email was actually sent (test email) |
| **metadata.originalRecipient** | Where it was supposed to go (recruiter email) |
| **metadata.isRedirected** | `true` if redirected, `false` if not |
| **metadata.redirectMode** | `"test"` in test mode, `"production"` otherwise |
| **status** | `queued` → `sending` → `sent` or `failed` |
| **emailContent.subject** | Email subject line |
| **emailContent.body** | Email body content |

---

## **📊 Quick Queries**

### **Count All Emails**
```javascript
db.emailsendqueues.countDocuments()
```

### **Count Redirected Emails**
```javascript
db.emailsendqueues.countDocuments({ "metadata.isRedirected": true })
```

### **Count Sent Successfully**
```javascript
db.emailsendqueues.countDocuments({ status: "sent" })
```

### **See Failed Emails**
```javascript
db.emailsendqueues.find({ status: "failed" }).pretty()
```

### **Last 5 Emails**
```javascript
db.emailsendqueues.find().sort({ createdAt: -1 }).limit(5).pretty()
```

---

## **🎯 Quick Status Check**

### **In Browser Console**

If your frontend is running at http://localhost:3000:

```javascript
// Open browser DevTools Console
fetch('http://localhost:8080/api/v1/email-redirect/status', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

---

## **✅ Verification Checklist**

Check these to verify emails are working:

- [ ] Backend logs show redirect messages
- [ ] Database has records in `emailsendqueues` collection
- [ ] Metadata shows `isRedirected: true`
- [ ] `originalRecipient` has company domain
- [ ] `recipientEmail` is one of your test emails
- [ ] Status is `sent` (not `failed`)
- [ ] Test email inboxes have received emails
- [ ] API endpoints return data

---

## **📞 Still Can't See Emails?**

### **Common Issues:**

1. **No emails in database?**
   - Check if bulk apply was successful
   - Check backend logs for errors
   - Verify Gmail OAuth is connected

2. **Emails in database but not sent?**
   - Check `status` field (should be `sent`)
   - Check `sentAt` field (should have timestamp)
   - Look for error messages in logs

3. **Not redirected?**
   - Check `EMAIL_TEST_MODE=true` in `.env`
   - Restart backend after changing `.env`
   - Verify logs show "TEST MODE ACTIVE"

---

## **🎉 Summary**

You have **5 different ways** to check where emails are being sent:

1. ✅ **Script**: `./check-email-status.sh` (easiest)
2. ✅ **Database**: MongoDB queries (most detailed)
3. ✅ **API**: cURL requests (programmatic)
4. ✅ **Logs**: Backend terminal output (real-time)
5. ✅ **Inboxes**: Test email accounts (actual delivery)

**All methods show you the same information:**
- Where emails were sent (test addresses)
- Where they were supposed to go (recruiter emails)
- Complete audit trail for compliance

**Happy Checking! 🎯**




