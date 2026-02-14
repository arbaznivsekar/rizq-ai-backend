# 🚀 **EMAIL REDIRECT - QUICK START GUIDE**

## **What is This?**

The Email Redirect Service allows you to test the email outreach system by sending emails to temporary test addresses instead of actual recruiter emails during development.

---

## **⚡ Quick Setup (2 Minutes)**

### **Step 1: Configure Environment**

Edit your `.env` file:

```bash
# Add these two lines at the end of your .env file
EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENTS=poliveg869@limtu.com,fsm2s@2200freefonts.com,jobhoho@forexiz.com
```

### **Step 2: Restart Backend**

```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm run dev
```

### **Step 3: Verify Configuration**

Look for this message in the backend logs:

```
🧪 Email Redirect Service initialized in TEST MODE
  testEmailCount: 3
  ⚠️  All recruiter emails will be redirected to test addresses
```

✅ **That's it! You're ready to test.**

---

## **🧪 Testing the Feature**

### **Method 1: Automated Test Script**

```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
./test-email-redirect.sh
```

Follow the prompts and verify all tests pass.

### **Method 2: Manual Testing**

1. **Open Frontend**: http://localhost:3000
2. **Login** to your account
3. **Search for jobs** (e.g., "Software Engineer")
4. **Select 3-5 jobs** using checkboxes
5. **Click "Bulk Apply"**
6. **Complete Gmail OAuth** if prompted
7. **Wait for processing** (~30 seconds)

### **Verify Redirection**

Check backend logs for redirect messages:

```
🧪 TEST MODE: Email redirected
  originalRecipient: 'recruiter@techcorp.com'
  testRecipient: 'poliveg869@limtu.com'
```

---

## **📊 Check Status**

### **Via API**

```bash
# Get redirect status (replace $TOKEN with your JWT token)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/email-redirect/status
```

### **Via Browser**

1. Login to frontend
2. Open DevTools Console
3. Run:
```javascript
fetch('http://localhost:8080/api/v1/email-redirect/status', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(console.log)
```

---

## **📧 Test Email Addresses**

All emails will be distributed evenly across these addresses:

1. **poliveg869@limtu.com**
2. **fsm2s@2200freefonts.com**
3. **jobhoho@forexiz.com**

**Distribution**: Round-robin (each address gets roughly equal emails)

---

## **✅ Expected Behavior**

### **What Happens:**

1. You apply to jobs through the frontend
2. Hunter.io finds recruiter email: `recruiter@company.com`
3. Email Redirect Service intercepts
4. Email is redirected to: `poliveg869@limtu.com` (or one of the test emails)
5. Original recipient is saved in database metadata
6. Email is sent to test address via Gmail
7. You receive email in test inbox

### **What to Check:**

- ✅ Backend logs show redirect messages
- ✅ Database has redirect metadata
- ✅ Test inboxes receive emails
- ✅ Email content is correct
- ✅ No emails sent to actual recruiters

---

## **🔧 Troubleshooting**

### **Problem: Service not in test mode**

**Check:**
```bash
grep EMAIL_TEST_MODE .env
```

**Should show:**
```
EMAIL_TEST_MODE=true
```

**Fix:**
```bash
echo "EMAIL_TEST_MODE=true" >> .env
npm run dev  # Restart
```

---

### **Problem: No redirect logs**

**Check logs for:**
```
Email Redirect Service initialized
```

**If missing:**
1. Restart backend: `npm run dev`
2. Check `.env` file has configuration
3. Check for startup errors

---

### **Problem: Emails going to actual recruiters**

**This means test mode is NOT enabled.**

**Fix:**
1. Stop backend (Ctrl+C)
2. Edit `.env`: Set `EMAIL_TEST_MODE=true`
3. Restart: `npm run dev`
4. Verify logs show "TEST MODE ACTIVE"

---

## **🚨 Important Notes**

### **Production Safety**

- ✅ Test mode **CANNOT** be enabled in production
- ✅ Service will throw error if you try
- ✅ This protects against accidentally redirecting production emails

### **When to Use**

- ✅ Development environment
- ✅ Testing email functionality
- ✅ Verifying email content
- ✅ Testing bulk apply flow

### **When NOT to Use**

- ❌ Production environment
- ❌ Staging environment (if you want real behavior)
- ❌ When testing actual recruiter engagement

---

## **📖 API Reference**

### **Get Status**

```bash
GET /api/v1/email-redirect/status
Authorization: Bearer <token>
```

### **Get Recent Redirects**

```bash
GET /api/v1/email-redirect/recent?limit=20
Authorization: Bearer <token>
```

### **Get Distribution Stats**

```bash
GET /api/v1/email-redirect/distribution
Authorization: Bearer <token>
```

### **Reset Distribution**

```bash
POST /api/v1/email-redirect/reset
Authorization: Bearer <token>
```

---

## **📚 Full Documentation**

For comprehensive documentation, see:
- [`EMAIL_REDIRECT_FEATURE_COMPLETE.md`](./EMAIL_REDIRECT_FEATURE_COMPLETE.md)

---

## **🎯 Success Criteria**

You know it's working when:

- ✅ Backend logs show "TEST MODE ACTIVE"
- ✅ Redirect logs appear when applying to jobs
- ✅ Test email inboxes receive emails
- ✅ Database has redirect metadata
- ✅ Status API shows testMode: true

---

## **💡 Pro Tips**

1. **Check distribution stats** regularly to ensure even distribution
2. **Monitor test inboxes** for email delivery
3. **Use test script** for comprehensive verification
4. **Reset distribution** if you want to start fresh
5. **Check logs** for any errors or issues

---

## **🤝 Need Help?**

1. Read the [full documentation](./EMAIL_REDIRECT_FEATURE_COMPLETE.md)
2. Run the test script: `./test-email-redirect.sh`
3. Check the troubleshooting section above
4. Review backend logs for errors

---

**Happy Testing! 🎉**

*Built by RIZQ.AI Engineering Team with Silicon Valley Standards*





