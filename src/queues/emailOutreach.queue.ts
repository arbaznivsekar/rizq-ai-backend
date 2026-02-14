import { emailOutreachQueue } from './index.js';
import { logger } from '../config/logger.js';

export async function enqueueEmailOutreach(payload: { queueId: string }) {
  if (!emailOutreachQueue) {
    logger.warn('Email outreach queue is not initialized (Redis not connected). Skipping enqueue.');
    return { id: null };
  }
  const job = await emailOutreachQueue.add('send-email', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  });
  return { id: job.id };
}


