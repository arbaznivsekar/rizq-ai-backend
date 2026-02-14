#!/bin/bash

# Multi-Role Job Scraper for RIZQ.AI
# This script scrapes jobs for different roles and saves them to the database

echo "🚀 RIZQ.AI Multi-Role Job Scraper"
echo "=================================="
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

# Define job roles to scrape
declare -a roles=(
    "software engineer"
    "data scientist"
    "product manager"
    "devops engineer"
    "frontend developer"
    "backend developer"
    "full stack developer"
    "machine learning engineer"
    "data analyst"
    "business analyst"
    "ui ux designer"
    "mobile developer"
    "cloud engineer"
    "security engineer"
    "qa engineer"
)

# Define locations
declare -a locations=(
    "bangalore"
    "mumbai"
    "delhi"
    "hyderabad"
    "chennai"
    "pune"
)

# Function to scrape jobs for a specific role and location
scrape_jobs() {
    local role="$1"
    local location="$2"
    local job_count="$3"
    
    echo "📡 Scraping: $role in $location (max $job_count jobs)..."
    
    response=$(curl -s -X POST http://localhost:8080/api/v1/scraping/jobs \
      -H "Content-Type: application/json" \
      -d "{
        \"boardType\": \"naukri\",
        \"searchParams\": {
          \"query\": \"$role\",
          \"location\": \"$location\",
          \"limit\": $job_count
        },
        \"config\": {
          \"name\": \"$role in $location\"
        }
      }")
    
    # Extract job ID
    jobId=$(echo "$response" | jq -r '.data.jobId' 2>/dev/null)
    
    if [ "$jobId" != "null" ] && [ -n "$jobId" ]; then
        echo "   ✅ Job started: $jobId"
        
        # Wait for completion
        for i in {1..30}; do
            status=$(curl -s "http://localhost:8080/api/v1/scraping/jobs/$jobId")
            current_status=$(echo "$status" | jq -r '.data.status' 2>/dev/null)
            jobs_found=$(echo "$status" | jq -r '.data.progress.found' 2>/dev/null)
            
            if [ "$current_status" = "completed" ]; then
                echo "   ✅ Completed: $jobs_found jobs found"
                return 0
            elif [ "$current_status" = "failed" ]; then
                echo "   ❌ Failed: $role in $location"
                return 1
            fi
            
            sleep 3
        done
        
        echo "   ⏳ Timeout: $role in $location"
        return 1
    else
        echo "   ❌ Failed to start: $role in $location"
        return 1
    fi
}

# Function to get current job count
get_job_count() {
    curl -s "http://localhost:8080/api/v1/workflow/search?query=*&limit=1" | jq -r '.data.total' 2>/dev/null || echo "0"
}

# Get initial job count
initial_count=$(get_job_count)
echo "📊 Current jobs in database: $initial_count"
echo ""

# Scraping strategy: Focus on top roles in major cities
echo "🎯 Scraping Strategy:"
echo "   - Top 5 roles in top 3 cities"
echo "   - 20 jobs per role per city"
echo "   - Estimated: 300+ new jobs"
echo ""

# Scrape top roles in major cities
success_count=0
total_attempts=0

for role in "${roles[@]:0:5}"; do  # Top 5 roles
    for location in "${locations[@]:0:3}"; do  # Top 3 cities
        total_attempts=$((total_attempts + 1))
        
        if scrape_jobs "$role" "$location" 20; then
            success_count=$((success_count + 1))
        fi
        
        # Small delay between requests
        sleep 2
    done
done

echo ""
echo "📊 Scraping Summary:"
echo "   Total attempts: $total_attempts"
echo "   Successful: $success_count"
echo "   Failed: $((total_attempts - success_count))"
echo ""

# Get final job count
final_count=$(get_job_count)
new_jobs=$((final_count - initial_count))

echo "🎉 Final Results:"
echo "   Initial jobs: $initial_count"
echo "   Final jobs: $final_count"
echo "   New jobs added: $new_jobs"
echo ""

if [ $new_jobs -gt 0 ]; then
    echo "✅ Successfully added $new_jobs new jobs to the database!"
    echo ""
    echo "🔍 Test your search:"
    echo "   curl \"http://localhost:8080/api/v1/workflow/search?query=software&limit=5\""
    echo ""
    echo "🌐 Check your frontend:"
    echo "   http://localhost:3000"
    echo ""
else
    echo "⚠️  No new jobs were added. Check the logs for errors."
fi

echo "🏁 Scraping completed!"
