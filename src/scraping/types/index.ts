/**
 * Core types and interfaces for the enterprise scraping system
 * @module scraping/types
 */

import { Types } from 'mongoose';

/**
 * Job posting data structure extracted from various job boards
 */
export interface ScrapedJob {
  // Core identification
  source: string;                    // Job board source (indeed, linkedin, etc.)
  externalId: string;                // Original job ID from source
  url: string;                       // Direct link to job posting
  
  // Job details
  title: string;                     // Job title
  company: string;                   // Company name
  location: string;                  // Job location
  jobType: JobType;                  // Employment type
  level: JobLevel;                   // Experience level
  
  // Compensation
  salaryMin?: number;                // Minimum salary
  salaryMax?: number;                // Maximum salary
  salaryCurrency?: string;           // Currency code
  salaryPeriod?: SalaryPeriod;       // Annual, hourly, etc.
  
  // Content
  description: string;                // Full job description
  requirements: string[];             // Required skills/experience
  benefits: string[];                 // Benefits offered
  responsibilities: string[];         // Job responsibilities
  
  // Metadata
  postedAt: Date;                    // When job was posted
  deadline?: Date;                    // Application deadline
  applicationCount?: number;          // Number of applicants
  
  // Company insights
  companyIndustry?: string;           // Industry sector
  companySize?: string;               // Company size
  companyType?: string;               // Public, private, startup
  
  // Application details
  easyApply?: boolean;                // One-click apply available
  referralBonus?: boolean;            // Employee referral program
  
  // Scraping metadata
  scrapedAt: Date;                   // When data was scraped
  scraperVersion: string;             // Scraper version used
  dataQuality: DataQuality;           // Confidence in data quality
  
  // Compliance
  anonymized: boolean;                // Personal data removed
  encrypted: boolean;                 // Sensitive data encrypted
}

/**
 * Job type enumeration
 */
export enum JobType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
  TEMPORARY = 'Temporary',
  INTERNSHIP = 'Internship',
  FREELANCE = 'Freelance',
  REMOTE = 'Remote',
  HYBRID = 'Hybrid',
  ON_SITE = 'On-site'
}

/**
 * Experience level enumeration
 */
export enum JobLevel {
  ENTRY = 'Entry',
  JUNIOR = 'Junior',
  MID = 'Mid',
  SENIOR = 'Senior',
  LEAD = 'Lead',
  MANAGER = 'Manager',
  DIRECTOR = 'Director',
  EXECUTIVE = 'Executive'
}

/**
 * Salary period enumeration
 */
export enum SalaryPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

/**
 * Data quality assessment
 */
export enum DataQuality {
  EXCELLENT = 'excellent',    // 95%+ confidence
  GOOD = 'good',             // 80-94% confidence
  FAIR = 'fair',             // 60-79% confidence
  POOR = 'poor',             // <60% confidence
  UNKNOWN = 'unknown'        // Cannot assess
}

/**
 * Scraping configuration for a job board
 */
export interface ScraperConfig {
  name: string;                       // Scraper name
  baseUrl: string;                    // Base URL for the job board
  enabled: boolean;                   // Whether scraper is active
  priority: number;                   // Priority (1-10, higher = more important)
  
  // Rate limiting
  requestsPerMinute: number;          // Max requests per minute
  requestsPerHour: number;            // Max requests per hour
  delayBetweenRequests: number;       // Delay between requests (ms)
  
  // Anti-bot settings
  useProxies: boolean;                // Whether to use proxy rotation
  rotateUserAgents: boolean;          // Whether to rotate user agents
  simulateHumanBehavior: boolean;     // Whether to simulate human behavior
  
  // Scraping depth
  maxPagesPerSearch: number;          // Max pages to scrape per search
  maxJobsPerPage: number;             // Max jobs to extract per page
  followPagination: boolean;          // Whether to follow pagination
  
