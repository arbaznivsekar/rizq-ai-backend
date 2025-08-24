import { Job } from "bullmq";
import { ScrapingService } from '../scraping/services/scrapingService.js';
import { JobBoardType } from '../scraping/factory/scraperFactory.js';
import { SearchParams } from '../scraping/types/index.js';
import { logger } from '../config/logger.js';
import { insertJobs } from '../services/jobs.service.js';
import { crawlAndStore } from "../services/scraping/index.js";

/**
 * Enterprise scraping worker for BullMQ
 */
export default async function scrapingWorker(job: Job<{ 
  source?: string; 
  url?: string; 
  boardType?: string; 
  searchParams?: SearchParams; 
  config?: any;
}>) {
  const { source, url, boardType, searchParams, config } = job.data || {};
  
  try {
    logger.info(`Processing scraping job ${job.id} for ${boardType || source}`);

    if (boardType && searchParams) {
      // New enterprise scraping approach
      const scrapingService = ScrapingService.getInstance();
      
      // Validate board type
      if (!Object.values(JobBoardType).includes(boardType as JobBoardType)) {
        throw new Error(`Invalid board type: ${boardType}`);
      }

      // Execute scraping with enterprise service
      const jobId = await scrapingService.startScrapingJob(
        boardType as JobBoardType,
        searchParams,
        config
      );

      // Wait for job completion (with timeout)
      const timeout = 300000; // 5 minutes
      const startTime = Date.now();
      let scrapingResult = null;

      while (Date.now() - startTime < timeout) {
        const jobStatus = scrapingService.getJobStatus(jobId);
        
        if (!jobStatus) {
          throw new Error(`Scraping job ${jobId} not found`);
        }

        if (jobStatus.status === 'completed') {
          scrapingResult = jobStatus.result;
          break;
        } else if (jobStatus.status === 'failed') {
          throw new Error(`Scraping job failed: ${jobStatus.error?.message || 'Unknown error'}`);
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (!scrapingResult) {
        throw new Error('Scraping job timed out');
      }

      // Store jobs in database using existing service
      if (scrapingResult.jobs && scrapingResult.jobs.length > 0) {
        const normalizedJobs = scrapingResult.jobs.map(job => ({
          source: job.source,
          externalId: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          jobType: job.jobType,
          url: job.url,
          postedAt: job.postedAt
        }));

        const count = await insertJobs(normalizedJobs);
        logger.info(`Stored ${count} jobs from enterprise scraping`);
      }

      return {
        success: true,
        jobId,
        jobsScraped: scrapingResult.scrapedJobs,
        jobsStored: scrapingResult.jobs.length,
        duration: scrapingResult.duration,
        message: `Successfully scraped ${scrapingResult.scrapedJobs} jobs from ${boardType}`
      };

    } else if (source && url) {
      // Legacy scraping approach (fallback)
      logger.warn(`Using legacy scraping for ${source} - consider migrating to enterprise scraping`);
      
      const result = await crawlAndStore(source, url);
      
      return {
        success: true,
        source,
        url,
        jobsProcessed: result.upserted || 0,
        message: `Legacy scraping completed for ${source}`
      };

    } else {
      return { 
        ok: false, 
        reason: "Missing required data: must provide either (boardType + searchParams) or (source + url)" 
      };
    }

  } catch (error: any) {
    logger.error(`Scraping worker failed for job ${job.id}: ${error.message}`, {
      jobId: job.id,
      jobData: job.data,
      error: error.stack
    });
    
    throw error; // Re-throw to mark job as failed
  }
}

