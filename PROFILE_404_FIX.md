# 🔧 Profile 404 Error - Quick Fix

## The Problem

You're getting a **404 error** when accessing the profile page because the backend server needs to be restarted to load the new profile routes.

```
AxiosError: Request failed with status code 404
GET /api/v1/profile → 404 Not Found
```

---

## ✅ Quick Fix (30 seconds)

### Step 1: Stop the backend server

Press `Ctrl+C` in the terminal where your backend is running.

### Step 2: Start the backend server again

```bash
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm run dev
```

### Step 3: Verify the routes are loaded

You should see this in the console:
```
✅ Services initialized successfully
🚀 Server running on port 8080
```

### Step 4: Test the profile endpoint

```bash
# Get your auth token from the browser (DevTools → Application → Cookies → token)
curl http://localhost:8080/api/v1/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "...",
      "email": "your@email.com",
      "name": "Your Name",
      ...
    }
  }
}
```

---

## Why Did This Happen?

When you add new routes to the backend, you need to:
1. ✅ Build the TypeScript code (`npm run build`) - Already done
2. ✅ Restart the server - **This was missing!**

The server was still running with the old code that didn't have the profile routes.

---

## Alternative: Use nodemon for Auto-Restart

To avoid this in the future, you can use `nodemon` which auto-restarts on file changes:

```bash
# Install nodemon (if not already installed)
npm install --save-dev nodemon

# Update package.json
"scripts": {
  "dev": "nodemon --watch src --exec ts-node src/server.ts"
}

# Or use this one-liner
npx nodemon --watch src --exec npx ts-node src/server.ts
```

---

## Verification Checklist

After restarting the backend:

- [ ] Backend server is running (`npm run dev`)
- [ ] No errors in backend console
- [ ] Frontend can access `http://localhost:3000/profile`
- [ ] Profile page loads without 404 error
- [ ] Can save profile successfully

---

## If Still Getting 404

### Check 1: Backend is running
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### Check 2: Profile route exists in build
```bash
ls dist/src/routes/profile.routes.js
# Should show the file
```

### Check 3: Check backend logs
```bash
tail -f server.log
# Look for any errors
```

### Check 4: Verify API URL in frontend
Check `rizq-ai-frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### Check 5: Clear browser cache
- Open DevTools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"

---

## Quick Test Script

```bash
#!/bin/bash
# test-profile-endpoint.sh

echo "🔍 Testing profile endpoint..."

# Check if backend is running
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running!"
    echo "   Run: cd rizq-ai-backend && npm run dev"
    exit 1
fi

# Check if profile route exists
if curl -s http://localhost:8080/api/v1/profile -H "Authorization: Bearer test" | grep -q "success"; then
    echo "✅ Profile endpoint is accessible"
else
    echo "❌ Profile endpoint returned 404"
    echo "   Solution: Restart backend server"
    exit 1
fi

echo "🎉 All checks passed!"
```

---

## Summary

**The Fix:**
```bash
# 1. Stop backend (Ctrl+C)
# 2. Start backend
cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
npm run dev

# 3. Refresh frontend
# Profile page should now work! ✨
```

---

**Built with ❤️ by Rizq.AI Team**


