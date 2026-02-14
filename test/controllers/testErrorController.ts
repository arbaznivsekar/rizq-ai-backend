/**
 * Test Error Controller for Error Handling Testing
 * @module test/controllers/testErrorController
 */

import { Request, Response } from 'express';
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
export async function testAuthError(req: Request, res: Response, next: any) {
  try {
    throw new AuthenticationError('Invalid credentials', { 
      userId: '123',
      attempts: 3 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Test validation error
 */
export async function testValidationError(req: Request, res: Response, next: any) {
  try {
    throw new ValidationError('Invalid input data', { 
      field: 'email',
      value: req.body.email 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Test database error
 */
export async function testDatabaseError(req: Request, res: Response) {
  throw new DatabaseError('Connection failed', { 
    host: 'localhost',
    port: 27017 
  });
}

/**
 * Test external service error
 */
export async function testExternalServiceError(req: Request, res: Response) {
  throw new ExternalServiceError('Gmail API unavailable', 'Gmail API', {
    statusCode: 503,
    retryAfter: 60
  });
}

/**
 * Test business logic error
 */
export async function testBusinessLogicError(req: Request, res: Response) {
  throw new BusinessLogicError('Daily limit exceeded', { 
    limit: 100,
    used: 150 
  });
}

/**
 * Test system error
 */
export async function testSystemError(req: Request, res: Response) {
  throw new SystemError('Critical system failure', { 
    component: 'queue',
    severity: 'critical' 
  });
}

/**
 * Test rate limit error
 */
export async function testRateLimitError(req: Request, res: Response) {
  throw new RateLimitError('Rate limit exceeded', 60, {
    limit: 100,
    remaining: 0
  });
}

/**
 * Test network error
 */
export async function testNetworkError(req: Request, res: Response) {
  throw new NetworkError('Connection timeout', 408, {
    url: 'https://api.example.com',
    timeout: 5000
  });
}

/**
 * Test scraping error
 */
export async function testScrapingError(req: Request, res: Response) {
  throw new AntiBotError('Anti-bot detection triggered', {
    url: 'https://indeed.com',
    userAgent: 'test-agent'
  });
}

/**
 * Test generic error
 */
export async function testGenericError(req: Request, res: Response) {
  throw new Error('Generic error occurred');
}

/**
 * Test HTTP error
 */
export async function testHttpError(req: Request, res: Response) {
  const error = new Error('Not Found');
  (error as any).status = 404;
  throw error;
}

/**
 * Test validation error (Zod)
 */
export async function testZodError(req: Request, res: Response) {
  const error = new Error('Validation failed');
  error.name = 'ValidationError';
  throw error;
}

/**
 * Test cast error (MongoDB)
 */
export async function testCastError(req: Request, res: Response) {
  const error = new Error('Cast to ObjectId failed');
  error.name = 'CastError';
  throw error;
}

/**
 * Test JWT error
 */
export async function testJWTError(req: Request, res: Response) {
  const error = new Error('Invalid token');
  error.name = 'JsonWebTokenError';
  throw error;
}

/**
 * Test token expired error
 */
export async function testTokenExpiredError(req: Request, res: Response) {
  const error = new Error('Token expired');
  error.name = 'TokenExpiredError';
  throw error;
}

/**
 * Test MongoDB error
 */
export async function testMongoError(req: Request, res: Response) {
  const error = new Error('MongoDB connection failed');
  error.name = 'MongoError';
  throw error;
}

/**
 * Test successful response (for comparison)
 */
export async function testSuccess(req: Request, res: Response) {
  res.json({
    success: true,
    message: 'Test successful',
    data: { test: true }
  });
}
