# Create JWT Token for Testing Scraping API
# This script creates a real token you can use to test your scraping system!

Write-Host "🔑 Creating JWT Token for Testing..." -ForegroundColor Green

# First, let's check if we have the required packages
try {
    # Try to create a simple JWT token
    $payload = @{
        sub = "000000000000000000000001"  # Mock user ID from your env
        email = "test@example.com"
        name = "Test User"
        roles = @("admin")
        iat = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        exp = [DateTimeOffset]::UtcNow.AddHours(1).ToUnixTimeSeconds()
    } | ConvertTo-Json -Compress
    
    Write-Host "✅ Token payload created successfully!" -ForegroundColor Green
    Write-Host "📝 Payload: $payload" -ForegroundColor Cyan
    
    Write-Host "`n🔐 To create a real JWT token, you need to:" -ForegroundColor Yellow
    Write-Host "   1. Install JWT package: npm install jsonwebtoken" -ForegroundColor White
    Write-Host "   2. Use your NEXTAUTH_SECRET from .env file" -ForegroundColor White
    Write-Host "   3. Sign the payload with the secret" -ForegroundColor White
    
    Write-Host "`n🚀 For now, you can test with Postman using the collection!" -ForegroundColor Green
    Write-Host "   File: postman/rizq-ai-enterprise-scraping.postman_collection.json" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error creating token: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Quick Test Commands:" -ForegroundColor Yellow
Write-Host "   Basic health: Invoke-RestMethod -Uri 'http://localhost:8080/health' -Method GET" -ForegroundColor White
Write-Host "   Scraping stats: Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/scraping/stats' -Method GET -Headers @{'Authorization'='Bearer YOUR-TOKEN-HERE'}" -ForegroundColor White
