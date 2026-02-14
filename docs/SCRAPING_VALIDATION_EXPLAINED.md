# 📝 Scraping Job Validation Issue - Detailed Explanation

## 🤔 What Is This Issue?

When you try to create a scraping job via the API, it fails because **the request format you're sending doesn't match what the backend expects**.

---

## 🎯 The Problem in Simple Terms

**What you're trying to send:**
```json
{
  "source": "indeed",
  "query": "software engineer",
  "location": "remote",
  "limit": 10
}
```

**What the backend actually expects:**
```json
{
  "boardType": "indeed",
  "searchParams": {
    "query": "software engineer",
    "location": "remote",
    "limit": 10
  },
  "config": {
    "name": "My scraping job",
    "maxPagesPerSearch": 5
  }
}
```

**Result:** ❌ Validation fails because fields don't match!

---

## 🔍 Deep Dive: What's Happening Under The Hood

### Step 1: Your API Request

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
```

### Step 2: Backend Receives Request

The request goes to: `src/controllers/scraping.controller.ts` → `startScrapingJob()` method

### Step 3: Validation Schema Checks

The backend uses **Zod** (a TypeScript validation library) to validate your request:

```typescript
// File: src/controllers/scraping.controller.ts (lines 27-69)

const StartJobSchema = z.object({
  // ❌ Looking for "boardType" but you sent "source"
  boardType: z.nativeEnum(JobBoardType, {
    errorMap: () => ({ message: 'Invalid board type' })
  }),
  
  // ❌ Looking for "searchParams" object but you sent flat fields
  searchParams: z.object({
    query: z.string().min(1).max(500),
    location: z.string().max(200).optional(),
    radius: z.number().optional(),
    jobType: z.array(z.string()).optional(),
    // ... more fields
  }),
  
  // ❌ Looking for "config" object but you didn't send it at all
  config: z.object({
    name: z.string().max(100),
    maxPagesPerSearch: z.number().optional(),
    useProxies: z.boolean().optional(),
    // ... many more fields
  })
});
```

### Step 4: Validation Fails

```typescript
// Line 120-136 in scraping.controller.ts
const validationResult = StartJobSchema.safeParse(req.body);

if (!validationResult.success) {
  // Returns these errors:
  res.status(400).json({
    success: false,
    error: 'Input validation failed',
    details: [
      { field: 'boardType', message: 'Invalid board type' },
      { field: 'searchParams', message: 'Required' }
    ]
  });
}
```

---

## 📊 The Schema Structure Explained

### What is `boardType`?

```typescript
// File: src/scraping/factory/scraperFactory.ts (lines 15-22)

