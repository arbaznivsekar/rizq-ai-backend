import { Request, Response } from 'express';
import { EmailCacheManager } from '../services/emailCacheManager.js';
import { HunterIOService } from '../services/hunterio.service.js';
import { enqueueEmailDiscovery } from '../queues/emailDiscovery.queue.js';
import { logger } from '../config/logger.js';

export async function discoverEmails(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { job_ids = [], companies = [] } = req.body || {};
  const cache = new EmailCacheManager();
  const hunter = new HunterIOService();
  const start = Date.now();

  const identifiers: Array<{ name: string; domain?: string }> = companies;

  const results: any[] = [];
  const misses: Array<{ name: string; domain?: string }> = [];
  for (const c of identifiers) {
    const hit = await cache.getCachedEmails({ name: c.name, domain: c.domain });
    if (hit.hit) {
      results.push({ company: c, emails: (hit as any).doc.emails, cache: true });
    } else {
      misses.push(c);
    }
  }

  if (misses.length > 0) {
    // process misses sequentially for API latency; large batches should use queue
    for (const m of misses) {
      const resd = await hunter.discoverCompanyEmails(m.name, m.domain);
      await cache.cacheEmailResults({ name: m.name, domain: resd.domain || m.domain }, resd.emails, { responseMs: resd.responseMs, credits: resd.credits });
      results.push({ company: m, emails: resd.emails, cache: false, responseMs: resd.responseMs, credits: resd.credits });
    }
  }

  const responseTime = Date.now() - start;
  const cacheHits = results.filter(r => r.cache).length;
  res.json({
    success: true,
    data: {
      discovered_emails: results,
      cache_performance: { hits: cacheHits, misses: misses.length, hitRate: results.length ? cacheHits / results.length : 0 },
      credits_consumed: results.reduce((s, r) => s + (r.credits || 0), 0),
      processing_time: responseTime
    }
  });
}

export async function discoveryStatus(_req: Request, res: Response) {
  res.json({ success: true, data: { status: 'not_queued' } });
}

export async function preemptiveDiscovery(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { companies = [] } = req.body || {};
  const job = await enqueueEmailDiscovery({ userId, companies });
  res.json({ success: true, data: { jobId: job.id } });
}


