// OAuth Flow Test Script
const https = require('https');
const http = require('http');

console.log('🚀 Testing OAuth Flow...\n');

// Test 1: Check if server is running
console.log('1️⃣ Testing server health...');
const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/auth/google/connect',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Server responded with status: ${res.statusCode}`);
  console.log(`📍 Location header: ${res.headers.location || 'No redirect'}`);
  
  if (res.headers.location) {
    console.log('\n2️⃣ OAuth URL Analysis:');
    const oauthUrl = res.headers.location;
    console.log(`🔗 Generated OAuth URL: ${oauthUrl}`);
    
    // Check if URL contains required parameters
    const hasClientId = oauthUrl.includes('client_id=');
    const hasRedirectUri = oauthUrl.includes('redirect_uri=');
    const hasResponseType = oauthUrl.includes('response_type=');
    const hasScope = oauthUrl.includes('scope=');
    const hasState = oauthUrl.includes('state=');
    
    console.log(`✅ Client ID: ${hasClientId ? 'Present' : 'Missing'}`);
    console.log(`✅ Redirect URI: ${hasRedirectUri ? 'Present' : 'Missing'}`);
    console.log(`✅ Response Type: ${hasResponseType ? 'Present' : 'Missing'}`);
    console.log(`✅ Scope: ${hasScope ? 'Present' : 'Missing'}`);
    console.log(`✅ State: ${hasState ? 'Present' : 'Missing'}`);
    
    if (hasClientId && hasRedirectUri && hasResponseType && hasScope && hasState) {
      console.log('\n🎉 OAuth URL looks perfect! Ready for testing.');
      console.log('\n📋 Next Steps:');
      console.log('1. Copy this URL and paste it in your browser');
      console.log('2. Complete the Google OAuth consent');
      console.log('3. Check if tokens are saved in database');
    } else {
      console.log('\n❌ OAuth URL is missing required parameters');
    }
  } else {
    console.log('❌ No redirect URL found - OAuth not working');
  }
});

req.on('error', (e) => {
  console.log(`❌ Server connection failed: ${e.message}`);
  console.log('💡 Make sure your server is running with: npm run dev');
});

req.end();
