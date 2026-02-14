/**
 * Mock for Scraping Service
 * @module test/mocks
 */

import { vi } from 'vitest';
import { ScrapingService } from '../../src/scraping/services/scrapingService.js';
import { JobBoardType } from '../../src/scraping/factory/scraperFactory.js';
import { SearchParams } from '../../src/scraping/types/index.js';

/**
 * Mock data for scraping service tests
 */
export const mockScrapedJobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    salaryMin: 120000,
    salaryMax: 160000,
    description: 'We are looking for a senior software engineer...',
    requirements: ['5+ years experience', 'React', 'Node.js'],
    benefits: ['Health insurance', '401k', 'Remote work'],
    source: 'indeed',
    externalId: 'indeed-123',
    postedAt: new Date('2024-01-15'),
    easyApply: true,
    remote: true,
    jobType: 'Full-time'
  },
  {
    id: '2',
    title: 'Frontend Developer',
    company: 'Startup Inc',
    location: 'New York, NY',
    salaryMin: 80000,
    salaryMax: 110000,
    description: 'Join our growing team as a frontend developer...',
    requirements: ['3+ years experience', 'React', 'TypeScript'],
    benefits: ['Stock options', 'Flexible hours'],
    source: 'naukri',
    externalId: 'naukri-456',
    postedAt: new Date('2024-01-16'),
    easyApply: false,
    remote: false,
    jobType: 'Full-time'
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    company: 'Cloud Solutions Ltd',
    location: 'Austin, TX',
    salaryMin: 100000,
    salaryMax: 140000,
    description: 'We need an experienced DevOps engineer...',
    requirements: ['4+ years experience', 'AWS', 'Kubernetes', 'Docker'],
    benefits: ['Health insurance', 'Dental', 'Vision'],
    source: 'indeed',
    externalId: 'indeed-789',
    postedAt: new Date('2024-01-17'),
    easyApply: true,
    remote: true,
    jobType: 'Full-time'
  }
];

/**
 * Mock scraping job data
 */
export const mockScrapingJobs = [
  {
    id: 'job-123',
    type: 'search_scrape',
    status: 'completed',
    priority: 5,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    startedAt: new Date('2024-01-15T10:05:00Z'),
    completedAt: new Date('2024-01-15T10:30:00Z'),
    attempts: 1,
    maxAttempts: 3,
    tags: ['indeed', 'search'],
    metadata: { boardType: 'indeed' },
    result: {
      success: true,
      totalJobs: 150,
      scrapedJobs: 45,
      failedJobs: 5,
      duration: 1500,
      startTime: new Date('2024-01-15T10:05:00Z'),
      endTime: new Date('2024-01-15T10:30:00Z')
    }
  },
  {
    id: 'job-456',
    type: 'search_scrape',
    status: 'running',
    priority: 3,
    createdAt: new Date('2024-01-15T11:00:00Z'),
    startedAt: new Date('2024-01-15T11:05:00Z'),
    attempts: 1,
    maxAttempts: 3,
    tags: ['naukri', 'search'],
    metadata: { boardType: 'naukri' },
    result: null
  },
  {
    id: 'job-789',
    type: 'search_scrape',
    status: 'failed',
    priority: 2,
    createdAt: new Date('2024-01-15T12:00:00Z'),
    startedAt: new Date('2024-01-15T12:05:00Z'),
    completedAt: new Date('2024-01-15T12:10:00Z'),
    attempts: 3,
    maxAttempts: 3,
    tags: ['linkedin', 'search'],
    metadata: { boardType: 'linkedin' },
    error: 'Rate limit exceeded'
  }
];

/**
 * Mock scraping statistics
 */
export const mockScrapingStats = {
  totalJobs: 1250,
  completedJobs: 850,
  failedJobs: 150,
  pendingJobs: 250,
  runningJobs: 5,
  averageProcessingTime: 45.2,
  successRate: 85.0,
  lastUpdated: new Date(),
  availableScrapers: ['indeed', 'naukri', 'linkedin'],
  scraperStats: {
    indeed: { total: 500, success: 450, failed: 50 },
    naukri: { total: 300, success: 280, failed: 20 },
    linkedin: { total: 450, success: 120, failed: 80 }
  }
};

