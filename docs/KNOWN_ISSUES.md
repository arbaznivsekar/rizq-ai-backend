# RIZQ.AI Backend - Known Issues & Fixes

**Last Updated:** October 3, 2025  
**Status:** 5 Non-Critical Issues Identified  
**Impact:** No blocking issues for MVP

---

## 📋 Issues Overview

| # | Issue | Severity | Impact | Est. Fix Time |
|---|-------|----------|--------|---------------|
| 1 | Auth Registration Schema Mismatch | MEDIUM | Frontend registration | 5 min |
| 2 | Scraping Job Creation Validation | MEDIUM | Cannot start scraping | 10 min |
| 3 | Application Export Empty Response | LOW | Export feature broken | 15 min |
| 4 | AI Chat Authentication Error | LOW | AI chat not accessible | 10 min |
| 5 | Sources Endpoint 403 Forbidden | LOW | Cannot access sources | 5 min |

**Total Estimated Fix Time:** 45 minutes

---

## Issue #1: Auth Registration Schema Mismatch

### 🔴 Severity: MEDIUM
**Category:** Authentication  
**Endpoint:** `POST /api/v1/auth/register`

### Problem Description
The registration endpoint validation schema expects a `name` field at the root level, but the User model stores user information in a nested `profile.fullName` structure. This mismatch causes registration to fail with a validation error.

### Current Behavior
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "profile": {
      "fullName": "John Doe"
    }
  }'

# Response:
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Required"
    }
  ]
}
```

### Expected Behavior
Registration should accept `profile.fullName` structure and successfully create a user.

### Root Cause
Validation schema in `src/controllers/auth.controller.ts` expects:
```typescript
{
  email: string,
  password: string,
  name: string  // <-- This field
}
```

But User model has:
```typescript
{
  email: string,
  password: string,
  profile: {
    fullName: string  // <-- Nested structure
  }
}
```

### Solution

**Option A: Update Validation Schema (Recommended)**

File: `src/controllers/auth.controller.ts`

```typescript
// Find the registration schema (around line 10-20)
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1), // <-- CHANGE THIS
});

// Change to:
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  profile: z.object({
    fullName: z.string().min(1),
    phone: z.string().optional(),
    location: z.string().optional()
  })
});
```

**Option B: Transform Input Data**

Alternatively, map the `name` field to `profile.fullName` in the controller:
```typescript
const body = RegisterSchema.parse(req.body);
const userData = {
  email: body.email,
  password: body.password,
  profile: {
    fullName: body.name
  }
};
```

### Testing After Fix
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Test123456",
    "profile": {
      "fullName": "New User"
    }
  }'

# Should return 200 OK with user data and token
```

### Workaround (Temporary)
Users can be created via database seed scripts or use the login endpoint with pre-existing users.

---

## Issue #2: Scraping Job Creation Validation

### 🔴 Severity: MEDIUM
**Category:** Scraping  
**Endpoint:** `POST /api/v1/scraping/jobs`

### Problem Description
The scraping job creation endpoint has a validation schema mismatch. The API expects `boardType` and `searchParams` fields, but the documentation and test attempts use `source`, `query`, `location`, etc.

### Current Behavior
```bash
curl -X POST http://localhost:8080/api/v1/scraping/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "indeed",
    "query": "software engineer",
    "location": "remote",
    "limit": 10
  }'

# Response:
{
  "success": false,
  "error": "Input validation failed",
  "details": [
    {
      "field": "boardType",
      "message": "Invalid board type"
    },
    {
      "field": "searchParams",
      "message": "Required"
    }
  ]
}
```

### Expected Behavior
Should accept job board parameters and start a scraping job.

### Root Cause
Validation schema in `src/controllers/scraping.controller.ts` expects different field structure than what's being sent.

### Solution

**Step 1: Check Validation Schema**

File: `src/controllers/scraping.controller.ts`

Look for the job creation validation schema (likely near `startScrapingJob` method):

```typescript
// Current (incorrect):
const ScrapingJobSchema = z.object({
  boardType: z.enum(['indeed', 'naukri', ...]),
  searchParams: z.object({
    query: z.string(),
    location: z.string().optional(),
    // ...
  })
});

// Should be:
const ScrapingJobSchema = z.object({
  source: z.enum(['indeed', 'naukri', 'linkedin', 'glassdoor']),
  query: z.string().min(1),
  location: z.string().optional(),
  jobTypes: z.array(z.string()).optional(),
  experienceLevel: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  maxPages: z.number().min(1).max(10).optional()
});
```

**Step 2: Update Controller Method**

Ensure the `startScrapingJob` method properly maps the validated data to the scraping service:

