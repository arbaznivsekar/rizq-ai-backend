
# Frontend Quick Start Guide - RIZQ.AI

**For Frontend Developers** 🎨  
**Last Updated:** October 2, 2025

---

## 🚀 Getting Started in 5 Minutes

### 1. API Base URL
```javascript
// Development
const API_URL = "http://localhost:8080/api/v1";

// Production (when deployed)
const API_URL = "https://api.rizq.ai/api/v1";
```

### 2. First API Call (Test)
```bash
# Test the API is running
curl http://localhost:8080/health

# Expected response
{"status":"ok"}
```

### 3. Search Jobs (No Auth Required)
```javascript
// Example: Basic job search
fetch(`${API_URL}/workflow/search?query=software+engineer&limit=20`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🔑 Authentication Flow

### Step 1: User Registration
```javascript
// POST /api/v1/auth/register
const register = async (email, password, fullName) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email, 
      password, 
      profile: { fullName } 
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store token in localStorage or cookie
    localStorage.setItem('token', data.data.token);
    return data.data;
  } else {
    throw new Error(data.error);
  }
};
```

### Step 2: User Login
```javascript
// POST /api/v1/auth/login
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    return data.data;
  } else {
    throw new Error(data.error);
  }
};
```

### Step 3: Authenticated Requests
```javascript
// Example: Get recommended jobs (requires auth)
const getRecommendedJobs = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/workflow/recommended`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

---

## 🔍 Job Search API

### Basic Search
```javascript
const searchJobs = async (query, limit = 20) => {
  const params = new URLSearchParams({
    query,
    limit: limit.toString()
  });
  
  const response = await fetch(`${API_URL}/workflow/search?${params}`);
  const data = await response.json();
  
  return data.data; // { jobs, total, facets, pagination }
};

// Usage
searchJobs("software engineer", 20);
```

### Advanced Search with Filters
```javascript
const advancedSearch = async (filters) => {
  const params = new URLSearchParams();
  
  // Required
  params.append('query', filters.query);
  
  // Optional filters
  if (filters.location) params.append('location', filters.location);
  if (filters.remote) params.append('remote', 'true');
  if (filters.easyApply) params.append('easyApply', 'true');
  if (filters.jobTypes) {
    filters.jobTypes.forEach(type => params.append('jobTypes', type));
  }
  if (filters.salaryMin) params.append('salaryMin', filters.salaryMin);
  if (filters.salaryMax) params.append('salaryMax', filters.salaryMax);
  if (filters.postedWithin) params.append('postedWithin', filters.postedWithin);
  
  // Pagination
  params.append('limit', filters.limit || 20);
  params.append('offset', filters.offset || 0);
  
  // Sorting
  params.append('sortBy', filters.sortBy || 'relevance');
  
  const response = await fetch(`${API_URL}/workflow/search?${params}`);
  return await response.json();
};

// Usage Example
advancedSearch({
  query: "react developer",
  location: "Remote",
  remote: true,
  easyApply: true,
  jobTypes: ["Full-time"],
  salaryMin: 60000,
  postedWithin: 30, // last 30 days
  sortBy: "date",
  limit: 20,
  offset: 0
});
```

### Response Structure
```typescript
{
  success: boolean;
  data: {
    jobs: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      description: string;
      requirements: string[];
      skills: string[];
      salary?: {
        min: number;
        max: number;
        currency: string;
      };
      jobType: string;
      experienceLevel: string;
      remote: boolean;
      easyApply: boolean;
      companyEmail?: string;
      applicationUrl?: string;
      postedDate: string;
      source: string;
    }>;
    total: number;
    facets: {
      sources: { [key: string]: number };
      types: { [key: string]: number };
      locations: { [key: string]: number };
    };
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
```

---

## 💼 Job Application Flow

### Step 1: Grant Email Consent
```javascript
const grantEmailConsent = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/email-outreach/consent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ granted: true })
  });
  
  return await response.json();
};
```

### Step 2: Connect Gmail (OAuth)
```javascript
const connectGmail = () => {
  const token = localStorage.getItem('token');
  
  // Redirect to Gmail OAuth flow
  window.location.href = `${API_URL}/gmail-oauth/authorize?token=${token}`;
  
  // User will be redirected back after granting access
  // The backend handles the OAuth callback
};
```

### Step 3: Apply to Jobs
```javascript
const applyToJobs = async (jobIds, customMessage = "") => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/workflow/apply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jobIds,
      customMessage,
      includeResume: true
    })
  });
  
  const data = await response.json();
  return data;
};

// Usage
applyToJobs(
  ["job_id_1", "job_id_2", "job_id_3"],
  "I'm very interested in this position..."
);
```

### Response Structure
```typescript
{
  success: boolean;
  data: {
    applicationsSubmitted: number;
    failed: number;
    details: Array<{
      jobId: string;
      status: "queued" | "sent" | "failed";
      message: string;
      error?: string;
    }>;
    estimatedSendTime: string;
  };
}
```

---

## 📊 User Dashboard

### Get Dashboard Data
```javascript
const getDashboard = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/workflow/dashboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

### Response Structure
```typescript
{
  success: boolean;
  data: {
    stats: {
      totalApplications: number;
      pendingApplications: number;
      successfulApplications: number;
      failedApplications: number;
      responseRate: number;
    };
    recentApplications: Array<{
      jobId: string;
      jobTitle: string;
      company: string;
      status: string;
      appliedAt: string;
    }>;
    recommendedJobs: Array<Job>;
    emailConsent: {
      granted: boolean;
      grantedAt?: string;
    };
    dailySendLimit: {
      limit: number;
      used: number;
      remaining: number;
      resetAt: string;
    };
  };
}
```