export enum JobBoardType {
  INDEED = 'indeed',
  LINKEDIN = 'linkedin',
  GLASSDOOR = 'glassdoor',
  NAUKRI = 'naukri',
  NAUKRI_GULF = 'naukri_gulf',
  GULF_TALENT = 'gulf_talent'
}
```

This tells the backend **which job board scraper to use**.

### What is `searchParams`?

This is an object containing all the search criteria:

```typescript
searchParams: {
  query: string,              // REQUIRED - "software engineer"
  location?: string,          // OPTIONAL - "Remote", "San Francisco"
  radius?: number,            // OPTIONAL - Search radius in miles
  jobType?: string[],         // OPTIONAL - ["Full-time", "Remote"]
  level?: string[],           // OPTIONAL - ["Mid", "Senior"]
  salaryMin?: number,         // OPTIONAL - 60000
  salaryMax?: number,         // OPTIONAL - 120000
  remote?: boolean,           // OPTIONAL - true/false
  easyApply?: boolean,        // OPTIONAL - true/false
  postedWithin?: number,      // OPTIONAL - Days (e.g., 7 for last week)
  page?: number,              // OPTIONAL - Page number to scrape
  limit?: number,             // OPTIONAL - Max jobs to scrape
  customFilters?: object      // OPTIONAL - Board-specific filters
}
```

### What is `config`?

This is an object containing scraper configuration:

```typescript
config: {
  name: string,                      // REQUIRED - Job name
  baseUrl?: string,                  // OPTIONAL - Custom base URL
  enabled?: boolean,                 // OPTIONAL - Enable/disable scraper
  priority?: number,                 // OPTIONAL - 1-10 (queue priority)
  requestsPerMinute?: number,        // OPTIONAL - Rate limiting
  requestsPerHour?: number,          // OPTIONAL - Rate limiting
  delayBetweenRequests?: number,     // OPTIONAL - Delay in ms
  useProxies?: boolean,              // OPTIONAL - Use proxy rotation
  rotateUserAgents?: boolean,        // OPTIONAL - Rotate user agents
  simulateHumanBehavior?: boolean,   // OPTIONAL - Human-like delays
  maxPagesPerSearch?: number,        // OPTIONAL - Max pages to scrape
  maxJobsPerPage?: number,           // OPTIONAL - Max jobs per page
  followPagination?: boolean,        // OPTIONAL - Follow pagination
  extractFullDescription?: boolean,  // OPTIONAL - Full job details
  extractRequirements?: boolean,     // OPTIONAL - Extract requirements
  extractBenefits?: boolean,         // OPTIONAL - Extract benefits
  maxRetries?: number,               // OPTIONAL - Max retry attempts
  retryDelay?: number,               // OPTIONAL - Delay between retries
  circuitBreakerThreshold?: number,  // OPTIONAL - Circuit breaker
  respectRobotsTxt?: boolean,        // OPTIONAL - Respect robots.txt
  includeAuditTrail?: boolean,       // OPTIONAL - Audit logging
  anonymizeData?: boolean            // OPTIONAL - Data anonymization
}
```

---

## ✅ Correct Request Format

### Minimal Request (Only Required Fields)

```json
{
  "boardType": "indeed",
  "searchParams": {
    "query": "software engineer"
  },
  "config": {
    "name": "Software Engineer Search"
  }
}
```

### Full Request Example

```json
{
  "boardType": "indeed",
  "searchParams": {
    "query": "software engineer",
    "location": "San Francisco, CA",
    "radius": 25,
    "jobType": ["Full-time", "Remote"],
    "level": ["Mid", "Senior"],
    "salaryMin": 80000,
    "salaryMax": 150000,
    "remote": true,
    "easyApply": true,
    "postedWithin": 7,
    "limit": 50
  },
  "config": {
    "name": "SF Software Engineer Jobs",
    "priority": 5,
    "maxPagesPerSearch": 5,
    "useProxies": true,
    "rotateUserAgents": true,
    "simulateHumanBehavior": true,
    "extractFullDescription": true,
    "extractRequirements": true,
    "respectRobotsTxt": true,
    "maxRetries": 3
  }
}
```

### With Queue Options (Advanced)

```json
{
  "boardType": "naukri",
  "searchParams": {
    "query": "react developer",
    "location": "Bangalore",
    "limit": 100
  },
  "config": {
    "name": "Naukri React Jobs"
  },
  "useQueue": true,      // Use BullMQ (default: true)
  "priority": 1,         // Higher number = higher priority
  "delay": 5000          // Delay job by 5 seconds
}
```

---

## 🧪 Testing The Correct Format

```bash
TOKEN="<your-auth-token>"

# Minimal test
curl -X POST http://localhost:8080/api/v1/scraping/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boardType": "indeed",
    "searchParams": {
      "query": "software engineer",
      "location": "remote",
      "limit": 10
    },
    "config": {
      "name": "Test Scraping Job",
      "maxPagesPerSearch": 1
    }
  }'

# Expected success response:
{
  "success": true,
  "jobId": "scraping-job-abc123",
  "boardType": "indeed",
  "searchQuery": "software engineer",
  "message": "Scraping job enqueued successfully",
  "status": "queued"
}
```

---

## 🔧 How To Fix This Issue

### Option 1: Update Request Format (Frontend)

If you're building a frontend, send requests in the correct format:

```javascript
// Frontend code
const startScraping = async () => {
  const response = await fetch('/api/v1/scraping/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      boardType: 'indeed',
      searchParams: {
        query: searchQuery,
        location: location,
        limit: 50
      },
      config: {
        name: `Search: ${searchQuery}`,
        maxPagesPerSearch: 5
      }
    })
  });
  
  return await response.json();
};
```

### Option 2: Simplify Backend Schema (Backend)

Change the validation schema to accept simpler format:

```typescript
// File: src/controllers/scraping.controller.ts

