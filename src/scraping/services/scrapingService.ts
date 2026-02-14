/**
 * Main scraping service that orchestrates all scrapers
 * @module scraping/services
 */

import { ScraperFactory, JobBoardType } from '../factory/scraperFactory.js';
import { 
  ScrapedJob, 
  ScrapingResult, 
  ScraperConfig, 
  SessionConfig, 
  SearchParams,
  ScrapingJob,
  ScrapingJobType,
  ScrapingJobStatus
} from '../types/index.js';
import { logger } from '../../config/logger.js';
import { redis } from '../../db/redis.js';
import { v4 as uuidv4 } from 'uuid';
import { ScrapedJobStore } from '../store/ScrapedJobStore.js';
import { ScrapingCache } from '../cache/ScrapingCache.js';

/**
 * Main scraping service
 */
export class ScrapingService {
  private static instance: ScrapingService;
  private factory: ScraperFactory;
  private activeJobs: Map<string, ScrapingJob> = new Map();
  private isRunning: boolean = false;

  private constructor() {
    this.factory = ScraperFactory.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ScrapingService {
    if (!ScrapingService.instance) {
      ScrapingService.instance = new ScrapingService();
    }
    return ScrapingService.instance;
  }

  /**
   * Start a scraping job
   */
  public async startScrapingJob(
    boardType: JobBoardType,
    searchParams: SearchParams,
    config?: Partial<ScraperConfig>
  ): Promise<string> {
    try {
      // Validate board type
      if (!this.factory.isScraperAvailable(boardType)) {
        throw new Error(`Scraper not available for ${boardType}`);
      }

      // Create job ID
      const jobId = uuidv4();
      
      // Get default configuration and merge with custom config
      const defaultConfig = this.factory.getDefaultConfig(boardType);
      const finalConfig = { ...defaultConfig, ...config };
      
      // Get default session
      const session = this.factory.getDefaultSession();
      
      // Create scraper
      const scraper = this.factory.createScraper(boardType, finalConfig, session);
      
      // Create job object
      const job: ScrapingJob = {
        id: jobId,
        type: ScrapingJobType.SEARCH_SCRAPE,
        priority: finalConfig.priority,
        status: ScrapingJobStatus.PENDING,
        config: finalConfig,
        searchParams,
        createdAt: new Date(),
        attempts: 0,
        maxAttempts: finalConfig.maxRetries,
        tags: [boardType, 'search'],
        metadata: { boardType }
      };

      // Store job
      this.activeJobs.set(jobId, job);
      
      // Start job execution
      this.executeJob(jobId, scraper, searchParams);
      
      logger.info(`Started scraping job ${jobId} for ${boardType}`);
      return jobId;
      
    } catch (error) {
      logger.error(`Failed to start scraping job: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a scraping job
   */
  private async executeJob(
    jobId: string, 
    scraper: any, 
    searchParams: SearchParams
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      // Update job status
      job.status = ScrapingJobStatus.RUNNING;
      job.startedAt = new Date();
      job.attempts++;
      
      // Execute scraping
      const result = await scraper.scrapeJobs(searchParams);
      
      // Update job with result
      job.status = ScrapingJobStatus.COMPLETED;
      job.completedAt = new Date();
      job.result = result;
      
      // Store results in Redis for caching
      await this.cacheResults(jobId, result);
      
      // Store jobs in MongoDB (this would integrate with your existing job storage)
      await this.storeJobs(result.jobs);
      
      logger.info(`Job ${jobId} completed successfully: ${result.jobs.length} jobs scraped`);
      
    } catch (error) {
      logger.error(`Job ${jobId} failed: ${error}`);
      
      // Update job with error
      job.status = ScrapingJobStatus.FAILED;
      job.error = {
        code: 'EXECUTION_FAILED',
        message: `Job execution failed: ${error}`,
        timestamp: new Date(),
        severity: 'high' as any,
        retryable: true
      };
      
      // Retry logic
      if (job.attempts < job.maxAttempts) {
        job.status = ScrapingJobStatus.RETRYING;
        job.nextRetryAt = new Date(Date.now() + job.config.retryDelay);
        
        // Schedule retry
        setTimeout(() => {
          this.executeJob(jobId, scraper, searchParams);
        }, job.config.retryDelay);
      }
    }
  }

  /**
   * Get job status
   */
  public getJobStatus(jobId: string): ScrapingJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs
   */
  public getActiveJobs(): ScrapingJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancel a job
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    if (job.status === ScrapingJobStatus.RUNNING) {
      // TODO: Implement job cancellation logic
      logger.warn(`Job ${jobId} is currently running, cancellation not yet implemented`);
    }

    job.status = ScrapingJobStatus.CANCELLED;
    logger.info(`Job ${jobId} cancelled`);
    return true;
  }

  /**
   * Get scraping statistics
   */
  public getStats(): Record<string, any> {
    const totalJobs = this.activeJobs.size;
    const completedJobs = Array.from(this.activeJobs.values()).filter(
      job => job.status === ScrapingJobStatus.COMPLETED
    ).length;
    const failedJobs = Array.from(this.activeJobs.values()).filter(
      job => job.status === ScrapingJobStatus.FAILED
    ).length;
    const runningJobs = Array.from(this.activeJobs.values()).filter(
      job => job.status === ScrapingJobStatus.RUNNING
    ).length;

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      runningJobs,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      scraperStats: this.factory.getScraperStats(),
      availableScrapers: this.factory.getAvailableScrapers()
    };
  }

  /**
   * Start continuous scraping for monitoring
   */
  public async startContinuousScraping(
    boardTypes: JobBoardType[],
    searchQueries: string[],
    intervalMinutes: number = 60
  ): Promise<void> {
    if (this.isRunning) {
      logger.warn('Continuous scraping is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Starting continuous scraping with ${intervalMinutes} minute intervals`);

    // Initial run
    await this.runContinuousScraping(boardTypes, searchQueries);

    // Set up interval
    setInterval(async () => {
      if (this.isRunning) {
        await this.runContinuousScraping(boardTypes, searchQueries);
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop continuous scraping
   */
  public stopContinuousScraping(): void {
    this.isRunning = false;
    logger.info('Continuous scraping stopped');
  }

  /**
   * Run continuous scraping cycle
   */
  private async runContinuousScraping(
    boardTypes: JobBoardType[],
    searchQueries: string[]
  ): Promise<void> {
    logger.info('Running continuous scraping cycle');

    for (const boardType of boardTypes) {
      if (!this.factory.isScraperAvailable(boardType)) {
        logger.warn(`Skipping ${boardType} - scraper not available`);
        continue;
      }

      for (const query of searchQueries) {
        try {
          const searchParams: SearchParams = {
            query,
            customFilters: {}
          };

          await this.startScrapingJob(boardType, searchParams);
          
          // Add delay between queries to respect rate limits
          await this.delay(5000);
          
        } catch (error) {
          logger.error(`Failed to start continuous scraping for ${boardType} with query "${query}": ${error}`);
        }
      }
    }

    logger.info('Continuous scraping cycle completed');
  }

  /**
   * Cache scraping results in Redis
   */
  private async cacheResults(jobId: string, result: ScrapingResult): Promise<void> {
    try {
      await ScrapingCache.setJobResults(jobId, result, 86400);
      logger.debug(`Cached results for job ${jobId}`);
      
    } catch (error) {
      logger.warn(`Failed to cache results for job ${jobId}: ${error}`);
    }
  }

  /**
   * Store scraped jobs in MongoDB
   */
  private async storeJobs(jobs: ScrapedJob[]): Promise<void> {
    try {
      logger.info(`Storing ${jobs.length} scraped jobs to database`);
      const mapped = jobs.map(j => ({
        source: (j as any).source,
        externalId: (j as any).externalId ?? null,
        canonicalUrl: (j as any).canonicalUrl ?? (j as any).url ?? null,
        title: (j as any).title,
        company: (j as any).company,
        location: (j as any).location,
        salary: (j as any).salary,
        seniority: (j as any).seniority ?? (j as any).level,
        description: (j as any).description,
        sanitizedDescription: (j as any).sanitizedDescription,
        skills: (j as any).skills ?? (j as any).requirements,
        benefits: (j as any).benefits,
        postedAt: (j as any).postedAt,
        expiresAt: (j as any).expiresAt ?? (j as any).deadline,
        applicationCount: (j as any).applicationCount,
        referralAvailable: (j as any).referralAvailable ?? (j as any).referralBonus,
        hash: (j as any).hash ?? (j as any).url,
        compositeKey: (j as any).compositeKey ?? `${(j as any).source}:${(j as any).externalId || (j as any).url}`,
        audit: (j as any).audit
      }));
      await ScrapedJobStore.upsertMany(mapped as any);
    } catch (error) {
      logger.error(`Failed to store jobs: ${error}`);
    }
  }

  /**
   * Utility method for adding delays
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up service resources
   */
  public async cleanup(): Promise<void> {
    try {
      this.stopContinuousScraping();
      await this.factory.cleanupAll();
      
      // Clear active jobs
      this.activeJobs.clear();
      
      logger.info('Scraping service cleaned up');
    } catch (error) {
      logger.error(`Error during cleanup: ${error}`);
    }
  }

  /**
   * Health check for the scraping service
   */
  public async healthCheck(): Promise<Record<string, any>> {
    try {
      const stats = this.getStats();
      let redisHealth = 'unavailable';
      if (redis) {
        redisHealth = await redis.ping().then(() => 'healthy').catch(() => 'unhealthy');
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats,
        redis: redisHealth,
        isRunning: this.isRunning
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        isRunning: this.isRunning
      };
    }
  }
}
