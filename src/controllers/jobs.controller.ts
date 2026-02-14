import { Request, Response } from "express";
import { JobsService } from "../services/JobsService.js";
import { ServiceRegistry } from "../core/ServiceRegistry.js";
import { getLatestResume } from "../services/resume.service.js";
import { scoreMatch } from "../services/matching.service.js";
import { logger } from "../config/logger.js";

// Cache-buster for logo URLs to avoid stale browser cache on job listings
const CACHE_BUCKET_MS = 5 * 60 * 1000; // 5 minutes
const cacheBucket = Math.floor(Date.now() / CACHE_BUCKET_MS);
const withCacheBuster = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${cacheBucket}`;
};

const buildLogoSrcSet = (domain?: string | null): string | undefined => {
  if (!domain) return undefined;
  const d = domain.replace(/^www\./, '');
  return `https://logo.clearbit.com/${d}?size=256 1x, https://logo.clearbit.com/${d}?size=512 2x`;
};

/**
 * Jobs controller using the unified service registry
 */
export class JobsController {
  private jobsService: JobsService;

  constructor() {
    // Get jobs service from registry
    const registry = ServiceRegistry.getInstance();
    const jobsService = registry.getService<JobsService>('jobs');

    if (!jobsService) {
      throw new Error('Jobs service not found in registry. Make sure it is registered.');
    }

    this.jobsService = jobsService;
  }

  /**
   * Get jobs with filtering and pagination
   */
  async getJobs(req: Request, res: Response): Promise<void> {
    try {
      const query = this.buildQueryFromRequest(req);
      const data = await this.jobsService.listJobs(query);
      const itemsWithCb = data.items.map((j: any) => ({
        ...j,
        logoUrl: withCacheBuster(j?.logoUrl),
        logoSrcSet: buildLogoSrcSet(j?.companyDomain)
      }));

      res.json({
        success: true,
        data: {
          items: itemsWithCb,
          total: data.total,
          page: data.page,
          pageSize: data.pageSize
        }
      });
    } catch (error: any) {
      logger.error('Failed to get jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve jobs',
        details: error.message
      });
    }
  }

  /**
   * Get a specific job by ID
   */
  async getJobById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Job ID is required'
        });
        return;
      }

      const job = await this.jobsService.getJob(id);

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { job: { ...job, logoUrl: withCacheBuster((job as any)?.logoUrl), logoSrcSet: buildLogoSrcSet((job as any)?.companyDomain) } }
      });
    } catch (error: any) {
      logger.error(`Failed to get job ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve job',
        details: error.message
      });
    }
  }

  /**
   * Bulk insert jobs
   */
  async bulkInsertJobs(req: Request, res: Response): Promise<void> {
    try {
      const { jobs } = req.body;

      if (!Array.isArray(jobs)) {
        res.status(400).json({
          success: false,
          error: 'Jobs must be an array'
        });
        return;
      }

      const count = await this.jobsService.insertJobs(jobs);

      res.status(201).json({
        success: true,
        data: { count },
        message: `Successfully inserted/updated ${count} jobs`
      });
    } catch (error: any) {
      logger.error('Failed to bulk insert jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to insert jobs',
        details: error.message
      });
    }
  }

  /**
   * Get job matches based on user resume
   */
  async getMatches(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const resume = await getLatestResume(userId);
      if (!resume) {
        res.json({
          success: true,
          data: {
            items: [],
            total: 0,
            page: 1,
            pageSize: 0,
            message: 'No resume found for user'
          }
        });
        return;
      }

      const query = this.buildQueryFromRequest(req);
      const { items, total, page, pageSize } = await this.jobsService.listJobs(query);

      // Score matches
      type Scored = { matchScore?: number; matchReasons?: string[] } & Record<string, unknown>;
      const scored: Scored[] = (items as unknown[]).map((j: unknown) => {
        const { score, reasons } = scoreMatch(j as any, resume as any);
        return { ...(j as any), matchScore: score, matchReasons: reasons } as Scored;
      }).sort((a: Scored, b: Scored) => (Number(b.matchScore) || 0) - (Number(a.matchScore) || 0));

      res.json({
        success: true,
        data: {
          items: scored.map((s: any) => ({ ...s, logoUrl: withCacheBuster(s?.logoUrl), logoSrcSet: buildLogoSrcSet((s as any)?.companyDomain) })),
          total,
          page,
          pageSize
        }
      });
    } catch (error: any) {
      logger.error('Failed to get job matches:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve job matches',
        details: error.message
      });
    }
  }

  /**
   * Get job statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.jobsService.getStats();

      res.json({
        success: true,
        data: stats
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
   * Search jobs with advanced filters
   */
  async searchJobs(req: Request, res: Response): Promise<void> {
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
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };

      const result = await this.jobsService.searchJobs(searchParams);
      const itemsWithCb = result.items.map((j: any) => ({
        ...j,
        logoUrl: withCacheBuster(j?.logoUrl),
        logoSrcSet: buildLogoSrcSet(j?.companyDomain)
      }));

      res.json({
        success: true,
        data: { ...result, items: itemsWithCb }
      });
    } catch (error: any) {
      logger.error('Failed to search jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search jobs',
        details: error.message
      });
    }
  }

  /**
   * Build query object from request parameters
   */
  private buildQueryFromRequest(req: Request): any {
    return {
      page: req.query.page ? Number(req.query.page) : undefined,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      q: req.query.q as string,
      type: req.query.type as string,
      source: req.query.source as string,
      location: req.query.location as string,
      easyApply: req.query.easyApply ? req.query.easyApply === 'true' : undefined,
      postedAfter: req.query.postedAfter as string,
      sort: req.query.sort as 'date' | 'salary',
    };
  }
}

// Export convenience functions for backward compatibility
export async function getJobs(req: Request, res: Response) {
  const controller = new JobsController();
  await controller.getJobs(req, res);
}

export async function getJobById(req: Request, res: Response) {
  const controller = new JobsController();
  await controller.getJobById(req, res);
}

export async function bulkInsertJobs(req: Request, res: Response) {
  const controller = new JobsController();
  await controller.bulkInsertJobs(req, res);
}

export async function getMatches(req: Request, res: Response) {
  const controller = new JobsController();
  await controller.getMatches(req, res);
}

export async function getJobStats(req: Request, res: Response) {
  const controller = new JobsController();
  await controller.getStats(req, res);
}

export async function searchJobs(req: Request, res: Response) {
  const controller = new JobsController();
  await controller.searchJobs(req, res);
}