// NEW SIMPLIFIED SCHEMA
const StartJobSchema = z.object({
  source: z.enum(['indeed', 'naukri', 'linkedin', 'glassdoor']),
  query: z.string().min(1).max(500),
  location: z.string().max(200).optional(),
  jobTypes: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).default(50),
  maxPages: z.number().min(1).max(10).default(5)
});

// In controller method, transform to expected format:
public async startScrapingJob(req: Request, res: Response) {
  const input = StartJobSchema.parse(req.body);
  
  // Transform simple format to complex format
  const transformedData = {
    boardType: input.source,
    searchParams: {
      query: input.query,
      location: input.location,
      jobType: input.jobTypes,
      limit: input.limit
    },
    config: {
      name: `${input.source} - ${input.query}`,
      maxPagesPerSearch: input.maxPages
    }
  };
  
  // Use transformed data for scraping...
}
```

### Option 3: Create Helper Endpoint (Backend)

Add a simpler endpoint for common use cases:

```typescript
// NEW ENDPOINT: POST /scraping/jobs/simple

const SimpleJobSchema = z.object({
  source: z.enum(['indeed', 'naukri']),
  query: z.string().min(1),
  location: z.string().optional(),
  limit: z.number().default(50)
});

public async startSimpleScrapingJob(req: Request, res: Response) {
  const { source, query, location, limit } = SimpleJobSchema.parse(req.body);
  
  // Use sensible defaults for config
  return this.startScrapingJob({
    ...req,
    body: {
      boardType: source,
      searchParams: { query, location, limit },
      config: {
        name: `${source} - ${query}`,
        maxPagesPerSearch: 5,
        useProxies: true,
        respectRobotsTxt: true
      }
    }
  }, res);
}
```

---

## 📈 Why This Complex Structure Exists

### Enterprise Features Supported:

1. **Rate Limiting** - `requestsPerMinute`, `requestsPerHour`
2. **Anti-Bot Protection** - `useProxies`, `rotateUserAgents`, `simulateHumanBehavior`
3. **Circuit Breakers** - `circuitBreakerThreshold`, `maxRetries`
4. **Data Privacy** - `anonymizeData`, `respectRobotsTxt`
5. **Quality Control** - `extractFullDescription`, `extractRequirements`
6. **Job Queue Management** - `priority`, `delay`, `useQueue`
7. **Audit Compliance** - `includeAuditTrail`

The complex structure allows fine-grained control for production scraping at scale.

---

## 🎯 Recommended Fix Path

**For MVP (Quick Fix):**
Use **Option 2** - Simplify the schema to accept:
```json
{
  "source": "indeed",
  "query": "software engineer",
  "location": "remote",
  "limit": 50
}
```

**For Production:**
Keep the complex schema but create **Option 3** - Two endpoints:
- `/scraping/jobs` - Full control (for admin)
- `/scraping/jobs/simple` - Easy use (for regular users)

---

## 🐛 Current Workaround

Until fixed, you can:

1. **Use the complex format** (shown above)
2. **Manually populate jobs** via database seeding
3. **Use admin scripts** to trigger scraping

---

## 📚 Related Files

- `src/controllers/scraping.controller.ts` - Validation schema (lines 27-69)
- `src/scraping/factory/scraperFactory.ts` - JobBoardType enum (lines 15-22)
- `src/scraping/types/index.ts` - SearchParams type definitions
- `src/queues/scraping.queue.ts` - BullMQ job processing

---

**Summary:** The issue is a **mismatch between expected API format and what you're sending**. Fix by either simplifying the schema or sending the correct nested structure.

