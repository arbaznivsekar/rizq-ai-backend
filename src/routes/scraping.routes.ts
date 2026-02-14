/**
 * Routes for scraping-related endpoints
 * @module routes
 */

import { Router } from 'express';
import { ScrapingController } from '../controllers/scraping.controller.js';
import { requireAuth, requireAdmin } from '../auth/guard.js';

const router = Router();
const scrapingController = new ScrapingController();

/**
 * @route POST /api/v1/scraping/jobs
 * @desc Start a new scraping job
 * @access Private (Admin)
 */
router.post('/jobs', requireAuth, scrapingController.startScrapingJob.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/jobs
 * @desc Get all active scraping jobs
 * @access Private (Admin)
 */
router.get('/jobs', requireAuth, scrapingController.getActiveJobs.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/jobs/:jobId
 * @desc Get job status by ID
 * @access Private (Admin)
 */
router.get('/jobs/:jobId', requireAuth, requireAdmin, scrapingController.getJobStatus.bind(scrapingController));

/**
 * @route DELETE /api/v1/scraping/jobs/:jobId
 * @desc Cancel a scraping job
 * @access Private (Admin)
 */
router.delete('/jobs/:jobId', requireAuth, requireAdmin, scrapingController.cancelJob.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/stats
 * @desc Get scraping statistics
 * @access Private (Admin)
 */
router.get('/stats', requireAuth, requireAdmin, scrapingController.getStats.bind(scrapingController));

/**
 * @route POST /api/v1/scraping/continuous/start
 * @desc Start continuous scraping
 * @access Private (Admin)
 */
router.post('/continuous/start', requireAuth, requireAdmin, scrapingController.startContinuousScraping.bind(scrapingController));

/**
 * @route POST /api/v1/scraping/continuous/stop
 * @desc Stop continuous scraping
 * @access Private (Admin)
 */
router.post('/continuous/stop', requireAuth, requireAdmin, scrapingController.stopContinuousScraping.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/scrapers
 * @desc Get available scrapers
 * @access Private (Admin)
 */
router.get('/scrapers', requireAuth, scrapingController.getAvailableScrapers.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/health
 * @desc Health check for scraping service
 * @access Private (Admin)
 */
router.get('/health', requireAuth, scrapingController.healthCheck.bind(scrapingController));

/**
 * @route POST /api/v1/scraping/cleanup
 * @desc Clean up scraping service
 * @access Private (Admin)
 */
router.post('/cleanup', requireAuth, requireAdmin, scrapingController.cleanup.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/queue/stats
 * @desc Get queue statistics
 * @access Private (Admin)
 */
router.get('/queue/stats', requireAuth, requireAdmin, scrapingController.getQueueStats.bind(scrapingController));

/**
 * @route POST /api/v1/scraping/jobs/:jobId/retry
 * @desc Retry a failed job
 * @access Private (Admin)
 */
router.post('/jobs/:jobId/retry', requireAuth, requireAdmin, scrapingController.retryJob.bind(scrapingController));

/**
 * @route POST /api/v1/scraping/jobs/bulk
 * @desc Bulk enqueue scraping jobs
 * @access Private (Admin)
 */
router.post('/jobs/bulk', requireAuth, requireAdmin, scrapingController.bulkEnqueueJobs.bind(scrapingController));

/**
 * @route POST /api/v1/scraping/queue/clean
 * @desc Clean old jobs from queue
 * @access Private (Admin)
 */
router.post('/queue/clean', requireAuth, requireAdmin, scrapingController.cleanQueue.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/jobs/scraped
 * @desc Get scraped jobs from database with filtering
 * @access Private (Admin)
 */
router.get('/jobs/scraped', requireAuth, requireAdmin, scrapingController.getScrapedJobs.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/jobs/scraped/:id
 * @desc Get a specific scraped job from database by ID
 * @access Private (Admin)
 */
router.get('/jobs/scraped/:id', requireAuth, requireAdmin, scrapingController.getScrapedJobById.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/jobs/stats
 * @desc Get job statistics from database
 * @access Private (Admin)
 */
router.get('/jobs/stats', requireAuth, requireAdmin, scrapingController.getJobStats.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/jobs/search
 * @desc Search scraped jobs with advanced filters
 * @access Private (Admin)
 */
router.get('/jobs/search', requireAuth, requireAdmin, scrapingController.searchScrapedJobs.bind(scrapingController));

export default router;
