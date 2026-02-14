#!/bin/bash

echo "=========================================="
echo "🔄 RETRY QUEUED EMAILS"
echo "=========================================="
echo ""

node << 'NODE_SCRIPT'
import('mongodb').then(async ({ MongoClient }) => {
  const fs = require('fs');
  
  let mongoUri = process.env.MONGODB_URI || '';
  
  if (!mongoUri && fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const mongoMatch = envContent.match(/^MONGO_URI=(.+)$/m) || envContent.match(/^DATABASE_URL=(.+)$/m);
    if (mongoMatch) {
      mongoUri = mongoMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db();
    
    console.log('✅ Connected to MongoDB\n');
    
    // Get queued emails
    const queuedEmails = await db.collection('emailsendqueues')
      .find({ status: 'queued' })
      .toArray();
    
    if (queuedEmails.length === 0) {
      console.log('✅ No queued emails found\n');
      await client.close();
      return;
    }
    
    console.log(`📬 Found ${queuedEmails.length} queued email(s)\n`);
    
    // Import the enqueue function
    const { enqueueEmailOutreach } = await import('./dist/src/queues/emailOutreach.queue.js');
    
    let success = 0;
    let failed = 0;
    
    for (const email of queuedEmails) {
      try {
        console.log(`📧 Enqueueing email ${email._id}...`);
        const result = await enqueueEmailOutreach({ queueId: String(email._id) });
        
        if (result.id) {
          console.log(`  ✅ Enqueued successfully (Job ID: ${result.id})\n`);
          success++;
        } else {
          console.log(`  ❌ Failed to enqueue\n`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}\n`);
        failed++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Success: ${success}`);
    console.log(`  ❌ Failed: ${failed}`);
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
});
NODE_SCRIPT

echo ""
echo "=========================================="
