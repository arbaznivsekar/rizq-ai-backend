import { redis } from "../../db/redis.js";
import { logger } from "../../config/logger.js";

export class ScrapingCache {
  public static async setJobResults(jobId: string, result: unknown, ttlSeconds = 86400): Promise<void> {
    try {
      const key = `scraping:results:${jobId}`;
      const isObject = typeof result === 'object' && result !== null;
      const base: Record<string, any> = isObject ? (result as Record<string, any>) : { value: result };
      const payload = JSON.stringify({ ...base, cachedAt: new Date().toISOString() });
      if (redis && typeof redis.setex === 'function') {
        await redis.setex(key, ttlSeconds, payload);
      }
    } catch (err) {
      logger.warn(`ScrapingCache.setJobResults failed: ${err}`);
    }
  }

  public static async getJobResults(jobId: string): Promise<any | null> {
    try {
      const key = `scraping:results:${jobId}`;
      if (!redis || typeof redis.get !== 'function') return null;
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      logger.warn(`ScrapingCache.getJobResults failed: ${err}`);
      return null;
    }
  }
}


