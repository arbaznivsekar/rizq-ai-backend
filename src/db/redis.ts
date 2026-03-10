import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export let redis: any = null;

export async function connectRedis() {
  try {
    if (!env.REDIS_URL) {
      logger.warn("REDIS_URL not set; Redis disabled (queues/email sending will not run)");
      return;
    }
    // Use the configured REDIS_URL; avoid hardcoded hosts
    redis = new (Redis as any)(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    await redis.ping();
    logger.info("Connected to Redis");
  } catch (err) {
    logger.warn(`Redis connection failed: ${err}`);
    redis = null;
  }
}