  // Data extraction
  extractFullDescription: boolean;    // Whether to extract full descriptions
  extractRequirements: boolean;        // Whether to extract requirements
  extractBenefits: boolean;           // Whether to extract benefits
  
  // Error handling
  maxRetries: number;                 // Max retry attempts
  retryDelay: number;                 // Delay between retries (ms)
  circuitBreakerThreshold: number;    // Circuit breaker failure threshold
  
  // Compliance
  respectRobotsTxt: boolean;          // Whether to respect robots.txt
  includeAuditTrail: boolean;         // Whether to include audit trail
  anonymizeData: boolean;             // Whether to anonymize data
}

/**
 * Proxy configuration for anti-bot measures
 */
export interface ProxyConfig {
  host: string;                       // Proxy host
  port: number;                       // Proxy port
  username?: string;                  // Proxy username
  password?: string;                  // Proxy password
  type: ProxyType;                    // Proxy type
  country?: string;                    // Proxy country
  city?: string;                      // Proxy city
  isp?: string;                       // Internet service provider
  lastUsed?: Date;                    // When proxy was last used
  successRate: number;                // Success rate (0-1)
  responseTime: number;               // Average response time (ms)
  isHealthy: boolean;                 // Whether proxy is healthy
}

/**
 * Proxy type enumeration
 */
export enum ProxyType {
  HTTP = 'http',
  HTTPS = 'https',
  SOCKS4 = 'socks4',
  SOCKS5 = 'socks5',
  RESIDENTIAL = 'residential',
  DATACENTER = 'datacenter'
}

/**
 * CAPTCHA solving configuration
 */
export interface CaptchaConfig {
  enabled: boolean;                   // Whether CAPTCHA solving is enabled
  service: CaptchaService;            // CAPTCHA solving service
  apiKey: string;                     // API key for the service
  timeout: number;                    // Timeout for solving (ms)
  maxRetries: number;                 // Max retry attempts
  costPerSolve: number;               // Cost per CAPTCHA solve
}

/**
 * CAPTCHA service enumeration
 */
export enum CaptchaService {
  TWO_CAPTCHA = '2captcha',
  ANTI_CAPTCHA = 'anticaptcha',
  CAPTCHA_SOLVER = 'captchasolver',
  CAPTCHA_AI = 'captchaai',
  CUSTOM_ML = 'custom_ml'
}

/**
 * Scraping session configuration
 */
export interface SessionConfig {
  sessionId: string;                  // Unique session identifier
  startTime: Date;                    // Session start time
  endTime?: Date;                     // Session end time
  
  // Browser configuration
  userAgent: string;                  // User agent string
  viewport: Viewport;                 // Browser viewport
  language: string;                   // Browser language
  timezone: string;                   // Browser timezone
  
  // Behavior simulation
  scrollSpeed: number;                // Scroll speed (pixels/ms)
  typingSpeed: number;                // Typing speed (ms/character)
  clickDelay: number;                 // Delay between clicks (ms)
  
  // Session persistence
  cookies: Cookie[];                  // Session cookies
  localStorage: Record<string, string>; // Local storage data
  sessionStorage: Record<string, string>; // Session storage data
}

/**
 * Viewport configuration
 */
export interface Viewport {
  width: number;                      // Viewport width
  height: number;                     // Viewport height
  deviceScaleFactor: number;          // Device pixel ratio
  isMobile: boolean;                  // Whether mobile device
  hasTouch: boolean;                  // Whether touch enabled
}

/**
 * Cookie structure
 */
export interface Cookie {
  name: string;                       // Cookie name
  value: string;                      // Cookie value
  domain: string;                     // Cookie domain
  path: string;                       // Cookie path
  expires?: Date;                     // Expiration date
  httpOnly: boolean;                  // HTTP only flag
  secure: boolean;                    // Secure flag
  sameSite: string;                   // Same site policy
}

/**
 * Scraping result with metadata
 */
