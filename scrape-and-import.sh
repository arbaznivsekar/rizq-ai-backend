#!/bin/bash

# Comprehensive Job Scraper and Importer for RIZQ.AI
# This script scrapes jobs for multiple roles and automatically imports them to the database

echo "🚀 RIZQ.AI Comprehensive Job Scraper & Importer"
echo "==============================================="
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

# Function to get current job count
get_job_count() {
    curl -s "http://localhost:8080/api/v1/workflow/search?query=*&limit=1" | jq -r '.data.total' 2>/dev/null || echo "0"
}

# Get initial job count
initial_count=$(get_job_count)
echo "📊 Current jobs in database: $initial_count"
echo ""

# Define roles to scrape
declare -a roles=(
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
    "python developer"
    "java developer"
    "react developer"
    "nodejs developer"
    "angular developer"
    "vuejs developer"
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
echo "   Roles: ${#roles[@]} different roles"
echo "   Locations: ${#locations[@]} major cities"
echo "   Jobs per role per city: 15"
echo "   Estimated total: $(( ${#roles[@]} * ${#locations[@]} * 15 )) jobs"
echo ""

read -p "🤔 Do you want to proceed with scraping? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Scraping cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting scraping process..."
echo ""

# Scrape jobs for each role in each location
success_count=0
total_attempts=0
imported_jobs=0

for role in "${roles[@]}"; do
    echo "📋 Processing role: $role"
    echo "----------------------------------------"
    
    for location in "${locations[@]}"; do
        total_attempts=$((total_attempts + 1))
        
        echo "📡 Scraping: $role in $location..."
        
        # Run the scraper
        if node real-naukri-scraper.mjs "$role" "$location" 15 > /dev/null 2>&1; then
            echo "   ✅ Scraping completed for $role in $location"
            
            # Find the latest JSON file
            latest_file=$(ls -t REAL-naukri-jobs-*-$(date +%Y-%m-%d).json 2>/dev/null | head -1)
            
            if [ -n "$latest_file" ]; then
                echo "   📂 Found file: $latest_file"
                
                # Update the import script with the latest file
                sed -i "s/REAL-naukri-jobs-.*\.json/$latest_file/" scripts/import-scraped-jobs.ts
                
                # Import jobs
                if npx tsx scripts/import-scraped-jobs.ts > /dev/null 2>&1; then
                    echo "   ✅ Jobs imported successfully"
                    success_count=$((success_count + 1))
                    
                    # Count jobs in the file
                    job_count=$(jq -r '.totalJobs' "$latest_file" 2>/dev/null || echo "0")
                    imported_jobs=$((imported_jobs + job_count))
                else
                    echo "   ❌ Failed to import jobs"
                fi
            else
                echo "   ❌ No JSON file found"
            fi
        else
            echo "   ❌ Scraping failed for $role in $location"
        fi
        
        # Small delay between requests
        sleep 3
    done
    
    echo ""
done

echo ""
echo "📊 Scraping Summary:"
echo "   Total attempts: $total_attempts"
echo "   Successful: $success_count"
echo "   Failed: $((total_attempts - success_count))"
echo "   Estimated jobs imported: $imported_jobs"
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
    for role in "${roles[@]:0:10}"; do
        count=$(curl -s "http://localhost:8080/api/v1/workflow/search?query=$role&limit=1" | jq -r '.data.total' 2>/dev/null || echo "0")
        echo "   $role: $count jobs"
    done
    echo ""
else
    echo "⚠️  No new jobs were added. Check the logs for errors."
fi

echo "🏁 Scraping and import completed!"



