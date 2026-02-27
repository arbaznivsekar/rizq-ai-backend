import { describe, it, expect, beforeEach } from 'vitest';
import { TestEnvironment } from '../helpers/testEnvironment.js';
import { TestDataFactory } from '../helpers/testDataFactory.js';
import User from '../../src/models/User.js';

describe('Authentication Endpoints', () => {
  
  describe('POST /api/v1/auth/register', () => {
    it('should register new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      
      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Test User');
    });
    
    it('should reject invalid email format', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject weak password', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject duplicate email', async () => {
      // Create user first
      await TestDataFactory.createUser({ email: 'test@example.com' });
      
      const response = await TestEnvironment.request
        .post('/api/v1/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Pre-create user
      const user = await TestDataFactory.createUser({
        email: 'test@example.com'
      });
      
      const response = await TestEnvironment.request
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });
    
    it('should reject invalid credentials', async () => {
      await TestDataFactory.createUser({ email: 'test@example.com' });
      
      const response = await TestEnvironment.request
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject non-existent user', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/v1/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const { user, token } = await TestDataFactory.createAuthenticatedUser();
      
      const response = await TestEnvironment.request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.id).toBe(user._id.toString());
      expect(response.body.email).toBe(user.email);
    });
    
    it('should reject request without token', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/auth/me')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject invalid token', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const { token } = await TestDataFactory.createAuthenticatedUser();

      const response = await TestEnvironment.request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
    });
    
    it('should fail logout without authentication', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/auth/logout')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});
