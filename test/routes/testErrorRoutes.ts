/**
 * Test Error Routes for Error Handling Testing
 * @module test/routes/testErrorRoutes
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
  testHttpError,
  testZodError,
  testCastError,
  testJWTError,
  testTokenExpiredError,
  testMongoError,
  testSuccess
} from '../controllers/testErrorController.js';

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
router.get('/http-error', testHttpError);
router.get('/zod-error', testZodError);
router.get('/cast-error', testCastError);
router.get('/jwt-error', testJWTError);
router.get('/token-expired-error', testTokenExpiredError);
router.get('/mongo-error', testMongoError);
router.get('/success', testSuccess);

// Test POST routes with body
router.post('/validation-error', testValidationError);
router.post('/business-logic-error', testBusinessLogicError);

export default router;



