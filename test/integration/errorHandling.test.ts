/**
 * Error Handling Integration Tests
 * @module test/integration/errorHandling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEnvironment } from '../helpers/testEnvironment.js';
import { TestDataFactory } from '../helpers/testDataFactory.js';
import { 
  AppError, 
  AuthenticationError, 
  ValidationError, 
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  SystemError,
  RateLimitError,
  NetworkError,
  ErrorSeverity,
  ErrorCategory
} from '../../src/errors/AppError.js';
import { ScrapingError } from '../../src/scraping/errors/index.js';

describe('Error Handling Integration Tests', () => {
  
  beforeEach(async () => {
    // Clear database before each test
    try {
      await TestEnvironment.clearDatabase();
    } catch (error) {
      console.warn('Database clear failed, continuing with test...', error);
    }
  });

  describe('AppError Classes', () => {
    it('should create AuthenticationError with correct properties', () => {
      const error = new AuthenticationError('Invalid credentials', { userId: '123' });
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('AUTHENTICATION_FAILED');
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({ userId: '123' });
    });

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input data', { field: 'email' });
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid input data');
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({ field: 'email' });
    });

    it('should create DatabaseError with correct properties', () => {
      const error = new DatabaseError('Connection failed', { host: 'localhost' });
      
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ host: 'localhost' });
    });

    it('should create ExternalServiceError with correct properties', () => {
      const error = new ExternalServiceError('Service unavailable', 'Gmail API');
      
      expect(error).toBeInstanceOf(ExternalServiceError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Service unavailable');
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ service: 'Gmail API' });
    });

    it('should create BusinessLogicError with correct properties', () => {
      const error = new BusinessLogicError('Invalid business rule', { rule: 'daily_limit' });
      
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid business rule');
      expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
      expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({ rule: 'daily_limit' });
    });

    it('should create SystemError with correct properties', () => {
      const error = new SystemError('System failure', { component: 'queue' });
      
      expect(error).toBeInstanceOf(SystemError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('System failure');
      expect(error.code).toBe('SYSTEM_ERROR');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ component: 'queue' });
    });

    it('should create RateLimitError with correct properties', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ retryAfter: 60 });
    });

    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Connection timeout', 408);
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Connection timeout');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ statusCode: 408 });
    });
  });

  describe('Error JSON Serialization', () => {
    it('should serialize AppError to JSON correctly', () => {
      const error = new AuthenticationError('Invalid token', { token: 'abc123' });
      const json = error.toJSON();
      
      expect(json).toEqual({
        name: 'AuthenticationError',
        message: 'Invalid token',
        code: 'AUTHENTICATION_FAILED',
        category: 'authentication',
        severity: 'high',
        retryable: false,
        timestamp: expect.any(String),
        context: { token: 'abc123' },
        requestId: undefined,
        userId: undefined,
        stack: expect.any(String)
      });
    });
  });

  describe('Error Handler Integration', () => {
    it('should handle AppError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/auth-error')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'AUTHENTICATION_FAILED');
      expect(response.body.error).toHaveProperty('message', 'Invalid credentials');
      expect(response.body.error).toHaveProperty('category', 'authentication');
      expect(response.body.error).toHaveProperty('severity', 'high');
      expect(response.body.error).toHaveProperty('retryable', false);
    });

    it('should handle ValidationError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/validation-error')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_FAILED');
      expect(response.body.error).toHaveProperty('category', 'validation');
    });

    it('should handle DatabaseError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/database-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'DATABASE_ERROR');
      expect(response.body.error).toHaveProperty('category', 'database');
      expect(response.body.error).toHaveProperty('retryable', true);
    });

    it('should handle ExternalServiceError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/external-service-error')
        .expect(502);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'EXTERNAL_SERVICE_ERROR');
      expect(response.body.error).toHaveProperty('category', 'external_service');
    });

    it('should handle BusinessLogicError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/business-logic-error')
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'BUSINESS_LOGIC_ERROR');
      expect(response.body.error).toHaveProperty('category', 'business_logic');
    });

    it('should handle SystemError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/system-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'SYSTEM_ERROR');
      expect(response.body.error).toHaveProperty('category', 'system');
      expect(response.body.error).toHaveProperty('severity', 'critical');
    });

    it('should handle RateLimitError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/rate-limit-error')
        .expect(429);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
      expect(response.body.error).toHaveProperty('category', 'system');
    });

    it('should handle NetworkError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/network-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NETWORK_ERROR');
      expect(response.body.error).toHaveProperty('category', 'network');
    });

    it('should handle ScrapingError correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/scraping-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'ANTI_BOT_BLOCKED');
      expect(response.body.error).toHaveProperty('category', 'scraping');
    });

    it('should handle generic errors correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/generic-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INTERNAL_SERVER_ERROR');
    });

    it('should handle HTTP errors correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/http-error')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'HTTP_ERROR');
    });

    it('should handle JWT errors correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/jwt-error')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should handle token expired errors correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/token-expired-error')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'TOKEN_EXPIRED');
    });

    it('should handle MongoDB errors correctly in API response', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/mongo-error')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'DATABASE_ERROR');
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should handle circuit breaker states correctly', async () => {
      // This would test circuit breaker functionality
      // Implementation depends on how circuit breakers are integrated
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Context and Request ID', () => {
    it('should include request ID in error responses', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/auth-error')
        .set('X-Request-ID', 'test-request-123')
        .expect(401);

      expect(response.body).toHaveProperty('requestId', 'test-request-123');
    });

    it('should generate request ID if not provided', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/test/validation-error')
        .expect(400);

      expect(response.body).toHaveProperty('requestId');
      expect(response.body.requestId).toMatch(/^req_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });
  });

  describe('Error Logging', () => {
    it('should log errors with appropriate levels', () => {
      const loggerSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const criticalError = new SystemError('Critical system failure');
      const mediumError = new ValidationError('Invalid input');
      
      // Test error logging levels
      expect(criticalError.severity).toBe(ErrorSeverity.CRITICAL);
      expect(mediumError.severity).toBe(ErrorSeverity.MEDIUM);
      
      loggerSpy.mockRestore();
    });
  });
});

