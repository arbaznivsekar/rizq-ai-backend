// Check Gmail tokens in the correct database (test)
import { MongoClient } from 'mongodb';

async function checkTestDb() {
  console.log('🔍 Checking Gmail tokens in TEST database...\n');
  
  const mongoUri = 'mongodb+srv://nivsekarab11nb123:6UO2hGnmHuMUJlnH@cluster0.fjhwkf9.mongodb.net';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('test'); // Use the correct database name
    const users = db.collection('users');
    
    // Find user with Gmail tokens
    const user = await users.findOne({
      $or: [
        { gmailRefreshToken: { $exists: true } },
        { gmailAccessToken: { $exists: true } }
      ]
    });
    
    if (user) {
      console.log('🎉 Gmail tokens found!');
      console.log(`👤 User ID: ${user._id}`);
      console.log(`📧 Email: ${user.email || 'Not set'}`);
      console.log(`🔑 Has Refresh Token: ${user.gmailRefreshToken ? 'Yes' : 'No'}`);
      console.log(`🔑 Has Access Token: ${user.gmailAccessToken ? 'Yes' : 'No'}`);
      console.log(`⏰ Token Expiry: ${user.gmailTokenExpiry || 'Not set'}`);
      console.log(`📅 Connected At: ${user.gmailConnectedAt || 'Not set'}`);
      
      if (user.gmailRefreshToken && user.gmailAccessToken) {
        console.log('\n✅ OAuth flow completed successfully!');
        console.log('🚀 Ready for Gmail automation!');
      }
    } else {
      console.log('❌ No Gmail tokens found in test database');
      
      // Show all users for debugging
      const allUsers = await users.find({}).toArray();
      console.log(`\n📊 Total users in test database: ${allUsers.length}`);
      allUsers.forEach((u, i) => {
        console.log(`\n${i + 1}. User ID: ${u._id}`);
        console.log(`   Email: ${u.email || 'Not set'}`);
        console.log(`   Has Gmail tokens: ${u.gmailRefreshToken ? 'Yes' : 'No'}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkTestDb();
