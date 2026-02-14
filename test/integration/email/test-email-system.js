// Test Gmail email system
import http from 'http';

console.log('🚀 Testing Gmail Email System...\n');

// Test 1: Check Gmail status
console.log('1️⃣ Checking Gmail status...');
const statusOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/email-test/status',
  method: 'GET'
};

const statusReq = http.request(statusOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`✅ Status Response (${res.statusCode}):`);
    console.log(JSON.stringify(JSON.parse(data), null, 2));
    
    // Test 2: Send test email
    console.log('\n2️⃣ Sending test email...');
    const emailData = JSON.stringify({
      to: 'nivsekarab11nb123@gmail.com' // Use your Gmail address for testing
    });
    
    const emailOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/email-test/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailData)
      }
    };
    
    const emailReq = http.request(emailOptions, (emailRes) => {
      let emailResponseData = '';
      emailRes.on('data', (chunk) => emailResponseData += chunk);
      emailRes.on('end', () => {
        console.log(`✅ Email Response (${emailRes.statusCode}):`);
        console.log(JSON.stringify(JSON.parse(emailResponseData), null, 2));
        
        if (emailRes.statusCode === 200) {
          console.log('\n🎉 Gmail email system is working perfectly!');
          console.log('📧 Check your Gmail inbox for the test email!');
        } else {
          console.log('\n❌ Email sending failed. Check the error above.');
        }
      });
    });
    
    emailReq.on('error', (e) => {
      console.log(`❌ Email request failed: ${e.message}`);
    });
    
    emailReq.write(emailData);
    emailReq.end();
  });
});

statusReq.on('error', (e) => {
  console.log(`❌ Status request failed: ${e.message}`);
});

statusReq.end();
    