import { dataConfig } from '../../config/data.config.js';

// No-Redis test-friendly cache (in-memory). Safe for local testing only.
const mem = new Map<string, { value: any; expiresAt: number }>();

export class CacheService {
  async setJSON(key: string, value: any, ttlSeconds = dataConfig.cache.ttlSeconds) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    mem.set(key, { value, expiresAt });
  }

  async getJSON<T = any>(key: string): Promise<T | null> {
    const entry = mem.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { mem.delete(key); return null; }
    return entry.value as T;
  }

  async warmHotLists(job: { source: string; location?: { country?: string; city?: string }; skills?: string[]; }) {
    const now = Date.now();
    if (job.source) await this.setJSON(`jobs:latest:${job.source}`, { t: now }, dataConfig.cache.hotListTtlSeconds);
    const country = job.location?.country;
    const city = job.location?.city;
    if (country && city) await this.setJSON(`jobs:latest:${country}:${city}`, { t: now }, dataConfig.cache.hotListTtlSeconds);
    for (const s of (job.skills || []).slice(0, 5)) {
      await this.setJSON(`jobs:skill:${s.toLowerCase()}`, { t: now }, dataConfig.cache.hotListTtlSeconds);
    }
  }
}


