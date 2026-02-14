/**
 * Workflow Routes - Database-first Job Search and Application Workflow
 * @module routes
 */

import { Router } from 'express';
import { requireAuth } from '../auth/guard.js';
import { workflowController } from '../controllers/workflow.controller.js';

const router = Router();

/**
 * @route GET /api/v1/workflow/search
 * @desc Smart job search from database with filtering and ranking
 * @access Public (better with auth for personalization)
 * @query query, location, jobTypes, experienceLevels, salaryMin, salaryMax, remote, easyApply, postedWithin, limit, offset, sortBy, sources
 */
router.get('/search', workflowController.searchJobs.bind(workflowController));

/**
 * @route GET /api/v1/workflow/recommended
 * @desc Get personalized job recommendations based on resume
 * @access Private
 */
router.get('/recommended', requireAuth, workflowController.getRecommendedJobs.bind(workflowController));

/**
 * @route POST /api/v1/workflow/apply
 * @desc One-click bulk apply with automated email discovery and AI generation
 * @access Private
 */
router.post('/apply', requireAuth, workflowController.quickApply.bind(workflowController));

/**
 * @route GET /api/v1/workflow/apply/check-eligibility
 * @desc Check if user can apply to jobs (30-day idempotency check)
 * @access Private
 * @query jobIds (comma-separated or array)
 */
router.get('/apply/check-eligibility', requireAuth, workflowController.checkApplicationEligibility.bind(workflowController));

/**
 * @route GET /api/v1/workflow/apply/status/:progressId
 * @desc Get bulk application progress status
 * @access Private
 */
router.get('/apply/status/:progressId', requireAuth, workflowController.getApplicationProgress.bind(workflowController));

/**
 * @route GET /api/v1/workflow/dashboard
 * @desc Get user dashboard data with application stats
 * @access Private
 */
router.get('/dashboard', requireAuth, workflowController.getDashboardData.bind(workflowController));

/**
 * @route GET /api/v1/workflow/sources
 * @desc Get available job sources with statistics
 * @access Public
 */
router.get('/sources', workflowController.getJobSources.bind(workflowController));

/**
 * @route GET /api/v1/workflow/categories
 * @desc Get job categories with counts
 * @access Public
 */
router.get('/categories', workflowController.getJobCategories.bind(workflowController));

/**
 * @route GET /api/v1/workflow/apply/preview/:progressId
 * @desc Get email preview for review
 * @access Private
 */
router.get('/apply/preview/:progressId', requireAuth, workflowController.getEmailPreview.bind(workflowController));

/**
 * @route PUT /api/v1/workflow/apply/preview/:progressId/email/:emailIndex
 * @desc Update email subject and body
 * @access Private
 */
router.put('/apply/preview/:progressId/email/:emailIndex', requireAuth, workflowController.updateEmail.bind(workflowController));

/**
 * @route POST /api/v1/workflow/apply/preview/:progressId/regenerate/:emailIndex
 * @desc Regenerate a single email using AI
 * @access Private
 */
router.post('/apply/preview/:progressId/regenerate/:emailIndex', requireAuth, workflowController.regenerateEmail.bind(workflowController));

/**
 * @route POST /api/v1/workflow/apply/preview/:progressId/finalize
 * @desc Finalize and queue emails for sending
 * @access Private
 */
router.post('/apply/preview/:progressId/finalize', requireAuth, workflowController.finalizeEmails.bind(workflowController));

export default router;