export interface ScrapingResult {
  success: boolean;                   // Whether scraping was successful
  jobs: ScrapedJob[];                // Extracted jobs
  totalJobs: number;                  // Total jobs found
  scrapedJobs: number;                // Number of jobs successfully scraped
  failedJobs: number;                 // Number of jobs that failed to scrape
  
  // Performance metrics
  startTime: Date;                    // Scraping start time
  endTime: Date;                      // Scraping end time
  duration: number;                   // Total duration (ms)
  averageTimePerJob: number;          // Average time per job (ms)
  
  // Error tracking
  errors: ScrapingError[];            // Errors encountered
  warnings: ScrapingWarning[];        // Warnings encountered
  
  // Compliance
  robotsTxtRespected: boolean;        // Whether robots.txt was respected
  rateLimitRespected: boolean;        // Whether rate limits were respected
  termsOfServiceRespected: boolean;   // Whether ToS were respected
}

/**
 * Scraping error structure
 */
export interface ScrapingError {
  code: string;                       // Error code
  message: string;                    // Error message
  details?: any;                      // Additional error details
  timestamp: Date;                    // When error occurred
  jobId?: string;                     // Associated job ID if applicable
  severity: ErrorSeverity;            // Error severity level
  retryable: boolean;                 // Whether error is retryable
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',                        // Minor issue, can continue
  MEDIUM = 'medium',                  // Moderate issue, may affect quality
  HIGH = 'high',                      // Significant issue, may affect success
  CRITICAL = 'critical'               // Critical issue, cannot continue
}

/**
 * Scraping warning structure
 */
export interface ScrapingWarning {
  code: string;                       // Warning code
  message: string;                    // Warning message
  details?: any;                      // Additional warning details
  timestamp: Date;                    // When warning occurred
  jobId?: string;                     // Associated job ID if applicable
  severity: WarningSeverity;          // Warning severity level
}

/**
 * Warning severity levels
 */
export enum WarningSeverity {
  INFO = 'info',                      // Informational warning
  MINOR = 'minor',                    // Minor issue
  MODERATE = 'moderate',              // Moderate issue
  MAJOR = 'major'                     // Major issue
}

/**
 * Audit trail entry for compliance
 */
export interface AuditEntry {
  id: string;                         // Unique audit entry ID
  timestamp: Date;                    // When action occurred
  action: string;                     // Action performed
  userId?: string;                    // User who performed action
  sessionId?: string;                 // Session identifier
  scraperId?: string;                 // Scraper identifier
  
  // Request details
  url: string;                        // URL accessed
  method: string;                     // HTTP method used
  headers: Record<string, string>;    // Request headers
  userAgent: string;                  // User agent used
  
  // Response details
  statusCode: number;                 // HTTP status code
  responseSize: number;               // Response size in bytes
  responseTime: number;               // Response time in ms
  
  // Compliance
  robotsTxtRespected: boolean;        // Whether robots.txt was respected
  rateLimitRespected: boolean;        // Whether rate limits were respected
  termsOfServiceRespected: boolean;   // Whether ToS were respected
  
  // Data handling
  dataAnonymized: boolean;            // Whether data was anonymized
  dataEncrypted: boolean;             // Whether data was encrypted
  personalDataRemoved: boolean;       // Whether personal data was removed
  
  // Metadata
  ipAddress?: string;                 // IP address used (anonymized)
  proxyUsed?: string;                 // Proxy used (anonymized)
  location?: string;                  // Geographic location
  createdAt: Date;                    // When audit entry was created
}

/**
 * Scraping job for queue processing
 */
export interface ScrapingJob {
  id: string;                         // Unique job ID
  type: ScrapingJobType;              // Job type
  priority: number;                   // Job priority (1-10)
  status: ScrapingJobStatus;          // Job status
  
  // Configuration
  config: ScraperConfig;              // Scraper configuration
  searchParams: SearchParams;          // Search parameters
  
