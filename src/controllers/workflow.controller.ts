/**
 * Unified Workflow Controller - Complete End-to-End Job Application Workflow
 * Database-first approach: Search from stored jobs, then apply
 * @module controllers
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { logger } from '../config/logger.js';
import { gmailOutreachService } from '../services/gmailOutreachService.js';
import axios from 'axios';
import { JobsService } from '../services/JobsService.js';
import { ServiceRegistry } from '../core/ServiceRegistry.js';
import { scoreMatch } from '../services/matching.service.js';
import { getLatestResume } from '../services/resume.service.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { JobModel } from '../data/models/Job.js';

/**
 * Input validation schemas
 */
const JobSearchSchema = z.object({
  query: z.string().max(500, 'Search query too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  jobTypes: z.array(z.string()).max(10, 'Too many job types').optional(),
  experienceLevels: z.array(z.string()).max(10, 'Too many experience levels').optional(),
  salaryMin: z.coerce.number().min(0, 'Salary must be positive').max(1000000, 'Salary too high').optional(),
  salaryMax: z.coerce.number().min(0, 'Salary must be positive').max(1000000, 'Salary too high').optional(),
  remote: z.coerce.boolean().optional(),
  easyApply: z.coerce.boolean().optional(),
  postedWithin: z.coerce.number().min(1, 'Posted within must be at least 1 day').max(365, 'Posted within too long').optional(),
  companySize: z.array(z.enum(['startup', 'small', 'medium', 'large'])).max(4, 'Too many company sizes').optional(),
  locationRadius: z.coerce.number().min(1, 'Radius must be at least 1km').max(100, 'Radius too large').optional(),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(20),
  offset: z.coerce.number().min(0, 'Offset must be non-negative').default(0),
  sortBy: z.enum(['relevance', 'date', 'salary', 'match']).default('relevance'),
  sources: z.array(z.enum(['indeed', 'naukri', 'linkedin', 'glassdoor', 'naukri_gulf', 'gulf_talent'])).optional()
});

const BulkApplySchema = z.object({
  jobIds: z.array(z.string()).min(1, 'At least one job ID is required').max(100, 'Too many jobs'),
  customMessage: z.string().max(1000, 'Custom message too long').optional(),
  includeResume: z.boolean().default(true),
  jobSummaries: z.record(z.string(), z.string()).optional(),
  previewMode: z.boolean().optional()
});

const WorkflowStatusSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required')
});

// Type inference
type JobSearchInput = z.infer<typeof JobSearchSchema>;
type BulkApplyInput = z.infer<typeof BulkApplySchema>;
type WorkflowStatusInput = z.infer<typeof WorkflowStatusSchema>;

/**
 * Workflow Controller - Handles complete job application workflows
 * Focus: Database search + Email application (No real-time scraping)
 */
export class WorkflowController {
  private jobsService?: JobsService;
  private activeWorkflows: Map<string, any> = new Map();

  constructor() {
    // Services will be lazy-loaded when needed
  }

  /**
   * Get jobs service from registry (lazy loading)
   */
  private getJobsService(): JobsService {
    if (!this.jobsService) {
      const registry = ServiceRegistry.getInstance();
      const jobsService = registry.getService<JobsService>('jobs');
      
      if (!jobsService) {
        throw new Error('Jobs service not found in registry');
      }
      
      this.jobsService = jobsService;
    }
    
    return this.jobsService;
  }

  /**
   * Smart Job Search from Database
   * Searches stored jobs with advanced filtering, ranking, and resume matching
   */
  public async searchJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;

