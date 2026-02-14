#!/bin/bash

echo "=========================================="
echo "📧 EMAIL STATUS CHECKER"
echo "=========================================="
echo ""

# Check if MongoDB connection string exists
if [ -f .env ]; then
  MONGODB_URI=$(grep "^MONGO_URI=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  if [ -z "$MONGODB_URI" ]; then
    MONGODB_URI=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  fi
else
  echo "❌ .env file not found"
  exit 1
fi

if [ -z "$MONGODB_URI" ]; then
  echo "❌ MongoDB URI not found in .env"
  exit 1
fi

echo "🔍 Checking recent email queue entries..."
echo ""

# Use node to query MongoDB
node << 'NODE_SCRIPT'
const { MongoClient } = require('mongodb');
const fs = require('fs');

async function checkEmails() {
  let mongoUri = process.env.MONGODB_URI || '';
  
  if (!mongoUri && fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const mongoMatch = envContent.match(/^MONGO_URI=(.+)$/m) || envContent.match(/^DATABASE_URL=(.+)$/m);
    if (mongoMatch) {
      mongoUri = mongoMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  if (!mongoUri) {
    console.log('❌ MongoDB URI not found');
    process.exit(1);
  }

  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db();
    
    console.log('✅ Connected to MongoDB\n');
    
    // Get recent email queue entries
    const emails = await db.collection('emailsendqueues')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    if (emails.length === 0) {
      console.log('📭 No emails found in queue\n');
      await client.close();
      return;
    }
    
    console.log(`📬 Found ${emails.length} recent email(s):\n`);
    
    emails.forEach((email, idx) => {
      console.log(`--- Email ${idx + 1} ---`);
      console.log(`ID: ${email._id}`);
      console.log(`Status: ${email.status || 'unknown'}`);
      console.log(`Recipient: ${email.recipientEmail || 'N/A'}`);
      if (email.metadata?.originalRecipient) {
        console.log(`Original Recipient: ${email.metadata.originalRecipient}`);
        console.log(`Redirected: ${email.metadata.isRedirected ? '✅ YES' : '❌ NO'}`);
        console.log(`Mode: ${email.metadata.redirectMode || 'N/A'}`);
      }
      console.log(`Subject: ${email.emailContent?.subject || 'N/A'}`);
      console.log(`Created: ${email.createdAt || 'N/A'}`);
      console.log(`Sent At: ${email.sentAt || 'Not sent yet'}`);
      if (email.error) {
        console.log(`❌ Error: ${email.error}`);
      }
      if (email.sendAttempt) {
        console.log(`Attempts: ${email.sendAttempt}`);
      }
      console.log('');
    });
    
    // Summary
    const statusCounts = emails.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEmails();
NODE_SCRIPT

echo ""
echo "=========================================="
