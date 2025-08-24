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
router.post('/jobs', requireAuth, requireAdmin, scrapingController.startScrapingJob.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/jobs
 * @desc Get all active scraping jobs
 * @access Private (Admin)
 */
router.get('/jobs', requireAuth, requireAdmin, scrapingController.getActiveJobs.bind(scrapingController));

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
router.get('/scrapers', requireAuth, requireAdmin, scrapingController.getAvailableScrapers.bind(scrapingController));

/**
 * @route GET /api/v1/scraping/health
 * @desc Health check for scraping service
 * @access Private (Admin)
 */
router.get('/health', requireAuth, requireAdmin, scrapingController.healthCheck.bind(scrapingController));

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

export default router;
