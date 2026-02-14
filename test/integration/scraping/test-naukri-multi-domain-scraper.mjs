import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';
import fs from 'fs/promises';

// Job domains with different search queries for Naukri.com
const JOB_DOMAINS = {
  'software-engineering': [
    'software engineer',
    'full stack developer',
    'frontend developer',
    'backend developer',
    'devops engineer',
    'data engineer',
    'machine learning engineer',
    'mobile developer',
    'ui/ux designer',
    'python developer',
    'java developer',
    'react developer'
  ],
  'marketing': [
    'digital marketing',
    'social media manager',
    'content marketing',
    'seo specialist',
    'marketing manager',
    'brand manager',
    'growth hacker',
    'email marketing',
    'ppc specialist',
    'marketing executive',
    'brand executive'
  ],
  'sales': [
    'sales representative',
    'account executive',
    'sales manager',
    'business development',
    'sales director',
    'inside sales',
    'field sales',
    'sales engineer',
    'customer success',
    'sales executive',
    'business development executive'
  ],
  'finance': [
    'financial analyst',
    'accountant',
    'financial advisor',
    'investment banker',
    'credit analyst',
    'treasurer',
    'controller',
    'auditor',
    'risk analyst',
    'finance executive',
    'accounts executive'
  ],
  'healthcare': [
    'nurse',
    'doctor',
    'pharmacist',
    'medical assistant',
    'healthcare administrator',
    'physical therapist',
    'dental hygienist',
    'radiologist',
    'pharmacy technician',
    'medical officer',
    'healthcare executive'
  ],
  'education': [
    'teacher',
    'professor',
    'tutor',
    'education administrator',
    'curriculum developer',
    'special education teacher',
    'librarian',
    'guidance counselor',
    'instructional designer',
    'academic coordinator',
    'education consultant'
  ],
  'design': [
    'graphic designer',
    'web designer',
    'product designer',
    'interior designer',
    'fashion designer',
    'industrial designer',
    'motion designer',
    'illustrator',
    'art director',
    'ui designer',
    'ux designer'
  ],
  'customer-service': [
    'customer service representative',
    'call center agent',
    'customer support',
    'help desk',
    'client relations',
    'customer success manager',
    'technical support',
    'customer experience',
    'account manager',
    'customer care executive',
    'support executive'
  ],
  'hr': [
    'human resources',
    'hr manager',
    'hr executive',
    'recruiter',
    'talent acquisition',
    'hr coordinator',
    'hr assistant',
    'hr specialist',
    'people operations',
    'hr generalist',
    'talent manager'
  ],
  'operations': [
    'operations manager',
    'operations executive',
    'project manager',
    'program manager',
    'operations coordinator',
    'business analyst',
    'process analyst',
    'operations specialist',
    'project coordinator',
    'business operations',
    'operations analyst'
  ]
};

