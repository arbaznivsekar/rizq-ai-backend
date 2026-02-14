/**
 * Custom error classes for the scraping system
 * @module scraping/errors
 */

import { ErrorSeverity } from '../types/index.js';

/**
 * Base class for all scraping-related errors
 */
export abstract class ScrapingError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.retryable = retryable;
    this.timestamp = new Date();
    this.context = context;
  }
}

/**
 * Error thrown when a request is blocked by anti-bot measures
 */
export class AntiBotError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ANTI_BOT_BLOCKED', ErrorSeverity.HIGH, true, context);
  }
}

/**
 * Error thrown when rate limits are exceeded
 */
export class RateLimitError extends ScrapingError {
  constructor(message: string, retryAfter?: number, context?: Record<string, any>) {
    super(
      message,
      'RATE_LIMIT_EXCEEDED',
      ErrorSeverity.MEDIUM,
      true,
      { ...context, retryAfter }
    );
  }
}

/**
 * Error thrown when CAPTCHA solving fails
 */
export class CaptchaError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CAPTCHA_SOLVING_FAILED', ErrorSeverity.HIGH, true, context);
  }
}

/**
 * Error thrown when proxy fails
 */
export class ProxyError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PROXY_FAILURE', ErrorSeverity.MEDIUM, true, context);
  }
}

/**
 * Error thrown when parsing fails
 */
export class ParsingError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PARSING_FAILED', ErrorSeverity.MEDIUM, false, context);
  }
}

/**
 * Error thrown when robots.txt is violated
 */
export class RobotsTxtError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'ROBOTS_TXT_VIOLATION', ErrorSeverity.CRITICAL, false, context);
  }
}

/**
 * Error thrown when terms of service are violated
 */
export class TermsOfServiceError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'TERMS_OF_SERVICE_VIOLATION', ErrorSeverity.CRITICAL, false, context);
  }
}

/**
 * Error thrown when network requests fail
 */
export class NetworkError extends ScrapingError {
  constructor(message: string, statusCode?: number, context?: Record<string, any>) {
    super(
      message,
      'NETWORK_ERROR',
      ErrorSeverity.MEDIUM,
      true,
      { ...context, statusCode }
    );
  }
}

/**
 * Error thrown when scraping times out
 */
export class TimeoutError extends ScrapingError {
  constructor(message: string, timeoutMs?: number, context?: Record<string, any>) {
    super(
      message,
      'TIMEOUT_ERROR',
      ErrorSeverity.MEDIUM,
      true,
      { ...context, timeoutMs }
    );
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', ErrorSeverity.CRITICAL, false, context);
  }
}

/**
 * Error thrown when data validation fails
 */
export class ValidationError extends ScrapingError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', ErrorSeverity.MEDIUM, false, context);
  }
}
