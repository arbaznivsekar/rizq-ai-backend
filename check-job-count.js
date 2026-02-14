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

// Count jobs
const jobCount = await db.collection('jobs').countDocuments();
console.log(`📊 Total Jobs in Database: ${jobCount}\n`);

// Get sample jobs
const sampleJobs = await db.collection('jobs').find({}).limit(1).toArray();

if (sampleJobs.length > 0) {
  const job = sampleJobs[0];
  console.log('📝 Sample Job Structure:');
  console.log(`   - _id: ${job._id}`);
  console.log(`   - title: ${job.title || 'N/A'}`);
  console.log(`   - company: ${job.company?.name || job.company || 'N/A'}`);
  console.log(`   - url: ${job.url || job.jobUrl || 'N/A'}`);
  console.log(`   - source: ${job.source || 'N/A'}`);
  console.log(`   - externalId: ${job.externalId || 'N/A'}`);
  console.log(`   - createdAt: ${job.createdAt || 'N/A'}\n`);
  
  // Check duplicate detection fields
  const keyFields = ['externalId', 'url', 'source', 'jobId'];
  console.log('🔑 Duplicate Detection Fields:');
  keyFields.forEach(field => {
    if (job[field]) console.log(`   ✅ ${field}: ${job[field]}`);
  });
}

// Check for JSON files in current directory
import { readdirSync } from 'fs';
const jsonFiles = readdirSync('.').filter(f => f.endsWith('.json') && f.includes('jobs'));
if (jsonFiles.length > 0) {
  console.log(`\n📁 Found ${jsonFiles.length} job JSON file(s):`);
  jsonFiles.forEach(f => console.log(`   - ${f}`));
}

await client.close();
