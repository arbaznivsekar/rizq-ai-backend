#!/usr/bin/env ts-node

import dotenv from 'dotenv-flow';
import mongoose from 'mongoose';
import JobModel from '../dist/src/models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rizq-ai';

async function main() {
  await mongoose.connect(MONGO_URI);

  const missing = await JobModel.aggregate([
    {
      $match: {
        $or: [
          { companyDomain: { $exists: false } },
          { companyDomain: null },
          { companyDomain: '' },
          { logoUrl: { $exists: false } },
          { logoUrl: null },
          { logoUrl: '' }
        ]
      }
    },
    { $group: { _id: '$company', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log('\nCompanies missing logos/domains:');
  for (const row of missing) {
    console.log(`- ${row._id} (${row.count})`);
  }
  console.log(`\nTotal: ${missing.length}`);

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('Failed:', e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});



