import { connectMongo } from '../src/db/mongo.js';
import { ingestJob } from '../src/data/pipelines/ingestEntry.js';

async function main() {
  await connectMongo();

  const job = {
    source: 'indeed' as const,
    externalId: 'abc123',
    canonicalUrl: 'https://indeed.com/viewjob?jk=abc123',
    title: 'Software Engineer',
    company: { name: 'Acme Corp', domain: 'acme.com' },
    location: { city: 'Mumbai', country: 'IN', remoteType: 'hybrid' as const },
    salary: { min: 1000000, max: 2000000, currency: 'INR', period: 'year' as const },
    postedAt: new Date().toISOString(),
    description: 'Build products with JavaScript and Node. Insurance and bonus offered.',
    skills: ['Node', 'JavaScript']
  };

  const res = await ingestJob(job as any);
  console.log('Ingest result:', res);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


