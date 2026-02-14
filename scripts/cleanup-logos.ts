#!/usr/bin/env ts-node

/**
 * Cleanup listing-site branding and prepare for real logo backfill
 * Usage:
 *   npm run build && npx ts-node scripts/cleanup-logos.ts
 */

import dotenv from 'dotenv-flow';
import mongoose from 'mongoose';
import JobModel from '../dist/src/models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rizq-ai';

async function cleanup() {
  try {
    console.log(`\n🧹 Starting Logo Cleanup...`);
    console.log(`📦 Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const SOURCE_DOMAINS = ['naukri.com','linkedin.com','indeed.com','glassdoor.com','monsterindia.com','timesjobs.com'];

    // Unset branding where companyDomain is a listing domain
    const res1 = await JobModel.updateMany(
      { companyDomain: { $in: SOURCE_DOMAINS } },
      { $unset: { companyDomain: '', logoUrl: '' } }
    );
    console.log(`🧽 Unset branding on listing domains: matched=${res1.matchedCount ?? (res1 as any).n} modified=${res1.modifiedCount ?? (res1 as any).nModified}`);

    // Clear duckduckgo favicons that point to listing domains (process in app code for compatibility)
    const badFavicons = await JobModel.find({ logoUrl: { $regex: /icons\.duckduckgo\.com\/ip3\//i } })
      .select({ _id: 1, logoUrl: 1 })
      .lean();
    let cleared = 0;
    for (const j of badFavicons) {
      try {
        const url = String(j.logoUrl);
        const match = url.match(/icons\.duckduckgo\.com\/ip3\/([^/]+)\.ico/i);
        const domain = match?.[1]?.toLowerCase();
        if (domain && SOURCE_DOMAINS.includes(domain)) {
          await JobModel.findByIdAndUpdate(j._id, { $unset: { logoUrl: '' } });
          cleared++;
        }
      } catch {}
    }
    console.log(`🧽 Cleaned listing favicons: examined=${badFavicons.length} cleared=${cleared}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    console.log('✅ Cleanup complete. Now run: npx ts-node scripts/backfill-logos.ts');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Cleanup failed:', err.message);
    console.error(err.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

cleanup();


