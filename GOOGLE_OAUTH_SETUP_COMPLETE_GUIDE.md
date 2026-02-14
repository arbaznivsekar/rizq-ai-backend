# Complete Google OAuth Setup Guide

**Issue:** Getting "Error 404: invalid_client" when trying to login with Gmail

**Solution:** You need to create OAuth 2.0 credentials in Google Cloud Console

---

## Step 1: Create a Google Cloud Project

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it "Rizq AI" (or any name you prefer)
4. Click "Create"

---

## Step 2: Enable Gmail API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and click "Enable"

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required fields:
   - **App name:** Rizq AI
   - **User support email:** Your email
   - **Developer contact email:** Your email
5. Click "Save and Continue"
6. **Scopes:** Click "Add or Remove Scopes"
   - Search and add: `https://www.googleapis.com/auth/gmail.send`
   - Search and add: `https://www.googleapis.com/auth/userinfo.email`
   - Search and add: `https://www.googleapis.com/auth/userinfo.profile`
7. Click "Update" → "Save and Continue"
8. **Test Users:** Add your Gmail address
9. Click "Save and Continue"
10. Review and click "Back to Dashboard"

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "**+ CREATE CREDENTIALS**" → "OAuth client ID"
3. Application type: **Web application**
4. Name: "Rizq AI Web Client"
5. **Authorized JavaScript origins:**
   - Add: `http://localhost:3000` (your frontend)
   - Add: `http://localhost:8080` (your backend)
6. **Authorized redirect URIs:**
   - Add: `http://localhost:8080/api/v1/auth/google/callback`
7. Click "Create"
8. **IMPORTANT:** Copy the Client ID and Client Secret

---

## Step 5: Update Your .env File

1. Open `/home/arbaz/projects/rizq-ai/rizq-ai-backend/.env`
2. Replace the values with your newly created credentials:

```env
GMAIL_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET_HERE
GMAIL_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback
```

3. Save the file

---

## Step 6: Restart Your Backend Server

```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm run build
npm start
```

---

## Step 7: Test the OAuth Flow

1. Open your frontend: `http://localhost:3000/auth/login`
2. Click "Continue with Gmail"
3. You should be redirected to Google's consent screen
4. Grant permissions
5. You'll be redirected back to `/dashboard`

---

## Common Issues & Solutions

### Issue: "Error 403: access_denied"
**Solution:** Make sure you added your email as a Test User in the OAuth consent screen

### Issue: "Error 400: redirect_uri_mismatch"
**Solution:** Double-check that `http://localhost:8080/api/v1/auth/google/callback` is exactly listed in Authorized redirect URIs

### Issue: Still getting "invalid_client"
**Solution:** 
- Make sure you copied the ENTIRE Client ID (including `.apps.googleusercontent.com`)
- Restart your backend server after updating .env
- Clear your browser cache and cookies

---

## For Production Deployment

When you deploy to production, you'll need to:

1. Update OAuth redirect URIs in Google Cloud Console:
   - Add: `https://yourdomain.com/api/v1/auth/google/callback`

2. Update your `.env` file:
   ```env
   GMAIL_REDIRECT_URI=https://yourdomain.com/api/v1/auth/google/callback
   CORS_ORIGIN=https://yourdomain.com
   ```

3. Publish your OAuth app (remove "Testing" status in OAuth consent screen)

---

## Screenshots Location

**Google Cloud Console:** https://console.cloud.google.com/
- Left menu → APIs & Services → Credentials

---

## Need Help?

If you're still having issues:
1. Check that Gmail API is enabled
2. Verify your test user email is added
3. Make sure all redirect URIs are EXACTLY correct
4. Try creating new credentials and updating .env
5. Clear browser cache and restart backend

---

**Current Backend Status:**
- ✅ Server running on `http://localhost:8080`
- ✅ Using Client ID: `367212019275-mamei4cgqfbttnjvhpno27l8me6lvoh4`
- ⚠️ This Client ID needs to be created in Google Cloud Console





































































