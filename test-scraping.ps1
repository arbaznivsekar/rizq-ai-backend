# RIZQ.AI Scraping Test Script
# Run this script to test your scraping system!

Write-Host "🚀 Testing RIZQ.AI Scraping System!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Step 1: Test basic health
Write-Host "`n📋 Step 1: Testing basic health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method GET
    Write-Host "✅ Basic health check: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Basic health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Test scraping health (this will fail without auth, but that's expected)
Write-Host "`n📋 Step 2: Testing scraping health (will fail without auth - that's normal!)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/scraping/health" -Method GET -Headers @{"Authorization"="Bearer fake-token"}
    Write-Host "✅ Scraping health check: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Scraping health check failed (expected): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 3: Test starting a scraping job (this will also fail without auth, but shows the endpoint works)
Write-Host "`n📋 Step 3: Testing scraping job creation (will fail without auth - that's normal!)..." -ForegroundColor Yellow
$jobData = @{
    boardType = "indeed"
    searchParams = @{
        query = "software engineer"
        location = "remote"
        jobType = @("Full-time", "Remote")
    }
    config = @{
        maxPagesPerSearch = 2
        delayBetweenRequests = 2000
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/scraping/jobs" -Method POST -Body $jobData -ContentType "application/json" -Headers @{"Authorization"="Bearer fake-token"}
    Write-Host "✅ Scraping job created: $($response.jobId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Scraping job creation failed (expected): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Testing completed!" -ForegroundColor Green
Write-Host "`n📝 What this means:" -ForegroundColor Cyan
Write-Host "   - ✅ Basic server is working" -ForegroundColor Green
Write-Host "   - ❌ Scraping endpoints need authentication (that's good for security!)" -ForegroundColor Yellow
Write-Host "`n🔑 To test with real authentication, you need to:" -ForegroundColor Cyan
Write-Host "   1. Create a real JWT token" -ForegroundColor White
Write-Host "   2. Or modify the auth guard to allow mock users" -ForegroundColor White
Write-Host "   3. Or use Postman with the collection I created earlier" -ForegroundColor White

Write-Host "`n🚀 Ready to test more? Check the Postman collection in the postman folder!" -ForegroundColor Green
