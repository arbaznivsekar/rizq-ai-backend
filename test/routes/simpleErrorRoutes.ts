/**
 * Simple Error Routes for Testing
 * @module test/routes/simpleErrorRoutes
 */

import { Router } from 'express';
import {
  testAuthError,
  testValidationError,
  testDatabaseError,
  testExternalServiceError,
  testBusinessLogicError,
  testSystemError,
  testRateLimitError,
  testNetworkError,
  testScrapingError,
  testGenericError,
  testSuccess
} from '../controllers/simpleErrorController.js';

const router = Router();

// Test error routes
router.get('/auth-error', testAuthError);
router.get('/validation-error', testValidationError);
router.get('/database-error', testDatabaseError);
router.get('/external-service-error', testExternalServiceError);
router.get('/business-logic-error', testBusinessLogicError);
router.get('/system-error', testSystemError);
router.get('/rate-limit-error', testRateLimitError);
router.get('/network-error', testNetworkError);
router.get('/scraping-error', testScrapingError);
router.get('/generic-error', testGenericError);
router.get('/success', testSuccess);

// Test POST routes with body
router.post('/validation-error', testValidationError);
router.post('/business-logic-error', testBusinessLogicError);

export default router;



