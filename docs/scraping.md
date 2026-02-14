# RIZQ.AI Enterprise Scraping System

## Overview

The RIZQ.AI Enterprise Scraping System is a production-ready, enterprise-grade web scraping solution designed to extract job postings from major job boards including Indeed, LinkedIn, Glassdoor, Naukri Gulf, and GulfTalent. The system features advanced anti-bot detection, human-like behavior simulation, proxy rotation, and comprehensive compliance features.

## Architecture

### Core Components

1. **Base Scraper** (`src/scraping/base/baseScraper.ts`)
   - Abstract class providing common functionality
   - Browser management with Playwright
   - Anti-bot detection and handling
   - Human-like behavior simulation
   - Rate limiting and compliance

2. **Job Board Scrapers** (`src/scraping/scrapers/`)
   - Indeed scraper (fully implemented)
   - LinkedIn scraper (placeholder)
   - Glassdoor scraper (placeholder)
   - Naukri Gulf scraper (placeholder)
   - GulfTalent scraper (placeholder)

3. **Scraper Factory** (`src/scraping/factory/scraperFactory.ts`)
   - Singleton factory for scraper instantiation
   - Configuration management
   - Session management
   - Resource cleanup

4. **Scraping Service** (`src/scraping/services/scrapingService.ts`)
   - Main orchestration service
   - Job queue management
   - Continuous scraping
   - Result caching and storage

5. **API Controllers** (`src/controllers/scraping.controller.ts`)
   - HTTP endpoint management
   - Request validation
   - Response formatting
   - Error handling

## Features

### Anti-Bot Measures
- **User Agent Rotation**: Random selection from realistic browser user agents
- **Human Behavior Simulation**: Random scrolling, typing delays, mouse movements
- **Session Persistence**: Cookie and local storage management
- **Rate Limiting**: Configurable delays between requests
- **Proxy Support**: Infrastructure for proxy rotation (to be implemented)

### Compliance & Legal
- **GDPR/CCPA Ready**: Data anonymization and encryption
- **Robots.txt Respect**: Automatic compliance checking
- **Terms of Service Monitoring**: Built-in ToS violation detection
- **Audit Trail**: Comprehensive logging of all scraping activities
- **Rate Limiting**: Respectful crawling practices

### Data Extraction
- **Job Details**: Title, company, location, description
- **Requirements**: Skills, experience levels, qualifications
- **Benefits**: Compensation, perks, company culture
- **Metadata**: Posted dates, application counts, job types
- **Quality Assessment**: Confidence scoring for extracted data

### Performance & Scalability
- **Asynchronous Processing**: Non-blocking job execution
- **Redis Caching**: Result caching and job queuing
- **MongoDB Integration**: Structured data storage
- **Worker Pools**: Parallel processing capabilities
- **Circuit Breakers**: Fault tolerance and recovery

## Installation & Setup

### Prerequisites

1. **Node.js 18+** with npm or pnpm
2. **MongoDB** running and accessible
3. **Redis** running and accessible
4. **Playwright** browsers installed

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd rizq-ai-backend
   npm install
   # or
   pnpm install
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install
   # or
   pnpm exec playwright install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```

   Update `.env` with:
   ```env
   # Existing configuration...
   
   # Scraping Configuration
   SCRAPING_ENABLED=true
   SCRAPING_MAX_CONCURRENT_JOBS=5
   SCRAPING_DEFAULT_DELAY=2000
   SCRAPING_RATE_LIMIT_PER_MINUTE=30
   
   # Proxy Configuration (Optional)
   PROXY_ENABLED=false
   PROXY_LIST_URL=
   PROXY_USERNAME=
   PROXY_PASSWORD=
   
   # CAPTCHA Solving (Optional)
   CAPTCHA_SERVICE_ENABLED=false
   CAPTCHA_SERVICE_API_KEY=
   CAPTCHA_SERVICE_TIMEOUT=30000
   ```

4. **Database Setup**
   ```bash
   # Ensure MongoDB is running
   docker-compose up -d mongo redis
   
   # Or start manually
   mongod --dbpath /path/to/data
   redis-server
   ```

5. **Start the Application**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## Usage

### Basic Scraping Job

```typescript
import { ScrapingService } from './src/scraping/services/scrapingService.js';
import { JobBoardType } from './src/scraping/factory/scraperFactory.js';

const scrapingService = ScrapingService.getInstance();

// Start a scraping job
const jobId = await scrapingService.startScrapingJob(
  JobBoardType.INDEED,
  {
    query: 'software engineer',
    location: 'remote',
    jobType: ['Full-time', 'Remote'],
    level: ['Mid', 'Senior'],
    salaryMin: 80000,
    salaryMax: 150000
  },
  {
    maxPagesPerSearch: 5,
    extractFullDescription: true,
    delayBetweenRequests: 3000
  }
);

