import 'dotenv-flow/config';
import mongoose from 'mongoose';
import { connectMongo } from '../src/db/mongo.js';
import { gmailOutreachService } from '../src/services/gmailOutreachService.js';
import { ingestJob } from '../src/data/pipelines/ingestEntry.js';
import { JobModel } from '../src/data/models/Job.js';
import User from '../src/models/User.js';
import { EmailConsent, EmailSendQueue } from '../src/models/emailOutreach.js';

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const userEmail = process.env.SMOKE_USER_EMAIL || process.env.TEST_USER_EMAIL || 'you@example.com';
  const refresh = process.env.SMOKE_GMAIL_REFRESH_TOKEN || process.env.USER_GMAIL_REFRESH_TOKEN || '';

  if (!process.env.REDIS_URL) {
    // eslint-disable-next-line no-console
    console.log('WARN: REDIS_URL not set. Using default redis://127.0.0.1:6379');
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
  }

  await connectMongo();

  // Ensure user exists with gmailRefreshToken
  let user = await User.findOne({ email: userEmail });
  if (!user) {
    user = await User.create({ email: userEmail, name: 'Smoke Tester', roles: ['user'] } as any);
  }
  if (refresh) {
    (user as any).gmailRefreshToken = refresh;
    await user.save();
  }

  // Ensure consent
  await EmailConsent.updateMany({ userId: user._id, consentStatus: 'active' }, { $set: { consentStatus: 'withdrawn', withdrawnAt: new Date() } });
  await EmailConsent.create({ userId: user._id, consentDetails: 'Smoke test consent up to 40 emails/day via Gmail', consentStatus: 'active' });

  // Ingest a job (uses pipeline to set compositeKey and indexes)
  const dto: any = {
    source: 'indeed',
    externalId: `smoke-${Date.now()}`,
    canonicalUrl: 'https://example.com/job/senior-nodejs-engineer',
    title: 'Senior Node.js Engineer',
    company: { name: 'Acme Corp' },
    location: { city: 'Remote', country: 'IN', remoteType: 'remote' },
    postedAt: new Date().toISOString(),
    description: 'Hands-on Node/TS, queues, Mongo.',
    skills: ['Node.js', 'TypeScript', 'MongoDB']
  };
  const ingestRes = await ingestJob(dto);
  const jobDoc = await JobModel.findOne({ compositeKey: ingestRes.compositeKey }).lean();
  if (!jobDoc) throw new Error('Smoke job not found after ingest');
  const jobId = (jobDoc as { _id: any })._id;

  // Queue one email
  const res = await gmailOutreachService.queueBulkOutreach(String(user._id), [{ jobId: String(jobId) }]);
  // eslint-disable-next-line no-console
  console.log('Queued:', res);

  // Wait and check status
  await delay(5000);
  const items = await EmailSendQueue.find({ userId: user._id }).sort({ createdAt: -1 }).limit(3).lean();
  // eslint-disable-next-line no-console
  console.log('Latest queue items:', items.map(i => ({ id: i._id, status: i.status, error: i.error })));

  await mongoose.connection.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


