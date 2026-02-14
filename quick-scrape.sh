#!/bin/bash

# Quick Job Scraper for RIZQ.AI
# This script quickly scrapes a few more roles to expand the database

echo "🚀 RIZQ.AI Quick Job Scraper"
echo "============================"
echo ""

# Check if server is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "❌ Backend server is not running!"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Get current job count
current_count=$(curl -s "http://localhost:8080/api/v1/workflow/search?query=*&limit=1" | jq -r '.data.total' 2>/dev/null || echo "0")
echo "📊 Current jobs in database: $current_count"
echo ""

# Define roles to scrape (quick selection)
declare -a roles=(
    "product manager"
    "devops engineer"
    "frontend developer"
    "backend developer"
    "full stack developer"
    "machine learning engineer"
    "data analyst"
    "business analyst"
    "python developer"
    "java developer"
)

# Function to scrape and import
scrape_and_import() {
    local role="$1"
    local location="$2"
    
    echo "📡 Scraping: $role in $location..."
    
    # Run scraper
    if node real-naukri-scraper.mjs "$role" "$location" 15 > /dev/null 2>&1; then
        # Find latest file
        latest_file=$(ls -t REAL-naukri-jobs-*-$(date +%Y-%m-%d).json 2>/dev/null | head -1)
        
        if [ -n "$latest_file" ]; then
            # Update import script
            sed -i "s/REAL-naukri-jobs-.*\.json/$latest_file/" scripts/import-scraped-jobs.ts
            
            # Import jobs
            if npx tsx scripts/import-scraped-jobs.ts > /dev/null 2>&1; then
                job_count=$(jq -r '.totalJobs' "$latest_file" 2>/dev/null || echo "0")
                echo "   ✅ Imported $job_count jobs"
                return 0
            fi
        fi
    fi
    
    echo "   ❌ Failed"
    return 1
}

# Scrape each role in Bangalore
success_count=0
total_attempts=0

for role in "${roles[@]}"; do
    total_attempts=$((total_attempts + 1))
    
    if scrape_and_import "$role" "bangalore"; then
        success_count=$((success_count + 1))
    fi
    
    # Small delay
    sleep 2
done

echo ""
echo "📊 Quick Scraping Summary:"
echo "   Total attempts: $total_attempts"
echo "   Successful: $success_count"
echo "   Failed: $((total_attempts - success_count))"
echo ""

# Get final job count
final_count=$(curl -s "http://localhost:8080/api/v1/workflow/search?query=*&limit=1" | jq -r '.data.total' 2>/dev/null || echo "0")
new_jobs=$((final_count - current_count))

echo "🎉 Results:"
echo "   Initial jobs: $current_count"
echo "   Final jobs: $final_count"
echo "   New jobs added: $new_jobs"
echo ""

if [ $new_jobs -gt 0 ]; then
    echo "✅ Successfully added $new_jobs new jobs!"
    echo ""
    echo "🔍 Test your search:"
    echo "   curl \"http://localhost:8080/api/v1/workflow/search?query=product&limit=3\""
    echo ""
    echo "🌐 Check your frontend:"
    echo "   http://localhost:3000"
    echo ""
else
    echo "⚠️  No new jobs were added."
fi

echo "🏁 Quick scraping completed!"



