# RIZQ.AI Backend API Testing Guide

## 🚀 Quick Start Testing

### Prerequisites
```bash
# 1. Start MongoDB
docker-compose up -d mongo

# 2. Start Redis
docker-compose up -d redis

# 3. Set environment variables
cp env.example .env
# Edit .env with your values

# 4. Start the server
npm run dev
```

Server should be running on `http://localhost:8080`

---

## 📝 Complete Workflow Testing

### **Step 1: Check Server Health**
```bash
curl http://localhost:8080/health
```

Expected:
```json
{"status": "ok"}
```

---

### **Step 2: Get Available Job Sources**
```bash
curl http://localhost:8080/api/v1/workflow/sources
```

Expected:
```json
{
  "success": true,
  "data": {
    "sources": [
      {
        "id": "indeed",
        "name": "Indeed",
        "available": true,
        "jobCount": 5000
      }
    ],
    "totalJobs": 13000,
    "recentJobs": 150
  }
}
```

---

### **Step 3: Search Jobs (Basic)**
```bash
curl "http://localhost:8080/api/v1/workflow/search?query=software+engineer&limit=5"
```

Expected:
```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "total": 150,
    "facets": {
      "sources": {...},
      "types": {...},
      "locations": {...}
    },
    "pagination": {
      "limit": 5,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### **Step 4: Advanced Job Search**
```bash
curl "http://localhost:8080/api/v1/workflow/search?\
query=software+engineer&\
location=Mumbai&\
salaryMin=1000000&\
salaryMax=2000000&\
remote=true&\
postedWithin=7&\
sortBy=salary&\
limit=10"
```

---

### **Step 5: Register/Login User**
```bash
# This depends on your auth implementation
# Example:
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the JWT token from the response.

---

### **Step 6: Upload Resume (Optional)**
```bash
curl -X POST http://localhost:8080/api/v1/resumes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

---

### **Step 7: Get Personalized Recommendations**
```bash
curl http://localhost:8080/api/v1/workflow/recommended?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected:
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "title": "Senior Software Engineer",
        "matchScore": 85,
        "matchReasons": ["React experience", "5+ years"],
        ...
      }
    ],
    "total": 15
  }
}
```

---

### **Step 8: Gmail OAuth Setup**
```bash
# Start OAuth flow
curl http://localhost:8080/api/v1/email-outreach/oauth/google/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will redirect you to Google OAuth consent page. After approving, you'll be redirected back with Gmail connected.

---

### **Step 9: Give Email Consent**
```bash
curl -X POST http://localhost:8080/api/v1/email-outreach/consent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consentDetails": "I agree to automated email outreach"
  }'
```

---

### **Step 10: Apply to Jobs**
```bash
curl -X POST http://localhost:8080/api/v1/workflow/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobIds": ["67033c8f8b5e4d0012345678", "67033c8f8b5e4d0012345679"],
    "includeResume": true
  }'
```

Expected:
```json
{
  "success": true,
  "queued": 2,
  "message": "Successfully queued 2 applications"
}
```

---

### **Step 11: Check Dashboard**
```bash
curl http://localhost:8080/api/v1/workflow/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected:
```json
{
  "success": true,
  "data": {
    "recentJobs": [...],
    "applicationStats": {
      "totalApplications": 2,
      "pendingApplications": 2,
      "thisWeek": 2
    },
    "activeWorkflows": 0
  }
}
```

---

## 🧪 Testing Individual Components

### **Jobs Service**
```bash
# Get all jobs
curl "http://localhost:8080/api/v1/jobs?page=1&pageSize=10"

# Get specific job
curl "http://localhost:8080/api/v1/jobs/JOB_ID"

# Get job matches (requires auth)
curl "http://localhost:8080/api/v1/jobs/matches" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Job Categories**
```bash
curl http://localhost:8080/api/v1/workflow/categories
```

Expected:
```json
{
  "success": true,
  "data": {
    "categories": {
      "Full-time": 8000,
      "Remote": 2000,
      "Contract": 1000
    },
    "totalJobs": 11000
  }
}
```

---

## 📊 Postman Collection

Import the Postman collections from `/postman` directory:
- `rizq-ai-enterprise-scraping.postman_collection.json`
- `rizq-ai-gmail-outreach.postman_collection.json`
- `RizqAI-Full.postman_collection.json`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Jobs service not found in registry"
**Solution:** Ensure services are initialized properly
```bash
# Check logs for service initialization
# Should see: "✅ Services initialized successfully"
```

### Issue 2: "Gmail not connected"
**Solution:** Complete OAuth flow first
```bash
# Visit /api/v1/email-outreach/oauth/google/start
```

### Issue 3: "No jobs found"
**Solution:** Populate database with jobs first
```bash
# Run scraping manually or insert sample jobs
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobs": [...]}'
```

### Issue 4: "Consent required"
**Solution:** Grant email consent
```bash
POST /api/v1/email-outreach/consent
```

---

## ✅ Success Indicators

### Backend is Working When:
- ✅ Health check returns 200
- ✅ Job search returns results
- ✅ Personalized recommendations work (with resume)
- ✅ Email applications queue successfully
- ✅ Dashboard shows correct stats

### Ready for Frontend When:
- ✅ All endpoints return correct data structure
- ✅ Error messages are clear and consistent
- ✅ Pagination works correctly
- ✅ Filters work as expected
- ✅ Sorting works correctly

---

## 🔍 Monitoring & Debugging

### Check Logs
```bash
# Watch logs
tail -f logs/app.log

# Check specific service logs
grep "JobsService" logs/app.log
grep "WorkflowController" logs/app.log
```

### Check Database
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/rizq-ai

# Check job counts
db.jobs.countDocuments()

# Check recent jobs
db.jobs.find().sort({postedAt: -1}).limit(5)

# Check users
db.users.find()
```

### Check Redis
```bash
# Connect to Redis
redis-cli

# Check keys
KEYS *

# Check queue status
LLEN bull:email-outreach:wait
```

---

## 📈 Performance Testing

### Load Testing (using Apache Bench)
```bash
# Test job search endpoint
ab -n 1000 -c 10 "http://localhost:8080/api/v1/workflow/search?query=engineer"

# Expected: < 200ms average response time
```

### Database Query Performance
```bash
# In MongoDB
db.jobs.find({title: /engineer/i}).explain("executionStats")

# Should use indexes efficiently
```

---

## 🎉 Testing Complete!

If all tests pass, your backend is ready for frontend integration! 🚀






