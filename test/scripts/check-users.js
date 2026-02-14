// Check all users in database
import { MongoClient } from 'mongodb';

async function checkUsers() {
  console.log('🔍 Checking all users in database...\n');
  
  const mongoUri = 'mongodb+srv://nivsekarab11nb123:6UO2hGnmHuMUJlnH@cluster0.fjhwkf9.mongodb.net';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('rizq-ai');
    const users = db.collection('users');
    
    // Count total users
    const totalUsers = await users.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Find all users
    const allUsers = await users.find({}).toArray();
    
    if (allUsers.length > 0) {
      console.log('\n👥 Users found:');
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user._id}`);
        console.log(`   Email: ${user.email || 'Not set'}`);
        console.log(`   Gmail Refresh Token: ${user.gmailRefreshToken ? 'Yes' : 'No'}`);
        console.log(`   Gmail Access Token: ${user.gmailAccessToken ? 'Yes' : 'No'}`);
        console.log(`   Gmail Connected At: ${user.gmailConnectedAt || 'Not set'}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkUsers();
