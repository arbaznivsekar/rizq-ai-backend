/**
 * Controller for scraping-related HTTP endpoints
 * @module controllers
 */

import { Request, Response } from 'express';
import { ScrapingService } from '../scraping/services/scrapingService.js';
import { JobBoardType } from '../scraping/factory/scraperFactory.js';
import { SearchParams } from '../scraping/types/index.js';
import { JobsService } from '../services/JobsService.js';
import { ServiceRegistry } from '../core/ServiceRegistry.js';
import { logger } from '../config/logger.js';
import { z } from 'zod';
import {
  enqueueEnterpriseScrapingJob,
  enqueueBulkEnterpriseScrapingJobs,
  getScrapingQueueStats,
  getScrapingJobDetails,
  cancelScrapingJob,
  retryScrapingJob,
  cleanScrapingQueue
} from '../queues/scraping.queue.js';

/**
 * Input validation schemas
 */
const StartJobSchema = z.object({
  boardType: z.nativeEnum(JobBoardType, {
    errorMap: () => ({ message: 'Invalid board type' })
  }),
  searchParams: z.object({
    query: z.string().min(1, 'Search query is required').max(500, 'Search query too long'),
    location: z.string().max(200, 'Location too long').optional(),
    radius: z.number().min(1, 'Radius must be at least 1').max(100, 'Radius too large').optional(),
    jobType: z.array(z.enum(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance', 'Remote', 'Hybrid', 'On-site'])).max(10, 'Too many job types').optional(),
    level: z.array(z.enum(['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'])).max(10, 'Too many levels').optional(),
    salaryMin: z.number().min(0, 'Salary must be positive').max(1000000, 'Salary too high').optional(),
    salaryMax: z.number().min(0, 'Salary must be positive').max(1000000, 'Salary too high').optional(),
    remote: z.boolean().optional(),
    easyApply: z.boolean().optional(),
    postedWithin: z.number().min(1, 'Posted within must be at least 1 day').max(365, 'Posted within too long').optional(),
    page: z.number().min(1, 'Page must be at least 1').max(100, 'Page too high').optional(),
    limit: z.number().min(1, 'Limit must be at least 1').max(1000, 'Limit too high').optional(),
    customFilters: z.record(z.any()).optional()
  }),
  config: z.object({
    name: z.string().max(100, 'Config name too long').optional(),
    baseUrl: z.string().url('Invalid base URL').optional(),
    enabled: z.boolean().optional(),
    priority: z.number().min(1, 'Priority must be at least 1').max(10, 'Priority must be at most 10').optional(),
    requestsPerMinute: z.number().min(1, 'Requests per minute must be at least 1').max(1000, 'Requests per minute too high').optional(),
    requestsPerHour: z.number().min(1, 'Requests per hour must be at least 1').max(10000, 'Requests per hour too high').optional(),
    delayBetweenRequests: z.number().min(100, 'Delay must be at least 100ms').max(60000, 'Delay too high').optional(),
    useProxies: z.boolean().optional(),
    rotateUserAgents: z.boolean().optional(),
    simulateHumanBehavior: z.boolean().optional(),
    maxPagesPerSearch: z.number().min(1, 'Max pages must be at least 1').max(100, 'Max pages too high').optional(),
    maxJobsPerPage: z.number().min(1, 'Max jobs per page must be at least 1').max(1000, 'Max jobs per page too high').optional(),
    followPagination: z.boolean().optional(),
    extractFullDescription: z.boolean().optional(),
    extractRequirements: z.boolean().optional(),
    extractBenefits: z.boolean().optional(),
    maxRetries: z.number().min(0, 'Max retries must be at least 0').max(10, 'Max retries too high').optional(),
    retryDelay: z.number().min(100, 'Retry delay must be at least 100ms').max(300000, 'Retry delay too high').optional(),
    circuitBreakerThreshold: z.number().min(1, 'Circuit breaker threshold must be at least 1').max(100, 'Circuit breaker threshold too high').optional(),
    respectRobotsTxt: z.boolean().optional(),
    includeAuditTrail: z.boolean().optional(),
    anonymizeData: z.boolean().optional()
  }).optional()
});

const ContinuousScrapingSchema = z.object({
  boardTypes: z.array(z.nativeEnum(JobBoardType, {
    errorMap: () => ({ message: 'Invalid board type' })
  })).min(1, 'At least one board type is required').max(10, 'Too many board types'),
  searchQueries: z.array(z.string().min(1, 'Search query cannot be empty').max(500, 'Search query too long'))
    .min(1, 'At least one search query is required').max(50, 'Too many search queries'),
  intervalMinutes: z.number().min(1, 'Interval must be at least 1 minute').max(1440, 'Interval cannot exceed 24 hours').default(60)
});

// Type inference for the schemas
type StartJobInput = z.infer<typeof StartJobSchema>;
type ContinuousScrapingInput = z.infer<typeof ContinuousScrapingSchema>;

/**
 * Scraping controller - handles scraping jobs and job data retrieval
 */
export class ScrapingController {
  private scrapingService: ScrapingService;
  private jobsService?: JobsService;

  constructor() {
    this.scrapingService = ScrapingService.getInstance();
  }

  /**
   * Get jobs service from registry (lazy loading)
   */
  private getJobsService(): JobsService {
    if (!this.jobsService) {
      const registry = ServiceRegistry.getInstance();
      const jobsService = registry.getService<JobsService>('jobs');

      if (!jobsService) {
        throw new Error('Jobs service not found in registry. Make sure it is registered.');
      }

      this.jobsService = jobsService;
    }

    return this.jobsService;
  }

  /**
   * Start a new scraping job using BullMQ
   */
  public async startScrapingJob(req: Request, res: Response): Promise<void> {
    try {
      // Validate input with Zod schema
      const validationResult = StartJobSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn(`Input validation failed for scraping job: ${JSON.stringify(errors)}`);
        
        res.status(400).json({
          success: false,
          error: 'Input validation failed',
          details: errors
        });
        return;
      }

      const { boardType, searchParams, config } = validationResult.data;
      const { useQueue = true, priority = 0, delay = 0 } = req.body;

      if (useQueue) {
        // Use BullMQ for asynchronous processing
        const result = await enqueueEnterpriseScrapingJob(
          boardType,
          searchParams as SearchParams,
          config,
          { priority, delay }
        );

        logger.info(`Enqueued scraping job ${result.jobId} for ${boardType}`);

        res.status(202).json({
          success: true,
          jobId: result.jobId,
          boardType: result.boardType,
          searchQuery: result.searchQuery,
          message: 'Scraping job enqueued successfully',
          status: 'queued'
        });
      } else {
        // Direct execution (for immediate processing)
        const jobId = await this.scrapingService.startScrapingJob(
          boardType,
          searchParams as SearchParams,
          config
        );

        logger.info(`Started direct scraping job ${jobId} for ${boardType}`);

        res.status(202).json({
          success: true,
          jobId,
          message: 'Scraping job started successfully',
          status: 'pending'
        });
      }

    } catch (error: any) {
      logger.error(`Failed to start scraping job: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to start scraping job',
        details: error.message
      });
    }
  }

  /**
   * Get job status (checks both enterprise service and BullMQ)
   */
  public async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      // Validate job ID
      if (!jobId || jobId.trim().length === 0) {
        res.status(400).json({ error: 'jobId is required' });
        return;
      }

      // Try to get job from BullMQ first (for queued jobs)
      const queueJob = await getScrapingJobDetails(jobId);
      
      if (queueJob) {
        res.json({
          success: true,
          job: {
            id: queueJob.id,
            type: 'queue_job',
            status: queueJob.state,
            data: queueJob.data,
            progress: queueJob.progress,
            result: queueJob.returnvalue,
            error: queueJob.failedReason,
            createdAt: new Date(queueJob.timestamp),
            processedAt: queueJob.processedOn ? new Date(queueJob.processedOn) : undefined,
            finishedAt: queueJob.finishedOn ? new Date(queueJob.finishedOn) : undefined,
            attempts: queueJob.attemptsMade,
            delay: queueJob.delay,
            priority: queueJob.priority
          }
        });
        return;
      }

      // Validate job ID format (UUID) for enterprise service
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(jobId)) {
        // Try to get job from enterprise service
        const job = this.scrapingService.getJobStatus(jobId);

        if (job) {
          res.json({
            success: true,
            job: {
              id: job.id,
              type: job.type,
              status: job.status,
              priority: job.priority,
              createdAt: job.createdAt,
              startedAt: job.startedAt,
              completedAt: job.completedAt,
              attempts: job.attempts,
              maxAttempts: job.maxAttempts,
              nextRetryAt: job.nextRetryAt,
              tags: job.tags,
              metadata: job.metadata,
              result: job.result ? {
                success: job.result.success,
                totalJobs: job.result.totalJobs,
                scrapedJobs: job.result.scrapedJobs,
                failedJobs: job.result.failedJobs,
                duration: job.result.duration,
                startTime: job.result.startTime,
                endTime: job.result.endTime
              } : undefined,
              error: job.error
            }
          });
          return;
        }
      }

      res.status(404).json({ error: 'Job not found' });

    } catch (error: any) {
      logger.error(`Failed to get job status: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get job status',
        details: error.message
      });
    }
  }

  /**
   * Get all active jobs
   */
  public async getActiveJobs(req: Request, res: Response): Promise<void> {
    try {
      const jobs = this.scrapingService.getActiveJobs();

      res.json({
        success: true,
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          priority: job.priority,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          tags: job.tags,
          metadata: job.metadata
        })),
        total: jobs.length
      });

    } catch (error: any) {
      logger.error(`Failed to get active jobs: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get active jobs',
        details: error.message
      });
    }
  }



  /**
   * Get scraping statistics (includes queue stats)
   */
  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      const serviceStats = this.scrapingService.getStats();
      const queueStats = await getScrapingQueueStats();

      res.json({
        success: true,
        stats: {
          ...serviceStats,
          queue: queueStats
        }
      });

    } catch (error: any) {
      logger.error(`Failed to get scraping stats: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get scraping stats',
        details: error.message
      });
    }
  }

  /**
   * Get queue statistics only
   */
  public async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const queueStats = await getScrapingQueueStats();

      res.json({
        success: true,
        queueStats
      });

    } catch (error: any) {
      logger.error(`Failed to get queue stats: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get queue stats',
        details: error.message
      });
    }
  }

  /**
   * Cancel a job (works with both queue and enterprise service)
   */
  public async cancelJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      // Validate job ID
      if (!jobId || jobId.trim().length === 0) {
        res.status(400).json({ error: 'jobId is required' });
        return;
      }

      // Try to cancel from BullMQ first
      const queueResult = await cancelScrapingJob(jobId);
      
      if (queueResult.cancelled) {
        res.json({
          success: true,
          message: `Queue job cancelled successfully`,
          jobId,
          previousState: queueResult.previousState
        });
        return;
      }

      // Try to cancel from enterprise service
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(jobId)) {
        const cancelled = await this.scrapingService.cancelJob(jobId);

        if (cancelled) {
          res.json({
            success: true,
            message: 'Enterprise job cancelled successfully',
            jobId
          });
          return;
        }
      }

      res.status(404).json({ 
        error: 'Job not found or could not be cancelled',
        details: queueResult.reason
      });

    } catch (error: any) {
      logger.error(`Failed to cancel job: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel job',
        details: error.message
      });
    }
  }

  /**
   * Retry a failed job
   */
  public async retryJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;

      // Validate job ID
      if (!jobId || jobId.trim().length === 0) {
        res.status(400).json({ error: 'jobId is required' });
        return;
      }

      const result = await retryScrapingJob(jobId);
      
      if (result.retried) {
        res.json({
          success: true,
          message: 'Job retried successfully',
          jobId
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Job could not be retried',
          reason: result.reason
        });
      }

    } catch (error: any) {
      logger.error(`Failed to retry job: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retry job',
        details: error.message
      });
    }
  }

  /**
   * Bulk enqueue scraping jobs
   */
  public async bulkEnqueueJobs(req: Request, res: Response): Promise<void> {
    try {
      const { jobs, options } = req.body;

      if (!Array.isArray(jobs) || jobs.length === 0) {
        res.status(400).json({
          success: false,
          error: 'jobs array is required and cannot be empty'
        });
        return;
      }

      if (jobs.length > 50) {
        res.status(400).json({
          success: false,
          error: 'Cannot enqueue more than 50 jobs at once'
        });
        return;
      }

      // Validate each job
      for (const job of jobs) {
        if (!job.boardType || !job.searchParams) {
          res.status(400).json({
            success: false,
            error: 'Each job must have boardType and searchParams'
          });
          return;
        }
      }

      const result = await enqueueBulkEnterpriseScrapingJobs(jobs, options);

      logger.info(`Bulk enqueued ${result.totalJobs} scraping jobs`);

      res.status(202).json({
        success: true,
        message: `Successfully enqueued ${result.totalJobs} scraping jobs`,
        ...result
      });

    } catch (error: any) {
      logger.error(`Failed to bulk enqueue jobs: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to bulk enqueue jobs',
        details: error.message
      });
    }
  }

  /**
   * Clean old jobs from queue
   */
  public async cleanQueue(req: Request, res: Response): Promise<void> {
    try {
      const { grace = 86400000, type = 'completed' } = req.query; // Default 24 hours

      const result = await cleanScrapingQueue(
        Number(grace),
        type as 'completed' | 'failed' | 'active' | 'waiting'
      );

      res.json({
        success: true,
        message: `Cleaned ${result.cleaned} ${result.type} jobs`,
        ...result
      });

    } catch (error: any) {
      logger.error(`Failed to clean queue: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to clean queue',
        details: error.message
      });
    }
  }

  /**
   * Start continuous scraping
   */
  public async startContinuousScraping(req: Request, res: Response): Promise<void> {
    try {
      // Validate input with Zod schema
      const validationResult = ContinuousScrapingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn(`Input validation failed for continuous scraping: ${JSON.stringify(errors)}`);
        
        res.status(400).json({
          success: false,
          error: 'Input validation failed',
          details: errors
        });
        return;
      }

      const { boardTypes, searchQueries, intervalMinutes } = validationResult.data;

      // Start continuous scraping
      await this.scrapingService.startContinuousScraping(
        boardTypes,
        searchQueries,
        intervalMinutes
      );

      logger.info(`Started continuous scraping for ${boardTypes.length} board types`);

      res.json({
        success: true,
        message: 'Continuous scraping started successfully',
        boardTypes,
        searchQueries,
        intervalMinutes
      });

    } catch (error: any) {
      logger.error(`Failed to start continuous scraping: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to start continuous scraping',
        details: error.message
      });
    }
  }

  /**
   * Stop continuous scraping
   */
  public async stopContinuousScraping(req: Request, res: Response): Promise<void> {
    try {
      this.scrapingService.stopContinuousScraping();

      logger.info('Continuous scraping stopped');

      res.json({
        success: true,
        message: 'Continuous scraping stopped successfully'
      });

    } catch (error: any) {
      logger.error(`Failed to stop continuous scraping: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to stop continuous scraping',
        details: error.message
      });
    }
  }

  /**
   * Get available scrapers
   */
  public async getAvailableScrapers(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.scrapingService.getStats();

      res.json({
        success: true,
        availableScrapers: stats.availableScrapers,
        scraperStats: stats.scraperStats
      });

    } catch (error: any) {
      logger.error(`Failed to get available scrapers: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get available scrapers',
        details: error.message
      });
    }
  }

  /**
   * Health check for scraping service
   */
  public async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.scrapingService.healthCheck();

      res.json({
        success: true,
        health
      });

    } catch (error: any) {
      logger.error(`Failed to get health check: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get health check',
        details: error.message
      });
    }
  }

  /**
   * Clean up scraping service
   */
  public async cleanup(req: Request, res: Response): Promise<void> {
    try {
      await this.scrapingService.cleanup();

      logger.info('Scraping service cleanup completed');

      res.json({
        success: true,
        message: 'Scraping service cleanup completed successfully'
      });

    } catch (error: any) {
      logger.error(`Failed to cleanup scraping service: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup scraping service',
        details: error.message
      });
    }
  }

  /**
   * Get jobs from database with scraping filters
   */
  public async getScrapedJobs(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
        q: req.query.q as string,
        type: req.query.type as string,
        source: req.query.source as string,
        location: req.query.location as string,
        easyApply: req.query.easyApply ? req.query.easyApply === 'true' : undefined,
        postedAfter: req.query.postedAfter as string,
        sort: req.query.sort as 'date' | 'salary',
      };

      const data = await this.getJobsService().listJobs(query);

      res.json({
        success: true,
        data: {
          items: data.items,
          total: data.total,
          page: data.page,
          pageSize: data.pageSize
        },
        message: 'Jobs retrieved from database'
      });
    } catch (error: any) {
      logger.error('Failed to get scraped jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve scraped jobs',
        details: error.message
      });
    }
  }

  /**
   * Get job statistics from database
   */
  public async getJobStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getJobsService().getStats();

      res.json({
        success: true,
        data: stats,
        message: 'Job statistics retrieved from database'
      });
    } catch (error: any) {
      logger.error('Failed to get job statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve job statistics',
        details: error.message
      });
    }
  }

  /**
   * Search jobs in database with advanced filters
   */
  public async searchScrapedJobs(req: Request, res: Response): Promise<void> {
    try {
      const searchParams = {
        query: req.query.q as string,
        location: req.query.location as string,
        jobType: req.query.jobType ? (req.query.jobType as string).split(',') : undefined,
        experienceLevel: req.query.experienceLevel ? (req.query.experienceLevel as string).split(',') : undefined,
        salaryMin: req.query.salaryMin ? Number(req.query.salaryMin) : undefined,
        salaryMax: req.query.salaryMax ? Number(req.query.salaryMax) : undefined,
        remote: req.query.remote ? req.query.remote === 'true' : undefined,
        easyApply: req.query.easyApply ? req.query.easyApply === 'true' : undefined,
        postedWithin: req.query.postedWithin ? Number(req.query.postedWithin) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };

      const result = await this.getJobsService().searchJobs(searchParams);

      res.json({
        success: true,
        data: result,
        message: 'Advanced job search completed from database'
      });
    } catch (error: any) {
      logger.error('Failed to search scraped jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search scraped jobs',
        details: error.message
      });
    }
  }

  /**
   * Get a specific job from database by ID
   */
  public async getScrapedJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Job ID is required'
        });
        return;
      }

      const job = await this.getJobsService().getJob(id);

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found in database'
        });
        return;
      }

      res.json({
        success: true,
        data: { job },
        message: 'Job retrieved from database'
      });
    } catch (error: any) {
      logger.error(`Failed to get scraped job ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve scraped job',
        details: error.message
      });
    }
  }
}

