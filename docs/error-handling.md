# RIZQ.AI Error Handling System
## Comprehensive Error Management Documentation

## 📋 Overview

The RIZQ.AI error handling system provides comprehensive error management with standardized error responses, logging, and monitoring capabilities.

## 🏗️ Architecture

### Error Class Hierarchy

```
AppError (Base Class)
├── AuthenticationError
├── AuthorizationError
├── ValidationError
├── DatabaseError
├── ExternalServiceError
├── BusinessLogicError
├── SystemError
├── RateLimitError
└── NetworkError
```

### Error Categories

- **Authentication**: Login, token validation, OAuth errors
- **Authorization**: Permission, role-based access errors
- **Validation**: Input validation, data format errors
- **Database**: Connection, query, transaction errors
- **External Service**: Third-party API, service integration errors
- **Business Logic**: Domain-specific business rule errors
- **System**: Infrastructure, configuration, critical errors
- **Network**: Connection, timeout, communication errors

### Error Severity Levels

- **LOW**: Minor issues, warnings
- **MEDIUM**: Standard errors, recoverable issues
- **HIGH**: Important errors, user-facing issues
- **CRITICAL**: System failures, security issues

## 🚀 Usage Examples

### Creating Custom Errors

```typescript
import { 
  AuthenticationError, 
  ValidationError, 
  DatabaseError,
  ExternalServiceError 
} from '../errors/AppError.js';

// Authentication error
throw new AuthenticationError('Invalid credentials', { userId: '123' });

// Validation error
throw new ValidationError('Email format is invalid', { field: 'email' });

// Database error
throw new DatabaseError('Connection failed', { host: 'localhost' });

// External service error
throw new ExternalServiceError('Gmail API unavailable', 'Gmail API');
```

### Using Error Utilities

```typescript
import { 
  throwValidationError,
  throwAuthenticationError,
  throwDatabaseError 
} from '../utils/errorUtils.js';

// Quick error throwing
throwValidationError('Invalid input data', { field: 'email' });
throwAuthenticationError('Token expired');
throwDatabaseError('Query failed', { query: 'SELECT * FROM users' });
```

### Circuit Breaker Pattern

```typescript
import { circuitBreakerManager } from '../utils/circuitBreaker.js';

// Execute with circuit breaker protection
try {
  const result = await circuitBreakerManager.execute(
    'gmail-api',
    () => gmailService.sendEmail(emailData)
  );
} catch (error) {
  // Handle circuit breaker or service errors
}
```

## 📊 Error Response Format

### Standard Error Response

```json
{
  "success": false,
  "requestId": "req_1234567890_abc123",
  "timestamp": "2025-09-28T18:12:53.739Z",
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid credentials provided",
    "category": "authentication",
    "severity": "high",
    "retryable": false,
    "context": {
      "userId": "123",
      "attempts": 3
    }
  }
}
```

### Error Response Fields

- **success**: Always `false` for error responses
- **requestId**: Unique identifier for request tracking
- **timestamp**: ISO timestamp of error occurrence
- **error.code**: Machine-readable error code
- **error.message**: Human-readable error message
- **error.category**: Error category for classification
- **error.severity**: Error severity level
- **error.retryable**: Whether the operation can be retried
- **error.context**: Additional error context and metadata

## 🔧 Error Handling Middleware

### Enhanced Error Handler

The enhanced error handler automatically:
- Categorizes errors by type
- Assigns appropriate HTTP status codes
- Logs errors with structured data
- Generates unique request IDs
- Provides consistent error responses

### Global Error Handlers

- **Unhandled Promise Rejections**: Logged and tracked
- **Uncaught Exceptions**: Logged and graceful shutdown
- **Circuit Breaker States**: Monitored and reported

## 📈 Monitoring and Logging

### Error Logging

All errors are logged with structured data including:
- Error type and severity
- Request context (user, IP, method, URL)
- Stack trace and context
- Timestamp and request ID

### Error Metrics

