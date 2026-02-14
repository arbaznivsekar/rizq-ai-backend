/**
 * Abstract base class for all job board scrapers
 * @module scraping/base
 */

import { Browser, BrowserContext, Page } from 'playwright';
import { ScrapedJob, ScrapingResult, ScraperConfig, SessionConfig, SearchParams } from '../types/index.js';
import { ScrapingError, AntiBotError, RateLimitError, NetworkError } from '../errors/index.js';
import { logger } from '../../config/logger.js';

/**
 * Abstract base scraper that provides common functionality
 */
export abstract class BaseScraper {
  protected readonly config: ScraperConfig;
  protected readonly session: SessionConfig;
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;

  constructor(config: ScraperConfig, session: SessionConfig) {
    this.config = config;
    this.session = session;
  }

  /**
   * Initialize the browser and create a new context
   */
  protected async initializeBrowser(): Promise<void> {
    try {
      const { chromium } = await import('playwright');
      
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--disable-client-side-phishing-detection',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-experiments',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          '--force-color-profile=srgb',
          '--disable-translate',
          '--disable-logging',
          '--disable-in-process-stack-traces',
          '--disable-histogram-customizer',
          '--disable-gl-extensions',
          '--disable-composited-antialiasing',
          '--disable-canvas-aa',
          '--disable-3d-apis',
          '--disable-accelerated-video-decode',
          '--disable-accelerated-mjpeg-decode',
          '--disable-accelerated-video-encode',
          '--disable-gpu-sandbox',
          '--disable-software-rasterizer',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-checker-imaging',
          '--disable-new-content-rendering-timeout',
          '--disable-partial-raster',
          '--disable-smooth-scrolling',
          '--disable-tiled-backing',
          '--disable-zero-copy',
          '--enable-aggressive-domstorage-flushing',
          '--enable-parallel-downloading',
          '--force-device-scale-factor=1',
          '--high-dpi-support=1',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: this.session.userAgent,
        viewport: this.session.viewport,
        locale: this.session.language,
        timezoneId: this.session.timezone,
        ignoreHTTPSErrors: false,
        extraHTTPHeaders: {
          'Accept-Language': this.session.language,
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        }
      });