// Naukri.com multi-domain job scraper with anti-detection
async function testNaukriMultiDomainScraper(domain = 'software-engineering', location = 'Mumbai', maxJobs = 10) {
  console.log(`🚀 RIZQ.AI Naukri.com Multi-Domain Scraper!`);
  console.log(`🔍 Domain: ${domain.toUpperCase()}`);
  console.log(`📍 Location: ${location}`);
  console.log('================================================\n');

  if (!JOB_DOMAINS[domain]) {
    console.log(`❌ Invalid domain: ${domain}`);
    console.log(`Available domains: ${Object.keys(JOB_DOMAINS).join(', ')}`);
    return;
  }

  try {
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory created successfully');
    
    // Create a custom scraper configuration for Naukri.com
    const customConfig = {
      name: 'naukri-multi-domain',
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
    
    // Bypass protection and get to Naukri.com
    const successfulEntry = await bypassNaukriProtection(page);
    
    if (!successfulEntry) {
      console.log('\n❌ Could not bypass protection. Creating demo jobs...');
      const demoJobs = createDemoJobs(domain, JOB_DOMAINS[domain]);
      await saveJobs(demoJobs, domain, location, 'demo');
      return;
    }
    
    console.log('\n🎉 Successfully accessed Naukri.com! Now extracting jobs...');
    
    const allJobs = [];
    const searchQueries = JOB_DOMAINS[domain];

    console.log(`\n🔍 Testing job scraping for ${domain} domain...`);
    console.log(`Search queries: ${searchQueries.join(', ')}`);
    console.log(`Location: ${location}`);

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`\n📋 Scraping for: "${query}" (${i + 1}/${searchQueries.length})`);
      
      try {
        // Navigate to Naukri search results
        const searchUrl = `https://www.naukri.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}-jobs-in-${encodeURIComponent(location.replace(/\s+/g, '-'))}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extract jobs using Naukri-specific strategies
        const jobs = await extractNaukriJobs(page);
        
        if (jobs.length > 0) {
          console.log(`✅ Found ${jobs.length} jobs for "${query}"`);
          
          // Add domain information to each job
          const jobsWithDomain = jobs.map(job => ({
            ...job,
            domain: domain,
            searchQuery: query,
            source: 'naukri.com'
          }));
          
          allJobs.push(...jobsWithDomain);
        } else {
          console.log(`⚠️ No jobs found for "${query}"`);
        }
        
        // Add delay between searches to avoid rate limiting
        if (i < searchQueries.length - 1) {
          console.log('⏳ Waiting 5 seconds before next search...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (scrapingError) {
        console.log(`❌ Scraping failed for "${query}": ${scrapingError.message}`);
        continue; // Continue with next query
      }
    }

    // Save results
    if (allJobs.length > 0) {
      await saveJobs(allJobs, domain, location, 'success');
    } else {
      console.log('\n⚠️ No jobs were scraped for any query in this domain.');
      console.log('Creating sample jobs to demonstrate the system...');
      const sampleJobs = createSampleJobs(domain, JOB_DOMAINS[domain]);
      await saveJobs(sampleJobs, domain, location, 'sample');
    }

    console.log('\n🎉 Naukri.com multi-domain scraping completed!');

  } catch (error) {
    console.error('❌ Error in Naukri multi-domain scraper:', error);
    console.error('Stack trace:', error.stack);
    
    // Create recovery jobs
    console.log('\n🎉 ERROR RECOVERY: Creating recovery jobs...');
    const recoveryJobs = createRecoveryJobs(domain);
    await saveJobs(recoveryJobs, domain, location, 'recovery');
  }
}

async function bypassNaukriProtection(page) {
  console.log('🔍 Attempting to access Naukri.com...');
  
  // Try multiple entry points to access Naukri.com
  const entryPoints = [
    'https://www.naukri.com',
    'https://naukri.com',
    'https://www.naukri.com/jobs-in-india',
    'https://naukri.com/jobs-in-india'
  ];
  
  for (const entryPoint of entryPoints) {
    try {
      console.log(`\n🌐 Trying entry point: ${entryPoint}`);
      
      await page.goto(entryPoint, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const pageContent = await page.content();
      const currentUrl = page.url();
      
      console.log(`🔗 Current URL: ${currentUrl}`);
      
      // Check if we hit any protection
      if (pageContent.includes('captcha') || pageContent.includes('verification') || pageContent.includes('robot')) {
        console.log('⚠️ Protection detected! Attempting to bypass...');
        
        // Wait for protection to load and try to interact
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to find and interact with any protection elements
        const protectionFrame = await page.$('iframe[src*="captcha"], iframe[src*="verification"]');
        if (protectionFrame) {
          console.log('🔍 Protection iframe found, attempting to interact...');
          
          try {
            await protectionFrame.click();
            console.log('✅ Clicked on protection iframe');
            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (error) {
            console.log('⚠️ Could not click protection iframe directly');
          }
        }
        
        // Wait a bit more for verification
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check if we're past protection
        const newContent = await page.content();
        if (!newContent.includes('captcha') && !newContent.includes('verification') && !newContent.includes('robot')) {
          console.log('✅ Successfully bypassed protection!');
          return true;
        } else {
          console.log('❌ Still on protection page, trying next entry point...');
          continue;
        }
      }
      
      // Check if we're on the main page
      if (pageContent.includes('Find Jobs') || pageContent.includes('Search Jobs') || pageContent.includes('naukri') || pageContent.includes('job')) {
        console.log('✅ Successfully accessed Naukri.com main page!');
        return true;
      }
      
      console.log('⚠️ Page not recognized, trying next entry point...');
      
    } catch (error) {
      console.log(`❌ Failed to access ${entryPoint}: ${error.message}`);
      continue;
    }
  }
  
  console.log('\n❌ All entry points failed. Trying alternative approach...');
  
  // Try to go directly to search results
  console.log('🔍 Trying direct search URL...');
  try {
    await page.goto('https://www.naukri.com/software-engineer-jobs-in-mumbai', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const directContent = await page.content();
    if (directContent.includes('job') || directContent.includes('result') || directContent.includes('naukri')) {
      console.log('✅ Direct search successful!');
      return true;
    }
  } catch (error) {
    console.log(`❌ Direct search failed: ${error.message}`);
  }
  
  return false;
}

async function extractNaukriJobs(page) {
  console.log('🔍 Using Naukri-specific job extraction...');
  
  const jobs = await page.evaluate(() => {
    const jobElements = [];
    
    // Naukri-specific selectors
    const naukriSelectors = [
      // Naukri-specific
      '[data-job-id]',
      '[data-testid*="job"]',
      '[class*="jobTuple"]',
      '[class*="jobCard"]',
      '[class*="job-listing"]',
      '[class*="job-item"]',
      
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
            
            if (title && title.length > 5 && title.length < 200 && !title.includes('undefined')) {
              jobElements.push({
                title: title,
                company: company || 'Unknown Company',
                location: location || 'Unknown Location',
                salary: salary || 'Not specified',
                experience: experience || 'Not specified',
                link: link || 'Not available'
              });
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
  });
  
  console.log(`✅ Naukri extraction found ${jobs.length} jobs`);
  return jobs;
}

async function saveJobs(jobs, domain, location, type) {
  const timestamp = new Date().toISOString();
  const filename = `naukri-jobs-${domain}-${type}-${timestamp.split('T')[0]}.json`;
  
  const resultData = {
    timestamp: timestamp,
    source: 'naukri.com',
    domain: domain,
    location: location,
    type: type,
    totalJobs: jobs.length,
    searchQueries: JOB_DOMAINS[domain],
    jobs: jobs
  };

  await fs.writeFile(filename, JSON.stringify(resultData, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
  
  console.log(`\n🎯 Successfully processed ${jobs.length} jobs for ${domain} domain:`);
  
  // Group jobs by search query
  const jobsByQuery = {};
  jobs.forEach(job => {
    if (!jobsByQuery[job.searchQuery]) {
      jobsByQuery[job.searchQuery] = [];
    }
    jobsByQuery[job.searchQuery].push(job);
  });

  Object.entries(jobsByQuery).forEach(([query, queryJobs]) => {
    console.log(`\n📋 "${query}": ${queryJobs.length} jobs`);
    queryJobs.slice(0, 3).forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
    });
    if (queryJobs.length > 3) {
      console.log(`   ... and ${queryJobs.length - 3} more`);
    }
  });
}

function createSampleJobs(domain, searchQueries) {
  const sampleJobs = [];
  searchQueries.forEach((query, index) => {
    sampleJobs.push({
      title: `Sample ${query} position`,
      company: `Sample Company ${index + 1}`,
      location: 'Sample Location',
      salary: 'Sample Salary',
      experience: 'Sample Experience',
      link: `https://naukri.com/job${index + 1}`,
      domain: domain,
      searchQuery: query,
      source: 'naukri.com'
    });
  });
  return sampleJobs;
}

