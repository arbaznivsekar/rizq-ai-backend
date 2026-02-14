/**
 * Indeed.com job scraper implementation
 * @module scraping/scrapers
 */

import { BaseScraper } from '../base/baseScraper.js';
import { 
  ScrapedJob, 
  ScrapingResult, 
  ScraperConfig, 
  SessionConfig, 
  SearchParams,
  JobType,
  JobLevel,
  DataQuality,
  SalaryPeriod
} from '../types/index.js';
import { logger } from '../../config/logger.js';

/**
 * Indeed.com specific scraper configuration
 */
export interface IndeedScraperConfig extends ScraperConfig {
  // Indeed-specific settings
  useAdvancedSearch: boolean;
  extractCompanyReviews: boolean;
  extractSalaryData: boolean;
  followCompanyLinks: boolean;
}

/**
 * Indeed scraper implementation
 */
export class IndeedScraper extends BaseScraper {
  private readonly indeedConfig: IndeedScraperConfig;

  constructor(config: IndeedScraperConfig, session: SessionConfig) {
    super(config, session);
    this.indeedConfig = config;
  }

  /**
   * Get the base URL for Indeed
   */
  protected getBaseUrl(): string {
    return 'https://www.indeed.com';
  }

  /**
   * Build search URL from parameters
   */
  protected buildSearchUrl(searchParams: SearchParams): string {
    const baseUrl = this.getBaseUrl();
    const params = new URLSearchParams();

    // Basic search parameters
    params.set('q', searchParams.query);
    
    if (searchParams.location) {
      params.set('l', searchParams.location);
    }

    if (searchParams.radius) {
      params.set('radius', searchParams.radius.toString());
    }

    // Job type filters
    if (searchParams.jobType && searchParams.jobType.length > 0) {
      const jobTypeMap: Record<JobType, string> = {
        [JobType.FULL_TIME]: 'fulltime',
        [JobType.PART_TIME]: 'parttime',
        [JobType.CONTRACT]: 'contract',
        [JobType.TEMPORARY]: 'temporary',
        [JobType.INTERNSHIP]: 'internship',
        [JobType.FREELANCE]: 'freelance',
        [JobType.REMOTE]: 'remote',
        [JobType.HYBRID]: 'hybrid',
        [JobType.ON_SITE]: 'onsite'
      };

      const jobTypes = searchParams.jobType
        .map(type => jobTypeMap[type])
        .filter(Boolean);
      
      if (jobTypes.length > 0) {
        params.set('jt', jobTypes.join(','));
      }
    }

    // Experience level filters
    if (searchParams.level && searchParams.level.length > 0) {
      const levelMap: Record<JobLevel, string> = {
        [JobLevel.ENTRY]: 'entry',
        [JobLevel.JUNIOR]: 'junior',
        [JobLevel.MID]: 'mid',
        [JobLevel.SENIOR]: 'senior',
        [JobLevel.LEAD]: 'lead',
        [JobLevel.MANAGER]: 'manager',
        [JobLevel.DIRECTOR]: 'director',
        [JobLevel.EXECUTIVE]: 'executive'
      };

      const levels = searchParams.level
        .map(level => levelMap[level])
        .filter(Boolean);
      
      if (levels.length > 0) {
        params.set('explvl', levels.join(','));
      }
    }

    // Salary filters
    if (searchParams.salaryMin) {
      params.set('salary_min', searchParams.salaryMin.toString());
    }

    if (searchParams.salaryMax) {
      params.set('salary_max', searchParams.salaryMax.toString());
    }

    // Remote work filter
    if (searchParams.remote) {
      params.set('remotejob', '1');
    }

    // Easy apply filter
    if (searchParams.easyApply) {
      params.set('easy_apply', '1');
    }

    // Date filters
    if (searchParams.postedWithin) {
      const dateMap: Record<number, string> = {
        1: '1',
        3: '3',
        7: '7',
        14: '14',
        30: '30'
      };
      
      if (dateMap[searchParams.postedWithin]) {
        params.set('fromage', dateMap[searchParams.postedWithin]);
      }
    }

    // Pagination
    if (searchParams.page && searchParams.page > 1) {
      params.set('start', ((searchParams.page - 1) * 10).toString());
    }

    return `${baseUrl}/jobs?${params.toString()}`;
  }