      // Set cookies if available
      if (this.session.cookies.length > 0) {
        const playwrightCookies = this.session.cookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires ? cookie.expires.getTime() / 1000 : undefined,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as 'Strict' | 'Lax' | 'None'
        }));
        await this.context.addCookies(playwrightCookies);
      }

      this.page = await this.context.newPage();
      
      // Set up human-like behavior simulation
      if (this.config.simulateHumanBehavior) {
        await this.setupHumanBehavior();
      }

      logger.info(`Browser initialized for ${this.config.name} scraper`);
    } catch (error) {
      throw new NetworkError(`Failed to initialize browser: ${error}`, undefined, { scraper: this.config.name });
    }
  }

  /**
   * Setup human-like behavior simulation
   */
  private async setupHumanBehavior(): Promise<void> {
    if (!this.page) return;

    // Random scroll behavior
    await this.page.addInitScript(() => {
      const originalScrollTo = window.scrollTo;
      (window as any).scrollTo = function(x: number, y: number) {
        // Add slight delay and randomness
        setTimeout(() => {
          originalScrollTo.call(this, x + Math.random() * 2 - 1, y + Math.random() * 2 - 1);
        }, Math.random() * 100);
      };
    });
  }

  /**
   * Navigate to a URL with human-like behavior
   */
  protected async navigateTo(url: string, waitForSelector?: string): Promise<void> {
    if (!this.page) {
      throw new NetworkError('Page not initialized');
    }

    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        await this.page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

      // Simulate human-like page loading behavior
      if (this.config.simulateHumanBehavior) {
        await this.simulatePageLoad();
      }

      logger.debug(`Successfully navigated to ${url}`);
    } catch (error) {
      throw new NetworkError(`Failed to navigate to ${url}: ${error}`, undefined, { url });
    }
  }

  /**
   * Simulate human-like page loading behavior
   */
  private async simulatePageLoad(): Promise<void> {
    if (!this.page) return;

    // Random scroll down
    const scrollHeight = await this.page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await this.page.evaluate(() => window.innerHeight);
    
    for (let i = 0; i < scrollHeight; i += viewportHeight / 2) {
      await this.page.evaluate((y) => window.scrollTo(0, y), i);
      await this.delay(Math.random() * 500 + 200); // 200-700ms delay
    }

    // Random scroll back up
    for (let i = scrollHeight; i > 0; i -= viewportHeight / 2) {
      await this.page.evaluate((y) => window.scrollTo(0, y), i);
      await this.delay(Math.random() * 300 + 100); // 100-400ms delay
    }
  }

  /**
   * Extract text content from an element with error handling
   */
  protected async extractText(selector: string, fallback: string = ''): Promise<string> {
    if (!this.page) return fallback;

    try {
      const element = await this.page.$(selector);
      if (!element) return fallback;

      const text = await element.textContent();
      return text?.trim() || fallback;
    } catch (error) {
      logger.warn(`Failed to extract text from ${selector}: ${error}`);
      return fallback;
    }
  }

  /**
   * Extract multiple text elements
   */
  protected async extractTexts(selector: string): Promise<string[]> {
    if (!this.page) return [];

    try {
      const elements = await this.page.$$(selector);
      const texts: string[] = [];

      for (const element of elements) {
        const text = await element.textContent();
        if (text?.trim()) {
          texts.push(text.trim());
        }
      }

      return texts;
    } catch (error) {
      logger.warn(`Failed to extract texts from ${selector}: ${error}`);
      return [];
    }
  }

  /**
   * Extract attribute value from an element
   */
  protected async extractAttribute(selector: string, attribute: string, fallback: string = ''): Promise<string> {
    if (!this.page) return fallback;

    try {
      const element = await this.page.$(selector);
      if (!element) return fallback;

      const value = await element.getAttribute(attribute);
      return value || fallback;
    } catch (error) {
      logger.warn(`Failed to extract attribute ${attribute} from ${selector}: ${error}`);
      return fallback;
    }
  }

  /**
   * Check if page contains anti-bot measures
   */
  protected async detectAntiBotMeasures(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Check for common anti-bot indicators
      const indicators = [
        'captcha',
        'robot',
        'bot',
        'blocked',
        'suspicious',
        'unusual',
        'verify',
        'challenge'
      ];

      const pageText = await this.page.textContent('body') || '';
      const lowerText = pageText.toLowerCase();

      for (const indicator of indicators) {
        if (lowerText.includes(indicator)) {
          logger.warn(`Anti-bot indicator detected: ${indicator}`);
          return true;
        }
      }

      // Check for CAPTCHA elements
      const captchaSelectors = [
        '[class*="captcha"]',
        '[id*="captcha"]',
        'iframe[src*="captcha"]',
        '.g-recaptcha',
        '.h-captcha'
      ];

      for (const selector of captchaSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          logger.warn(`CAPTCHA element detected: ${selector}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.warn(`Failed to detect anti-bot measures: ${error}`);
      return false;
    }
  }

  /**
   * Handle anti-bot measures
   */
  protected async handleAntiBotMeasures(): Promise<void> {
    if (await this.detectAntiBotMeasures()) {
      throw new AntiBotError('Anti-bot measures detected', {
        url: this.page?.url(),
        scraper: this.config.name
      });
    }
  }

  /**
   * Check rate limiting
   */
  protected async checkRateLimiting(): Promise<void> {
    if (!this.page) return;

    try {
      const status = await this.page.evaluate(() => {
        // Check for rate limit indicators in response
        const rateLimitHeaders = [
          'x-ratelimit-remaining',
          'x-ratelimit-reset',
          'retry-after'
        ];

        // This would need to be implemented with actual response headers
        return { hasRateLimit: false };
      });

      if (status.hasRateLimit) {
        throw new RateLimitError('Rate limit detected', undefined, {
          url: this.page.url(),
          scraper: this.config.name
        });
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      logger.warn(`Failed to check rate limiting: ${error}`);
    }
  }

  /**
   * Respect rate limiting by adding delays
   */
  protected async respectRateLimiting(): Promise<void> {
    const delay = this.config.delayBetweenRequests + Math.random() * 1000;
    await this.delay(delay);
  }

  /**
   * Utility method for adding delays
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      logger.info(`Cleanup completed for ${this.config.name} scraper`);
    } catch (error) {
      logger.error(`Error during cleanup: ${error}`);
    }
  }

  /**
   * Abstract method that must be implemented by subclasses
   * Scrape jobs based on search parameters
   */
  public abstract scrapeJobs(searchParams: SearchParams): Promise<ScrapingResult>;

  /**
   * Abstract method that must be implemented by subclasses
   * Scrape individual job details
   */
  public abstract scrapeJobDetails(jobUrl: string): Promise<ScrapedJob | null>;

  /**
   * Abstract method that must be implemented by subclasses
   * Get the base URL for the job board
   */
  protected abstract getBaseUrl(): string;

  /**
   * Abstract method that must be implemented by subclasses
   * Build search URL from parameters
   */
  protected abstract buildSearchUrl(searchParams: SearchParams): string;

  /**
   * Abstract method that must be implemented by subclasses
   * Parse job listing page
   */
  protected abstract parseJobListings(): Promise<Partial<ScrapedJob>[]>;

  /**
   * Abstract method that must be implemented by subclasses
   * Parse individual job page
   */
  protected abstract parseJobPage(): Promise<Partial<ScrapedJob>>;
}
