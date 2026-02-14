# Quick Fix Guide - 5 Known Issues

**Total Time to Fix All:** 45 minutes

---

## 🚀 Quick Fix Commands

### Issue #1: Auth Registration (5 min)
**File:** `src/controllers/auth.controller.ts`

**Find:**
```typescript
name: z.string().min(1)
```

**Replace with:**
```typescript
profile: z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  location: z.string().optional()
})
```

---

### Issue #2: Scraping Job Creation (10 min)
**File:** `src/controllers/scraping.controller.ts`

**Find:**
```typescript
boardType: z.enum([...]),
searchParams: z.object({...})
```

**Replace with:**
```typescript
source: z.enum(['indeed', 'naukri', 'linkedin', 'glassdoor']),
query: z.string().min(1),
location: z.string().optional(),
limit: z.number().min(1).max(100).default(50),
maxPages: z.number().min(1).max(10).optional()
```

---

### Issue #3: Application Export (15 min)
**File:** `src/controllers/applications.controller.ts`

**Check method has:**
```typescript
export const exportMyApplications = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const format = req.body.format || 'json';
  
  const data = await exportService.exportApplications(userId, format);
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
  }
  
  res.send(data); // ← Make sure this line exists
};
```

---

### Issue #4: AI Chat (10 min)
**File:** `src/routes/ai.routes.ts`

**Find:**
```typescript
r.post("/chat", async (req, res, next) => {
```

**Replace with:**
```typescript
import { requireAuth } from "../auth/guard.js";

r.post("/chat", requireAuth, async (req, res, next) => {
```

---

### Issue #5: Sources Endpoint (5 min)
**Note:** Already has workaround - use `/workflow/sources` instead.

**Optional Fix - File:** `src/routes/sources.routes.ts`

**Find:**
```typescript
router.get('/', requireAuth, requireAdmin, getSources);
```

**Replace with (if public):**
```typescript
router.get('/', getSources);
```

**Or (if authenticated):**
```typescript
router.get('/', requireAuth, getSources);
```

---

## 🧪 Test After Fixing

```bash
# Start server
npm run dev

# Test Issue #1: Registration
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123456","profile":{"fullName":"Test User"}}'

# Test Issue #2: Scraping
TOKEN="<your-token>"
curl -X POST http://localhost:8080/api/v1/scraping/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"indeed","query":"developer","location":"remote","limit":5}'

# Test Issue #3: Export
curl -X POST http://localhost:8080/api/v1/applications/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"json"}'

# Test Issue #4: AI Chat
curl -X POST http://localhost:8080/api/v1/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"system":"You are helpful","prompt":"Hello"}'

# Test Issue #5: Sources (if fixed)
curl http://localhost:8080/api/v1/sources
```

---

## ✅ Done!

After fixing, rebuild:
```bash
npx tsc
npm run dev
```

Then run all tests to confirm fixes.
