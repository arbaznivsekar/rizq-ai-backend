import { Job } from 'bullmq';
import { gmailOutreachService } from '../services/gmailOutreachService.js';

type Payload = { queueId: string };

export default async function emailOutreachProcessor(job: Job<Payload>) {
  if (!job?.data?.queueId) return { status: 'skipped', reason: 'missing_queue_id' };
  await gmailOutreachService.processQueueItem({ queueId: job.data.queueId });
  return { status: 'sent', queueId: job.data.queueId };
}


