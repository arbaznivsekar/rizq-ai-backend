import { Job } from 'bullmq';
import { gmailOutreachService } from '../services/gmailOutreachService.js';
import { logger } from '../config/logger.js';

type Payload = { queueId: string };

export default async function emailOutreachProcessor(job: Job<Payload>) {
  if (!job?.data?.queueId) {
    logger.warn('Email outreach worker received job without queueId', {
      jobId: job?.id,
      data: job?.data,
    });
    return { status: 'skipped', reason: 'missing_queue_id' };
  }

  logger.info('▶️ Processing email outreach job', {
    jobId: job.id,
    queueId: job.data.queueId,
  });

  try {
    await gmailOutreachService.processQueueItem({ queueId: job.data.queueId });
    logger.info('✅ Email outreach job processed', {
      jobId: job.id,
      queueId: job.data.queueId,
    });
    return { status: 'sent', queueId: job.data.queueId };
  } catch (error: any) {
    logger.error('❌ Email outreach job threw error in worker', {
      jobId: job.id,
      queueId: job.data.queueId,
      error: error?.message,
      stack: error?.stack,
    });
    throw error;
  }
}


