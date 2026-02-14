/**
 * Job Recommendations Controller
 * Handles personalized job recommendations for users
 * @module controllers
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger.js';
import { recommendationService } from '../services/recommendation.service.js';

// Cache-buster for logo URLs to avoid stale browser cache
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
 * Validation schema for recommendation requests
 */
const RecommendationRequestSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  minScore: z.coerce.number().min(0).max(100).default(30),
  diversify: z.coerce.boolean().default(true),
});

/**
 * Recommendations Controller
 */
export class RecommendationsController {
  /**
   * Get personalized job recommendations for authenticated user
   * GET /api/recommendations
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Validate query parameters
      const validationResult = RecommendationRequestSchema.safeParse(req.query);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: errors,
        });
        return;
      }

      const { limit, minScore, diversify } = validationResult.data;

      logger.info(`Generating recommendations for user ${userId} (limit: ${limit}, minScore: ${minScore})`);

      // Get recommendations
      const recommendations = await recommendationService.getRecommendations(userId, {
        limit,
        minScore,
        diversify,
      });

      // Format response
      const formattedJobs = recommendations.map((match) => ({
        _id: match.job._id,
        title: match.job.title,
        company: match.job.company,
        location: match.job.location,
        companyDomain: match.job.companyDomain,
        logoUrl: withCacheBuster(match.job.logoUrl),
        logoSrcSet: buildLogoSrcSet(match.job.companyDomain),
        description: match.job.description,
        requirements: match.job.requirements,
        salaryMin: match.job.salaryMin,
        salaryMax: match.job.salaryMax,
        jobType: match.job.jobType,
        url: match.job.url,
        source: match.job.source,
        postedAt: match.job.postedAt,
        matchScore: match.matchScore,
        matchReasons: match.matchReasons,
        matchBreakdown: match.breakdown,
      }));

      res.json({
        success: true,
        data: {
          jobs: formattedJobs,
          total: formattedJobs.length,
          message: formattedJobs.length > 0
            ? `Found ${formattedJobs.length} personalized job recommendations`
            : 'No matching jobs found. Try completing your profile for better recommendations.',
        },
      });
    } catch (error: any) {
      logger.error('Failed to get recommendations:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations',
        details: error.message,
      });
    }
  }

  /**
   * Get quick recommendations (limited info, faster response)
   * GET /api/recommendations/quick
   */
  async getQuickRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      logger.info(`Generating quick recommendations for user ${userId}`);

      // Get top 10 recommendations with lower minimum score to show more jobs
      // Lowered from 50 to 20 to ensure jobs are shown even with incomplete profiles
      const recommendations = await recommendationService.getRecommendations(userId, {
        limit: 10,
        minScore: 20, // Lowered threshold to show more jobs
        diversify: true,
      });

      // Format minimal response
      const formattedJobs = recommendations.map((match) => ({
        _id: match.job._id,
        title: match.job.title,
        company: match.job.company,
        location: match.job.location,
        companyDomain: match.job.companyDomain,
        logoUrl: withCacheBuster(match.job.logoUrl),
        logoSrcSet: buildLogoSrcSet(match.job.companyDomain),
        salaryMin: match.job.salaryMin,
        salaryMax: match.job.salaryMax,
        matchScore: match.matchScore,
        matchReasons: match.matchReasons.slice(0, 2), // Only top 2 reasons
      }));

      res.json({
        success: true,
        data: {
          jobs: formattedJobs,
          total: formattedJobs.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get quick recommendations:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate quick recommendations',
        details: error.message,
      });
    }
  }

  /**
   * Refresh recommendations (clears cache and regenerates)
   * POST /api/recommendations/refresh
   */
  async refreshRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      logger.info(`Refreshing recommendations for user ${userId}`);

      // Get fresh recommendations
      const recommendations = await recommendationService.getRecommendations(userId, {
        limit: 50,
        minScore: 30,
        diversify: true,
      });

      res.json({
        success: true,
        data: {
          total: recommendations.length,
          message: `Refreshed ${recommendations.length} job recommendations`,
        },
      });
    } catch (error: any) {
      logger.error('Failed to refresh recommendations:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to refresh recommendations',
        details: error.message,
      });
    }
  }
}

export const recommendationsController = new RecommendationsController();