  // Execution
  createdAt: Date;                    // When job was created
  startedAt?: Date;                   // When job started
  completedAt?: Date;                 // When job completed
  lastAttemptAt?: Date;               // When job was last attempted
  
  // Results
  result?: ScrapingResult;            // Scraping result
  error?: ScrapingError;              // Error if failed
  
  // Retry logic
  attempts: number;                   // Number of attempts made
  maxAttempts: number;                // Maximum attempts allowed
  nextRetryAt?: Date;                 // When to retry next
  
  // Metadata
  tags: string[];                     // Job tags for categorization
  metadata: Record<string, any>;      // Additional metadata
}

/**
 * Scraping job types
 */
export enum ScrapingJobType {
  SEARCH_SCRAPE = 'search_scrape',    // Scrape search results
  JOB_DETAIL = 'job_detail',          // Scrape individual job details
  COMPANY_SCRAPE = 'company_scrape',  // Scrape company information
  BULK_SCRAPE = 'bulk_scrape',        // Bulk scraping operation
  MONITORING = 'monitoring',          // Continuous monitoring
  COMPLIANCE_CHECK = 'compliance_check' // Compliance verification
}

/**
 * Scraping job status
 */
export enum ScrapingJobStatus {
  PENDING = 'pending',                // Job is waiting to be processed
  RUNNING = 'running',                // Job is currently running
  COMPLETED = 'completed',            // Job completed successfully
  FAILED = 'failed',                  // Job failed
  RETRYING = 'retrying',              // Job is being retried
  CANCELLED = 'cancelled',            // Job was cancelled
  TIMEOUT = 'timeout'                 // Job timed out
}

/**
 * Search parameters for job scraping
 */
export interface SearchParams {
  query: string;                      // Search query
  location?: string;                  // Location filter
  radius?: number;                    // Search radius in miles/km
  
  // Job filters
  jobType?: JobType[];                // Job type filters
  level?: JobLevel[];                 // Experience level filters
  salaryMin?: number;                 // Minimum salary
  salaryMax?: number;                 // Maximum salary
  
  // Company filters
  companySize?: string[];             // Company size filters
  industry?: string[];                // Industry filters
  
  // Date filters
  postedWithin?: number;              // Posted within X days
  
  // Pagination
  page?: number;                      // Page number
  limit?: number;                     // Results per page
  
  // Advanced filters
  remote?: boolean;                   // Remote work filter
  easyApply?: boolean;                // Easy apply filter
  veteran?: boolean;                  // Veteran friendly filter
  disability?: boolean;               // Disability friendly filter
  
  // Custom filters
  customFilters: Record<string, any>; // Custom filters for specific boards
}

/**
 * Scraping metrics for monitoring
 */
export interface ScrapingMetrics {
  // Performance metrics
  totalJobsScraped: number;           // Total jobs scraped
  totalJobsFailed: number;            // Total jobs that failed
  successRate: number;                // Success rate (0-1)
  averageResponseTime: number;        // Average response time (ms)
  throughput: number;                 // Jobs per minute
  
  // Resource usage
  memoryUsage: number;                // Memory usage in MB
  cpuUsage: number;                   // CPU usage percentage
  networkUsage: number;               // Network usage in MB
  
  // Error rates
  errorRate: number;                  // Error rate (0-1)
  retryRate: number;                  // Retry rate (0-1)
  timeoutRate: number;                // Timeout rate (0-1)
  
  // Compliance metrics
  robotsTxtViolations: number;        // Number of robots.txt violations
  rateLimitViolations: number;        // Number of rate limit violations
  termsOfServiceViolations: number;   // Number of ToS violations
  
  // Proxy metrics
  proxySuccessRate: number;           // Proxy success rate (0-1)
  proxyRotationCount: number;         // Number of proxy rotations
  proxyHealthScore: number;           // Overall proxy health (0-1)
  
  // Timestamp
  timestamp: Date;                    // When metrics were collected
}