      // Validate input
      const validationResult = JobSearchSchema.safeParse(req.query);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({
          success: false,
          error: 'Input validation failed',
          details: errors
        });
        return;
      }

      const searchParams = validationResult.data;

      // Search jobs from database
      const searchResult = await this.getJobsService().searchJobs({
        query: searchParams.query,
        location: searchParams.location,
        jobType: searchParams.jobTypes,
        experienceLevel: searchParams.experienceLevels,
        salaryMin: searchParams.salaryMin,
        salaryMax: searchParams.salaryMax,
        remote: searchParams.remote,
        easyApply: searchParams.easyApply,
        postedWithin: searchParams.postedWithin,
        companySize: searchParams.companySize,
        locationRadius: searchParams.locationRadius,
        limit: searchParams.limit,
        offset: searchParams.offset
      });

      let jobs = searchResult.items;

      // Filter by sources if specified
      if (searchParams.sources && searchParams.sources.length > 0) {
        jobs = jobs.filter(job => searchParams.sources?.includes(job.source));
      }

      // Apply resume-based matching if user is authenticated
      if (userId) {
        const resume = await getLatestResume(userId);
        if (resume) {
          jobs = jobs.map((job: any) => {
            const { score, reasons } = scoreMatch(job, resume);
            return {
              ...job,
              matchScore: score,
              matchReasons: reasons
            };
          });
        }
      }

      // Sort based on user preference
      jobs = this.sortJobs(jobs, searchParams.sortBy, userId ? true : false);

      res.json({
        success: true,
        data: {
          jobs,
          total: searchResult.total,
          facets: searchResult.facets,
          pagination: {
            limit: searchParams.limit,
            offset: searchParams.offset,
            hasMore: searchParams.offset + jobs.length < searchResult.total
          }
        }
      });

    } catch (error: any) {
      logger.error(`Job search failed: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to search jobs',
        details: error.message
      });
    }
  }

  /**
   * Sort jobs based on different criteria
   */
  private sortJobs(jobs: any[], sortBy: string, hasResume: boolean): any[] {
    const sortedJobs = [...jobs];

    switch (sortBy) {
      case 'match':
        // Sort by match score (requires resume)
        if (hasResume) {
          sortedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        } else {
          // Fallback to date if no resume
          sortedJobs.sort((a, b) => {
            const dateA = new Date(a.postedAt || 0).getTime();
            const dateB = new Date(b.postedAt || 0).getTime();
            return dateB - dateA;
          });
        }
        break;

      case 'salary':
        // Sort by salary (highest first)
        sortedJobs.sort((a, b) => {
          const salaryA = a.salary?.normalizedAnnualMax || a.salary?.max || 0;
          const salaryB = b.salary?.normalizedAnnualMax || b.salary?.max || 0;
          return salaryB - salaryA;
        });
        break;

      case 'date':
        // Sort by posted date (newest first)
        sortedJobs.sort((a, b) => {
          const dateA = new Date(a.postedAt || 0).getTime();
          const dateB = new Date(b.postedAt || 0).getTime();
          return dateB - dateA;
        });
        break;

      case 'relevance':
      default:
        // Composite score: combine match score, date, and salary
        sortedJobs.sort((a, b) => {
          const scoreA = this.calculateRelevanceScore(a, hasResume);
          const scoreB = this.calculateRelevanceScore(b, hasResume);
          return scoreB - scoreA;
        });
        break;
    }

    return sortedJobs;
  }

  /**
   * Calculate relevance score for a job
   * Combines multiple factors: match score, recency, salary, easy apply
   */
  private calculateRelevanceScore(job: any, hasResume: boolean): number {
    let score = 0;

    // Match score (40% weight if available)
    if (hasResume && job.matchScore) {
      score += job.matchScore * 0.4;
    }

    // Recency score (30% weight)
    const daysSincePosted = Math.floor(
      (Date.now() - new Date(job.postedAt || 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.max(0, 100 - daysSincePosted * 2); // Decreases over time
    score += recencyScore * 0.3;

    // Salary score (20% weight)
    const salary = job.salary?.normalizedAnnualMax || job.salary?.max || 0;
    const salaryScore = Math.min(100, salary / 1000); // Normalize to 0-100
    score += salaryScore * 0.2;

    // Easy apply bonus (10% weight)
    if (job.easyApply) {
      score += 10;
    }

    return score;
  }

  /**
   * Get recommended jobs based on user's resume and preferences
   * This is the main endpoint for personalized job recommendations
   */
  public async getRecommendedJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      // Get user's resume
      const resume = await getLatestResume(userId);
      if (!resume) {
        res.status(404).json({
          success: false,
          error: 'Resume not found',
          message: 'Please upload your resume to get personalized recommendations'
        });
        return;
      }

      // Get recent jobs from database
      const searchResult = await this.getJobsService().searchJobs({
        postedWithin: 30, // Last 30 days
        limit: limit * 2, // Get more to filter down
        offset: offset
      });

      // Score and rank jobs based on resume
      const scoredJobs = searchResult.items.map((job: any) => {
        const { score, reasons } = scoreMatch(job, resume);
        return {
          ...job,
          matchScore: score,
          matchReasons: reasons
        };
      });

      // Filter jobs with good match scores (>= 60%)
      const recommendedJobs = scoredJobs
        .filter(job => job.matchScore >= 60)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      res.json({
        success: true,
        data: {
          jobs: recommendedJobs,
          total: recommendedJobs.length,
          pagination: {
            limit,
            offset,
            hasMore: scoredJobs.length > limit
          }
        }
      });

    } catch (error: any) {
      logger.error(`Failed to get recommended jobs: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get recommendations',
        details: error.message
      });
    }
  }

  /**
   * One-Click Bulk Apply - Enhanced with Email Discovery & AI Generation
   * This is our competitive advantage - email discovery hidden from frontend
   */
  public async quickApply(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const validationResult = BulkApplySchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({
          success: false,
          error: 'Input validation failed',
          details: errors
        });
        return;
      }

      const { jobIds, customMessage, includeResume, jobSummaries, previewMode } = validationResult.data;

      // Verify jobs exist
      const jobs = await this.getJobsService().getJobsByIds(jobIds);
      if (jobs.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No valid jobs found'
        });
        return;
      }

      // Use the new orchestrator for enhanced bulk application
      // This handles: Email Discovery → AI Generation → Gmail Sending
      const { bulkApplicationOrchestrator } = await import('../services/bulkApplicationOrchestrator.service.js');
      
      const result = await bulkApplicationOrchestrator.processBulkApplications({
        userId: String(userId),
        jobIds,
        customMessage,
        includeResume,
        jobSummaries,
        previewMode: previewMode || false
      });

      // Return immediately with progress ID
      // Frontend can poll for progress updates
      res.status(202).json({
        success: true,
        message: result.totalJobs > 0 
          ? 'Applications are being processed' 
          : 'All selected jobs have already been applied to within the last 30 days',
        data: {
          progressId: result.progressId,
          totalJobs: result.totalJobs,
          estimatedTime: result.estimatedTime,
          statusUrl: `/api/v1/workflow/apply/status/${result.progressId}`,
          alreadyAppliedCount: result.alreadyAppliedJobs?.length || 0,
          alreadyAppliedJobs: result.alreadyAppliedJobs
        }
      });

    } catch (error: any) {
      logger.error(`Bulk apply failed: ${error.message}`, { 
        error: error.stack,
        userId: (req as any).user?.id
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to process applications',
        details: error.message
      });
    }
  }
  
  /**
   * Check if user can apply to specific jobs (idempotency check)
   * Returns application status and days until reapplication is allowed
   */
  public async checkApplicationEligibility(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      logger.info('🔍 [ELIGIBILITY CHECK] Request received', { 
        userId: userId ? String(userId) : 'MISSING',
        hasAuth: !!userId 
      });
      
      if (!userId) {
        logger.warn('⚠️ [ELIGIBILITY CHECK] No user ID found - auth required');
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const jobIds = req.query.jobIds as string | string[];
      if (!jobIds) {
        logger.warn('⚠️ [ELIGIBILITY CHECK] No jobIds provided');
        res.status(400).json({ success: false, error: 'jobIds query parameter is required' });
        return;
      }

      const jobIdArray = Array.isArray(jobIds) ? jobIds : [jobIds];
      logger.info('🔍 [ELIGIBILITY CHECK] Processing request', {
        userId: String(userId),
        jobCount: jobIdArray.length,
        sampleJobIds: jobIdArray.slice(0, 3)
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find applications for these jobs
      const applications = await Application.find({
        userId: new Types.ObjectId(userId),
        jobId: { $in: jobIdArray.map(id => new Types.ObjectId(id)) }
      }).sort({ createdAt: -1 }).lean();

      logger.info('📊 [ELIGIBILITY CHECK] Applications found', {
        totalApplications: applications.length,
        applications: applications.map(app => ({
          jobId: String(app.jobId),
          createdAt: app.createdAt
        }))
      });

      // Build status map for each job
      const statusMap: Record<string, {
        hasApplied: boolean;
        canReapply: boolean;
        lastAppliedAt?: string;
        daysUntilReapply?: number;
        applicationId?: string;
      }> = {};

      for (const jobId of jobIdArray) {
        const application = applications.find(app => String(app.jobId) === jobId);
        
        if (!application) {
          // Never applied
          statusMap[jobId] = {
            hasApplied: false,
            canReapply: true
          };
        } else {
          const lastApplied = new Date(application.createdAt);
          const daysSinceApplication = Math.floor(
            (Date.now() - lastApplied.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysUntilReapply = Math.max(0, 30 - daysSinceApplication);
          const canReapply = daysSinceApplication >= 30;

          statusMap[jobId] = {
            hasApplied: true,
            canReapply,
            lastAppliedAt: application.createdAt.toISOString(),
            daysUntilReapply: canReapply ? 0 : daysUntilReapply,
            applicationId: String(application._id)
          };
        }
      }

      const appliedCount = Object.values(statusMap).filter(s => s.hasApplied).length;
      logger.info('✅ [ELIGIBILITY CHECK] Response ready', {
        totalJobs: jobIdArray.length,
        appliedJobs: appliedCount,
        notAppliedJobs: jobIdArray.length - appliedCount,
        sample: Object.entries(statusMap).slice(0, 3).map(([jobId, status]) => ({
          jobId: jobId.substring(0, 8) + '...',
          hasApplied: status.hasApplied,
          canReapply: status.canReapply
        }))
      });

      res.json({
        success: true,
        data: statusMap
      });

    } catch (error: any) {
      logger.error(`❌ [ELIGIBILITY CHECK] Failed: ${error.message}`, {
        error: error.stack
      });
      res.status(500).json({
        success: false,
        error: 'Failed to check application status'
      });
    }
  }
  
  /**
   * Get Application Progress
   * Frontend polls this endpoint to track progress
   */
  public async getApplicationProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { progressId } = req.params;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      
      if (!progressId) {
        res.status(400).json({ success: false, error: 'Progress ID required' });
        return;
      }
      
      const { bulkApplicationOrchestrator } = await import('../services/bulkApplicationOrchestrator.service.js');
      const progress = await bulkApplicationOrchestrator.getProgress(progressId);
      
      if (!progress) {
        res.status(404).json({
          success: false,
          error: 'Progress not found or expired'
        });
        return;
      }
      
      // Return progress without exposing email discovery details
      res.json({
        success: true,
        data: {
          total: progress.total,
          processed: progress.processed,
          successful: progress.successful,
          failed: progress.failed,
          skipped: progress.skipped || 0,
          status: this.mapPhaseToUserStatus(progress.phase),
          isComplete: progress.phase === 'complete',
          startedAt: progress.startedAt,
          completedAt: progress.completedAt
        }
      });
      
    } catch (error: any) {
      logger.error(`Failed to get application progress: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve progress'
      });
    }
  }
  
  /**
   * Map internal phases to user-friendly status
   * Hide email discovery phase (proprietary)
   */
  private mapPhaseToUserStatus(phase: string): string {
    const phaseMap: Record<string, string> = {
      'initializing': 'Preparing your applications...',
      'discovering_emails': 'Processing applications...',  // Hide email discovery
      'generating_emails': 'Personalizing your messages...',
      'queueing': 'Sending applications...',
      'complete': 'Complete'
    };
    
    return phaseMap[phase] || 'Processing...';
  }

  /**
   * Get User Dashboard Data
   */
  public async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }


      // Get recent jobs
      const recentJobs = await this.getJobsService().getRecentJobs(10);
      
      // Get application statistics
      const appStats = await this.getApplicationStats(userId);
      
      // Get today's applications only
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
      
      const recentApplications = await Application.find({ 
        userId: new Types.ObjectId(userId),
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      })
        .populate({
          path: 'jobId',
          select: 'title company location description salaryMin salaryMax url companyDomain logoUrl postedAt',
          model: 'Job'
        })
        .sort({ createdAt: -1 })
        .lean();
      
      // Filter out applications where jobId is null (job was deleted)
      const validApplications = recentApplications.filter((app: any) => app.jobId !== null && app.jobId !== undefined);
      
      // Get workflow status
      const activeWorkflows = Array.from(this.activeWorkflows.values())
        .filter(w => w.userId === userId && w.status !== 'completed');

      res.json({
        success: true,
        data: {
          recentJobs,
          recentApplications: validApplications || [],
          stats: appStats,
          applicationStats: appStats, // Keep for backward compatibility
          activeWorkflows: activeWorkflows.length,
          lastUpdated: new Date()
        }
      });

    } catch (error: any) {
      logger.error(`Failed to get dashboard data: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
        details: error.message
      });
    }
  }

  /**
   * Get application statistics for user
   */
  private async getApplicationStats(userId: string): Promise<any> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [total, pending, successful, rejected, thisWeek, thisMonth] = await Promise.all([
      Application.countDocuments({ userId: new Types.ObjectId(userId) }),
      Application.countDocuments({ userId: new Types.ObjectId(userId), status: 'Applied' }),
      Application.countDocuments({ userId: new Types.ObjectId(userId), status: 'Offer' }),
      Application.countDocuments({ userId: new Types.ObjectId(userId), status: 'Rejected' }),
      Application.countDocuments({ 
        userId: new Types.ObjectId(userId), 
        createdAt: { $gte: weekAgo } 
      }),
      Application.countDocuments({ 
        userId: new Types.ObjectId(userId), 
        createdAt: { $gte: monthAgo } 
      }),
    ]);
    
    return {
      totalApplications: total,
      pendingApplications: pending,
      successfulApplications: successful,
      rejectedApplications: rejected,
      thisWeek,
      thisMonth
    };
  }

  /**
   * Get available job sources and their statistics
   */
  public async getJobSources(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getJobsService().getStats();

      const sources = [
        { 
          id: 'indeed', 
          name: 'Indeed', 
          available: true, 
          description: 'Global job search platform',
          jobCount: stats.jobsBySource['indeed'] || 0
        },
        { 
          id: 'naukri', 
          name: 'Naukri', 
          available: true, 
          description: 'Indian job search platform',
          jobCount: stats.jobsBySource['naukri'] || 0
        },
        { 
          id: 'linkedin', 
          name: 'LinkedIn', 
          available: false, 
          description: 'Professional network (coming soon)',
          jobCount: stats.jobsBySource['linkedin'] || 0
        },
        { 
          id: 'glassdoor', 
          name: 'Glassdoor', 
          available: false, 
          description: 'Company reviews and jobs (coming soon)',
          jobCount: stats.jobsBySource['glassdoor'] || 0
        }
      ];

      res.json({
        success: true,
        data: {
          sources,
          totalJobs: stats.totalJobs,
          recentJobs: stats.recentJobs
        }
      });

    } catch (error: any) {
      logger.error(`Failed to get job sources: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get job sources',
        details: error.message
      });
    }
  }

  /**
   * Get job categories and counts
   */
  public async getJobCategories(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.getJobsService().getStats();

      res.json({
        success: true,
        data: {
          categories: stats.jobsByType,
          totalJobs: stats.totalJobs
        }
      });

    } catch (error: any) {
      logger.error(`Failed to get job categories: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get job categories',
        details: error.message
      });
    }
  }
  
  /**
   * Get Email Preview
   * Retrieve generated emails from Redis for user review
   */
  public async getEmailPreview(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { progressId } = req.params;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      
      if (!progressId) {
        res.status(400).json({ success: false, error: 'Progress ID required' });
        return;
      }
      
      const { redis } = await import('../db/redis.js');
      if (!redis) {
        res.status(500).json({ success: false, error: 'Redis not available' });
        return;
      }
      
      const key = `email_preview:${progressId}`;
      const previewDataStr = await redis.get(key);
      
      if (!previewDataStr) {
        res.status(404).json({ success: false, error: 'Email preview not found or expired' });
        return;
      }
      
      const previewData = JSON.parse(previewDataStr);
      
      // Verify user owns this preview
      if (previewData.userId !== String(userId)) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
      
      res.json({
        success: true,
        data: {
          emails: previewData.emails,
          createdAt: previewData.createdAt,
          expiresAt: previewData.expiresAt
        }
      });
      
    } catch (error: any) {
      logger.error(`Failed to get email preview: ${error.message}`, { error: error.stack });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve email preview',
        details: error.message
      });
    }
  }
  
  /**
   * Update Email
   * Update subject and body of a specific email in preview
   */
  public async updateEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { progressId, emailIndex } = req.params;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      
      const index = parseInt(emailIndex, 10);
      if (isNaN(index) || index < 0) {
        res.status(400).json({ success: false, error: 'Invalid email index' });
        return;
      }
      
      const { subject, body, recipientEmail } = req.body;
      if (!subject || !body || subject.trim().length === 0 || body.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Subject and body are required' });
        return;
      }
      
      if (subject.length > 200) {
        res.status(400).json({ success: false, error: 'Subject too long (max 200 characters)' });
        return;
      }
      
      if (body.length > 10000) {
        res.status(400).json({ success: false, error: 'Body too long (max 10000 characters)' });
        return;
      }
      
      // Validate recipient email if provided
      if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        res.status(400).json({ success: false, error: 'Invalid recipient email format' });
        return;
      }
      
      const { redis } = await import('../db/redis.js');
      if (!redis) {
        res.status(500).json({ success: false, error: 'Redis not available' });
        return;
      }
      
      const key = `email_preview:${progressId}`;
      const previewDataStr = await redis.get(key);
      
      if (!previewDataStr) {
        res.status(404).json({ success: false, error: 'Email preview not found or expired' });
        return;
      }
      
      const previewData = JSON.parse(previewDataStr);
      
      // Verify user owns this preview
      if (previewData.userId !== String(userId)) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
      
      if (index >= previewData.emails.length) {
        res.status(404).json({ success: false, error: 'Email index out of range' });
        return;
      }
      
      // Update email
      previewData.emails[index].subject = subject.trim();
      previewData.emails[index].body = body.trim();
      if (recipientEmail) {
        previewData.emails[index].recipientEmail = recipientEmail.trim();
        // Clear placeholder flag if email was updated
        if (previewData.emails[index].isPlaceholder) {
          delete previewData.emails[index].isPlaceholder;
        }
      }
      previewData.emails[index].lastModified = new Date().toISOString();
      
      // Save back to Redis with same TTL
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(previewData));
      } else {
        await redis.setex(key, 3600, JSON.stringify(previewData)); // 1 hour default
      }
      
      res.json({
        success: true,
        data: previewData.emails[index]
      });
      
    } catch (error: any) {
      logger.error(`Failed to update email: ${error.message}`, { error: error.stack });
      res.status(500).json({
        success: false,
        error: 'Failed to update email',
        details: error.message
      });
    }
  }
  
  /**
   * Regenerate Email
   * Regenerate a single email using AI
   */
  public async regenerateEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { progressId, emailIndex } = req.params;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      
      const index = parseInt(emailIndex, 10);
      if (isNaN(index) || index < 0) {
        res.status(400).json({ success: false, error: 'Invalid email index' });
        return;
      }
      
      const { redis } = await import('../db/redis.js');
      if (!redis) {
        res.status(500).json({ success: false, error: 'Redis not available' });
        return;
      }
      
      const key = `email_preview:${progressId}`;
      const previewDataStr = await redis.get(key);
      
      if (!previewDataStr) {
        res.status(404).json({ success: false, error: 'Email preview not found or expired' });
        return;
      }
      
      const previewData = JSON.parse(previewDataStr);
      
      // Verify user owns this preview
      if (previewData.userId !== String(userId)) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
      
      if (index >= previewData.emails.length) {
        res.status(404).json({ success: false, error: 'Email index out of range' });
        return;
      }
      
      const emailToRegenerate = previewData.emails[index];
      
      // Fetch user and job data

      const user = await User.findById(userId).lean();
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      
      const { JobModel } = await import('../data/models/Job.js');
      const job = await JobModel.findById(emailToRegenerate.jobId).lean();
      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found' });
        return;
      }
      
      // Generate new email
      const { smartEmailGenerator } = await import('../services/smartEmailGenerator.service.js');
      const companyData = (job as any).company;
      const companyName = typeof companyData === 'string' ? companyData : companyData?.name || 'Company';
      
      const emailInput = {
        jobTitle: (job as any).title,
        companyName,
        jobDescription: (job as any).description,
        userProfile: {
          name: (user as any).name || (user as any).fullName || 'Professional',
          email: (user as any).email,
          currentRole: (user as any).currentRole,
          experience: (user as any).experience,
          skills: (user as any).skills || [],
          resumeSummary: (user as any).resumeSummary
        },
        recipientRole: 'unknown' as const
      };
      
      const generatedEmail = await smartEmailGenerator.generateApplicationEmail(emailInput);
      
      // Update email in preview
      previewData.emails[index].subject = generatedEmail.subject;
      previewData.emails[index].body = generatedEmail.body;
      previewData.emails[index].generatedAt = new Date().toISOString();
      delete previewData.emails[index].lastModified;
      
      // Save back to Redis
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(previewData));
      } else {
        await redis.setex(key, 3600, JSON.stringify(previewData));
      }
      
      res.json({
        success: true,
        data: previewData.emails[index]
      });
      
    } catch (error: any) {
      logger.error(`Failed to regenerate email: ${error.message}`, { error: error.stack });
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate email',
        details: error.message
      });
    }
  }
  
  /**
   * Finalize Emails
   * Queue emails for sending after user review
   */
  public async finalizeEmails(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { progressId } = req.params;
      const resumeDownloads = (req.body?.resumeDownloads || {}) as Record<string, string>;
      const selectedJobIds = Array.isArray((req.body as any)?.jobIds)
        ? (req.body as any).jobIds.map((id: any) => String(id))
        : undefined;
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      
      const { redis } = await import('../db/redis.js');
      if (!redis) {
        res.status(500).json({ success: false, error: 'Redis not available' });
        return;
      }
      
      const key = `email_preview:${progressId}`;
      const previewDataStr = await redis.get(key);
      
      if (!previewDataStr) {
        res.status(404).json({ success: false, error: 'Email preview not found or expired' });
        return;
      }
      
      const previewData = JSON.parse(previewDataStr);
      
      // Verify user owns this preview
      if (previewData.userId !== String(userId)) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
      
      // Reconstruct the emailsGenerated array format expected by queueEmailsForSending
      const { JobModel } = await import('../data/models/Job.js');
      const { EmailSendQueue } = await import('../models/emailOutreach.js');
      const { enqueueEmailOutreach } = await import('../queues/emailOutreach.queue.js');
      const { emailRedirectService } = await import('../services/emailRedirectService.js');
      const { Types } = await import('mongoose');
      
      const results: any[] = [];
      
      // IDEMPOTENCY: Skip jobs already applied to within the last 30 days
      const emailJobIds = (previewData.emails || [])
        .map((e: any) => e.jobId)
        .filter((id: any) => !!id);
      
      let alreadyAppliedJobIds = new Set<string>();
      if (emailJobIds.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const existingApplications = await Application.find({
          userId: new Types.ObjectId(userId),
          jobId: { $in: emailJobIds.map((id: string) => new Types.ObjectId(id)) },
          createdAt: { $gte: thirtyDaysAgo }
        }).lean();
        
        alreadyAppliedJobIds = new Set(
          existingApplications.map((app: any) => String(app.jobId))
        );
      }
      
      for (const emailData of previewData.emails) {
        const jobIdStr = String(emailData.jobId);
        // If the client sent an explicit list of jobIds to finalize,
        // skip any emails that are not in that list.
        if (selectedJobIds && !selectedJobIds.includes(jobIdStr)) {
          results.push({
            jobId: emailData.jobId,
            status: 'skipped',
            reason: 'Removed by user before sending',
          });
          continue;
        }
        // Skip if user has already applied to this job recently
        if (emailData.jobId && alreadyAppliedJobIds.has(jobIdStr)) {
          results.push({
            jobId: emailData.jobId,
            status: 'skipped',
            reason: 'Already applied within the last 30 days'
          });
          continue;
        }
        try {
          const job = await JobModel.findById(emailData.jobId).lean();
          if (!job) {
            results.push({
              jobId: emailData.jobId,
              status: 'failed',
              reason: 'Job not found'
            });
            continue;
          }
          
          const companyData = (job as any).company;
          const companyName = typeof companyData === 'string' ? companyData : companyData?.name || 'Company';
          
          // Apply email redirect service
          const redirectResult = emailRedirectService.getRecipient(
            emailData.recipientEmail,
            {
              jobId: emailData.jobId,
              company: companyName,
              jobTitle: emailData.jobTitle,
              userId: String(userId)
            }
          );
          
          // Prepare attachments array (optionally with resume PDF)
          const attachments: Array<{ filename: string; content: Buffer }> = [];

          const pdfDownloadUrl = resumeDownloads[emailData.jobId];
          if (pdfDownloadUrl) {
            try {
              const pdfBuffer = await this.downloadPdfAsBuffer(pdfDownloadUrl);
              if (pdfBuffer) {
                const safeCompany = companyName.replace(/[^a-zA-Z0-9]/g, '_');
                const safeTitle = String(emailData.jobTitle || 'Position').replace(/[^a-zA-Z0-9]/g, '_');
                const filename = `Resume_${safeCompany}_${safeTitle}.pdf`;
                attachments.push({
                  filename,
                  content: pdfBuffer
                });
                logger.debug('📎 Resume attachment prepared (preview finalize)', {
                  jobId: emailData.jobId,
                  filename,
                  size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
                });
              }
            } catch (attachError: any) {
              logger.warn('⚠️ Failed to download or attach resume PDF for job during finalize', {
                jobId: emailData.jobId,
                error: attachError.message
              });
            }
          }

          // Create queue record
          const queueDoc = await EmailSendQueue.create({
            userId: new Types.ObjectId(userId),
            jobId: new Types.ObjectId(emailData.jobId),
            recipientEmail: redirectResult.recipient,
            emailContent: {
              subject: emailData.subject,
              body: emailData.body,
              attachments
            },
            status: 'queued',
            scheduledAt: new Date(),
            metadata: {
              isRedirected: redirectResult.isRedirected,
              originalRecipient: redirectResult.originalRecipient,
              redirectMode: redirectResult.redirectMode,
              company: companyName,
              jobTitle: emailData.jobTitle
            }
          });
          
          // Enqueue for async processing
          await enqueueEmailOutreach({ queueId: String(queueDoc._id) });
          
          results.push({
            jobId: emailData.jobId,
            status: 'queued',
            emailDiscovered: true,
            emailAddress: redirectResult.recipient,
            queueId: String(queueDoc._id)
          });
          
        } catch (error: any) {
          logger.error('Failed to queue email', {
            jobId: emailData.jobId,
            error: error.message
          });
          
          results.push({
            jobId: emailData.jobId,
            status: 'failed',
            reason: error.message
          });
        }
      }
      
      // Clear preview data from Redis
      await redis.del(key);
      
      // Create application records
      for (const result of results) {
        if (result.status === 'queued') {
          try {
            await Application.create({
              userId: new Types.ObjectId(userId),
              jobId: new Types.ObjectId(result.jobId),
              status: 'Applied',
              emailQueueId: new Types.ObjectId(result.queueId),
              appliedAt: new Date()
            });
          } catch (error: any) {
            logger.warn('Failed to create application record', {
              jobId: result.jobId,
              error: error.message
            });
          }
        }
      }
      
      res.json({
        success: true,
        message: 'Emails queued for sending',
        data: {
          queued: results.filter(r => r.status === 'queued').length,
          failed: results.filter(r => r.status === 'failed').length,
          skipped: results.filter(r => r.status === 'skipped').length,
          results
        }
      });
      
    } catch (error: any) {
      logger.error(`Failed to finalize emails: ${error.message}`, { error: error.stack });
      res.status(500).json({
        success: false,
        error: 'Failed to finalize emails',
        details: error.message
      });
    }
  }

  /**
   * Download PDF from gdocify using secure DOC_AUTOMATION credentials
   * Used to attach user-generated resumes to finalized emails
   */
  private async downloadPdfAsBuffer(pdfDownloadUrl: string): Promise<Buffer | null> {
    try {
      logger.info('📥 Downloading PDF for email finalize from resume service', {
        pdfDownloadUrl
      });

      const response = await axios.get(pdfDownloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          Accept: 'application/pdf'
        }
      });

      if (response.status === 200 && response.data) {
        const buffer = Buffer.from(response.data);
        logger.info('✅ PDF downloaded successfully for finalize', {
          size: `${(buffer.length / 1024).toFixed(2)} KB`
        });
        return buffer;
      }

      logger.error('❌ Failed to download PDF for finalize', {
        status: response.status
      });
      return null;
    } catch (error: any) {
      logger.error('❌ Error downloading PDF for finalize', {
        error: error.message,
        pdfDownloadUrl
      });
      return null;
    }
  }
}

export const workflowController = new WorkflowController();

