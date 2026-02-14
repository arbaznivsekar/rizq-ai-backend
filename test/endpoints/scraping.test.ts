import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEnvironment } from '../helpers/testEnvironment.js';
import { TestDataFactory } from '../helpers/testDataFactory.js';
import { TestHelpers } from '../helpers/testHelpers.js';
import jwt from 'jsonwebtoken';

describe('Scraping Endpoints', () => {
  let adminToken: string;
  let userToken: string;
  let adminUser: any;
  let regularUser: any;
  
  beforeEach(async () => {
    adminUser = await TestDataFactory.createAdminUser();
    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email },
      process.env.NEXTAUTH_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    const userData = await TestDataFactory.createAuthenticatedUser();
    userToken = userData.token;
    regularUser = userData.user;
  });
  
  describe('POST /api/v1/scraping/jobs', () => {
    it('should start scraping job with valid parameters', async () => {
      const scrapingData = {
        source: 'indeed',
        query: 'software engineer',
        location: 'remote',
        maxJobs: 10
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/scraping/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scrapingData)
        .expect(200);
      
      expect(response.body).toHaveProperty('jobId');
      expect(response.body.status).toBe('queued');
      expect(response.body.source).toBe('indeed');
    });
    
    it('should reject scraping request from non-admin', async () => {
      const scrapingData = {
        source: 'indeed',
        query: 'software engineer',
        location: 'remote'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/scraping/jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .send(scrapingData)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should validate required scraping parameters', async () => {
      const invalidData = {
        source: 'indeed'
        // Missing query
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/scraping/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject invalid scraping source', async () => {
      const invalidData = {
        source: 'invalid_source',
        query: 'software engineer',
        location: 'remote'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/scraping/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('source');
    });
  });
  
  describe('GET /api/v1/scraping/jobs', () => {
    it('should return active scraping jobs for admin', async () => {
      // Mock some scraping jobs
      const mockJobs = [
        { id: 'job1', status: 'running', source: 'indeed' },
        { id: 'job2', status: 'completed', source: 'linkedin' }
      ];
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          getActiveJobs: vi.fn().mockResolvedValue(mockJobs)
        }
      }));
      
      const response = await TestEnvironment.request
        .get('/api/v1/scraping/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.jobs).toBeDefined();
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });
    
    it('should reject request from non-admin user', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/scraping/jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/v1/scraping/jobs/:jobId', () => {
    it('should return job status for admin', async () => {
      const jobId = 'test-job-123';
      const mockJobStatus = {
        id: jobId,
        status: 'running',
        progress: 50,
        jobsFound: 25,
        errors: []
      };
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          getJobStatus: vi.fn().mockResolvedValue(mockJobStatus)
        }
      }));
      
      const response = await TestEnvironment.request
        .get(`/api/v1/scraping/jobs/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.id).toBe(jobId);
      expect(response.body.status).toBe('running');
      expect(response.body.progress).toBe(50);
    });
    
    it('should return 404 for non-existent job', async () => {
      const jobId = 'non-existent-job';
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          getJobStatus: vi.fn().mockResolvedValue(null)
        }
      }));
      
      const response = await TestEnvironment.request
        .get(`/api/v1/scraping/jobs/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /api/v1/scraping/jobs/:jobId', () => {
    it('should cancel scraping job', async () => {
      const jobId = 'test-job-to-cancel';
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          cancelJob: vi.fn().mockResolvedValue({ success: true })
        }
      }));
      
      const response = await TestEnvironment.request
        .delete(`/api/v1/scraping/jobs/${jobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    it('should reject cancellation from non-admin', async () => {
      const jobId = 'test-job-to-cancel';
      
      const response = await TestEnvironment.request
        .delete(`/api/v1/scraping/jobs/${jobId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/v1/scraping/stats', () => {
    it('should return scraping statistics', async () => {
      const mockStats = {
        totalJobs: 150,
        successfulJobs: 140,
        failedJobs: 10,
        successRate: 93.33,
        averageJobsPerHour: 25,
        totalJobsScraped: 3500,
        lastScrapingTime: new Date().toISOString()
      };
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          getStats: vi.fn().mockResolvedValue(mockStats)
        }
      }));
      
      const response = await TestEnvironment.request
        .get('/api/v1/scraping/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.totalJobs).toBe(150);
      expect(response.body.successRate).toBe(93.33);
      expect(response.body.averageJobsPerHour).toBe(25);
    });
  });
  
  describe('POST /api/v1/scraping/continuous/start', () => {
    it('should start continuous scraping', async () => {
      const continuousConfig = {
        sources: ['indeed', 'linkedin'],
        queries: ['software engineer', 'data scientist'],
        locations: ['remote', 'san francisco'],
        intervalMinutes: 60
      };
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          startContinuousScraping: vi.fn().mockResolvedValue({ success: true, intervalId: 'interval-123' })
        }
      }));
      
      const response = await TestEnvironment.request
        .post('/api/v1/scraping/continuous/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(continuousConfig)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('intervalId');
    });
  });
  
  describe('POST /api/v1/scraping/continuous/stop', () => {
    it('should stop continuous scraping', async () => {
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          stopContinuousScraping: vi.fn().mockResolvedValue({ success: true })
        }
      }));
      
      const response = await TestEnvironment.request
        .post('/api/v1/scraping/continuous/stop')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('GET /api/v1/scraping/scrapers', () => {
    it('should return available scrapers', async () => {
      const mockScrapers = [
        { name: 'indeed', status: 'active', capabilities: ['jobs', 'companies'] },
        { name: 'linkedin', status: 'active', capabilities: ['jobs', 'profiles'] },
        { name: 'glassdoor', status: 'inactive', capabilities: ['jobs', 'reviews'] }
      ];
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          getAvailableScrapers: vi.fn().mockResolvedValue(mockScrapers)
        }
      }));
      
      const response = await TestEnvironment.request
        .get('/api/v1/scraping/scrapers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.scrapers).toHaveLength(3);
      expect(response.body.scrapers[0].name).toBe('indeed');
      expect(response.body.scrapers[0].status).toBe('active');
    });
  });
  
  describe('GET /api/v1/scraping/health', () => {
    it('should return scraping service health status', async () => {
      const mockHealth = {
        status: 'healthy',
        uptime: 3600,
        activeJobs: 5,
        queueSize: 12,
        lastError: null
      };
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          healthCheck: vi.fn().mockResolvedValue(mockHealth)
        }
      }));
      
      const response = await TestEnvironment.request
        .get('/api/v1/scraping/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.uptime).toBe(3600);
      expect(response.body.activeJobs).toBe(5);
    });
    
    it('should return unhealthy status when service has issues', async () => {
      const mockHealth = {
        status: 'unhealthy',
        uptime: 3600,
        activeJobs: 0,
        queueSize: 100,
        lastError: 'Browser launch failed'
      };
      
      vi.doMock('../../src/services/scraping.service.js', () => ({
        scrapingService: {
          healthCheck: vi.fn().mockResolvedValue(mockHealth)
        }
      }));
      
      const response = await TestEnvironment.request
        .get('/api/v1/scraping/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.lastError).toBe('Browser launch failed');
    });
  });
});
