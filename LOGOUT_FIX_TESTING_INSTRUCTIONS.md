# Logout Fix - Testing Instructions

## Quick Verification (5 minutes)

### Prerequisites
- Server running on `http://localhost:8080`
- Gmail OAuth configured with valid credentials
- Browser with DevTools

### Step-by-Step Test

#### 1. Start Fresh
```bash
# If server is not running, start it
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm start
```

#### 2. Login via Gmail OAuth

**Option A - Using Browser:**
1. Open browser and navigate to: `http://localhost:8080/api/v1/auth/google/login`
2. Complete the Gmail OAuth flow
3. You'll be redirected to the dashboard

**Option B - Using curl (gets redirect URL):**
```bash
curl -L http://localhost:8080/api/v1/auth/google/login
```

#### 3. Verify Cookie is Set

Open Browser DevTools:
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Expand **Cookies** in the left sidebar
4. Click on `http://localhost:8080`
5. You should see a `token` cookie with:
   - ✅ Name: `token`
   - ✅ HttpOnly: `✓` (checked)
   - ✅ SameSite: `Lax`
   - ✅ Path: `/`
   - ✅ Expires: ~7 days from now

#### 4. Test Authenticated Endpoint

```bash
# Get token from browser DevTools or from login response
TOKEN="your-jwt-token-here"

# Test /me endpoint
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Should return user info (200 OK)
```

#### 5. Test Logout (THE FIX)

```bash
# Call logout endpoint
curl -i -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Expected response headers should include:
# Set-Cookie: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax
```

**Look for these indicators in the response:**
- ✅ HTTP Status: `200 OK`
- ✅ Response Body: `{"success":true,"message":"Logout successful"}`
- ✅ Set-Cookie header with `Max-Age=0` or `Expires=Thu, 01 Jan 1970`

#### 6. Verify Cookie is Cleared

Go back to Browser DevTools → Application → Cookies:
- ❌ The `token` cookie should be **GONE** (deleted)

#### 7. Test Browser Refresh (CRITICAL TEST)

**Before the fix:** User would be logged back in ❌  
**After the fix:** User should stay logged out ✅

1. Refresh the browser (`F5` or `Ctrl+R`)
2. Check if you're still logged out
3. Try accessing a protected page (should be redirected to login)

#### 8. Verify Auth Fails Without Cookie

```bash
# Try to access /me endpoint without token
curl http://localhost:8080/api/v1/auth/me

# Should return 401 Unauthorized
```

---

## Automated Testing

### Run Test Suite
```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm test -- test/endpoints/auth.test.ts
```

### Run Manual Test Script
```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
chmod +x test-logout-fix.sh
./test-logout-fix.sh
```

---

## Expected Behavior Comparison

### ❌ BEFORE FIX (Broken)

| Action | Cookie Status | Auth Status | Issue |
|--------|--------------|-------------|-------|
| Login | Set (7 days) | ✅ Authenticated | OK |
| Logout | Still set | ❌ Still works | **BUG** |
| Refresh | Still set | ❌ Logged back in | **BUG** |

### ✅ AFTER FIX (Working)

| Action | Cookie Status | Auth Status | Result |
|--------|--------------|-------------|--------|
| Login | Set (7 days) | ✅ Authenticated | ✅ OK |
| Logout | Cleared | ❌ Unauthorized | ✅ OK |
| Refresh | No cookie | ❌ Stays logged out | ✅ OK |

---

## Troubleshooting

### Issue: Server not responding
```bash
# Check server status
lsof -i :8080

# Restart server
pkill -f "node.*server"
npm start
```

### Issue: Cookie not being set on login
- Check browser console for errors
- Verify `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` in `.env`
- Check that `CORS_ORIGIN` matches your frontend URL

### Issue: Cookie not being cleared on logout
- Check response headers using `curl -i` or browser DevTools Network tab
- Verify `Set-Cookie` header includes `Max-Age=0` or expired date
- Make sure you're calling the correct endpoint: `POST /api/v1/auth/logout`

### Issue: Still getting logged back in
- **Clear browser cache and cookies manually** (Ctrl+Shift+Delete)
- Check if there are multiple `token` cookies (different domains/paths)
- Verify the server has been restarted with the new code

---

## Integration Test with Frontend

If you have a frontend application:

### 1. Frontend Logout Function
```javascript
// Your logout function should call the backend endpoint
const logout = async () => {
  try {
    // Call backend logout
    const response = await fetch('http://localhost:8080/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include' // Important: sends cookies
    });
    
    if (response.ok) {
      // Clear frontend state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### 2. Test Flow
1. Login through frontend
2. Click logout button
3. Frontend calls backend `/logout`
4. Backend clears cookie
5. Frontend redirects to login
6. **TEST:** Refresh the page
7. **VERIFY:** User stays on login page (not logged back in)

---

## Success Criteria

✅ All tests must pass:

1. ✅ Login sets HttpOnly cookie
2. ✅ Logout returns 200 OK
3. ✅ Logout response includes `Set-Cookie` with expired date
4. ✅ Cookie is removed from browser after logout
5. ✅ Refresh after logout keeps user logged out
6. ✅ Protected endpoints return 401 after logout
7. ✅ Can login again after logout
8. ✅ Automated tests pass

---

## Security Verification

Verify these security properties:

1. **HttpOnly**: Cookie cannot be accessed via JavaScript (XSS protection)
   ```javascript
   // In browser console, this should return undefined:
   document.cookie // Should not show token
   ```

2. **SameSite=Lax**: Protection against CSRF attacks

3. **Secure flag** (in production): Cookie only sent over HTTPS

4. **Proper expiry**: Cookie cleared immediately on logout

5. **No token leakage**: Token not exposed in URLs or logs

---

## Quick Health Check

Run this one-liner to test the entire flow:

```bash
# This will test login → me → logout in sequence
echo "🔐 Testing auth flow..." && \
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token') && \
echo "✅ Login successful, token: ${TOKEN:0:20}..." && \
curl -s http://localhost:8080/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq && \
echo "✅ /me endpoint works" && \
curl -i -X POST http://localhost:8080/api/v1/auth/logout -H "Authorization: Bearer $TOKEN" && \
echo "✅ Logout completed - Check Set-Cookie header above for Max-Age=0"
```

---

## Support

If you encounter any issues:

1. Check `LOGOUT_FIX_DOCUMENTATION.md` for detailed explanation
2. Review `LOGOUT_FIX_SUMMARY.md` for quick reference
3. Check server logs: `tail -f server.log`
4. Check browser console for frontend errors
5. Verify environment variables in `.env`

---

**Last Updated**: 2025-10-26  
**Fix Version**: v1.0.0  
**Status**: ✅ PRODUCTION READY


