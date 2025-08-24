import jwt from 'jsonwebtoken';
import https from 'https';
import http from 'http';

// Test configuration
const BASE_URL = 'http://localhost:8080';
const JWT_SECRET = 'test-secret-key-for-development-12345'; // This should match your env
const JWT_ISSUER = 'rizq-ai';
const JWT_AUDIENCE = 'rizq-ai-users';

// Create a test JWT token
function createTestToken() {
  const payload = {
    sub: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['admin'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test functions
async function testHealth() {
  console.log('🔍 Testing basic health...');
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    console.log(`✅ Health check: ${response.status} - ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function testScrapingHealth(token) {
  console.log('\n🔍 Testing scraping health...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/scraping/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Scraping health: ${response.status} - ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log(`❌ Scraping health failed: ${error.message}`);
    return false;
  }
}

async function testScrapingJobCreation(token) {
  console.log('\n🔍 Testing scraping job creation...');
  
  const jobData = {
    boardType: "indeed",
    searchParams: {
      query: "software engineer",
      location: "remote",
      jobType: ["Full-time", "Remote"]
    },
    config: {
      maxPagesPerSearch: 2,
      delayBetweenRequests: 2000
    }
  };

  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/scraping/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobData)
    });
    
    console.log(`✅ Scraping job created: ${response.status} - ${JSON.stringify(response.data)}`);
    return response.data.jobId;
  } catch (error) {
    console.log(`❌ Scraping job creation failed: ${error.message}`);
    return null;
  }
}

async function testJobStatus(token, jobId) {
  if (!jobId) return;
  
  console.log('\n🔍 Testing job status...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/scraping/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Job status: ${response.status} - ${JSON.stringify(response.data)}`);
  } catch (error) {
    console.log(`❌ Job status check failed: ${error.message}`);
  }
}

async function testAvailableScrapers(token) {
  console.log('\n🔍 Testing available scrapers...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/scraping/scrapers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Available scrapers: ${response.status} - ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log(`❌ Available scrapers check failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Testing RIZQ.AI Scraping System!');
  console.log('=====================================\n');

  // Test basic health
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('❌ Basic health check failed. Server might not be running.');
    return;
  }

  // Create test token
  const token = createTestToken();
  console.log(`🔑 Created test JWT token: ${token.substring(0, 20)}...`);

  // Test scraping endpoints
  await testScrapingHealth(token);
  await testAvailableScrapers(token);
  
  const jobId = await testScrapingJobCreation(token);
  if (jobId) {
    await testJobStatus(token, jobId);
  }

  console.log('\n🎉 Testing completed!');
}

// Run tests
runTests().catch(console.error);