- Error count by category and severity
- Error rate over time
- Circuit breaker states
- Retry success rates

## 🛡️ Circuit Breaker Pattern

### States

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit is open, requests are blocked
- **HALF_OPEN**: Testing if service has recovered

### Configuration

```typescript
const options = {
  failureThreshold: 5,        // Failures before opening
  resetTimeout: 60000,        // Time before retry (ms)
  monitoringPeriod: 300000,   // Failure monitoring period (ms)
  successThreshold: 3         // Successes to close from half-open
};
```

## 🧪 Testing Error Handling

### Unit Tests

```typescript
import { AuthenticationError } from '../errors/AppError.js';

describe('Error Handling', () => {
  it('should create authentication error', () => {
    const error = new AuthenticationError('Invalid token');
    expect(error.code).toBe('AUTHENTICATION_FAILED');
    expect(error.severity).toBe('high');
  });
});
```

### Integration Tests

```typescript
describe('API Error Handling', () => {
  it('should return 401 for authentication error', async () => {
    const response = await request
      .post('/api/v1/auth/login')
      .send({ email: 'invalid', password: 'wrong' })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
  });
});
```

## 🔄 Error Recovery

### Retry Logic

- **Retryable Errors**: Automatically retried with exponential backoff
- **Non-Retryable Errors**: Returned immediately to client
- **Circuit Breaker**: Prevents cascading failures

### Graceful Degradation

- **Service Unavailable**: Fallback to cached data
- **Database Errors**: Return cached responses
- **External API Failures**: Use alternative services

## 📋 Best Practices

### Error Creation

1. **Use Specific Error Types**: Choose the most specific error class
2. **Include Context**: Provide relevant context for debugging
3. **Set Appropriate Severity**: Match severity to error impact
4. **Mark Retryable**: Indicate if operation can be retried

### Error Handling

1. **Catch at Appropriate Level**: Handle errors where you can take action
2. **Log with Context**: Include request and user context
3. **Don't Expose Internals**: Sanitize error messages for production
4. **Use Circuit Breakers**: Protect against cascading failures

### Error Monitoring

1. **Track Error Rates**: Monitor error frequency and trends
2. **Alert on Critical Errors**: Set up alerts for critical issues
3. **Analyze Error Patterns**: Identify common error causes
4. **Review Error Context**: Use context for debugging and fixes

## 🚨 Error Codes Reference

### Authentication Errors
- `AUTHENTICATION_FAILED`: General authentication failure
- `INVALID_TOKEN`: Invalid or malformed token
- `TOKEN_EXPIRED`: Authentication token has expired

### Validation Errors
- `VALIDATION_FAILED`: General validation failure
- `INVALID_ID_FORMAT`: Invalid ID format provided
- `MISSING_REQUIRED_FIELD`: Required field is missing

### Database Errors
- `DATABASE_ERROR`: General database error
- `CONNECTION_FAILED`: Database connection failed
- `QUERY_FAILED`: Database query failed

### External Service Errors
- `EXTERNAL_SERVICE_ERROR`: General external service error
- `SERVICE_UNAVAILABLE`: External service is unavailable
- `API_RATE_LIMIT`: External API rate limit exceeded

### System Errors
- `SYSTEM_ERROR`: General system error
- `CONFIGURATION_ERROR`: System configuration error
- `RESOURCE_EXHAUSTED`: System resource exhausted

## 🔧 Configuration

### Environment Variables

```bash
# Error handling configuration
NODE_ENV=production
LOG_LEVEL=error
ERROR_REPORTING=true
CIRCUIT_BREAKER_ENABLED=true
```

### Error Handler Options

```typescript
const errorHandlerOptions = {
  includeStack: process.env.NODE_ENV !== 'production',
  logErrors: true,
  reportErrors: true,
  circuitBreakerEnabled: true
};
```

This comprehensive error handling system ensures robust error management, monitoring, and recovery capabilities for the RIZQ.AI platform.




