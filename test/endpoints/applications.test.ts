import { describe, it, expect, beforeEach } from 'vitest';
import { TestEnvironment } from '../helpers/testEnvironment.js';
import { TestDataFactory } from '../helpers/testDataFactory.js';
import { TestHelpers } from '../helpers/testHelpers.js';
import Application from '../../src/models/Application.js';

describe('Applications Endpoints', () => {
  let authToken: string;
  let user: any;
  
  beforeEach(async () => {
    const authData = await TestDataFactory.createAuthenticatedUser();
    authToken = authData.token;
    user = authData.user;
  });
  
  describe('GET /api/v1/applications', () => {
    it('should return user applications', async () => {
      const jobs = await TestDataFactory.createJobs(3);
      
      // Create applications for the user
      for (const job of jobs) {
        await TestDataFactory.createApplication(user._id, job._id);
      }
      
      // Create application for another user (should not appear)
      const { user: otherUser } = await TestDataFactory.createAuthenticatedUser();
      await TestDataFactory.createApplication(otherUser._id.toString(), jobs[0]._id.toString());
      
      const response = await TestEnvironment.request
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.applications).toHaveLength(3);
      response.body.applications.forEach((app: any) => {
        expect(app.userId).toBe(user._id.toString());
      });
    });
    
    it('should return empty array when user has no applications', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.applications).toHaveLength(0);
    });
    
    it('should filter applications by status', async () => {
      const job = await TestDataFactory.createJob();
      
      await TestDataFactory.createApplication(user._id, job._id, { status: 'applied' });
      await TestDataFactory.createApplication(user._id, job._id, { status: 'interviewed' });
      
      const response = await TestEnvironment.request
        .get('/api/v1/applications?status=applied')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0].status).toBe('applied');
    });
  });
  
  describe('POST /api/v1/applications', () => {
    it('should create new application', async () => {
      const job = await TestDataFactory.createJob();
      
      const applicationData = {
        jobId: job._id,
        coverLetter: 'I am interested in this position...',
        status: 'applied'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.jobId).toBe(job._id.toString());
      expect(response.body.userId).toBe(user._id.toString());
      
      // Verify application was created in database
      const application = await Application.findById(response.body.id);
      expect(application).toBeTruthy();
      expect(application?.status).toBe('Applied');
    });
    
    it('should reject application with invalid job ID', async () => {
      const applicationData = {
        jobId: '507f1f77bcf86cd799439011', // Non-existent job ID
        coverLetter: 'Test cover letter'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should prevent duplicate applications for same job', async () => {
      const job = await TestDataFactory.createJob();
      
      // Create first application
      await TestDataFactory.createApplication(user._id, job._id);
      
      // Try to create duplicate
      const applicationData = {
        jobId: job._id,
        coverLetter: 'Another application'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PATCH /api/v1/applications/:id', () => {
    it('should update application status', async () => {
      const job = await TestDataFactory.createJob();
      const application = await TestDataFactory.createApplication(user._id, job._id, {
        status: 'applied'
      });
      
      const updateData = {
        status: 'interviewed',
        notes: 'Had first round interview'
      };
      
      const response = await TestEnvironment.request
        .patch(`/api/v1/applications/${application._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.status).toBe('interviewed');
      expect(response.body.notes).toBe('Had first round interview');
      
      // Verify update in database
      const updatedApp = await Application.findById(application._id);
      expect(updatedApp?.status).toBe('interviewed');
      expect(updatedApp?.notes).toBe('Had first round interview');
    });
    
    it('should prevent updating other users applications', async () => {
      const { user: otherUser } = await TestDataFactory.createAuthenticatedUser();
      const job = await TestDataFactory.createJob();
      const application = await TestDataFactory.createApplication(otherUser._id.toString(), job._id.toString());
      
      const response = await TestEnvironment.request
        .patch(`/api/v1/applications/${application._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'interviewed' })
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/v1/applications/bulk-apply', () => {
    it('should handle bulk job applications', async () => {
      const jobs = await TestDataFactory.createJobs(5);
      const jobIds = jobs.map(job => job._id.toString());
      
      const response = await TestEnvironment.request
        .post('/api/v1/applications/bulk-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds })
        .expect(200);
      
      expect(response.body.applied).toBe(5);
      expect(response.body.success).toBe(true);
      
      // Verify applications were created
      const applications = await Application.find({ userId: user._id });
      expect(applications).toHaveLength(5);
    });
    
    it('should handle partial success in bulk apply', async () => {
      const jobs = await TestDataFactory.createJobs(3);
      
      // Create one application already to cause conflict
      await TestDataFactory.createApplication(user._id, jobs[0]._id);
      
      const jobIds = jobs.map(job => job._id.toString());
      
      const response = await TestEnvironment.request
        .post('/api/v1/applications/bulk-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds })
        .expect(200);
      
      // Should apply to 2 jobs (excluding the duplicate)
      expect(response.body.applied).toBe(2);
      expect(response.body.skipped).toBe(1);
    });
    
    it('should reject bulk apply with invalid job IDs', async () => {
      const invalidJobIds = ['invalid-id-1', 'invalid-id-2'];
      
      const response = await TestEnvironment.request
        .post('/api/v1/applications/bulk-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds: invalidJobIds })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject bulk apply with empty job IDs array', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/applications/bulk-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds: [] })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/v1/applications/export', () => {
    it('should export user applications as CSV', async () => {
      const jobs = await TestDataFactory.createJobs(3);
      
      for (const job of jobs) {
        await TestDataFactory.createApplication(user._id, job._id, {
          status: 'applied',
          appliedAt: new Date()
        });
      }
      
      const response = await TestEnvironment.request
        .post('/api/v1/applications/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Job Title');
      expect(response.text).toContain('Company');
      expect(response.text).toContain('Status');
    });
    
    it('should handle export with no applications', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/applications/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Job Title'); // Header should still be present
    });
  });
});
