import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectRedis, redis } from '../src/db/redis.js';
import { ScrapingCache } from '../src/scraping/cache/ScrapingCache.js';

describe('ScrapingCache', () => {
  beforeAll(async () => {
    await connectRedis();
  });

  it('sets and gets job results', async () => {
    const jobId = `cache-test-${Date.now()}`;
    const payload = { ok: true, n: Math.random() };
    await ScrapingCache.setJobResults(jobId, payload, 60);
    const got = await ScrapingCache.getJobResults(jobId);
    // If redis is disabled (no-op), allow null; otherwise ensure payload shape
    if (!redis) {
      expect(got).toBeNull();
    } else {
      expect(got.ok).toBe(true);
      expect(typeof got.cachedAt).toBe('string');
    }
  });
  afterAll(async () => {
    try { if (redis && typeof redis.quit === 'function') await redis.quit(); } catch {}
  });
});


