// Simple test to check Gmail tokens
import { MongoClient } from 'mongodb';

async function checkTokens() {
  console.log('🔍 Checking Gmail tokens in database...\n');
  
  const mongoUri = 'mongodb+srv://nivsekarab11nb123:6UO2hGnmHuMUJlnH@cluster0.fjhwkf9.mongodb.net';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('rizq-ai');
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
      console.log('❌ No Gmail tokens found in database');
      console.log('💡 The OAuth flow may not have completed properly');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkTokens();
