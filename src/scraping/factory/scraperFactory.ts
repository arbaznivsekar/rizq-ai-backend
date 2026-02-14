/**
 * Factory for creating and managing job board scrapers
 * @module scraping/factory
 */

import { IndeedScraper, IndeedScraperConfig } from '../scrapers/indeedScraper.js';
import { NaukriScraper } from '../scrapers/naukriScraper.js';
import { BaseScraper } from '../base/baseScraper.js';
import { ScraperConfig, SessionConfig } from '../types/index.js';
import { logger } from '../../config/logger.js';

/**
 * Supported job board types
 */
export enum JobBoardType {
  INDEED = 'indeed',
  LINKEDIN = 'linkedin',
  GLASSDOOR = 'glassdoor',
  NAUKRI = 'naukri',
  NAUKRI_GULF = 'naukri_gulf',
  GULF_TALENT = 'gulf_talent'
}

/**
 * Factory for creating job board scrapers
 */
export class ScraperFactory {
  private static instance: ScraperFactory;
  private scrapers: Map<JobBoardType, BaseScraper> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ScraperFactory {
    if (!ScraperFactory.instance) {
      ScraperFactory.instance = new ScraperFactory();
    }
    return ScraperFactory.instance;
  }

  /**
   * Create a scraper for the specified job board
   */
  public createScraper(
    boardType: JobBoardType,
    config: ScraperConfig,
    session: SessionConfig
  ): BaseScraper {
    // Check if scraper already exists
    if (this.scrapers.has(boardType)) {
      const existingScraper = this.scrapers.get(boardType);
      if (existingScraper) {
        logger.info(`Reusing existing ${boardType} scraper`);
        return existingScraper;
      }
    }

    let scraper: BaseScraper;

    switch (boardType) {
      case JobBoardType.INDEED:
        scraper = this.createIndeedScraper(config, session);
        break;
      
      case JobBoardType.LINKEDIN:
        scraper = this.createLinkedInScraper(config, session);
        break;
      
      case JobBoardType.GLASSDOOR:
        scraper = this.createGlassdoorScraper(config, session);
        break;
      
      case JobBoardType.NAUKRI_GULF:
        scraper = this.createNaukriGulfScraper(config, session);
        break;
      
      case JobBoardType.NAUKRI:
        scraper = this.createNaukriScraper(config, session);
        break;
      
      case JobBoardType.GULF_TALENT:
        scraper = this.createGulfTalentScraper(config, session);
        break;
      
      default:
        throw new Error(`Unsupported job board type: ${boardType}`);
    }

    // Store the scraper for reuse
    this.scrapers.set(boardType, scraper);
    
    logger.info(`Created ${boardType} scraper with config: ${config.name}`);
    return scraper;
  }

  /**
   * Create Indeed scraper with enhanced configuration
   */
  private createIndeedScraper(config: ScraperConfig, session: SessionConfig): IndeedScraper {
    const indeedConfig: IndeedScraperConfig = {
      ...config,
      useAdvancedSearch: true,
      extractCompanyReviews: false,
      extractSalaryData: true,
      followCompanyLinks: false
    };

    return new IndeedScraper(indeedConfig, session);
  }

  private createNaukriScraper(config: ScraperConfig, session: SessionConfig): NaukriScraper {
    return new NaukriScraper(config, session);
  }

  /**
   * Create LinkedIn scraper (placeholder for future implementation)
   */
  private createLinkedInScraper(config: ScraperConfig, session: SessionConfig): BaseScraper {
    // TODO: Implement LinkedIn scraper
    throw new Error('LinkedIn scraper not yet implemented');
  }

  /**
   * Create Glassdoor scraper (placeholder for future implementation)
   */
  private createGlassdoorScraper(config: ScraperConfig, session: SessionConfig): BaseScraper {
    // TODO: Implement Glassdoor scraper
    throw new Error('Glassdoor scraper not yet implemented');
  }

  /**
   * Create Naukri Gulf scraper (placeholder for future implementation)
   */
  private createNaukriGulfScraper(config: ScraperConfig, session: SessionConfig): BaseScraper {
    // TODO: Implement Naukri Gulf scraper
    throw new Error('Naukri Gulf scraper not yet implemented');
  }

  /**
   * Create GulfTalent scraper (placeholder for future implementation)
   */
  private createGulfTalentScraper(config: ScraperConfig, session: SessionConfig): BaseScraper {
    // TODO: Implement GulfTalent scraper
    throw new Error('GulfTalent scraper not yet implemented');
  }