/**
 * Create a mock ScrapingService instance
 */
export function createMockScrapingService(): ScrapingService {
  const mockService = {
    getInstance: vi.fn().mockReturnThis(),
    startScrapingJob: vi.fn(),
    getJobStatus: vi.fn(),
    getActiveJobs: vi.fn(),
    getStats: vi.fn(),
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
    startContinuousScraping: vi.fn(),
    stopContinuousScraping: vi.fn(),
    getAvailableScrapers: vi.fn(),
    healthCheck: vi.fn(),
    cleanup: vi.fn()
  };

  // Configure default mock behaviors
  mockService.startScrapingJob.mockImplementation(async (boardType: JobBoardType, searchParams: SearchParams) => {
    return `mock-job-${Date.now()}`;
  });

  mockService.getJobStatus.mockImplementation((jobId: string) => {
    return mockScrapingJobs.find(job => job.id === jobId) || null;
  });

  mockService.getActiveJobs.mockImplementation(() => {
    return mockScrapingJobs.filter(job => job.status === 'running' || job.status === 'pending');
  });

  mockService.getStats.mockImplementation(() => {
    return mockScrapingStats;
  });

  mockService.cancelJob.mockImplementation(async (jobId: string) => {
    const job = mockScrapingJobs.find(j => j.id === jobId);
    return job ? true : false;
  });

  mockService.retryJob.mockImplementation(async (jobId: string) => {
    const job = mockScrapingJobs.find(j => j.id === jobId);
    return job ? { retried: true } : { retried: false, reason: 'Job not found' };
  });

  mockService.startContinuousScraping.mockImplementation(async () => {
    return Promise.resolve();
  });

  mockService.stopContinuousScraping.mockImplementation(() => {
    return Promise.resolve();
  });

  mockService.getAvailableScrapers.mockImplementation(() => {
    return ['indeed', 'naukri', 'linkedin'];
  });

  mockService.healthCheck.mockImplementation(async () => {
    return {
      status: 'healthy',
      timestamp: new Date(),
      responseTime: 50,
      metadata: {
        activeJobs: mockScrapingJobs.filter(j => j.status === 'running').length,
        totalJobs: mockScrapingJobs.length
      }
    };
  });

  mockService.cleanup.mockImplementation(async () => {
    return Promise.resolve();
  });

  return mockService as unknown as ScrapingService;
}

/**
 * Mock the ScrapingService class for testing
 */
export function mockScrapingService() {
  const mockService = createMockScrapingService();

  // Mock the static getInstance method
  vi.spyOn(ScrapingService, 'getInstance').mockReturnValue(mockService);

  return mockService;
}

/**
 * Reset all mocks
 */
export function resetScrapingServiceMocks() {
  vi.clearAllMocks();
}

/**
 * Create mock jobs for testing
 */
export function createMockJobs(count: number = 5): any[] {
  const jobs = [];
  const sources = ['indeed', 'naukri', 'linkedin'];
  const jobTypes = ['Full-time', 'Part-time', 'Contract'];
  const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA'];

  for (let i = 0; i < count; i++) {
    jobs.push({
      id: `mock-job-${i + 1}`,
      title: `Software Engineer ${i + 1}`,
      company: `Company ${i + 1}`,
      location: locations[i % locations.length],
      salaryMin: 80000 + (i * 10000),
      salaryMax: 120000 + (i * 15000),
      description: `This is a mock job description for job ${i + 1}`,
      requirements: [`${3 + i} years experience`, 'JavaScript', 'React'],
      benefits: ['Health insurance', '401k', 'Remote work'],
      source: sources[i % sources.length],
      externalId: `${sources[i % sources.length]}-${i + 1}`,
      postedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
      easyApply: i % 2 === 0,
      remote: i % 3 === 0,
      jobType: jobTypes[i % jobTypes.length]
    });
  }

  return jobs;
}

/**
 * Create mock scraping results
 */
export function createMockScrapingResult() {
  return {
    success: true,
    totalJobs: 25,
    scrapedJobs: 20,
    failedJobs: 5,
    duration: 1200,
    startTime: new Date(),
    endTime: new Date(Date.now() + 1200000),
    jobs: createMockJobs(20)
  };
}
