# 🧪 **EMAIL OUTREACH TESTING GUIDE**

## **🚀 QUICK START TESTING**

### **Step 1: Start the Backend Server**
```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm run dev
```

### **Step 2: Start the Frontend Server**
```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend
npm run dev
```

### **Step 3: Open the Application**
- Navigate to: http://localhost:3000
- Register a new account or login with existing credentials

## **🔧 TESTING THE EMAIL OUTREACH FEATURE**

### **Test 1: Basic Job Selection**
1. **Search for jobs** using the search bar (e.g., "Java Developer")
2. **Select 15+ jobs** by clicking the checkboxes
3. **Verify the floating action bar** appears at the bottom
4. **Check the button states**:
   - Orange bar with "Select X more to apply" (if < 15 jobs)
   - Blue bar with "Apply to Selected Jobs" (if ≥ 15 jobs)

### **Test 2: Gmail Connection Flow**
1. **Click "Email Outreach" button**
2. **Expected behavior**:
   - If Gmail not connected: Red error toast "Gmail Not Connected"
   - If Gmail connected: Email discovery progress modal appears

### **Test 3: Gmail OAuth Connection**
1. **Click "Email Outreach" button** (when Gmail not connected)
2. **Look for OAuth redirect** or connection prompt
3. **Complete Gmail authorization** in popup/redirect
4. **Verify connection success** message

### **Test 4: Email Discovery Process**
1. **With Gmail connected**, click "Email Outreach"
2. **Watch the progress modal**:
   - Shows "Email Discovery" with progress bar
   - Displays metrics: Companies processed, emails found, credits used
   - Shows cache hits/misses
3. **Wait for completion** (should take 5-15 seconds)

### **Test 5: Email Review Modal**
1. **After email discovery completes**
2. **Email review modal should open** showing:
   - List of selected jobs
   - Discovered emails for each company
   - Editable subject and body fields
   - "Send Applications" button

### **Test 6: Send Applications**
1. **Review and edit email content** if needed
2. **Click "Send Applications"**
3. **Watch for success/error messages**
4. **Check Gmail sent folder** for sent emails

## **🐛 TROUBLESHOOTING**

### **Issue: "Gmail Not Connected" Error**
**Cause**: User hasn't completed Gmail OAuth flow
**Solution**: 
1. Click "Email Outreach" button
2. Complete Gmail authorization
3. Verify connection in user profile

### **Issue: Email Discovery Fails**
**Cause**: Hunter.io API issues or rate limits
**Solution**:
1. Check Hunter.io API key in environment variables
2. Verify API credits available
3. Check network connectivity

### **Issue: No Emails Found**
**Cause**: Company domains not found in Hunter.io
**Solution**:
1. Check if company domains are valid
2. Verify Hunter.io has data for those domains
3. Check API response for error messages

### **Issue: Gmail Send Fails**
**Cause**: Gmail API permissions or token issues
**Solution**:
1. Re-authorize Gmail connection
2. Check Gmail API quotas
3. Verify email content is valid

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

### **Test API Endpoints Directly**
```bash
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
3. ✅ Gmail OAuth completes successfully
4. ✅ Email discovery finds company emails
5. ✅ Email review modal shows discovered emails
6. ✅ User sends applications successfully
7. ✅ Emails appear in Gmail sent folder

### **Performance Expectations**
- **Email Discovery**: 5-15 seconds for 15 companies
- **Gmail OAuth**: 10-30 seconds for authorization
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

**Note**: This testing guide assumes all backend services (MongoDB, Redis, Hunter.io API, Gmail API) are properly configured and running.


