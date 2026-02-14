// Check if Gmail tokens are saved in database
import mongoose from 'mongoose';
import User from './src/models/User.ts';

console.log('🔍 Checking Gmail tokens in database...\n');

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://nivsekarab11nb123:6UO2hGnmHuMUJlnH@cluster0.fjhwkf9.mongodb.net';
await mongoose.connect(mongoUri);

// Find user with Gmail tokens
const user = await User.findOne({ 
  $or: [
    { gmailRefreshToken: { $exists: true } },
    { gmailAccessToken: { $exists: true } }
  ]
});

if (user) {
  console.log('✅ Gmail tokens found!');
  console.log(`👤 User ID: ${user._id}`);
  console.log(`📧 Email: ${user.email || 'Not set'}`);
  console.log(`🔑 Has Refresh Token: ${user.gmailRefreshToken ? 'Yes' : 'No'}`);
  console.log(`🔑 Has Access Token: ${user.gmailAccessToken ? 'Yes' : 'No'}`);
  console.log(`⏰ Token Expiry: ${user.gmailTokenExpiry || 'Not set'}`);
  console.log(`📅 Connected At: ${user.gmailConnectedAt || 'Not set'}`);
} else {
  console.log('❌ No Gmail tokens found in database');
  console.log('💡 Complete the OAuth flow first');
}

await mongoose.disconnect();
