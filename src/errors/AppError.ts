/**
 * Enhanced Application Error Classes
 * @module errors/AppError
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system'
}

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly retryable: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly requestId?: string;
  public readonly userId?: string;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = false,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.retryable = retryable;
    this.timestamp = new Date();
    this.context = context;
    this.requestId = requestId;
    this.userId = userId;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      requestId: this.requestId,
      userId: this.userId,
      stack: this.stack
    };
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    super(
      message,
      'AUTHENTICATION_FAILED',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      false,
      context,
      requestId,
      userId
    );
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    super(
      message,
      'AUTHORIZATION_FAILED',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      false,
      context,
      requestId,
      userId
    );
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    super(
      message,
      'VALIDATION_FAILED',
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      false,
      context,
      requestId,
      userId
    );
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    super(
      message,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      true,
      context,
      requestId,
      userId
    );
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    service: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'EXTERNAL_SERVICE_ERROR',
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.MEDIUM,
      true,
      { ...context, service },
      requestId,
      userId
    );
  }
}

/**
 * Business logic errors
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      false,
      context,
      requestId,
      userId
    );
  }
}

/**
 * System errors
 */
export class SystemError extends AppError {
  constructor(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    super(
      message,
      'SYSTEM_ERROR',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      true,
      context,
      requestId,
      userId
    );
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    retryAfter?: number,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'RATE_LIMIT_EXCEEDED',
      ErrorCategory.SYSTEM,
      ErrorSeverity.MEDIUM,
      true,
      { ...context, retryAfter },
      requestId,
      userId
    );
  }
}

/**
 * Network errors
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    statusCode?: number,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    super(
      message,
      'NETWORK_ERROR',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      true,
      { ...context, statusCode },
      requestId,
      userId
    );
  }
}