  /**
   * Get default configuration for a job board
   */
  public getDefaultConfig(boardType: JobBoardType): ScraperConfig {
    const baseConfig: ScraperConfig = {
      name: `${boardType}_scraper`,
      baseUrl: this.getBaseUrl(boardType),
      enabled: true,
      priority: 5,
      requestsPerMinute: 30,
      requestsPerHour: 1000,
      delayBetweenRequests: 2000,
      useProxies: true,
      rotateUserAgents: true,
      simulateHumanBehavior: true,
      maxPagesPerSearch: 10,
      maxJobsPerPage: 25,
      followPagination: true,
      extractFullDescription: true,
      extractRequirements: true,
      extractBenefits: true,
      maxRetries: 3,
      retryDelay: 5000,
      circuitBreakerThreshold: 5,
      respectRobotsTxt: true,
      includeAuditTrail: true,
      anonymizeData: true
    };

    // Board-specific customizations
    switch (boardType) {
      case JobBoardType.INDEED:
        return {
          ...baseConfig,
          requestsPerMinute: 20,
          delayBetweenRequests: 3000,
          maxPagesPerSearch: 15
        };
      case JobBoardType.NAUKRI:
        return {
          ...baseConfig,
          requestsPerMinute: 25,
          delayBetweenRequests: 2500,
          maxPagesPerSearch: 10
        };
      
      case JobBoardType.LINKEDIN:
        return {
          ...baseConfig,
          requestsPerMinute: 15,
          delayBetweenRequests: 4000,
          maxPagesPerSearch: 20
        };
      
      case JobBoardType.GLASSDOOR:
        return {
          ...baseConfig,
          requestsPerMinute: 25,
          delayBetweenRequests: 2500,
          maxPagesPerSearch: 12
        };
      
      case JobBoardType.NAUKRI_GULF:
        return {
          ...baseConfig,
          requestsPerMinute: 35,
          delayBetweenRequests: 1500,
          maxPagesPerSearch: 8
        };
      
      case JobBoardType.GULF_TALENT:
        return {
          ...baseConfig,
          requestsPerMinute: 30,
          delayBetweenRequests: 2000,
          maxPagesPerSearch: 10
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Get base URL for a job board
   */
  private getBaseUrl(boardType: JobBoardType): string {
    const urls: Record<JobBoardType, string> = {
      [JobBoardType.INDEED]: 'https://www.indeed.com',
      [JobBoardType.LINKEDIN]: 'https://www.linkedin.com',
      [JobBoardType.GLASSDOOR]: 'https://www.glassdoor.com',
      [JobBoardType.NAUKRI]: 'https://www.naukri.com',
      [JobBoardType.NAUKRI_GULF]: 'https://www.naukrigulf.com',
      [JobBoardType.GULF_TALENT]: 'https://www.gulftalent.com'
    };

    return urls[boardType] || '';
  }

  /**
   * Get default session configuration
   */
  public getDefaultSession(): SessionConfig {
    return {
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      userAgent: this.getRandomUserAgent(),
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      },
      language: 'en-US',
      timezone: 'America/New_York',
      scrollSpeed: 100,
      typingSpeed: 50,
      clickDelay: 200,
      cookies: [],
      localStorage: {},
      sessionStorage: {}
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get a random user agent string
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Clean up all scrapers
   */
  public async cleanupAll(): Promise<void> {
    logger.info('Cleaning up all scrapers...');
    
    for (const [boardType, scraper] of this.scrapers) {
      try {
        await scraper.cleanup();
        logger.info(`Cleaned up ${boardType} scraper`);
      } catch (error) {
        logger.error(`Failed to cleanup ${boardType} scraper: ${error}`);
      }
    }

    this.scrapers.clear();
    logger.info('All scrapers cleaned up');
  }

  /**
   * Get scraper statistics
   */
  public getScraperStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [boardType, scraper] of this.scrapers) {
      stats[boardType] = {
        isActive: !!scraper,
        config: scraper ? scraper.constructor.name : 'N/A'
      };
    }

    return stats;
  }

  /**
   * Check if a scraper is available for a board type
   */
  public isScraperAvailable(boardType: JobBoardType): boolean {
    const availableScrapers = [
      JobBoardType.INDEED,
      JobBoardType.NAUKRI
      // Add other scrapers as they are implemented
    ];

    return availableScrapers.includes(boardType);
  }

  /**
   * Get list of available scrapers
   */
  public getAvailableScrapers(): JobBoardType[] {
    return Object.values(JobBoardType).filter(boardType => 
      this.isScraperAvailable(boardType)
    );
  }
}