---

## 🎨 UI Component Examples

### Job Search Component (React)
```jsx
import { useState, useEffect } from 'react';

function JobSearch() {
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const searchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/workflow/search?query=${query}&limit=20`
      );
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.data.jobs);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search jobs..."
      />
      <button onClick={searchJobs} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      
      <div>
        {jobs.map(job => (
          <div key={job.id}>
            <h3>{job.title}</h3>
            <p>{job.company} - {job.location}</p>
            <p>{job.description.substring(0, 200)}...</p>
            <button>Apply</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### One-Click Apply Button
```jsx
function ApplyButton({ jobId, jobTitle }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  
  const handleApply = async () => {
    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:8080/api/v1/workflow/apply',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobIds: [jobId],
            includeResume: true
          })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setApplied(true);
        alert('Application submitted!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Application failed');
    } finally {
      setApplying(false);
    }
  };
  
  return (
    <button 
      onClick={handleApply} 
      disabled={applying || applied}
    >
      {applied ? '✓ Applied' : applying ? 'Applying...' : 'Quick Apply'}
    </button>
  );
}
```

---

## 🚨 Error Handling

### Standard Error Response
```typescript
{
  success: false;
  error: string; // Human-readable error message
  details?: Array<{
    field: string;
    message: string;
  }>; // Validation errors (if applicable)
}
```

### Example Error Handler
```javascript
const handleApiError = (data) => {
  if (!data.success) {
    if (data.details) {
      // Validation errors
      data.details.forEach(err => {
        console.error(`${err.field}: ${err.message}`);
      });
    } else {
      // General error
      console.error(data.error);
    }
  }
};
```

### Common Error Codes
| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Show rate limit message |
| 500 | Server Error | Show generic error, retry later |

---

## 🔄 Pagination

### Load More Jobs
```javascript
const [jobs, setJobs] = useState([]);
const [offset, setOffset] = useState(0);
const [hasMore, setHasMore] = useState(true);
const limit = 20;

const loadMoreJobs = async () => {
  const response = await fetch(
    `${API_URL}/workflow/search?query=developer&limit=${limit}&offset=${offset}`
  );
  const data = await response.json();
  
  if (data.success) {
    setJobs([...jobs, ...data.data.jobs]);
    setOffset(offset + limit);
    setHasMore(data.data.pagination.hasMore);
  }
};

// Infinite scroll
useEffect(() => {
  const handleScroll = () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight &&
      hasMore &&
      !loading
    ) {
      loadMoreJobs();
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [hasMore, loading]);
```

---

## 📱 Mobile Considerations

### Responsive API Limits
```javascript
// Desktop: Load more results
const limit = window.innerWidth > 768 ? 20 : 10;

// Mobile: Smaller response for faster loading
fetch(`${API_URL}/workflow/search?query=developer&limit=${limit}`);
```

---

## 🧪 Testing the API

### Using Postman
1. Import the collection from `/docs/postman_collection.json` (if available)
2. Set environment variable: `API_URL = http://localhost:8080/api/v1`
3. Test each endpoint

### Using curl
```bash
# Search jobs
curl "http://localhost:8080/api/v1/workflow/search?query=developer&limit=5"

# Register user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","profile":{"fullName":"Test User"}}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🎯 Quick Reference Table

| Feature | Endpoint | Method | Auth | Description |
|---------|----------|--------|------|-------------|
| Search Jobs | `/workflow/search` | GET | No | Search with filters |
| Recommendations | `/workflow/recommended` | GET | Yes | AI-powered matches |
| Apply to Jobs | `/workflow/apply` | POST | Yes | One-click apply |
| Dashboard | `/workflow/dashboard` | GET | Yes | User stats |
| Register | `/auth/register` | POST | No | Create account |
| Login | `/auth/login` | POST | No | Get JWT token |
| Email Consent | `/email-outreach/consent` | POST | Yes | Grant permission |
| Gmail OAuth | `/gmail-oauth/authorize` | GET | Yes | Connect Gmail |

---

## 💡 Tips & Best Practices

### 1. Token Management
```javascript
// Store token securely
localStorage.setItem('token', token);

// Add expiry check
const isTokenExpired = (token) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return Date.now() >= payload.exp * 1000;
};

// Auto-refresh before expiry
if (isTokenExpired(token)) {
  // Call refresh endpoint
}
```

### 2. Loading States
```javascript
// Show loading indicator
const [loading, setLoading] = useState(false);

// Show skeleton loaders for better UX
<SkeletonLoader count={5} />
```

### 3. Error Messages
```javascript
// User-friendly error messages
const errorMessages = {
  400: "Please check your input and try again.",
  401: "Please log in to continue.",
  403: "You don't have permission to do this.",
  404: "The requested resource was not found.",
  429: "Too many requests. Please wait a moment.",
  500: "Something went wrong. Please try again later."
};
```

### 4. Debounce Search
```javascript
// Debounce search input (wait 300ms after user stops typing)
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const debouncedSearch = debounce(searchJobs, 300);
```

---

## 🚀 Ready to Build!

You now have everything you need to integrate with the RIZQ.AI backend. Start with:

1. **Authentication** - Get users registered and logged in
2. **Job Search** - Build the core search UI
3. **Job Display** - Show job listings beautifully
4. **Apply Flow** - Implement one-click apply

**Need Help?** Check:
- `/docs/MVP_READINESS_FINAL.md` - Complete feature list
- `/docs/API_TESTING_GUIDE.md` - Detailed API docs
- `/docs/API_TEST_RESULTS.md` - Test results

**Good luck! 🎉**