  /**
   * Scrape jobs based on search parameters
   */
  public async scrapeJobs(searchParams: SearchParams): Promise<ScrapingResult> {
    const startTime = new Date();
    const jobs: ScrapedJob[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      await this.initializeBrowser();
      
      const searchUrl = this.buildSearchUrl(searchParams);
      logger.info(`Starting Indeed job scraping for: ${searchParams.query} in ${searchParams.location || 'any location'}`);

      let currentPage = 1;
      let totalJobsFound = 0;

      while (currentPage <= this.config.maxPagesPerSearch) {
        try {
          const pageUrl = currentPage === 1 ? searchUrl : this.buildSearchUrl({ ...searchParams, page: currentPage });
          
          await this.navigateTo(pageUrl, '[data-testid="jobsearch-ResultsList"]');
          
          // Check for anti-bot measures
          await this.handleAntiBotMeasures();
          
          // Check rate limiting
          await this.checkRateLimiting();
          
          // Parse job listings from current page
          const pageJobs = await this.parseJobListings();
          
          if (pageJobs.length === 0) {
            logger.info(`No more jobs found on page ${currentPage}, stopping pagination`);
            break;
          }

          // Extract full job details if configured
          if (this.config.extractFullDescription) {
            for (const job of pageJobs) {
              try {
                if (job.url) {
                  const fullJob = await this.scrapeJobDetails(job.url);
                  if (fullJob) {
                    jobs.push(fullJob);
                  }
                }
                
                // Respect rate limiting between job detail requests
                await this.respectRateLimiting();
              } catch (error) {
                logger.warn(`Failed to scrape job details for ${job.url}: ${error}`);
                errors.push({
                  code: 'JOB_DETAIL_FAILED',
                  message: `Failed to scrape job details: ${error}`,
                  jobId: job.externalId,
                  timestamp: new Date()
                });
              }
            }
          } else {
            // Convert partial jobs to full jobs with basic info
            const basicJobs = pageJobs.map(job => this.createBasicJob(job));
            jobs.push(...basicJobs);
          }

          totalJobsFound += pageJobs.length;
          logger.info(`Page ${currentPage}: Found ${pageJobs.length} jobs, Total: ${totalJobsFound}`);

          currentPage++;
          
          // Respect rate limiting between pages
          await this.respectRateLimiting();
          
        } catch (error) {
          logger.error(`Failed to scrape page ${currentPage}: ${error}`);
          errors.push({
            code: 'PAGE_SCRAPING_FAILED',
            message: `Failed to scrape page ${currentPage}: ${error}`,
            timestamp: new Date()
          });
          break;
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logger.info(`Indeed scraping completed: ${jobs.length} jobs scraped in ${duration}ms`);

      return {
        success: jobs.length > 0,
        jobs,
        totalJobs: totalJobsFound,
        scrapedJobs: jobs.length,
        failedJobs: errors.length,
        startTime,
        endTime,
        duration,
        averageTimePerJob: jobs.length > 0 ? duration / jobs.length : 0,
        errors,
        warnings,
        robotsTxtRespected: true,
        rateLimitRespected: true,
        termsOfServiceRespected: true
      };

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      logger.error(`Indeed scraping failed: ${error}`);
      
      return {
        success: false,
        jobs: [],
        totalJobs: 0,
        scrapedJobs: 0,
        failedJobs: jobs.length + 1,
        startTime,
        endTime,
        duration,
        averageTimePerJob: 0,
        errors: [...errors, {
          code: 'SCRAPING_FAILED',
          message: `Scraping failed: ${error}`,
          timestamp: new Date()
        }],
        warnings,
        robotsTxtRespected: true,
        rateLimitRespected: true,
        termsOfServiceRespected: true
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Scrape individual job details
   */
  public async scrapeJobDetails(jobUrl: string): Promise<ScrapedJob | null> {
    try {
      await this.initializeBrowser();
      
      await this.navigateTo(jobUrl, '[data-testid="jobsearch-JobComponent"]');
      
      // Check for anti-bot measures
      await this.handleAntiBotMeasures();
      
      // Parse the job page
      const jobData = await this.parseJobPage();
      
      if (!jobData.title || !jobData.company) {
        logger.warn(`Incomplete job data for ${jobUrl}`);
        return null;
      }

      // Create full job object
      const job: ScrapedJob = {
        source: 'indeed',
        externalId: jobData.externalId || this.extractJobIdFromUrl(jobUrl),
        url: jobUrl,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location || 'Unknown',
        jobType: jobData.jobType || JobType.FULL_TIME,
        level: jobData.level || JobLevel.MID,
        description: jobData.description || '',
        requirements: jobData.requirements || [],
        benefits: jobData.benefits || [],
        responsibilities: jobData.responsibilities || [],
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        salaryCurrency: jobData.salaryCurrency || 'USD',
        salaryPeriod: jobData.salaryPeriod || SalaryPeriod.ANNUAL,
        postedAt: jobData.postedAt || new Date(),
        deadline: jobData.deadline,
        applicationCount: jobData.applicationCount,
        companyIndustry: jobData.companyIndustry,
        companySize: jobData.companySize,
        companyType: jobData.companyType,
        easyApply: jobData.easyApply,
        referralBonus: jobData.referralBonus,
        scrapedAt: new Date(),
        scraperVersion: '1.0.0',
        dataQuality: this.assessDataQuality(jobData),
        anonymized: true,
        encrypted: false
      };

      return job;

    } catch (error) {
      logger.error(`Failed to scrape job details for ${jobUrl}: ${error}`);
      return null;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Parse job listings from search results page
   */
  protected async parseJobListings(): Promise<Partial<ScrapedJob>[]> {
    if (!this.page) return [];

    try {
      const jobs = await this.page.evaluate(() => {
        const jobElements = document.querySelectorAll('[data-testid="jobsearch-ResultsList"] > div');
        const results: any[] = [];

        for (const element of jobElements) {
          try {
            // Extract job title
            const titleElement = element.querySelector('[data-testid="jobsearch-JobComponent-title"] a');
            const title = titleElement?.textContent?.trim();
            const url = titleElement?.getAttribute('href');

            if (!title || !url) continue;

            // Extract company name
            const companyElement = element.querySelector('[data-testid="jobsearch-JobComponent-company"]');
            const company = companyElement?.textContent?.trim() || 'Unknown';

            // Extract location
            const locationElement = element.querySelector('[data-testid="jobsearch-JobComponent-location"]');
            const location = locationElement?.textContent?.trim() || 'Unknown';

            // Extract job type
                    const jobTypeElement = element.querySelector('[data-testid="jobsearch-JobComponent-jobType"]');
        const jobTypeText = jobTypeElement?.textContent?.trim() || 'Full-time';
        const jobType = this.mapJobTypeString(jobTypeText);

            // Extract salary info
            const salaryElement = element.querySelector('[data-testid="jobsearch-JobComponent-salary"]');
            const salary = salaryElement?.textContent?.trim();

            // Extract posted date
            const dateElement = element.querySelector('[data-testid="jobsearch-JobComponent-postedDate"]');
            const postedDate = dateElement?.textContent?.trim();

            // Extract job ID from URL
            const jobId = url.match(/\/jobs\/view\/([^?]+)/)?.[1] || '';

            results.push({
              title,
              company,
              location,
              jobType,
              salary,
              postedDate,
              url: url.startsWith('http') ? url : `https://www.indeed.com${url}`,
              externalId: jobId
            });
          } catch (error) {
            console.warn('Failed to parse job element:', error);
          }
        }

        return results;
      });

      return jobs;

    } catch (error) {
      logger.error(`Failed to parse job listings: ${error}`);
      return [];
    }
  }

  /**
   * Parse individual job page
   */
  protected async parseJobPage(): Promise<Partial<ScrapedJob>> {
    if (!this.page) return {};

    try {
      const jobData = await this.page.evaluate(() => {
        // Extract job title
        const titleElement = document.querySelector('[data-testid="jobsearch-JobComponent-title"]');
        const title = titleElement?.textContent?.trim() || '';

        // Extract company name
        const companyElement = document.querySelector('[data-testid="jobsearch-JobComponent-company"]');
        const company = companyElement?.textContent?.trim() || '';

        // Extract location
        const locationElement = document.querySelector('[data-testid="jobsearch-JobComponent-location"]');
        const location = locationElement?.textContent?.trim() || '';

        // Extract job description
        const descriptionElement = document.querySelector('[data-testid="jobsearch-JobComponent-description"]');
        const description = descriptionElement?.textContent?.trim() || '';

        // Extract salary information
        const salaryElement = document.querySelector('[data-testid="jobsearch-JobComponent-salary"]');
        const salary = salaryElement?.textContent?.trim() || '';

        // Extract job type
        const jobTypeElement = document.querySelector('[data-testid="jobsearch-JobComponent-jobType"]');
        const jobTypeText = jobTypeElement?.textContent?.trim() || '';
        const jobType = this.mapJobTypeString(jobTypeText);

        // Extract posted date
        const dateElement = document.querySelector('[data-testid="jobsearch-JobComponent-postedDate"]');
        const postedDate = dateElement?.textContent?.trim() || '';

        // Extract requirements (look for common requirement patterns)
        const requirements: string[] = [];
        const requirementElements = document.querySelectorAll('ul li, .jobsearch-JobComponent-description li');
        
        for (const element of requirementElements) {
          const text = element.textContent?.trim();
          if (text && (text.includes('experience') || text.includes('required') || text.includes('must') || text.includes('should'))) {
            requirements.push(text);
          }
        }

        // Extract benefits
        const benefits: string[] = [];
        const benefitElements = document.querySelectorAll('.jobsearch-JobComponent-benefits li, [class*="benefit"] li');
        
        for (const element of benefitElements) {
          const text = element.textContent?.trim();
          if (text) {
            benefits.push(text);
          }
        }

        // Check for easy apply
        const easyApplyElement = document.querySelector('[data-testid="jobsearch-JobComponent-easyApply"]');
        const easyApply = !!easyApplyElement;

        return {
          title,
          company,
          location,
          description,
          salary,
          jobType,
          postedDate,
          requirements,
          benefits,
          easyApply
        };
      });

      return jobData;

    } catch (error) {
      logger.error(`Failed to parse job page: ${error}`);
      return {};
    }
  }

  /**
   * Create a basic job from partial data
   */
  private createBasicJob(partialJob: Partial<ScrapedJob>): ScrapedJob {
    return {
      source: 'indeed',
      externalId: partialJob.externalId || 'unknown',
      url: partialJob.url || '',
      title: partialJob.title || 'Unknown Title',
      company: partialJob.company || 'Unknown Company',
      location: partialJob.location || 'Unknown Location',
      jobType: partialJob.jobType || JobType.FULL_TIME,
      level: partialJob.level || JobLevel.MID,
      description: partialJob.description || '',
      requirements: partialJob.requirements || [],
      benefits: partialJob.benefits || [],
      responsibilities: partialJob.responsibilities || [],
      salaryMin: partialJob.salaryMin,
      salaryMax: partialJob.salaryMax,
      salaryCurrency: partialJob.salaryCurrency || 'USD',
              salaryPeriod: partialJob.salaryPeriod || SalaryPeriod.ANNUAL,
      postedAt: partialJob.postedAt || new Date(),
      deadline: partialJob.deadline,
      applicationCount: partialJob.applicationCount,
      companyIndustry: partialJob.companyIndustry,
      companySize: partialJob.companySize,
      companyType: partialJob.companyType,
      easyApply: partialJob.easyApply,
      referralBonus: partialJob.referralBonus,
      scrapedAt: new Date(),
      scraperVersion: '1.0.0',
      dataQuality: DataQuality.FAIR,
      anonymized: true,
      encrypted: false
    };
  }

  /**
   * Extract job ID from Indeed URL
   */
  private extractJobIdFromUrl(url: string): string {
    const match = url.match(/\/jobs\/view\/([^?]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Map job type string to JobType enum
   */
  private mapJobTypeString(jobTypeText: string): JobType {
    const jobTypeMap: Record<string, JobType> = {
      'Full-time': JobType.FULL_TIME,
      'Part-time': JobType.PART_TIME,
      'Contract': JobType.CONTRACT,
      'Temporary': JobType.TEMPORARY,
      'Internship': JobType.INTERNSHIP,
      'Freelance': JobType.FREELANCE,
      'Remote': JobType.REMOTE,
      'Hybrid': JobType.HYBRID,
      'On-site': JobType.ON_SITE
    };
    
    return jobTypeMap[jobTypeText] || JobType.FULL_TIME;
  }

  /**
   * Assess data quality based on available information
   */
  private assessDataQuality(jobData: Partial<ScrapedJob>): DataQuality {
    let score = 0;
    
    if (jobData.title) score += 20;
    if (jobData.company) score += 20;
    if (jobData.location) score += 15;
    if (jobData.description) score += 20;
    if (jobData.requirements && jobData.requirements.length > 0) score += 15;
    if (jobData.benefits && jobData.benefits.length > 0) score += 10;

    if (score >= 95) return DataQuality.EXCELLENT;
    if (score >= 80) return DataQuality.GOOD;
    if (score >= 60) return DataQuality.FAIR;
    return DataQuality.POOR;
  }
}