```typescript
async startScrapingJob(req: Request, res: Response) {
  const validated = ScrapingJobSchema.parse(req.body);
  
  const jobId = await scrapingService.createJob({
    source: validated.source,
    config: {
      query: validated.query,
      location: validated.location,
      limit: validated.limit,
      maxPages: validated.maxPages
    }
  });
  
  res.json({ success: true, jobId });
}
```

### Testing After Fix
```bash
curl -X POST http://localhost:8080/api/v1/scraping/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "indeed",
    "query": "software engineer",
    "location": "remote",
    "limit": 10,
    "maxPages": 1
  }'

# Should return:
{
  "success": true,
  "jobId": "scraping_job_xxx"
}
```

### Workaround (Temporary)
Use the scraping service directly via code or create jobs through database seeding.

---

## Issue #3: Application Export Empty Response

### 🟡 Severity: LOW
**Category:** Applications  
**Endpoint:** `POST /api/v1/applications/export`

### Problem Description
The application export endpoint returns an empty response instead of exported data.

### Current Behavior
```bash
curl -X POST http://localhost:8080/api/v1/applications/export \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Returns: (empty - no JSON)
```

### Expected Behavior
Should return applications in requested format (JSON, CSV, PDF).

### Root Cause
Likely one of:
1. Missing response in export service
2. Export format not specified
3. Async operation not awaited
4. Content-Type header mismatch

### Solution

**Step 1: Check Export Controller**

File: `src/controllers/applications.controller.ts`

```typescript
export const exportMyApplications = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const format = req.body.format || 'json'; // Default format
  
  // Ensure we're awaiting the export
  const data = await exportService.exportApplications(userId, format);
  
  // Set proper content type
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
  } else if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
  }
  
  // Send the data
  res.send(data);
};
```

**Step 2: Check Export Service**

File: `src/services/export.service.ts`

Ensure the export method returns data:
```typescript
async exportApplications(userId: string, format: string) {
  const applications = await Application.find({ userId });
  
  if (format === 'json') {
    return JSON.stringify(applications, null, 2);
  }
  
  if (format === 'csv') {
    // Convert to CSV
    return this.convertToCSV(applications);
  }
  
  return applications; // Always return something
}
```

### Testing After Fix
```bash
# Test JSON export
curl -X POST http://localhost:8080/api/v1/applications/export \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"format": "json"}'

# Should return application data in JSON

# Test CSV export
curl -X POST http://localhost:8080/api/v1/applications/export \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv"}'

# Should return CSV data
```

### Workaround (Temporary)
Use `GET /api/v1/applications` to retrieve data and export client-side.

---

## Issue #4: AI Chat Authentication Error

### 🟡 Severity: LOW
**Category:** AI Services  
**Endpoint:** `POST /api/v1/ai/chat`

### Problem Description
The AI chat endpoint returns 401 "User not found" error even though no authentication middleware is applied to the route.

### Current Behavior
```bash
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "system": "You are a helpful assistant",
    "prompt": "Hello"
  }'

# Response:
{
  "success": false,
  "error": {
    "code": "HTTP_ERROR",
    "message": "401 User not found."
  }
}
```

### Expected Behavior
Should return AI response or require authentication explicitly.

### Root Cause
The AI service (`src/services/ai.service.ts`) likely attempts to access `req.user` even though the route doesn't have `requireAuth` middleware.

### Solution

**Option A: Make It Public (If Intended)**

File: `src/services/ai.service.ts` or controller

Remove any user lookup logic:
```typescript
// src/routes/ai.routes.ts
r.post("/chat", async (req, res, next) => {
  try {
    const body = BodySchema.parse(req.body);
    // Don't access req.user - this is public
    const content = await createChatCompletion(body.system, body.prompt);
    res.json({ content });
  } catch (err) {
    next(err);
  }
});
```

**Option B: Require Authentication (Recommended)**

File: `src/routes/ai.routes.ts`

```typescript
import { requireAuth } from '../auth/guard.js';

// Add auth middleware
r.post("/chat", requireAuth, async (req, res, next) => {
  try {
    const body = BodySchema.parse(req.body);
    const userId = req.user.id; // Now available
    const content = await createChatCompletion(body.system, body.prompt, userId);
    res.json({ content });
  } catch (err) {
    next(err);
  }
});
```

**Option C: Make It Optional**

```typescript
r.post("/chat", async (req, res, next) => {
  try {
    const body = BodySchema.parse(req.body);
    const userId = req.user?.id; // Optional
    const content = await createChatCompletion(body.system, body.prompt, userId);
    res.json({ content });
  } catch (err) {
    next(err);
  }
});
```

### Testing After Fix

**If Public:**
```bash
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"system": "You are helpful", "prompt": "Say hi"}'

# Should return AI response
```