console.log(`Started scraping job: ${jobId}`);
```

### Continuous Scraping

```typescript
// Start continuous scraping
await scrapingService.startContinuousScraping(
  [JobBoardType.INDEED, JobBoardType.LINKEDIN],
  [
    'software engineer',
    'data scientist',
    'product manager',
    'devops engineer'
  ],
  60 // Run every 60 minutes
);

// Stop continuous scraping
scrapingService.stopContinuousScraping();
```

### API Endpoints

#### Start Scraping Job
```http
POST /api/v1/scraping/jobs
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "boardType": "indeed",
  "searchParams": {
    "query": "software engineer",
    "location": "remote",
    "jobType": ["Full-time", "Remote"],
    "level": ["Mid", "Senior"],
    "salaryMin": 80000,
    "salaryMax": 150000
  },
  "config": {
    "maxPagesPerSearch": 5,
    "extractFullDescription": true,
    "delayBetweenRequests": 3000
  }
}
```

#### Get Job Status
```http
GET /api/v1/scraping/jobs/{jobId}
Authorization: Bearer <admin-token>
```

#### Get Statistics
```http
GET /api/v1/scraping/stats
Authorization: Bearer <admin-token>
```

#### Start Continuous Scraping
```http
POST /api/v1/scraping/continuous/start
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "boardTypes": ["indeed"],
  "searchQueries": [
    "software engineer",
    "data scientist"
  ],
  "intervalMinutes": 60
}
```

## Configuration

### Scraper Configuration

```typescript
interface ScraperConfig {
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
```

### Search Parameters

```typescript
interface SearchParams {
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
```

## Monitoring & Observability

### Health Checks

```http
GET /api/v1/scraping/health
```

Returns:
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "stats": {
      "totalJobs": 5,
      "completedJobs": 3,
      "failedJobs": 1,
      "runningJobs": 1,
      "successRate": 60
    },
    "redis": "healthy",
    "isRunning": true
  }
}
```

### Statistics

```http
GET /api/v1/scraping/stats
```

Returns comprehensive statistics including:
- Job counts and success rates
- Scraper performance metrics
- Available scrapers
- System health indicators

### Logging

The system uses Winston for structured logging with the following levels:
- **INFO**: General operational information
- **WARN**: Non-critical issues
- **ERROR**: Critical failures
- **DEBUG**: Detailed debugging information

## Troubleshooting

### Common Issues

1. **Playwright Installation Issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall Playwright
   npm install playwright
   npx playwright install
   ```

2. **Browser Launch Failures**
   - Ensure sufficient system resources
   - Check for conflicting antivirus software
   - Verify Docker container permissions (if running in container)

3. **Rate Limiting Issues**
   - Increase `delayBetweenRequests` in configuration
   - Reduce `maxPagesPerSearch`
   - Implement proxy rotation

4. **Anti-Bot Detection**
   - Enable `simulateHumanBehavior`
   - Increase delays between requests
   - Rotate user agents
   - Use residential proxies

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=scraping:* npm run dev
```

### Performance Tuning

1. **Concurrent Jobs**: Adjust `SCRAPING_MAX_CONCURRENT_JOBS`
2. **Rate Limiting**: Fine-tune delays based on target site
3. **Memory Management**: Monitor browser instance cleanup
4. **Database Optimization**: Index frequently queried fields

## Security Considerations

### Data Protection
- All personal data is automatically anonymized
- Sensitive information is encrypted at rest
- Audit trails track all data access

### Access Control
- All endpoints require admin authentication
- JWT tokens with proper expiration
- Role-based access control

### Compliance
- GDPR/CCPA compliant by design
- Automatic data retention policies
- Right to be forgotten implementation

## Future Enhancements

### Planned Features
1. **Proxy Management**: Residential proxy rotation
2. **CAPTCHA Solving**: ML-powered CAPTCHA resolution
3. **Advanced Analytics**: Real-time performance monitoring
4. **Machine Learning**: Intelligent job matching
5. **API Integrations**: Direct job board APIs
6. **Mobile Scraping**: Mobile-optimized scrapers

### Extensibility
The system is designed for easy extension:
- Add new job boards by implementing `BaseScraper`
- Customize anti-bot strategies
- Implement custom data processors
- Add new compliance features

## Support & Contributing

### Getting Help
1. Check the troubleshooting section
2. Review the logs for error details
3. Check system resource usage
4. Verify configuration settings

### Contributing
1. Follow the `.cursorrules` guidelines
2. Add comprehensive tests
3. Update documentation
4. Follow TypeScript best practices

### Testing
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## License

This project is proprietary software. All rights reserved.

---

For additional support or questions, please refer to the project documentation or contact the development team.
