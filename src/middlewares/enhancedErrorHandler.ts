/**
 * Enhanced Error Handler Middleware
 * @module middlewares/enhancedErrorHandler
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { AppError, ErrorSeverity, ErrorCategory } from '../errors/AppError.js';
import { ScrapingError } from '../scraping/errors/index.js';

/**
 * Enhanced error handler middleware
 */
export function enhancedErrorHandler(
  error: Error | AppError | ScrapingError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Extract request context
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  const userId = (req as any).user?.id || (req as any).user?._id;
  const userEmail = (req as any).user?.email;

  // Add request context to error if it's an AppError
  if (error instanceof AppError) {
    (error as any).requestId = requestId;
    (error as any).userId = userId;
  }

  // Determine error type and create standardized response
  const errorResponse = createErrorResponse(error, requestId);
  const statusCode = getStatusCode(error);

  // Log error with appropriate level
  logError(error, req, {
    requestId,
    userId,
    userEmail,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Create standardized error response
 */
function createErrorResponse(error: Error | AppError | ScrapingError, requestId: string) {
  const baseResponse = {
    success: false,
    requestId,
    timestamp: new Date().toISOString()
  };

  // Handle AppError instances
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

  // Handle ScrapingError instances
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

  // Handle generic errors
  if (error.name === 'ValidationError') {
    return {
      ...baseResponse,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        category: 'validation',
        severity: 'medium',
        retryable: false
      }
    };
  }

  if (error.name === 'CastError') {
    return {
      ...baseResponse,
      error: {
        code: 'INVALID_ID_FORMAT',
        message: 'Invalid ID format provided',
        category: 'validation',
        severity: 'medium',
        retryable: false
      }
    };
  }

  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return {
      ...baseResponse,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        category: 'database',
        severity: 'high',
        retryable: true
      }
    };
  }

  if (error.name === 'JsonWebTokenError') {
    return {
      ...baseResponse,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        category: 'authentication',
        severity: 'high',
        retryable: false
      }
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      ...baseResponse,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        category: 'authentication',
        severity: 'high',
        retryable: false
      }
    };
  }

  // Handle HTTP errors
  if ((error as any).status) {
    return {
      ...baseResponse,
      error: {
        code: 'HTTP_ERROR',
        message: error.message,
        category: 'system',
        severity: getSeverityFromStatus((error as any).status),
        retryable: (error as any).status >= 500
      }
    };
  }

  // Default error response
  return {
    ...baseResponse,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message,
      category: 'system',
      severity: 'critical',
      retryable: true
    }
  };
}

/**
 * Get HTTP status code from error
 */
function getStatusCode(error: Error | AppError | ScrapingError): number {
  // Handle HTTP errors
  if ((error as any).status) {
    return (error as any).status;
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        return 401;
      case ErrorCategory.AUTHORIZATION:
        return 403;
      case ErrorCategory.VALIDATION:
        return 400;
      case ErrorCategory.DATABASE:
        return 500;
      case ErrorCategory.EXTERNAL_SERVICE:
        return 502;
      case ErrorCategory.BUSINESS_LOGIC:
        return 422;
      case ErrorCategory.SYSTEM:
        return 500;
      default:
        return 500;
    }
  }

  // Handle ScrapingError instances
  if (error instanceof ScrapingError) {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 500;
      case ErrorSeverity.HIGH:
        return 500;
      case ErrorSeverity.MEDIUM:
        return 400;
      case ErrorSeverity.LOW:
        return 400;
      default:
        return 500;
    }
  }

  // Handle specific error types
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'CastError') return 400;
  if (error.name === 'MongoError' || error.name === 'MongooseError') return 500;
  if (error.name === 'JsonWebTokenError') return 401;
  if (error.name === 'TokenExpiredError') return 401;

  // Default to 500
  return 500;
}

/**
 * Log error with appropriate level and context
 */
function logError(
  error: Error | AppError | ScrapingError,
  req: Request,
  context: Record<string, any>
): void {
  const logData = {
    ...context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  };

  // Determine log level based on error severity
  if (error instanceof AppError || error instanceof ScrapingError) {
    const severity = error.severity || ErrorSeverity.MEDIUM;
    
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical error occurred', logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High severity error occurred', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error occurred', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low severity error occurred', logData);
        break;
      default:
        logger.error('Unknown severity error occurred', logData);
    }
  } else {
    // Log generic errors as errors
    logger.error('Unhandled error occurred', logData);
  }
}

/**
 * Get severity from HTTP status code
 */
function getSeverityFromStatus(status: number): ErrorSeverity {
  if (status >= 500) return ErrorSeverity.CRITICAL;
  if (status >= 400) return ErrorSeverity.HIGH;
  if (status >= 300) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Async error wrapper for route handlers
 */
export function asyncErrorHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error handler for unhandled promise rejections
 */
export function handleUnhandledRejection(reason: any, promise: Promise<any>): void {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
}

/**
 * Error handler for uncaught exceptions
 */
export function handleUncaughtException(error: Error): void {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  process.exit(1);
}
