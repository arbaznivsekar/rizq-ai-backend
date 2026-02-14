/**
 * Error Utility Functions
 * @module utils/errorUtils
 */

import { Request, Response } from 'express';
import { 
  AppError, 
  ErrorSeverity, 
  ErrorCategory,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  SystemError,
  RateLimitError,
  NetworkError
} from '../errors/AppError.js';
import { ScrapingError } from '../scraping/errors/index.js';

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: AppError | ScrapingError | Error,
  requestId?: string,
  userId?: string
) {
  const baseResponse = {
    success: false,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString()
  };

  if (error instanceof AppError) {
    return {
      ...baseResponse,
      error: {
        code: error.code,
        message: error.message,
        category: error.category,
        severity: error.severity,
        retryable: error.retryable,
        context: error.context
      }
    };
  }

  if (error instanceof ScrapingError) {
    return {
      ...baseResponse,
      error: {
        code: error.code,
        message: error.message,
        category: 'scraping',
        severity: error.severity,
        retryable: error.retryable,
        context: error.context
      }
    };
  }

  // Generic error
  return {
    ...baseResponse,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message,
      category: 'system',
      severity: 'critical',
      retryable: true
    }
  };
}

/**
 * Send error response
 */
export function sendErrorResponse(
  res: Response,
  error: AppError | ScrapingError | Error,
  statusCode: number = 500,
  requestId?: string,
  userId?: string
): void {
  const errorResponse = createErrorResponse(error, requestId, userId);
  res.status(statusCode).json(errorResponse);
}

/**
 * Create and throw AppError
 */
export function throwAppError(
  message: string,
  code: string,
  category: ErrorCategory,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  retryable: boolean = false,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  // Create a concrete AppError instance
  class ConcreteAppError extends AppError {
    constructor() {
      super(message, code, category, severity, retryable, context, requestId, userId);
    }
  }
  throw new ConcreteAppError();
}

/**
 * Create and throw validation error
 */
export function throwValidationError(
  message: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new ValidationError(message, context, requestId, userId);
}

/**
 * Create and throw authentication error
 */
export function throwAuthenticationError(
  message: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new AuthenticationError(message, context, requestId, userId);
}

/**
 * Create and throw authorization error
 */
export function throwAuthorizationError(
  message: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new AuthorizationError(message, context, requestId, userId);
}

/**
 * Create and throw database error
 */
export function throwDatabaseError(
  message: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new DatabaseError(message, context, requestId, userId);
}

/**
 * Create and throw external service error
 */
export function throwExternalServiceError(
  message: string,
  service: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new ExternalServiceError(message, service, context, requestId, userId);
}

/**
 * Create and throw business logic error
 */
export function throwBusinessLogicError(
  message: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new BusinessLogicError(message, context, requestId, userId);
}

/**
 * Create and throw system error
 */
export function throwSystemError(
  message: string,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new SystemError(message, context, requestId, userId);
}

/**
 * Create and throw rate limit error
 */
export function throwRateLimitError(
  message: string,
  retryAfter?: number,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new RateLimitError(message, retryAfter, context, requestId, userId);
}

/**
 * Create and throw network error
 */
export function throwNetworkError(
  message: string,
  statusCode?: number,
  context?: Record<string, any>,
  requestId?: string,
  userId?: string
): never {
  throw new NetworkError(message, statusCode, context, requestId, userId);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | AppError | ScrapingError): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }
  if (error instanceof ScrapingError) {
    return error.retryable;
  }
  return false;
}

/**
 * Get error severity
 */
export function getErrorSeverity(error: Error | AppError | ScrapingError): ErrorSeverity {
  if (error instanceof AppError) {
    return error.severity;
  }
  if (error instanceof ScrapingError) {
    return error.severity;
  }
  return ErrorSeverity.MEDIUM;
}

/**
 * Get error category
 */
export function getErrorCategory(error: Error | AppError | ScrapingError): string {
  if (error instanceof AppError) {
    return error.category;
  }
  if (error instanceof ScrapingError) {
    return 'scraping';
  }
  return 'system';
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request context
 */
export function extractRequestContext(req: Request): {
  requestId: string;
  userId?: string;
  userEmail?: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
} {
  return {
    requestId: req.headers['x-request-id'] as string || generateRequestId(),
    userId: (req as any).user?.id || (req as any).user?._id,
    userEmail: (req as any).user?.email,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress || 'unknown'
  };
}

// Re-export error classes for convenience
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  SystemError,
  RateLimitError,
  NetworkError,
  ErrorSeverity,
  ErrorCategory
} from '../errors/AppError.js';
