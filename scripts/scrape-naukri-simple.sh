#!/bin/bash

# Simple Naukri Scraper Script
# This script triggers the scraping API endpoint

echo "🚀 Starting Naukri Job Scraper"
echo "================================"
echo ""

# Check if server is running
echo "🔍 Checking if backend server is running..."
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "❌ Backend server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "   cd /home/arbaz/projects/rizq-ai/rizq-ai-backend"
    echo "   npm run dev"
    echo ""
    exit 1
fi

echo "✅ Server is running"
echo ""

# Trigger scraping job
echo "📡 Sending scraping request..."
echo ""

response=$(curl -s -X POST http://localhost:8080/api/v1/scraping/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "boardType": "naukri",
    "searchParams": {
      "query": "software engineer",
      "location": "bangalore",
      "limit": 50
    },
    "config": {
      "name": "Naukri Initial Scrape"
    }
  }')

echo "📋 Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Extract job ID
jobId=$(echo "$response" | jq -r '.data.jobId' 2>/dev/null)

if [ "$jobId" != "null" ] && [ -n "$jobId" ]; then
    echo "✅ Scraping job started!"
    echo "   Job ID: $jobId"
    echo ""
    echo "🔍 Monitor progress:"
    echo "   curl http://localhost:8080/api/v1/scraping/jobs/$jobId"
    echo ""
    echo "⏳ This may take 2-5 minutes..."
    echo ""
    
    # Wait and check status
    echo "📊 Checking status in 5 seconds..."
    sleep 5
    
    for i in {1..20}; do
        status=$(curl -s "http://localhost:8080/api/v1/scraping/jobs/$jobId")
        current_status=$(echo "$status" | jq -r '.data.status' 2>/dev/null)
        jobs_found=$(echo "$status" | jq -r '.data.progress.found' 2>/dev/null)
        
        echo "   Status: $current_status | Jobs found: $jobs_found"
        
        if [ "$current_status" = "completed" ]; then
            echo ""
            echo "✅ Scraping completed successfully!"
            echo ""
            echo "🎉 Jobs are now in your database!"
            echo ""
            echo "🔍 Test the search:"
            echo "   curl \"http://localhost:8080/api/v1/workflow/search?query=software&limit=5\""
            echo ""
            exit 0
        elif [ "$current_status" = "failed" ]; then
            echo ""
            echo "❌ Scraping failed!"
            echo "$status" | jq '.' 2>/dev/null || echo "$status"
            exit 1
        fi
        
        sleep 5
    done
    
    echo ""
    echo "⏳ Still processing... Check manually:"
    echo "   curl http://localhost:8080/api/v1/scraping/jobs/$jobId"
else
    echo "❌ Failed to start scraping job"
    echo ""
    echo "Response was:"
    echo "$response"
fi


