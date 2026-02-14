/**
 * Simple Error Handling Test
 * Direct test without complex setup
 */

import { test } from 'vitest';
import request from 'supertest';
import express from 'express';
import { enhancedErrorHandler } from '../src/middlewares/enhancedErrorHandler.js';
import { AuthenticationError, ValidationError } from '../src/errors/AppError.js';

// Create a simple test app
const app = express();
app.use(express.json());

// Test route that throws an error
app.get('/test-auth-error', (req, res, next) => {
  throw new AuthenticationError('Test authentication error', { userId: '123' });
});

app.get('/test-validation-error', (req, res, next) => {
  throw new ValidationError('Test validation error', { field: 'email' });
});

app.get('/test-generic-error', (req, res, next) => {
  throw new Error('Test generic error');
});

// Use our error handler
app.use(enhancedErrorHandler);

test('should handle AuthenticationError correctly', async () => {
  const response = await request(app)
    .get('/test-auth-error')
    .expect(401);

  console.log('Auth Error Response:', JSON.stringify(response.body, null, 2));
  
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
  expect(response.body.error.message).toBe('Test authentication error');
  expect(response.body.error.category).toBe('authentication');
  expect(response.body.error.severity).toBe('high');
  expect(response.body.requestId).toBeDefined();
});

test('should handle ValidationError correctly', async () => {
  const response = await request(app)
    .get('/test-validation-error')
    .expect(400);

  console.log('Validation Error Response:', JSON.stringify(response.body, null, 2));
  
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('VALIDATION_FAILED');
  expect(response.body.error.message).toBe('Test validation error');
  expect(response.body.error.category).toBe('validation');
  expect(response.body.requestId).toBeDefined();
});

test('should handle generic Error correctly', async () => {
  const response = await request(app)
    .get('/test-generic-error')
    .expect(500);

  console.log('Generic Error Response:', JSON.stringify(response.body, null, 2));
  
  expect(response.body.success).toBe(false);
  expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  expect(response.body.error.message).toBe('Test generic error');
  expect(response.body.requestId).toBeDefined();
});
