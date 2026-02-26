import User from '../../src/models/User.js';
import { JobModel } from '../../src/data/models/Job.js';
import Application from '../../src/models/Application.js';
import Resume from '../../src/models/Resume.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';
import bcrypt from 'bcrypt';

export class TestDataFactory {
  
  static async createUser(overrides: any = {}) {
    const userData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      roles: ['user'],
      ...overrides
    };
    
    return await User.create(userData);
  }
  
  static async createAdminUser(overrides: any = {}) {
    return await this.createUser({ 
      roles: ['admin'], 
      email: `admin${Date.now()}@example.com`,
      ...overrides 
    });
  }
  
  static async createAuthenticatedUser(overrides: any = {}) {
    const user = await this.createUser(overrides);
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        name: user.name ?? '',
        roles: user.roles ?? ['user']
      },
      env.JWT_SECRET,
      { expiresIn: '1h', issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE }
    );

    return { user, token };
  }
  
  static async createUserWithGmailAuth(overrides: any = {}) {
    const userData = {
      gmailRefreshToken: 'mock-refresh-token',
      gmailAccessToken: 'mock-access-token',
      gmailTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      ...overrides
    };
    
    return await this.createAuthenticatedUser(userData);
  }
  
  static async createJob(overrides: any = {}) {
    const jobData = {
      title: 'Software Engineer',
      company: { name: 'Test Company', domain: 'testcompany.com' },
      location: { city: 'Remote', remoteType: 'remote' },
      description: 'Test job description',
      skills: ['JavaScript', 'React'],
      postedAt: new Date(),
      source: 'test',
      compositeKey: `test-job-${Date.now()}`,
      ...overrides
    };
    
    return await JobModel.create(jobData);
  }
  
  static async createJobs(count: number, overrides: any = {}) {
    const jobs = [];
    for (let i = 0; i < count; i++) {
      const job = await this.createJob({
        title: `Test Job ${i + 1}`,
        compositeKey: `test-job-${Date.now()}-${i}`,
        ...overrides
      });
      jobs.push(job);
    }
    return jobs;
  }
  
  static async createApplication(userId: string, jobId: string, overrides: any = {}) {
    const applicationData = {
      userId,
      jobId,
      status: 'applied',
      appliedAt: new Date(),
      ...overrides
    };
    
    return await Application.create(applicationData);
  }
  
  static async createResume(userId: string, overrides: any = {}) {
    const resumeData = {
      userId,
      personalInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890'
      },
      experience: [
        {
          title: 'Software Engineer',
          company: 'Test Company',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-01-01'),
          description: 'Worked on various projects'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'Test University',
          graduationDate: new Date('2019-12-01')
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js'],
      ...overrides
    };
    
    return await Resume.create(resumeData);
  }
  
  static async createUserWithSkills(skills: string[], overrides: any = {}) {
    const { user, token } = await this.createAuthenticatedUser(overrides);
    await this.createResume(user._id.toString(), { skills });
    return { user, token };
  }
  
  // Helper methods for bulk creation
  static async createUsers(count: number) {
    const users = [];
    for (let i = 0; i < count; i++) {
      const { user, token } = await this.createAuthenticatedUser({
        email: `user${i}@example.com`
      });
      users.push({ user, token });
    }
    return users;
  }
  
  // Mock external service responses
  static mockHunterIOResponse() {
    return {
      emails: [
        { email: 'hr@testcompany.com', role: 'recruiter' },
        { email: 'hiring@testcompany.com', role: 'hr' }
      ],
      credits: 1,
      responseMs: 100
    };
  }
  
  static mockGmailTokenResponse() {
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    };
  }
}
