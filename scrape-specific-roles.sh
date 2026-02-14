#!/bin/bash

# Specific Role Job Scraper for RIZQ.AI
# This script scrapes jobs for specific roles you choose

echo "🚀 RIZQ.AI Specific Role Job Scraper"
echo "===================================="
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

# Define specific roles to scrape (you can modify these)
declare -a target_roles=(
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

echo "🎯 Scraping Plan:"
echo "   Roles: ${#target_roles[@]} different roles"
echo "   Locations: ${#locations[@]} major cities"
echo "   Jobs per role per city: 30"
echo "   Estimated total: $(( ${#target_roles[@]} * ${#locations[@]} * 30 )) jobs"
echo ""

read -p "🤔 Do you want to proceed? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Scraping cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting scraping process..."
echo ""

# Scrape all roles in all locations
success_count=0
total_attempts=0

for role in "${target_roles[@]}"; do
    echo "📋 Processing role: $role"
    echo "----------------------------------------"
    
    for location in "${locations[@]}"; do
        total_attempts=$((total_attempts + 1))
        
        if scrape_jobs "$role" "$location" 30; then
            success_count=$((success_count + 1))
        fi
        
        # Small delay between requests
        sleep 2
    done
    
    echo ""
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
    
    # Show some sample job counts by role
    echo "📈 Sample job counts by role:"
    for role in "${target_roles[@]:0:5}"; do
        count=$(curl -s "http://localhost:8080/api/v1/workflow/search?query=$role&limit=1" | jq -r '.data.total' 2>/dev/null || echo "0")
        echo "   $role: $count jobs"
    done
    echo ""
else
    echo "⚠️  No new jobs were added. Check the logs for errors."
fi

echo "🏁 Scraping completed!"



