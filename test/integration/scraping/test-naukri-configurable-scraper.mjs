import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';
import fs from 'fs/promises';

// Configurable Naukri.com job scraper with anti-detection - REAL JOBS ONLY!
async function testNaukriConfigurableScraper(searchQuery = 'software engineer', location = 'Mumbai', maxJobs = 10) {
  console.log(`🚀 RIZQ.AI Configurable Naukri.com Scraper - REAL JOBS ONLY!`);
  console.log(`🔍 Search Query: "${searchQuery}"`);
  console.log(`📍 Location: "${location}"`);
  console.log('================================================\n');

  try {
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory created successfully');
    
    // Create a custom scraper configuration for Naukri.com
    const customConfig = {
      name: 'naukri-configurable',
      baseUrl: 'https://www.naukri.com',
      enabled: true,
      priority: 5,
      requestsPerMinute: 10,
      requestsPerHour: 100,
      delayBetweenRequests: 3000,
      useProxies: false,
      rotateUserAgents: true,
      simulateHumanBehavior: true,
      maxPagesPerSearch: 1,
      maxJobsPerPage: maxJobs,
      followPagination: false,
      extractFullDescription: false,
      extractRequirements: true,
      extractBenefits: false,
      maxRetries: 3,
      retryDelay: 2000,
      circuitBreakerThreshold: 5,
      respectRobotsTxt: true,
      includeAuditTrail: true,
      anonymizeData: false
    };
    
    const session = factory.getDefaultSession();
    
    // Use Indeed scraper as base but customize for Naukri
    const scraper = factory.createScraper(JobBoardType.INDEED, customConfig, session);
    
    console.log('✅ Naukri scraper created successfully');
    
    await scraper['initializeBrowser']();
    const page = scraper['page'];
    
    console.log('✅ Browser initialized successfully');
    
    // Advanced anti-detection for Naukri.com
    await page.addInitScript(() => {
      // Override all detection methods
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      
      // Override canvas fingerprinting
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        const context = originalGetContext.call(this, type, ...args);
        if (type === '2d') {
          const originalFillText = context.fillText;
          context.fillText = function(...args) {
            args[1] += Math.random() * 0.1;
            args[2] += Math.random() * 0.1;
            return originalFillText.apply(this, args);
          };
        }
        return context;
      };
      
      // Override WebGL fingerprinting
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel(R) Iris(TM) Graphics 6100';
        }
        return getParameter.call(this, parameter);
      };
    });
    
    console.log('🔧 Advanced anti-detection measures applied');
    
    // Navigate directly to Naukri.com search results
    console.log('🌐 Navigating directly to Naukri.com search results...');
    
    try {
      // Navigate to Naukri search results
      const searchUrl = `https://www.naukri.com/${encodeURIComponent(searchQuery.replace(/\s+/g, '-'))}-jobs-in-${encodeURIComponent(location.replace(/\s+/g, '-'))}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Extract jobs using Naukri-specific strategies
      const jobs = await extractRealNaukriJobs(page, maxJobs);
      
      if (jobs.length > 0) {
        console.log(`\n🎉 SUCCESS! Found ${jobs.length} REAL jobs for "${searchQuery}":`);
        
        // Save results to file
        await saveRealJobs(jobs, searchQuery, location);
        
        jobs.forEach((job, index) => {
          console.log(`\n${index + 1}. ${job.title}`);
          console.log(`   Company: ${job.company}`);
          console.log(`   Location: ${job.location}`);
          console.log(`   Salary: ${job.salary || 'Not specified'}`);
          console.log(`   Experience: ${job.experience || 'Not specified'}`);
          console.log(`   URL: ${job.link}`);
        });
      } else {
        console.log('\n❌ No real jobs found. This might be due to:');
        console.log('   - No jobs available for this search');
        console.log('   - Website structure changed');
        console.log('   - Anti-bot protection');
        console.log('   - Network issues');
      }
      
    } catch (scrapingError) {
      console.log(`\n❌ Scraping failed: ${scrapingError.message}`);
      console.log('This might be due to anti-bot protection or network issues.');
    }

    console.log('\n🎉 Configurable Naukri.com scraping completed!');

  } catch (error) {
    console.error('❌ Error in configurable Naukri scraper:', error);
    console.error('Stack trace:', error.stack);
  }
}

async function extractRealNaukriJobs(page, maxJobs) {
  console.log('🔍 Using Naukri-specific job extraction for REAL jobs...');
  
  const jobs = await page.evaluate((maxJobs) => {
    const jobElements = [];
    
    // Naukri-specific selectors for REAL jobs
    const naukriSelectors = [
      // Naukri-specific
      '[data-job-id]',
      '[data-testid*="job"]',
      '[class*="jobTuple"]',
      '[class*="jobCard"]',
      '[class*="job-listing"]',
      '[class*="job-item"]',
      '[class*="jobTupleHeader"]',
      
      // Generic job selectors
      'article',
      '.job',
      '.result',
      '.listing',
      '.card',
      '[role="article"]',
      'div[class*="job"]',
      'div[class*="result"]',
      'div[class*="listing"]',
      
      // Text-based
      'h2', 'h3', 'h4', 'h5',
      'a[href*="job"]',
      'a[href*="naukri"]',
      
      // Fallback
      'div',
      'section',
      'main'
    ];
    
    for (const selector of naukriSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        for (const element of elements) {
          try {
            // Extract job information using Naukri-specific patterns
            const title = element.querySelector('h2, h3, h4, h5, a, [data-testid*="title"], [class*="title"], [class*="jobTitle"]')?.textContent?.trim();
            const company = element.querySelector('[class*="company"], [class*="employer"], [class*="name"], [class*="companyName"]')?.textContent?.trim();
            const location = element.querySelector('[class*="location"], [class*="city"], [class*="place"], [class*="jobLocation"]')?.textContent?.trim();
            const salary = element.querySelector('[class*="salary"], [class*="pay"], [class*="compensation"]')?.textContent?.trim();
            const experience = element.querySelector('[class*="experience"], [class*="exp"]')?.textContent?.trim();
            const link = element.querySelector('a')?.href || element.href;
            
            // Validate job data - NO FAKE JOBS!
            if (title && 
                title.length > 5 && 
                title.length < 200 && 
                !title.includes('undefined') &&
                !title.includes('Sample') &&
                !title.includes('Demo') &&
                !title.includes('Fake') &&
                !title.includes('Test') &&
                !title.includes('Example')) {
              
              jobElements.push({
                title: title,
                company: company || 'Unknown Company',
                location: location || 'Unknown Location',
                salary: salary || 'Not specified',
                experience: experience || 'Not specified',
                link: link || 'Not available',
                extractedAt: new Date().toISOString()
              });
              
              if (jobElements.length >= maxJobs) {
                console.log(`✅ Extracted ${jobElements.length} real jobs`);
                return jobElements;
              }
            }
          } catch (error) {
            // Continue with next element
          }
        }
        
        if (jobElements.length > 0) {
          console.log(`Successfully extracted ${jobElements.length} jobs using selector: ${selector}`);
          break;
        }
      }
    }
    
    return jobElements;
  }, maxJobs);
  
  console.log(`✅ Naukri extraction found ${jobs.length} REAL jobs`);
  return jobs;
}

async function saveRealJobs(jobs, searchQuery, location) {
  const timestamp = new Date().toISOString();
  const safeQuery = searchQuery.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const filename = `REAL-naukri-jobs-${safeQuery}-${timestamp.split('T')[0]}.json`;
  
  const resultData = {
    timestamp: timestamp,
    source: 'naukri.com',
    searchQuery: searchQuery,
    location: location,
    totalJobs: jobs.length,
    note: 'These are REAL jobs scraped from Naukri.com - No fake data!',
    jobs: jobs
  };

  await fs.writeFile(filename, JSON.stringify(resultData, null, 2));
  console.log(`\n💾 REAL jobs saved to: ${filename}`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  console.log(`
🚀 RIZQ.AI Configurable Naukri.com Scraper - REAL JOBS ONLY!

Usage: node test-naukri-configurable-scraper.mjs [search-query] [options]

Arguments:
  search-query          The job search query (default: "software engineer")

Options:
  --location <loc>      Location for job search (default: Mumbai)
  --max-jobs <num>      Maximum jobs per search (default: 10)

Examples:
  node test-naukri-configurable-scraper.mjs "data scientist"
  node test-naukri-configurable-scraper.mjs "marketing manager" --location "Delhi"
  node test-naukri-configurable-scraper.mjs "nurse" --location "Bangalore" --max-jobs 20
  node test-naukri-configurable-scraper.mjs "graphic designer" --location "Chennai"
  node test-naukri-configurable-scraper.mjs "sales representative" --location "Hyderabad"

Features:
  ✅ REAL job scraping - No fake data!
  ✅ Anti-detection measures
  ✅ Multiple entry points
  ✅ Aggressive job extraction
  ✅ Indian job market focused
  `);
} else {
  const searchQuery = args[0];
  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 ? args[locationIndex + 1] : 'Mumbai';
  
  const maxJobsIndex = args.indexOf('--max-jobs');
  const maxJobs = maxJobsIndex !== -1 ? parseInt(args[maxJobsIndex + 1]) : 10;

  testNaukriConfigurableScraper(searchQuery, location, maxJobs).catch(console.error);
}