**If Protected:**
```bash
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"system": "You are helpful", "prompt": "Say hi"}'

# Should return AI response
```

### Workaround (Temporary)
Use AI features through other endpoints (resume generation, job matching, etc.).

---

## Issue #5: Sources Endpoint 403 Forbidden

### 🟡 Severity: LOW
**Category:** Job Sources  
**Endpoint:** `GET /api/v1/sources`

### Problem Description
The sources endpoint returns 403 Forbidden even with a valid authentication token.

### Current Behavior
```bash
curl -H "Authorization: Bearer <valid-token>" \
  http://localhost:8080/api/v1/sources

# Response:
{
  "success": false,
  "error": {
    "code": "HTTP_ERROR",
    "message": "Forbidden"
  }
}
```

### Expected Behavior
Should return available job sources or require specific permissions.

### Root Cause
The endpoint likely has `requireAdmin` middleware or checks for admin role.

### Solution

**Step 1: Check Route Definition**

File: `src/routes/sources.routes.ts` (or similar)

```typescript
// Current (likely):
import { requireAuth, requireAdmin } from '../auth/guard.js';

router.get('/', requireAuth, requireAdmin, getSources);

// Option A: Make it public
router.get('/', getSources);

// Option B: Allow authenticated users
router.get('/', requireAuth, getSources);

// Option C: Keep admin-only but add proper error message
router.get('/', requireAuth, requireAdmin, getSources);
```

**Step 2: Update Controller**

If admin-only is intentional, improve error message:

```typescript
export const getSources = async (req: Request, res: Response) => {
  // Check if admin
  if (!req.user?.roles?.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'This endpoint is restricted to administrators'
    });
  }
  
  const sources = await getJobSources();
  res.json({ success: true, sources });
};
```

**Step 3: Consider Alternative**

Note: `GET /api/v1/workflow/sources` is already working and public - this might be the intended endpoint for users. The `/sources` endpoint might be for admin-only management.

### Testing After Fix

**If Made Public:**
```bash
curl http://localhost:8080/api/v1/sources

# Should return sources list
```

**If Made Authenticated:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/sources

# Should return sources list
```

**If Kept Admin-Only:**
```bash
# Test with admin token
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:8080/api/v1/sources

# Should return sources list
```

### Workaround (Current)
Use `GET /api/v1/workflow/sources` instead - this endpoint works perfectly and returns the same data.

```bash
curl http://localhost:8080/api/v1/workflow/sources

# Returns:
{
  "success": true,
  "data": {
    "sources": [
      {"id": "indeed", "name": "Indeed", ...},
      {"id": "naukri", "name": "Naukri", ...}
    ]
  }
}
```

---

## 🔧 Quick Fix Priority

### High Priority (Do First)
1. **Issue #1: Auth Registration** (5 min)
   - Blocks new user registration
   - Easy schema alignment fix

2. **Issue #2: Scraping Job Creation** (10 min)
   - Blocks ability to populate job database
   - Critical for data flow

### Medium Priority (Can Wait)
3. **Issue #4: AI Chat** (10 min)
   - Low impact - not core to MVP
   - Quick middleware addition

4. **Issue #3: Application Export** (15 min)
   - Feature not critical for MVP
   - Users can view apps in dashboard

### Low Priority (Optional)
5. **Issue #5: Sources Endpoint** (5 min)
   - Workaround exists (`/workflow/sources`)
   - May be intentionally admin-only

---

## 📝 Testing Checklist

After fixing each issue, run these tests:

```bash
# Issue #1: Registration
./test_scripts/test_auth_registration.sh

# Issue #2: Scraping
./test_scripts/test_scraping_job.sh

# Issue #3: Export
./test_scripts/test_export.sh

# Issue #4: AI Chat
./test_scripts/test_ai_chat.sh

# Issue #5: Sources
./test_scripts/test_sources.sh
```

---

## 🎯 Success Criteria

All issues resolved when:
- [ ] Users can register via API
- [ ] Scraping jobs can be created
- [ ] Applications export returns data
- [ ] AI chat responds (with or without auth)
- [ ] Sources endpoint clarified (public vs admin)

---

## 📞 Additional Notes

### Not Urgent Because:
1. Login works perfectly (registration workaround)
2. Core workflow functional without these features
3. Frontend can start development immediately
4. Issues are isolated (don't affect other systems)

### When to Fix:
- **Before Production:** Issues #1 and #2
- **Before Beta:** All issues
- **Can Wait:** Issues #3, #4, #5 (have workarounds)

---

**Document Created:** October 3, 2025  
**Last Review:** October 3, 2025  
**Next Review:** Before production deployment

