# 📧 **QUICK GUIDE: WHERE TO SEE YOUR EMAILS**

## **5 WAYS TO CHECK**

### **Method 1: Quick Script (Easiest)**

```bash
./check-email-status.sh
```

Enter your JWT token when prompted. Shows:
- Service status (test mode enabled?)
- Recent redirected emails
- Distribution statistics

---

### **Method 2: Database (Most Detailed)**

```bash
# Connect to MongoDB
mongosh

# Switch to database
use rizq_ai

# See last 10 emails
db.emailsendqueues.find().sort({ createdAt: -1 }).limit(10).pretty()
```

Shows:
- **recipientEmail** = where it was sent (test email)
- **metadata.originalRecipient** = original destination (recruiter email)
- **status** = sent/failed/queued
- **subject**, **company**, **jobTitle**

---

### **Method 3: API Endpoints**

```bash
# Replace YOUR_TOKEN with your JWT token

# Recent emails
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/email-redirect/recent?limit=10 | jq '.'

# Service status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/email-redirect/status | jq '.'
```

---

### **Method 4: Backend Logs**

Look in terminal where `npm run dev` is running:

```
🧪 TEST MODE: Email redirected
  originalRecipient: 'recruiter@techcorp.com'
  testRecipient: 'poliveg869@limtu.com'
  company: 'TechCorp'
```

---

### **Method 5: Test Email Inboxes**

Emails actually arrive at:
- poliveg869@limtu.com
- fsm2s@2200freefonts.com
- jobhoho@forexiz.com

Check these inboxes!

---

## **WHAT YOU'LL SEE**

Each email record shows:

```javascript
{
  recipientEmail: "poliveg869@limtu.com",        // ← SENT HERE
  metadata: {
    isRedirected: true,
    originalRecipient: "recruiter@techcorp.com",  // ← ORIGINALLY GOING HERE
    company: "TechCorp",
    jobTitle: "Software Engineer"
  },
  status: "sent",                                 // ← STATUS
  emailContent: {
    subject: "Application: Software Engineer at TechCorp"
  }
}
```

---

**That's it! Choose any method above. 🎯**




