#!/bin/bash

echo "=========================================="
echo "🔧 WORKER STATUS CHECKER"
echo "=========================================="
echo ""

# Check if Redis connection string exists
if [ -f .env ]; then
  REDIS_URI=$(grep "^REDIS_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
  echo "❌ .env file not found"
  exit 1
fi

if [ -z "$REDIS_URI" ]; then
  echo "❌ REDIS_URL not found in .env"
  exit 1
fi

echo "🔍 Checking BullMQ queue status..."
echo ""

# Use node to query Redis/BullMQ
node << 'NODE_SCRIPT'
import('ioredis').then(async ({ default: Redis }) => {
  const fs = require('fs');
  
  let redisUri = process.env.REDIS_URL || '';
  
  if (!redisUri && fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const redisMatch = envContent.match(/^REDIS_URL=(.+)$/m);
    if (redisMatch) {
      redisUri = redisMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  if (!redisUri) {
    console.log('❌ Redis URI not found');
    process.exit(1);
  }

  try {
    const redis = new Redis(redisUri);
    await redis.ping();
    console.log('✅ Connected to Redis\n');
    
    // Check BullMQ queue stats
    const queueName = 'email-outreach';
    
    // Get queue metrics using BullMQ keys
    const keys = await redis.keys(`bull:${queueName}:*`);
    
    if (keys.length === 0) {
      console.log('📭 No queue data found (queue might be empty or not initialized)\n');
      await redis.quit();
      return;
    }
    
    // Check waiting jobs
    const waiting = await redis.llen(`bull:${queueName}:wait`);
    const active = await redis.llen(`bull:${queueName}:active`);
    const completed = await redis.zcard(`bull:${queueName}:completed`);
    const failed = await redis.zcard(`bull:${queueName}:failed`);
    
    console.log(`📊 Queue Status for "${queueName}":`);
    console.log(`  ⏳ Waiting: ${waiting}`);
    console.log(`  🔄 Active: ${active}`);
    console.log(`  ✅ Completed: ${completed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log('');
    
    // Get recent job IDs
    if (waiting > 0) {
      console.log('⏳ Waiting Jobs:');
      const waitingIds = await redis.lrange(`bull:${queueName}:wait`, 0, 4);
      waitingIds.forEach(id => console.log(`  - ${id}`));
      console.log('');
    }
    
    if (failed > 0) {
      console.log('❌ Recent Failed Jobs (last 3):');
      const failedJobs = await redis.zrange(`bull:${queueName}:failed`, -3, -1, 'REV');
      for (const jobId of failedJobs) {
        const jobData = await redis.hgetall(`bull:${queueName}:${jobId}`);
        console.log(`  Job ID: ${jobId}`);
        if (jobData.failedReason) {
          console.log(`    Error: ${jobData.failedReason}`);
        }
      }
      console.log('');
    }
    
    await redis.quit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
});
NODE_SCRIPT

echo ""
echo "=========================================="
