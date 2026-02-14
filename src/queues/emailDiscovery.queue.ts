import { Queue } from 'bullmq';
import { logger } from '../config/logger.js';
import { redis as redisClient } from '../db/redis.js';

let emailDiscoveryQueue: Queue | null = null;

function getQueue(): Queue | null {
  if (!redisClient) return null;
  if (!emailDiscoveryQueue) {
    emailDiscoveryQueue = new Queue('email-discovery', { connection: redisClient as any });
  }
  return emailDiscoveryQueue;
}

export async function enqueueEmailDiscovery(payload: {
  userId: string;
  companies: Array<{ name: string; domain?: string; jobIds?: string[]; priority?: number }>;
}) {
  const q = getQueue();
  if (!q) {
    logger.warn('enqueueEmailDiscovery called without Redis; skipping queue add');
    return { id: null } as any;
  }
  return q.add('discover', payload, {
    attempts: 3,
    removeOnComplete: 1000,
    removeOnFail: 1000,
  });
}


