/**
 * Simple Error Controller for Testing
 * @module test/controllers/simpleErrorController
 */

import { Request, Response, NextFunction } from 'express';
import { 
  AuthenticationError, 
  ValidationError, 
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  SystemError,
  RateLimitError,
  NetworkError
} from '../../src/errors/AppError.js';
import { AntiBotError } from '../../src/scraping/errors/index.js';

/**
 * Test authentication error
 */
export function testAuthError(req: Request, res: Response, next: NextFunction) {
  const error = new AuthenticationError('Invalid credentials', { 
    userId: '123',
    attempts: 3 
  });
  next(error);
}

/**
 * Test validation error
 */
export function testValidationError(req: Request, res: Response, next: NextFunction) {
  const error = new ValidationError('Invalid input data', { 
    field: 'email',
    value: req.body.email 
  });
  next(error);
}

/**
 * Test database error
 */
export function testDatabaseError(req: Request, res: Response, next: NextFunction) {
  const error = new DatabaseError('Connection failed', { 
    host: 'localhost',
    port: 27017 
  });
  next(error);
}

/**
 * Test external service error
 */
export function testExternalServiceError(req: Request, res: Response, next: NextFunction) {
  const error = new ExternalServiceError('Gmail API unavailable', 'Gmail API', {
    statusCode: 503,
    retryAfter: 60
  });
  next(error);
}

/**
 * Test business logic error
 */
export function testBusinessLogicError(req: Request, res: Response, next: NextFunction) {
  const error = new BusinessLogicError('Daily limit exceeded', { 
    limit: 100,
    used: 150 
  });
  next(error);
}

/**
 * Test system error
 */
export function testSystemError(req: Request, res: Response, next: NextFunction) {
  const error = new SystemError('Critical system failure', { 
    component: 'queue',
    severity: 'critical' 
  });
  next(error);
}

/**
 * Test rate limit error
 */
export function testRateLimitError(req: Request, res: Response, next: NextFunction) {
  const error = new RateLimitError('Rate limit exceeded', 60, {
    limit: 100,
    remaining: 0
  });
  next(error);
}

/**
 * Test network error
 */
export function testNetworkError(req: Request, res: Response, next: NextFunction) {
  const error = new NetworkError('Connection timeout', 408, {
    url: 'https://api.example.com',
    timeout: 5000
  });
  next(error);
}

/**
 * Test scraping error
 */
export function testScrapingError(req: Request, res: Response, next: NextFunction) {
  const error = new AntiBotError('Anti-bot detection triggered', {
    url: 'https://indeed.com',
    userAgent: 'test-agent'
  });
  next(error);
}

/**
 * Test generic error
 */
export function testGenericError(req: Request, res: Response, next: NextFunction) {
  const error = new Error('Generic error occurred');
  next(error);
}

/**
 * Test successful response (for comparison)
 */
export function testSuccess(req: Request, res: Response) {
  res.json({
    success: true,
    message: 'Test successful',
    data: { test: true }
  });
}



