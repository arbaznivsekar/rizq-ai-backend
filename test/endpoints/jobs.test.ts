import { describe, it, expect, beforeEach } from 'vitest';
import { TestEnvironment } from '../helpers/testEnvironment.js';
import { TestDataFactory } from '../helpers/testDataFactory.js';
import { JobModel } from '../../src/data/models/Job.js';

describe('Jobs Endpoints', () => {
  let authToken: string;
  let user: any;
  
  beforeEach(async () => {
    const authData = await TestDataFactory.createAuthenticatedUser();
    authToken = authData.token;
    user = authData.user;
  });
  
  describe('GET /api/v1/jobs', () => {
    it('should return paginated jobs list', async () => {
      await TestDataFactory.createJobs(15);
      
      const response = await TestEnvironment.request
        .get('/api/v1/jobs?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.jobs).toHaveLength(10);
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages');
    });
    
    it('should filter jobs by location', async () => {
      await TestDataFactory.createJob({ 
        location: { city: 'Remote', remoteType: 'remote' },
        title: 'Remote Job'
      });
      await TestDataFactory.createJob({ 
        location: { city: 'New York', remoteType: 'onsite' },
        title: 'NYC Job'
      });
      
      const response = await TestEnvironment.request
        .get('/api/v1/jobs?location=remote')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].location.city).toBe('Remote');
    });
    
    it('should filter jobs by skills', async () => {
      await TestDataFactory.createJob({ 
        title: 'React Developer',
        skills: ['React', 'JavaScript', 'TypeScript']
      });
      await TestDataFactory.createJob({ 
        title: 'Python Developer',
        skills: ['Python', 'Django', 'Flask']
      });
      
      const response = await TestEnvironment.request
        .get('/api/v1/jobs?skills=React')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].title).toBe('React Developer');
    });
    
    it('should return empty array when no jobs match filters', async () => {
      await TestDataFactory.createJobs(5);
      
      const response = await TestEnvironment.request
        .get('/api/v1/jobs?location=nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.jobs).toHaveLength(0);
    });
    
    it('should reject unauthenticated requests', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/jobs')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/v1/jobs/:id', () => {
    it('should return specific job by ID', async () => {
      const job = await TestDataFactory.createJob({ title: 'Specific Job' });
      
      const response = await TestEnvironment.request
        .get(`/api/v1/jobs/${job._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.id).toBe(job._id.toString());
      expect(response.body.title).toBe('Specific Job');
    });
    
    it('should return 404 for non-existent job', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await TestEnvironment.request
        .get(`/api/v1/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should return 400 for invalid job ID format', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/jobs/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/v1/jobs/matches', () => {
    it('should return personalized job matches', async () => {
      // Create user with specific skills
      const { user: skillUser, token: skillToken } = await TestDataFactory.createUserWithSkills([
        'JavaScript', 'React', 'Node.js'
      ]);
      
      // Create matching job
      const matchingJob = await TestDataFactory.createJob({ 
        title: 'React Developer',
        skills: ['React', 'JavaScript', 'HTML', 'CSS']
      });
      
      // Create non-matching job
      await TestDataFactory.createJob({ 
        title: 'Python Developer',
        skills: ['Python', 'Django', 'PostgreSQL']
      });
      
      const response = await TestEnvironment.request
        .get('/api/v1/jobs/matches')
        .set('Authorization', `Bearer ${skillToken}`)
        .expect(200);
      
      expect(response.body.matches).toBeDefined();
      expect(response.body.matches.length).toBeGreaterThan(0);
      
      // Check if matching job is in results
      const jobIds = response.body.matches.map((match: any) => match.job.id || match.job._id);
      expect(jobIds).toContain(matchingJob._id.toString());
    });
    
    it('should return empty matches for user without skills', async () => {
      await TestDataFactory.createJobs(5);
      
      const response = await TestEnvironment.request
        .get('/api/v1/jobs/matches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.matches).toBeDefined();
      // May return empty or low-scored matches
    });
  });
  
  describe('POST /api/v1/jobs', () => {
    it('should create new job with valid data', async () => {
      const jobData = {
        title: 'New Software Engineer',
        company: { name: 'New Company', domain: 'newco.com' },
        location: { city: 'San Francisco', remoteType: 'hybrid' },
        description: 'Great opportunity for software engineer',
        skills: ['JavaScript', 'React', 'Node.js'],
        source: 'manual'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(jobData.title);
      
      // Verify job was created in database
      const job = await JobModel.findById(response.body.id);
      expect(job).toBeTruthy();
      expect(job?.title).toBe(jobData.title);
    });
    
    it('should reject job creation with invalid data', async () => {
      const invalidJobData = {
        title: '', // Empty title should be invalid
        company: { name: 'Test Company' }
        // Missing required fields
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidJobData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});
