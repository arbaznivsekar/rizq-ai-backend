import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestEnvironment } from '../helpers/testEnvironment.js';
import { TestDataFactory } from '../helpers/testDataFactory.js';
import { EmailSendQueue, DailySendTracker, EmailConsent } from '../../src/models/emailOutreach.js';

describe('Email Outreach Endpoints', () => {
  let authToken: string;
  let user: any;
  
  beforeEach(async () => {
    const authData = await TestDataFactory.createUserWithGmailAuth();
    authToken = authData.token;
    user = authData.user;
    
    // Create email consent for user
    await EmailConsent.create({
      userId: user._id,
      consentedAt: new Date(),
      consentDetails: 'User consented to automated email outreach',
      consentStatus: 'active'
    });
  });
  
  describe('POST /api/v1/email-outreach/consent', () => {
    it('should create email consent for user', async () => {
      // Clear existing consent
      await EmailConsent.deleteMany({ userId: user._id });
      
      const consentData = {
        consentDetails: 'I agree to automated email outreach for job applications'
      };
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(consentData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify consent was created
      const consent = await EmailConsent.findOne({ userId: user._id });
      expect(consent).toBeTruthy();
      expect(consent?.consentStatus).toBe('active');
    });
    
    it('should reject consent without details', async () => {
      await EmailConsent.deleteMany({ userId: user._id });
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/consent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/v1/email-outreach/withdraw-consent', () => {
    it('should withdraw email consent', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/withdraw-consent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify consent was withdrawn
      const consent = await EmailConsent.findOne({ userId: user._id });
      expect(consent?.consentStatus).toBe('withdrawn');
      expect(consent?.withdrawnAt).toBeTruthy();
    });
  });
  
  describe('POST /api/v1/email-outreach/one-click-apply', () => {
    beforeEach(() => {
      // Mock external services
      vi.doMock('../../src/services/hunterio.service.js', () => ({
        HunterIOService: vi.fn().mockImplementation(() => ({
          discoverCompanyEmails: vi.fn().mockResolvedValue(TestDataFactory.mockHunterIOResponse())
        }))
      }));
      
      vi.doMock('../../src/services/gmailTokenService.js', () => ({
        gmailTokenService: {
          getValidAccessToken: vi.fn().mockResolvedValue('mock-access-token')
        }
      }));
    });
    
    it('should queue email outreach for valid jobs', async () => {
      const jobs = await TestDataFactory.createJobs(3);
      const jobIds = jobs.map(job => job._id.toString());
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/one-click-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.queued).toBe(3);
      
      // Verify emails were queued
      const queuedEmails = await EmailSendQueue.find({ userId: user._id });
      expect(queuedEmails).toHaveLength(3);
    });
    
    it('should respect daily email limits', async () => {
      // Set user to daily limit
      await DailySendTracker.create({
        userId: user._id,
        date: new Date(),
        sendsToday: 40,
        maxAllowed: 40
      });
      
      const jobs = await TestDataFactory.createJobs(3);
      const jobIds = jobs.map(job => job._id.toString());
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/one-click-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds })
        .expect(200);
      
      expect(response.body.queued).toBe(0);
      expect(response.body.reason).toBe('daily_limit_reached');
    });
    
    it('should require active consent', async () => {
      // Withdraw consent
      await EmailConsent.updateOne(
        { userId: user._id },
        { consentStatus: 'withdrawn', withdrawnAt: new Date() }
      );
      
      const jobs = await TestDataFactory.createJobs(2);
      const jobIds = jobs.map(job => job._id.toString());
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/one-click-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds })
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('consent');
    });
    
    it('should handle non-existent jobs gracefully', async () => {
      const fakeJobIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/one-click-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds: fakeJobIds })
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('jobs_not_found');
    });
    
    it('should reject empty job IDs array', async () => {
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/one-click-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds: [] })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('no_job_ids');
    });
    
    it('should handle partial job processing', async () => {
      const validJobs = await TestDataFactory.createJobs(2);
      const invalidJobId = '507f1f77bcf86cd799439011';
      const jobIds = [...validJobs.map(j => j._id.toString()), invalidJobId];
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/one-click-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.queued).toBe(2); // Only valid jobs should be queued
    });
    
    it('should generate personalized email content', async () => {
      const job = await TestDataFactory.createJob({
        title: 'Senior React Developer',
        company: { name: 'TechCorp', domain: 'techcorp.com' }
      });
      
      const response = await TestEnvironment.request
        .post('/api/v1/email-outreach/one-click-apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ jobIds: [job._id.toString()] })
        .expect(200);
      
      expect(response.body.queued).toBe(1);
      
      // Check queued email content
      const queuedEmail = await EmailSendQueue.findOne({ userId: user._id });
      expect(queuedEmail?.emailContent.subject).toContain('Senior React Developer');
      expect(queuedEmail?.emailContent.subject).toContain('TechCorp');
      expect(queuedEmail?.emailContent.body).toContain(user.name);
    });
  });
  
  describe('GET /api/v1/email-outreach/oauth/google/start', () => {
    it('should initiate Gmail OAuth flow', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/email-outreach/oauth/google/start')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(302);
      
      expect(response.headers.location).toContain('accounts.google.com');
    });
  });
  
  describe('GET /api/v1/email-outreach/oauth/google/callback', () => {
    it('should handle OAuth callback with valid code', async () => {
      // Mock the OAuth token exchange
      vi.doMock('../../src/services/gmailTokenService.js', () => ({
        gmailTokenService: {
          exchangeCodeForTokens: vi.fn().mockResolvedValue(TestDataFactory.mockGmailTokenResponse())
        }
      }));
      
      const response = await TestEnvironment.request
        .get('/api/v1/email-outreach/oauth/google/callback?code=valid_auth_code&state=user_id')
        .expect(302);
      
      expect(response.headers.location).toContain('success');
    });
    
    it('should handle OAuth callback with error', async () => {
      const response = await TestEnvironment.request
        .get('/api/v1/email-outreach/oauth/google/callback?error=access_denied')
        .expect(302);
      
      expect(response.headers.location).toContain('error');
    });
  });
});
