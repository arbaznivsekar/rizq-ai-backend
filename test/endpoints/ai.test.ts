import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEnvironment } from '../helpers/testEnvironment.js';
import { TestDataFactory } from '../helpers/testDataFactory.js';

// Mock the AI service at module level
vi.mock('../../src/services/ai.service.js', () => ({
  createChatCompletion: vi.fn()
}));

describe('AI Endpoints', () => {
  let mockCreateChatCompletion: any;
  
  beforeEach(async () => {
    const aiService = await import('../../src/services/ai.service.js');
    mockCreateChatCompletion = vi.mocked(aiService.createChatCompletion);
    mockCreateChatCompletion.mockClear();
  });
  
  describe('POST /api/v1/ai/chat', () => {
    it('should return AI chat completion with valid prompt', async () => {
      // Mock the AI service response
      const mockResponse = 'This is a mock AI response to your query.';
      mockCreateChatCompletion.mockResolvedValue(mockResponse);
      
      const chatData = {
        prompt: 'Hello, how can you help me with job applications?',
        system: 'You are a helpful job search assistant.'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .send(chatData)
        .expect(200);
      
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
    });
    
    it('should use default system message when not provided', async () => {
      const mockResponse = 'Default system response';
      mockCreateChatCompletion.mockResolvedValue(mockResponse);
      
      const chatData = {
        prompt: 'What is a good resume format?'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .send(chatData)
        .expect(200);
      
      expect(response.body).toHaveProperty('content');
    });
    
    it('should reject request with empty prompt', async () => {
      const chatData = {
        prompt: '',
        system: 'You are a helpful assistant.'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .send(chatData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject request without prompt', async () => {
      const chatData = {
        system: 'You are a helpful assistant.'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .send(chatData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle AI service errors gracefully', async () => {
      // Mock AI service to throw error
      mockCreateChatCompletion.mockRejectedValue(new Error('AI service unavailable'));
      
      const chatData = {
        prompt: 'This should fail'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .send(chatData)
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should validate system message length', async () => {
      const longSystemMessage = 'x'.repeat(10000); // Very long system message
      
      const chatData = {
        prompt: 'Test prompt',
        system: longSystemMessage
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .send(chatData);
      
      // Should either accept or reject based on your validation rules
      expect([200, 400]).toContain(response.status);
    });
    
    it('should handle special characters in prompt', async () => {
      const mockResponse = 'Handled special characters';
      mockCreateChatCompletion.mockResolvedValue(mockResponse);
      
      const chatData = {
        prompt: 'How do I write résumé with special chars: @#$%^&*()[]{}|\\:";\'<>?,./'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .send(chatData)
        .expect(200);
      
      expect(response.body).toHaveProperty('content');
    });
    
    it('should handle concurrent AI requests', async () => {
      const mockResponse = 'Concurrent response';
      mockCreateChatCompletion.mockResolvedValue(mockResponse);
      
      const chatData = {
        prompt: 'Concurrent test prompt'
      };
      
      // Make 5 concurrent requests
      const promises = Array(5).fill(null).map(() =>
        TestEnvironment.request
          .post('/api/v1/ai/chat')
          .send(chatData)
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('content');
      });
    });
    
    it('should respect content type requirements', async () => {
      const mockResponse = 'Content type test';
      mockCreateChatCompletion.mockResolvedValue(mockResponse);
      
      const chatData = {
        prompt: 'Test content type'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/ai/chat')
        .set('Content-Type', 'application/json')
        .send(chatData)
        .expect(200);
      
      expect(response.body).toHaveProperty('content');
    });
  });
});
