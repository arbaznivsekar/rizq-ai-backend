/**
 * Email Redirect Routes
 * Admin endpoints for monitoring email redirect service
 */

import { Router } from 'express';
import { 
  getRedirectStatus, 
  getRecentRedirectedEmails,
  getDistributionStats,
  resetDistribution
} from '../controllers/emailRedirect.controller.js';
import { requireAuth } from '../auth/guard.js';

const router = Router();

/**
 * All routes require authentication
 * In production, add admin role check
 */

// GET /api/v1/email-redirect/status - Get redirect service status
router.get('/status', requireAuth, getRedirectStatus);

// GET /api/v1/email-redirect/recent - Get recent redirected emails
router.get('/recent', requireAuth, getRecentRedirectedEmails);

// GET /api/v1/email-redirect/distribution - Get distribution statistics
router.get('/distribution', requireAuth, getDistributionStats);

// POST /api/v1/email-redirect/reset - Reset distribution counter
router.post('/reset', requireAuth, resetDistribution);

export default router;


