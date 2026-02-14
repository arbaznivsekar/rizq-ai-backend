#!/usr/bin/env ts-node

/**
 * Backfill companyDomain and logoUrl for existing jobs
 * Usage:
 *   npm run build && npx ts-node scripts/backfill-logos.ts
 * Env:
 *   MONGO_URI=mongodb://localhost:27017/rizqai (or your connection string)
 */

import dotenv from 'dotenv-flow';
import mongoose from 'mongoose';
// Use compiled dist imports (same pattern as import-scraped-jobs.ts)
import JobModel from '../dist/src/models/Job.js';
import { logoService } from '../dist/src/services/logo.service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rizq-ai';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10);

async function backfill() {
  try {
    console.log(`\n🚀 Starting Logo Backfill...\n`);
    console.log(`📦 Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB\n`);

    let updated = 0;
    let processed = 0;
    let batch = 0;

    while (true) {
      batch += 1;
      // Find jobs missing branding or having listing domains (we will replace those once)
      const SOURCE_DOMAINS = ['naukri.com','linkedin.com','indeed.com','glassdoor.com','monsterindia.com','timesjobs.com'];
      const jobs: any[] = await JobModel.find({
        $or: [
          { companyDomain: { $exists: false } },
          { companyDomain: null },
          { companyDomain: '' },
          { logoUrl: { $exists: false } },
          { logoUrl: null },
          { logoUrl: '' },
          { companyDomain: { $in: SOURCE_DOMAINS } }
        ]
      })
        .select({ title: 1, company: 1, url: 1, companyDomain: 1, logoUrl: 1 })
        .limit(BATCH_SIZE)
        .lean();

      if (jobs.length === 0) {
        console.log('\n✅ No more jobs requiring backfill.');
        break;
      }

      console.log(`\n📦 Batch #${batch} - Processing ${jobs.length} jobs...`);

      let updatedInBatch = 0;
      for (const job of jobs) {
        processed++;
        const { companyDomain, logoUrl } = await logoService.resolve(job.company, job.url, job.companyDomain);
        
        const update: any = {};
        if (companyDomain && !job.companyDomain) {
          update.companyDomain = companyDomain;
        }
        if (logoUrl && !job.logoUrl) {
          update.logoUrl = logoUrl;
        }
        
        if (Object.keys(update).length > 0) {
          await JobModel.findByIdAndUpdate(job._id, { $set: update }, { new: false });
          updated++;
          updatedInBatch++;
          if (updated % 10 === 0) {
            process.stdout.write(`  ✅ Updated: ${updated} jobs\r`);
          }
        }
      }
      
      console.log(`  ✅ Batch #${batch} complete - Updated: ${updated} total (${updatedInBatch} in this batch), Processed: ${processed} total`);

      // Safety: if nothing updated in this batch, stop to avoid looping
      if (updatedInBatch === 0) {
        console.log('ℹ️ No updates in this batch. Stopping backfill.');
        break;
      }
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Processed: ${processed} jobs`);
    console.log(`✅ Updated:   ${updated} jobs`);
    console.log('='.repeat(70) + '\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    console.log('\n✅ Logo backfill complete! Refresh your dashboard to see logos.\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Backfill failed:', error.message);
    console.error(error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

backfill();


