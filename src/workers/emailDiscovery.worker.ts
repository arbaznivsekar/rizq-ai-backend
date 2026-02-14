import { Job } from 'bullmq';
import { EmailCacheManager } from '../services/emailCacheManager.js';
import { HunterIOService } from '../services/hunterio.service.js';

type Payload = {
  userId: string;
  companies: Array<{ name: string; domain?: string; jobIds?: string[]; priority?: number }>;
};

export default async function emailDiscoveryProcessor(job: Job<Payload>) {
  const cache = new EmailCacheManager();
  const hunter = new HunterIOService();
  let credits = 0;
  const started = Date.now();
  for (const c of job.data.companies) {
    const hit = await cache.getCachedEmails({ name: c.name, domain: c.domain });
    if (hit.hit) continue;
    const res = await hunter.discoverCompanyEmails(c.name, c.domain);
    credits += res.credits || 0;
    await cache.cacheEmailResults({ name: c.name, domain: res.domain || c.domain }, res.emails, { responseMs: res.responseMs, credits: res.credits });
  }
  return { credits, ms: Date.now() - started };
}


