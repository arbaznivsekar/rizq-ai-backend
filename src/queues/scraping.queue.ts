import { scrapingQueue } from "./index.js";
import { JobBoardType } from '../scraping/factory/scraperFactory.js';
import { SearchParams } from '../scraping/types/index.js';

/**
 * Legacy scraping job enqueueing (for backward compatibility)
 */
export async function enqueueScrapeJob(params: { source: string; url: string }) {
  await scrapingQueue.add("scrape", params, { 
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 50
  });
  return { enqueued: true };
}

/**
 * Enterprise scraping job enqueueing
 */
export async function enqueueEnterpriseScrapingJob(
  boardType: JobBoardType,
  searchParams: SearchParams,
  config?: any,
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
    removeOnComplete?: number;
    removeOnFail?: number;
  }
) {
  const jobData = {
    boardType,
    searchParams,
    config: config || {}
  };

  const jobOptions = {
    priority: options?.priority || 0,
    delay: options?.delay || 0,
    attempts: options?.attempts || 3,
    removeOnComplete: options?.removeOnComplete || 100,
    removeOnFail: options?.removeOnFail || 50,
    backoff: {
      type: 'exponential' as const,
      delay: 5000
    }
  };

  const job = await scrapingQueue.add("enterprise-scrape", jobData, jobOptions);
  
  return { 
    enqueued: true, 
    jobId: job.id,
    boardType,
    searchQuery: searchParams.query
  };
}

/**
 * Bulk enterprise scraping job enqueueing
 */
export async function enqueueBulkEnterpriseScrapingJobs(
  jobs: Array<{
    boardType: JobBoardType;
    searchParams: SearchParams;
    config?: any;
    priority?: number;
  }>,
  options?: {
    delay?: number;
    attempts?: number;
  }
) {
  const enqueuedJobs = [];

  for (const jobData of jobs) {
    const result = await enqueueEnterpriseScrapingJob(
      jobData.boardType,
      jobData.searchParams,
      jobData.config,
      {
        priority: jobData.priority || 0,
        delay: options?.delay || 0,
        attempts: options?.attempts || 3
      }
    );
    enqueuedJobs.push(result);
  }

  return {
    enqueued: true,
    totalJobs: enqueuedJobs.length,
    jobs: enqueuedJobs
  };
}

/**
 * Get scraping queue statistics
 */
export async function getScrapingQueueStats() {
  const waiting = await scrapingQueue.getWaiting();
  const active = await scrapingQueue.getActive();
  const completed = await scrapingQueue.getCompleted();
  const failed = await scrapingQueue.getFailed();
  const delayed = await scrapingQueue.getDelayed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
    total: waiting.length + active.length + completed.length + failed.length + delayed.length
  };
}

/**
 * Get specific job details from queue
 */
export async function getScrapingJobDetails(jobId: string) {
  const job = await scrapingQueue.getJob(jobId);
  
  if (!job) {
    return null;
  }

  const state = await job.getState();
  
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    state,
    progress: job.progress,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    timestamp: job.timestamp,
    attemptsMade: job.attemptsMade,
    delay: job.delay,
    priority: job.opts.priority
  };
}

/**
 * Cancel a scraping job
 */
export async function cancelScrapingJob(jobId: string) {
  const job = await scrapingQueue.getJob(jobId);
  
  if (!job) {
    return { cancelled: false, reason: 'Job not found' };
  }

  const state = await job.getState();
  
  if (state === 'completed' || state === 'failed') {
    return { cancelled: false, reason: `Job already ${state}` };
  }

  await job.remove();
  
  return { cancelled: true, jobId, previousState: state };
}

/**
 * Retry a failed scraping job
 */
export async function retryScrapingJob(jobId: string) {
  const job = await scrapingQueue.getJob(jobId);
  
  if (!job) {
    return { retried: false, reason: 'Job not found' };
  }

  const state = await job.getState();
  
  if (state !== 'failed') {
    return { retried: false, reason: `Job is not failed (current state: ${state})` };
  }

  await job.retry();
  
  return { retried: true, jobId };
}

/**
 * Clean old jobs from the queue
 */
export async function cleanScrapingQueue(
  grace: number = 24 * 60 * 60 * 1000, // 24 hours
  type: 'completed' | 'failed' | 'active' | 'waiting' = 'completed'
) {
  const cleaned = await scrapingQueue.clean(grace, 100, type);
  
  return {
    cleaned: cleaned.length,
    type,
    grace: `${grace / 1000 / 60 / 60} hours`
  };
}

