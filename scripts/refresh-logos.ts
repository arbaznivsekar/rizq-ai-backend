import mongoose from 'mongoose';
import JobModel from '../dist/src/models/Job.js';

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://nivsekarab11nb123:6UO2hGnmHuMUJlnH@cluster0.fjhwkf9.mongodb.net/';
  console.log('\n🚀 Starting Logo Refresh...');
  console.log(`\n📦 Connecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  try {
    const BATCH_SIZE = 200;
    let totalProcessed = 0;
    let totalUpdated = 0;

    while (true) {
      const jobs: any[] = await JobModel.find({
        companyDomain: { $exists: true, $nin: [null, ''] },
      })
        .select({ _id: 1, companyDomain: 1, logoUrl: 1 })
        .limit(BATCH_SIZE)
        .lean();

      if (jobs.length === 0) break;

      let updatedInBatch = 0;
      for (const job of jobs) {
        const domain = String(job.companyDomain).replace(/^www\./, '');
        const newLogo = `https://logo.clearbit.com/${domain}?size=256`;
        if (job.logoUrl !== newLogo) {
          await JobModel.updateOne({ _id: job._id }, { $set: { logoUrl: newLogo } });
          updatedInBatch++;
        }
      }

      totalProcessed += jobs.length;
      totalUpdated += updatedInBatch;
      console.log(`  ✅ Batch processed: ${jobs.length}, updated: ${updatedInBatch}, total updated: ${totalUpdated}`);

      if (updatedInBatch === 0) break;
    }

    console.log('\n======================================================================');
    console.log('📊 REFRESH SUMMARY');
    console.log('======================================================================');
    console.log(`✅ Processed: ${totalProcessed} jobs`);
    console.log(`✅ Updated:   ${totalUpdated} jobs`);
    console.log('======================================================================');
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
    console.log('\n✅ Logo refresh complete!');
  }
}

main().catch((err) => {
  console.error('Logo refresh failed:', err);
  process.exit(1);
});


