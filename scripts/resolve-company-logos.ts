#!/usr/bin/env ts-node

/**
 * Resolve distinct company names to domains and logos, then update all jobs of that company.
 * Usage:
 *   npm run build && npx ts-node scripts/resolve-company-logos.ts
 */

import dotenv from 'dotenv-flow';
import mongoose from 'mongoose';
import JobModel from '../dist/src/models/Job.js';
import { logoService } from '../dist/src/services/logo.service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rizq-ai';
const LIMIT = parseInt(process.env.COMPANY_LIMIT || '10000', 10);

async function main() {
  console.log('\n🔎 Resolving company logos (distinct by name)');
  console.log(`📦 Connecting to MongoDB: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  // Get distinct company names missing branding
  const companyNames: string[] = await JobModel.distinct('company', {
    $or: [
      { companyDomain: { $exists: false } },
      { companyDomain: null },
      { companyDomain: '' },
      { logoUrl: { $exists: false } },
      { logoUrl: null },
      { logoUrl: '' }
    ]
  });

  const names = companyNames.filter(Boolean).slice(0, LIMIT);
  console.log(`📚 Companies to resolve: ${names.length}`);

  let resolved = 0;
  for (const name of names) {
    try {
      const { companyDomain, logoUrl } = await logoService.resolve(name, null, null);
      if (!companyDomain && !logoUrl) continue;

      const update: any = {};
      if (companyDomain) update.companyDomain = companyDomain;
      if (logoUrl) update.logoUrl = logoUrl;

      if (Object.keys(update).length > 0) {
        const res = await JobModel.updateMany(
          { company: name },
          { $set: update }
        );
        resolved++;
        console.log(`✅ ${resolved}/${names.length} ${name}: updated ${res.modifiedCount ?? (res as any).nModified}`);
      }
    } catch (e: any) {
      console.warn(`⚠️  Failed to resolve ${name}: ${e.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n🎉 Done. Refresh the app to see logos.');
}

main().catch(async (e) => {
  console.error('❌ Failed:', e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});



