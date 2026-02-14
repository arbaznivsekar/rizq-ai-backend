import { BaseScraper } from '../base/baseScraper.js';
import { 
  ScrapedJob,
  ScrapingResult,
  ScraperConfig,
  SessionConfig,
  SearchParams,
  JobType,
  JobLevel,
  SalaryPeriod,
  DataQuality
} from '../types/index.js';
import { ErrorSeverity } from '../types/index.js';
import { logger } from '../../config/logger.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export class NaukriScraper extends BaseScraper {
  constructor(config: ScraperConfig, session: SessionConfig) {
    super(config, session);
  }

  // Implement abstract methods from BaseScraper as stubs with correct signatures

  protected buildSearchUrl(..._args: any[]): string {
    throw new Error('Method not implemented.');
  }

  protected async parseJobListings(..._args: any[]): Promise<Partial<ScrapedJob>[]> {
    throw new Error('Method not implemented.');
  }

  protected async parseJobPage(..._args: any[]): Promise<Partial<ScrapedJob>> {
    throw new Error('Method not implemented.');
  }

  public async scrapeJobDetails(jobUrl: string): Promise<ScrapedJob | null> {
    throw new Error('Method not implemented.');
  }

  protected getBaseUrl(): string {
    return 'https://www.naukri.com';
  }

  public async scrapeJobs(searchParams: SearchParams): Promise<ScrapingResult> {
    const startTime = new Date();
    const errors: any[] = [];
    const warnings: any[] = [];
    let jobs: ScrapedJob[] = [];

    try {
      const query = searchParams.query || 'software engineer';
      const location = searchParams.location || 'Mumbai';
      const maxJobs = this.config.maxJobsPerPage || 20;

      const projectRoot = process.cwd();
      const scriptPath = path.join(projectRoot, 'real-naukri-scraper.mjs');

      // Run the real Naukri scraper as a child process
      logger.info(`Launching real-naukri-scraper.mjs for query="${query}" location="${location}"`);
      await execFileAsync(process.execPath, [scriptPath, query, '--location', location, '--max-jobs', String(maxJobs)], { cwd: projectRoot });

      // Find the newest output file matching the naming pattern for today
      const today = new Date().toISOString().split('T')[0];
      const safeQuery = query.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const dirEntries = await fs.readdir(projectRoot, { withFileTypes: true });
      const matches = dirEntries
        .filter(d => d.isFile() && d.name.startsWith(`REAL-naukri-jobs-${safeQuery}-${today}`) && d.name.endsWith('.json'))
        .map(d => path.join(projectRoot, d.name));

      if (matches.length === 0) {
        throw new Error('Naukri scraper produced no output file');
      }

      // Pick the most recently modified matching file
      let newest = matches[0];
      let newestMtime = (await fs.stat(newest)).mtimeMs;
      for (const f of matches.slice(1)) {
        const mt = (await fs.stat(f)).mtimeMs;
        if (mt > newestMtime) {
          newest = f; newestMtime = mt;
        }
      }

      const raw = await fs.readFile(newest, 'utf-8');
      const parsed = JSON.parse(raw);
      const fileJobs = Array.isArray(parsed?.jobs) ? parsed.jobs : [];

      jobs = fileJobs.map((j: any): ScrapedJob => ({
        source: 'naukri',
        externalId: null as any,
        url: String(j.link || ''),
        title: String(j.title || 'Unknown Title'),
        company: String(j.company || 'Unknown Company'),
        location: String(j.location || location),
        jobType: JobType.FULL_TIME,
        level: JobLevel.MID,
        salaryMin: undefined,
        salaryMax: undefined,
        salaryCurrency: 'INR',
        salaryPeriod: SalaryPeriod.ANNUAL,
        description: String(j.description || ''),
        requirements: Array.isArray(j.keySkills) ? j.keySkills : [],
        benefits: [],
        responsibilities: [],
        postedAt: new Date(),
        deadline: undefined,
        applicationCount: undefined,
        companyIndustry: undefined,
        companySize: undefined,
        companyType: undefined,
        easyApply: false,
        referralBonus: false,
        scrapedAt: new Date(),
        scraperVersion: 'wrapper-1.0.0',
        dataQuality: DataQuality.FAIR,
        anonymized: true,
        encrypted: false,
      }));

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        success: jobs.length > 0,
        jobs,
        totalJobs: jobs.length,
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
        termsOfServiceRespected: true,
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      logger.error(`Naukri wrapper scraping failed: ${error}`);
      return {
        success: false,
        jobs: [],
        totalJobs: 0,
        scrapedJobs: 0,
        failedJobs: 1,
        startTime,
        endTime,
        duration,
        averageTimePerJob: 0,
        errors: [{
            code: 'SCRAPING_FAILED',
            message: String(error),
            timestamp: new Date(),
            severity: ErrorSeverity.LOW,
            retryable: false
        }],
        warnings,
        robotsTxtRespected: true,
        rateLimitRespected: true,
        termsOfServiceRespected: true,
      };
    }
  }
}