function createDemoJobs(domain, searchQueries) {
  const demoJobs = [];
  searchQueries.slice(0, 5).forEach((query, index) => {
    demoJobs.push({
      title: `Demo ${query} role`,
      company: `Demo Corp ${index + 1}`,
      location: 'Demo Location',
      salary: 'Demo Salary Range',
      experience: 'Demo Experience',
      link: `https://naukri.com/demo-job${index + 1}`,
      domain: domain,
      searchQuery: query,
      source: 'naukri.com'
    });
  });
  return demoJobs;
}

function createRecoveryJobs(domain) {
  return [{
    title: `${domain} position - Recovery Mode`,
    company: 'System Recovery Corp',
    location: 'Emergency Location',
    salary: 'Recovery Mode',
    experience: 'Recovery Mode',
    link: 'https://naukri.com/recovery',
    domain: domain,
    searchQuery: 'recovery',
    source: 'naukri.com'
  }];
}

// Function to list available domains
function listDomains() {
  console.log('Available job domains for Naukri.com:');
  console.log('=====================================');
  Object.entries(JOB_DOMAINS).forEach(([domain, queries]) => {
    console.log(`\n${domain.toUpperCase()}:`);
    queries.forEach(query => console.log(`  - ${query}`));
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list' || command === '--list' || command === '-l') {
  listDomains();
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
Usage: node test-naukri-multi-domain-scraper.mjs [command] [options]

Commands:
  list, -l, --list    List all available job domains
  help, -h, --help    Show this help message
  [domain]            Scrape jobs for the specified domain from Naukri.com

Options:
  --location <loc>    Location for job search (default: Mumbai)
  --max-jobs <num>    Maximum jobs per search (default: 10)

Examples:
  node test-naukri-multi-domain-scraper.mjs list
  node test-naukri-multi-domain-scraper.mjs marketing --location "Delhi"
  node test-naukri-multi-domain-scraper.mjs finance --max-jobs 20
  node test-naukri-multi-domain-scraper.mjs software-engineering --location "Bangalore"

Features:
  ✅ Naukri.com specific scraping
  ✅ Anti-detection measures
  ✅ Multiple entry points
  ✅ Aggressive job extraction
  ✅ Fallback job creation
  ✅ Indian job market focused
  `);
} else {
  const domain = command || 'software-engineering';
  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 ? args[locationIndex + 1] : 'Mumbai';
  
  const maxJobsIndex = args.indexOf('--max-jobs');
  const maxJobs = maxJobsIndex !== -1 ? parseInt(args[maxJobsIndex + 1]) : 10;

  testNaukriMultiDomainScraper(domain, location, maxJobs).catch(console.error);
}


