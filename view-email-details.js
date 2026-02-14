import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const mongoMatch = envContent.match(/^MONGO_URI=(.+)$/m) || envContent.match(/^DATABASE_URL=(.+)$/m);
const mongoUri = mongoMatch ? mongoMatch[1].trim().replace(/^["']|["']$/g, '') : '';

if (!mongoUri) {
  console.error('❌ MongoDB URI not found');
  process.exit(1);
}

const client = new MongoClient(mongoUri);
await client.connect();
const db = client.db();

console.log('✅ Connected to MongoDB\n');

// Get the most recent "sent" email
const sentEmail = await db.collection('emailsendqueues')
  .findOne({ status: 'sent' }, { sort: { sentAt: -1 } });

if (sentEmail) {
  console.log('📧 Most Recent Sent Email:');
  console.log('==========================================');
  console.log(`ID: ${sentEmail._id}`);
  console.log(`Status: ${sentEmail.status}`);
  console.log(`From: (User ID: ${sentEmail.userId})`);
  console.log(`To: ${sentEmail.recipientEmail}`);
  if (sentEmail.metadata?.originalRecipient) {
    console.log(`Original To: ${sentEmail.metadata.originalRecipient}`);
  }
  console.log(`Subject: ${sentEmail.emailContent?.subject || 'N/A'}`);
  console.log(`Sent At: ${sentEmail.sentAt || 'N/A'}`);
  console.log(`\n📝 Email Body:`);
  console.log(sentEmail.emailContent?.body || 'N/A');
  console.log('\n==========================================\n');
}

// Get all queued emails
const queuedEmails = await db.collection('emailsendqueues')
  .find({ status: 'queued' })
  .sort({ createdAt: -1 })
  .limit(5)
  .toArray();

if (queuedEmails.length > 0) {
  console.log(`\n⏳ Queued Emails (${queuedEmails.length} shown, may be more):`);
  queuedEmails.forEach((email, idx) => {
    console.log(`\n${idx + 1}. ID: ${email._id}`);
    console.log(`   To: ${email.recipientEmail}`);
    console.log(`   Subject: ${email.emailContent?.subject || 'N/A'}`);
    console.log(`   Created: ${email.createdAt}`);
  });
}

await client.close();
