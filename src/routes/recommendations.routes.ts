/**
 * Recommendations Routes
 * @module routes
 */

import { Router } from 'express';
import { recommendationsController } from '../controllers/recommendations.controller.js';
import { requireAuth } from '../auth/guard.js';

const router = Router();

/**
 * @route GET /api/recommendations
 * @desc Get personalized job recommendations
 * @access Private
 */
router.get('/', requireAuth, (req, res) => 
  recommendationsController.getRecommendations(req, res)
);

/**
 * @route GET /api/recommendations/quick
 * @desc Get quick job recommendations (dashboard preview)
 * @access Private
 */
router.get('/quick', requireAuth, (req, res) => 
  recommendationsController.getQuickRecommendations(req, res)
);

/**
 * @route POST /api/recommendations/refresh
 * @desc Refresh recommendations
 * @access Private
 */
router.post('/refresh', requireAuth, (req, res) => 
  recommendationsController.refreshRecommendations(req, res)
);

export default router;

