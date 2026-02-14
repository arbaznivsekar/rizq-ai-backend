# 🚀 **EMAIL OUTREACH SETUP & TESTING GUIDE**

## **🔧 ENVIRONMENT SETUP**

### **Step 1: Configure Gmail OAuth Credentials**

You need to set up Google OAuth credentials for Gmail integration:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:8080/api/v1/email-outreach/oauth/google/callback`

5. **Add Environment Variables** to your `.env` file:
```bash
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your_google_client_id_here
GMAIL_CLIENT_SECRET=your_google_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:8080/api/v1/email-outreach/oauth/google/callback
```

### **Step 2: Verify Hunter.io API Key**

The Hunter.io API key is already configured in `env.example`:
```bash
HUNTER_API_KEY=7abc001f5c3f5a698c1a72781f4dcb217ba97c1a
```

### **Step 3: Start Required Services**

```bash
# Start MongoDB (if using Docker)
docker-compose up -d

# Start Backend
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm run dev

# Start Frontend (in another terminal)
cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend
npm run dev
```

## **🧪 TESTING THE EMAIL OUTREACH FEATURE**

### **Test 1: Basic Setup Verification**

1. **Open the application**: http://localhost:3000
2. **Register a new account** or login
3. **Search for jobs** (e.g., "Java Developer")
4. **Select 15+ jobs** by clicking checkboxes
5. **Verify the floating action bar** appears with "Email Outreach" button

### **Test 2: Gmail OAuth Flow**

1. **Click "Email Outreach" button**
2. **Expected behavior**:
   - If Gmail not connected: Popup opens with Gmail authorization
   - If Gmail connected: Email discovery process starts

3. **Complete Gmail authorization**:
   - Grant permissions in the popup
   - Popup should close automatically
   - Success message should appear

### **Test 3: Email Discovery Process**

1. **After Gmail connection**, the email discovery modal should appear
2. **Watch the progress**:
   - Shows companies being processed
   - Displays emails found
   - Shows Hunter.io credits used
   - Shows cache hits/misses

### **Test 4: Email Review & Sending**

1. **Email review modal opens** after discovery completes
2. **Review discovered emails** for each company
3. **Edit email content** if needed
4. **Click "Send Applications"**
5. **Check Gmail sent folder** for sent emails

## **🐛 TROUBLESHOOTING**

### **Issue: "Gmail Not Connected" Error**

**Symptoms**: Red error toast appears when clicking "Email Outreach"

**Causes & Solutions**:
1. **Gmail OAuth not configured**:
   - Set up Google OAuth credentials (see Step 1 above)
   - Add environment variables to `.env` file

2. **User not authenticated**:
   - Login to the application first
   - Check if JWT token is valid

3. **Gmail OAuth popup blocked**:
   - Allow popups for localhost:3000
   - Check browser popup blocker settings

### **Issue: Email Discovery Fails**

**Symptoms**: Progress modal shows errors or hangs

**Causes & Solutions**:
1. **Hunter.io API issues**:
   - Check if API key is valid
   - Verify API credits available
   - Check network connectivity

2. **No emails found**:
   - Company domains might not exist in Hunter.io
   - Check if company names are valid
   - Verify Hunter.io has data for those domains

### **Issue: Gmail Send Fails**

**Symptoms**: Applications fail to send

**Causes & Solutions**:
1. **Gmail API permissions**:
   - Re-authorize Gmail connection
   - Check Gmail API quotas
   - Verify email content is valid

2. **Token expiration**:
   - Gmail tokens expire after 1 hour
   - System should auto-refresh tokens
   - Re-authorize if refresh fails

## **🔍 DEBUGGING STEPS**

### **Check Backend Logs**
```bash
# In backend terminal, look for:
- Gmail OAuth flow logs
- Hunter.io API calls
- Email sending attempts
- Error messages
```

### **Check Frontend Console**
```bash
# In browser DevTools Console, look for:
- API call errors
- Authentication issues
- Network request failures
```

### **Test API Endpoints**
```bash
# Test Gmail OAuth start
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/email-outreach/oauth/google/start

# Test Gmail status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/auth/gmail/status

# Test email discovery
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_ids":["JOB_ID_1","JOB_ID_2"]}' \
  http://localhost:8080/api/v1/email/discover-emails
```

## **📊 EXPECTED RESULTS**

### **Successful Flow**
1. ✅ User selects 15+ jobs
2. ✅ Clicks "Email Outreach"
3. ✅ Gmail OAuth popup opens
4. ✅ User completes Gmail authorization
5. ✅ Email discovery finds company emails
6. ✅ Email review modal shows discovered emails
7. ✅ User sends applications successfully
8. ✅ Emails appear in Gmail sent folder

### **Performance Expectations**
- **Gmail OAuth**: 10-30 seconds for authorization
- **Email Discovery**: 5-15 seconds for 15 companies
- **Email Sending**: 1-2 seconds per email
- **Total Process**: 30-60 seconds for 15 applications

## **🎯 SUCCESS CRITERIA**

- [ ] User can select multiple jobs
- [ ] Gmail OAuth flow works seamlessly
- [ ] Email discovery finds company emails
- [ ] Email review interface is user-friendly
- [ ] Applications are sent successfully
- [ ] Error handling is clear and actionable
- [ ] Progress indicators work correctly
- [ ] No data loss during the process

## **🚨 CRITICAL ISSUES TO WATCH**

1. **Authentication failures** - User gets logged out
2. **Gmail OAuth loops** - Infinite redirects
3. **Email discovery timeouts** - Process hangs
4. **Missing error messages** - User doesn't know what went wrong
5. **Data loss** - Selected jobs are lost during process
6. **Performance issues** - Process takes too long

---

## **📝 QUICK TEST CHECKLIST**

- [ ] Backend server running on port 8080
- [ ] Frontend server running on port 3000
- [ ] MongoDB connected and running
- [ ] Gmail OAuth credentials configured
- [ ] Hunter.io API key set
- [ ] User registered and logged in
- [ ] 15+ jobs selected
- [ ] Gmail OAuth flow completed
- [ ] Email discovery successful
- [ ] Applications sent successfully

**Note**: This guide assumes all backend services are properly configured and running. If you encounter issues, check the troubleshooting section above.


