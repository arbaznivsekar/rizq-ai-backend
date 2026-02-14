/**
 * Jobs Service - Handles job retrieval from database
 * @module services
 */

import { IService, ServiceConfig, ServiceHealth, ServiceStatus } from '../core/ServiceRegistry.js';
import { JobModel } from '../data/models/Job.js';
import { logger } from '../config/logger.js';
import { FilterQuery } from 'mongoose';

/**
 * Jobs service configuration
 */
const JOBS_SERVICE_CONFIG: ServiceConfig = {
  name: 'jobs',
  version: '1.0.0',
  enabled: true,
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  healthCheckInterval: 60000,
  dependencies: ['database'],
  environment: {}
};

/**
 * Jobs query parameters
 */
export interface JobsQuery {
  page?: number;
  pageSize?: number;
  q?: string; // Search query
  type?: string;
  source?: string;
  location?: string;
  easyApply?: boolean;
  postedAfter?: string;
  sort?: 'date' | 'salary';
}

/**
 * Jobs service for retrieving jobs from database
 */
export class JobsService implements IService {
  private config: ServiceConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = JOBS_SERVICE_CONFIG;
  }

  /**
   * Get service name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get service version
   */
  getVersion(): string {
    return this.config.version;
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get service configuration
   */
  getConfig(): ServiceConfig {
    return this.config;
  }

  /**
   * Health check for jobs service
   */
  async healthCheck(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Simple database connectivity check
      await JobModel.findOne({}).limit(1).lean();
      const responseTime = Date.now() - startTime;

      return {
        status: ServiceStatus.HEALTHY,
        timestamp: new Date(),
        responseTime,
        metadata: {
          collectionCount: await JobModel.countDocuments(),
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`Jobs service health check failed: ${errorMessage}`);

      return {
        status: ServiceStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime,
        error: errorMessage
      };
    }
  }

  /**
   * Initialize the jobs service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Jobs service already initialized');
      return;
    }

    try {
      logger.info('Initializing Jobs service...');

      // Ensure database connection is available
      await JobModel.findOne({}).limit(1).lean();

      this.isInitialized = true;
      logger.info('Jobs service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Jobs service:', error);
      throw error;
    }
  }

  /**
   * Shutdown the jobs service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Jobs service...');
    this.isInitialized = false;
    logger.info('Jobs service shutdown completed');
  }

  /**
   * List jobs with filtering and pagination
   */
  async listJobs(query: JobsQuery = {}): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const {
        page = 1,
        pageSize = 20,
        q,
        type,
        source,
        location,
        easyApply,
        postedAfter,
        sort
      } = query;

      const skip = (page - 1) * pageSize;
      const limit = pageSize;

      const filter: FilterQuery<any> = {};

      // Text search
      if (q) {
        (filter as any).$text = { $search: q };
      }

      // Job type filter
      if (type) {
        (filter as any).jobType = type;
      }

      // Source filter
      if (source) {
        (filter as any).source = source;
      }

      // Location filter
      if (location) {
        const rx = new RegExp(location, 'i');
        (filter as any).$or = [
          { 'location.city': rx },
          { 'location.state': rx },
          { 'location.country': rx },
        ];
      }

      // Easy apply filter
      if (easyApply !== undefined) {
        (filter as any).easyApply = easyApply;
      }

      // Posted after filter
      if (postedAfter) {
        filter.postedAt = { $gte: new Date(postedAfter) };
      }

      const cursor = JobModel.find(filter as any).skip(skip).limit(limit);

      // Sorting
      if (sort === 'date') {
        cursor.sort({ postedAt: -1 });
      } else if (sort === 'salary') {
        cursor.sort({ salaryMax: -1 });
      } else {
        cursor.sort({ postedAt: -1 }); // Default sort by date
      }

      const [items, total] = await Promise.all([
        cursor.lean(),
        JobModel.countDocuments(filter as any)
      ]);

      logger.info(`Retrieved ${items.length} jobs (page ${page}, total ${total})`);

      return {
        items,
        total,
        page,
        pageSize
      };
    } catch (error) {
      logger.error('Failed to list jobs:', error);
      throw error;
    }
  }

  /**
   * Get a specific job by ID
   */
  async getJob(id: string): Promise<any | null> {
    try {
      const job = await JobModel.findById(id).lean();

      if (job) {
        logger.info(`Retrieved job: ${id}`);
      } else {
        logger.warn(`Job not found: ${id}`);
      }

      return job;
    } catch (error) {
      logger.error(`Failed to get job ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getStats(): Promise<{
    totalJobs: number;
    jobsBySource: Record<string, number>;
    jobsByType: Record<string, number>;
    recentJobs: number;
    averageSalary: number;
  }> {
    try {
      const [
        totalJobs,
        jobsBySource,
        jobsByType,
        recentJobs,
        averageSalary
      ] = await Promise.all([
        // Total jobs count
        JobModel.countDocuments(),

        // Jobs by source
        JobModel.aggregate([
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).then(result => {
          const stats: Record<string, number> = {};
          result.forEach(item => {
            stats[item._id || 'unknown'] = item.count;
          });
          return stats;
        }),

        // Jobs by type
        JobModel.aggregate([
          { $group: { _id: '$jobType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).then(result => {
          const stats: Record<string, number> = {};
          result.forEach(item => {
            stats[item._id || 'unknown'] = item.count;
          });
          return stats;
        }),

        // Recent jobs (last 24 hours)
        JobModel.countDocuments({
          postedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),

        // Average salary
        JobModel.aggregate([
          { $match: { salaryMax: { $ne: null, $gt: 0 } } },
          { $group: { _id: null, avg: { $avg: '$salaryMax' } } }
        ]).then(result => result[0]?.avg || 0)
      ]);

      const stats = {
        totalJobs,
        jobsBySource,
        jobsByType,
        recentJobs,
        averageSalary: Math.round(averageSalary)
      };

      logger.info('Retrieved jobs statistics', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get jobs statistics:', error);
      throw error;
    }
  }

  /**
   * Search jobs with advanced filters
   */
  async searchJobs(searchParams: {
    query?: string;
    location?: string;
    jobType?: string[];
    experienceLevel?: string[];
    salaryMin?: number;
    salaryMax?: number;
    remote?: boolean;
    easyApply?: boolean;
    postedWithin?: number; // days
    companySize?: string[];
    locationRadius?: number; // km
    limit?: number;
    offset?: number;
  }): Promise<{
    items: any[];
    total: number;
    facets: {
      sources: Record<string, number>;
      types: Record<string, number>;
      locations: Record<string, number>;
    };
  }> {
    try {
      const {
        query,
        location,
        jobType = [],
        experienceLevel = [],
        salaryMin,
        salaryMax,
        remote,
        easyApply,
        postedWithin, // No default - only apply filter if explicitly provided
        companySize = [],
        locationRadius,
        limit = 20,
        offset = 0
      } = searchParams;

      const filter: FilterQuery<any> = {};

      // Text search
      if (query) {
        (filter as any).$text = { $search: query };
      }

      // Note: Location filtering will be done after fetching results
      // due to MongoDB Atlas restrictions on $where and $regex

      // Job type filter
      if (jobType.length > 0) {
        (filter as any).jobType = { $in: jobType };
      }

      // Experience level filter
      if (experienceLevel.length > 0) {
        (filter as any).experienceLevel = { $in: experienceLevel };
      }

      // Salary filter
      if (salaryMin || salaryMax) {
        const salaryFilter: any = {};
        if (salaryMin) salaryFilter.$gte = salaryMin;
        if (salaryMax) salaryFilter.$lte = salaryMax;
        (filter as any).salaryMax = salaryFilter;
      }

      // Remote filter
      if (remote !== undefined) {
        (filter as any).remote = remote;
      }

      // Easy apply filter
      if (easyApply !== undefined) {
        (filter as any).easyApply = easyApply;
      }

      // Posted within filter - only apply if explicitly provided
      // This allows fetching ALL jobs when postedWithin is not specified
      if (postedWithin !== undefined && postedWithin > 0) {
        filter.postedAt = {
          $gte: new Date(Date.now() - postedWithin * 24 * 60 * 60 * 1000)
        };
      }

      // Company size filter
      if (companySize.length > 0) {
        (filter as any).companySize = { $in: companySize };
      }

      // When location filter is specified, we need to fetch all jobs and filter in-memory
      // because MongoDB Atlas doesn't support $regex/$where in our tier
      let items: any[];
      let totalCount: number;
      
      if (location) {
        // Fetch ALL jobs matching other filters (without pagination)
        const allItems = await JobModel.find(filter as any)
          .sort({ postedAt: -1 })
          .lean();
        
        // Apply location filtering (case-insensitive partial match)
        const locationLower = location.toLowerCase();
        let filteredItems = allItems.filter(job => 
          job.location && job.location.toLowerCase().includes(locationLower)
        );

        // TODO: Implement location radius filtering when geocoding is available
        // For now, location radius parameter is accepted but not applied
        if (locationRadius && locationRadius > 0) {
          // Future implementation will use geocoding to filter by radius
          // filteredItems = filteredItems.filter(job => 
          //   calculateDistance(userLocation, job.location) <= locationRadius
          // );
        }
        
        // Apply pagination AFTER filtering
        totalCount = filteredItems.length;
        items = filteredItems.slice(offset, offset + limit);
      } else {
        // No location filter - use normal database pagination
        const [dbItems, dbTotal] = await Promise.all([
          JobModel.find(filter as any)
            .skip(offset)
            .limit(limit)
            .sort({ postedAt: -1 })
            .lean(),
          JobModel.countDocuments(filter as any)
        ]);
        items = dbItems;
        totalCount = dbTotal;
      }

      // Get facets for filtering UI
      const facets = await Promise.all([
        JobModel.aggregate([
          { $match: filter },
          { $group: { _id: '$source', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).then(result => {
          const sources: Record<string, number> = {};
          result.forEach(item => {
            sources[item._id || 'unknown'] = item.count;
          });
          return sources;
        }),

        JobModel.aggregate([
          { $match: filter },
          { $group: { _id: '$jobType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).then(result => {
          const types: Record<string, number> = {};
          result.forEach(item => {
            types[item._id || 'unknown'] = item.count;
          });
          return types;
        }),

        JobModel.aggregate([
          { $match: filter },
          { $group: { _id: '$location.city', count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]).then(result => {
          const locations: Record<string, number> = {};
          result.forEach(item => {
            locations[item._id] = item.count;
          });
          return locations;
        })
      ]);

      const result = {
        items,
        total: totalCount,
        facets: {
          sources: facets[0],
          types: facets[1],
          locations: facets[2]
        }
      };

      logger.info(`Advanced search returned ${items.length} jobs (total ${totalCount})`);
      return result;
    } catch (error) {
      logger.error('Failed to search jobs:', error);
      throw error;
    }
  }

  /**
   * Bulk insert jobs (upsert based on source and external ID)
   */
  async insertJobs(jobs: any[]): Promise<number> {
    if (!jobs?.length) return 0;

    try {
      const ops = jobs.map((job) => ({
        updateOne: {
          filter: { source: job.source, externalId: job.externalId },
          update: { $set: job, $setOnInsert: { createdAt: new Date() } },
          upsert: true,
        },
      }));

      const res = await JobModel.bulkWrite(ops as any, { ordered: false });
      const count = res.upsertedCount + res.modifiedCount;

      logger.info(`Bulk inserted/updated ${count} jobs`);
      return count;
    } catch (error) {
      logger.error('Failed to bulk insert jobs:', error);
      throw error;
    }
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit: number = 10): Promise<any[]> {
    try {
      const jobs = await JobModel.find({})
        .sort({ postedAt: -1 })
        .limit(limit)
        .lean();

      logger.info(`Retrieved ${jobs.length} recent jobs`);
      return jobs;
    } catch (error) {
      logger.error('Failed to get recent jobs:', error);
      throw error;
    }
  }

  /**
   * Get jobs by IDs
   */
  async getJobsByIds(jobIds: string[]): Promise<any[]> {
    try {
      const jobs = await JobModel.find({ _id: { $in: jobIds } }).lean();
      
      logger.info(`Retrieved ${jobs.length} jobs by IDs`);
      return jobs;
    } catch (error) {
      logger.error('Failed to get jobs by IDs:', error);
      throw error;
    }
  }
}
