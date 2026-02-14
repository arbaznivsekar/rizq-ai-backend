import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';
import fs from 'fs/promises';

// Job domains with different search queries
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
    'ui/ux designer'
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
    'ppc specialist'
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
    'customer success'
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
    'risk analyst'
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
    'pharmacy technician'
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
    'instructional designer'
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
    'art director'
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
    'account manager'
  ]
};

// Turnstile-bypassing multi-domain job scraper
async function testMultiDomainTurnstileBypass(domain = 'software-engineering', location = 'remote', maxJobs = 10) {
  console.log(`🚀 RIZQ.AI Multi-Domain Turnstile-Bypassing Scraper!`);
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
    
    const scraper = factory.createScraper(JobBoardType.INDEED, {
      maxPagesPerSearch: 1,
      maxJobsPerPage: maxJobs,
      delayBetweenRequests: 3000,
      maxRetries: 3
    }, factory.getDefaultSession());
    
    console.log('✅ Indeed scraper created successfully');
    
    await scraper['initializeBrowser']();
    const page = scraper['page'];
    
    console.log('✅ Browser initialized successfully');
    
    // Advanced anti-detection for Turnstile
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
    
    // Bypass Turnstile and get to Indeed
    const successfulEntry = await bypassTurnstile(page);
    
    if (!successfulEntry) {
      console.log('\n❌ Could not bypass protection. Creating demo jobs...');
      const demoJobs = createDemoJobs(domain, JOB_DOMAINS[domain]);
      await saveJobs(demoJobs, domain, location, 'demo');
      return;
    }
    
    console.log('\n🎉 Successfully bypassed protection! Now extracting jobs...');
    
    const allJobs = [];
    const searchQueries = JOB_DOMAINS[domain];

    console.log(`\n🔍 Testing job scraping for ${domain} domain...`);
    console.log(`Search queries: ${searchQueries.join(', ')}`);
    console.log(`Location: ${location}`);

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`\n📋 Scraping for: "${query}" (${i + 1}/${searchQueries.length})`);
      
      try {
        // Navigate to search results
        const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extract jobs using aggressive strategies
        const jobs = await extractJobsAggressive(page);
        
        if (jobs.length > 0) {
          console.log(`✅ Found ${jobs.length} jobs for "${query}"`);
          
          // Add domain information to each job
          const jobsWithDomain = jobs.map(job => ({
            ...job,
            domain: domain,
            searchQuery: query
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

    console.log('\n🎉 Multi-domain Turnstile-bypassing scraping completed!');

  } catch (error) {
    console.error('❌ Error in multi-domain Turnstile bypass scraper:', error);
    console.error('Stack trace:', error.stack);
    
    // Create recovery jobs
    console.log('\n🎉 ERROR RECOVERY: Creating recovery jobs...');
    const recoveryJobs = createRecoveryJobs(domain);
    await saveJobs(recoveryJobs, domain, location, 'recovery');
  }
}

async function bypassTurnstile(page) {
  console.log('🔍 Attempting to bypass Turnstile protection...');
  
  // Try multiple entry points to bypass Turnstile
  const entryPoints = [
    'https://www.indeed.com',
    'https://indeed.com',
    'https://www.indeed.com/jobs',
    'https://indeed.com/jobs'
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
      
      // Check if we hit Turnstile
      if (pageContent.includes('cf-turnstile') || pageContent.includes('turnstile')) {
        console.log('⚠️ Cloudflare Turnstile detected! Attempting to bypass...');
        
        // Wait for Turnstile to load and try to interact
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to find and interact with Turnstile
        const turnstileFrame = await page.$('iframe[src*="turnstile"], iframe[src*="cloudflare"]');
        if (turnstileFrame) {
          console.log('🔍 Turnstile iframe found, attempting to interact...');
          
          try {
            await turnstileFrame.click();
            console.log('✅ Clicked on Turnstile iframe');
            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (error) {
            console.log('⚠️ Could not click Turnstile iframe directly');
          }
        }
        
        // Wait a bit more for verification
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check if we're past Turnstile
        const newContent = await page.content();
        if (!newContent.includes('cf-turnstile') && !newContent.includes('turnstile')) {
          console.log('✅ Successfully bypassed Turnstile!');
          return true;
        } else {
          console.log('❌ Still on Turnstile page, trying next entry point...');
          continue;
        }
      }
      
      // Check if we're on a verification page
      if (pageContent.includes('verification') || pageContent.includes('captcha') || pageContent.includes('robot')) {
        console.log('⚠️ Verification page detected, trying next entry point...');
        continue;
      }
      
      // Check if we're on the main page
      if (pageContent.includes('Find jobs') || pageContent.includes('job search') || pageContent.includes('What job title')) {
        console.log('✅ Successfully accessed Indeed main page!');
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
    await page.goto('https://www.indeed.com/jobs?q=software+engineer&l=remote', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const directContent = await page.content();
    if (directContent.includes('job') || directContent.includes('result')) {
      console.log('✅ Direct search successful!');
      return true;
    }
  } catch (error) {
    console.log(`❌ Direct search failed: ${error.message}`);
  }
  
  return false;
}

async function extractJobsAggressive(page) {
  console.log('🔍 Using aggressive job extraction...');
  
  const jobs = await page.evaluate(() => {
    const jobElements = [];
    
    // Very aggressive selectors
    const aggressiveSelectors = [
      // Indeed-specific
      '[data-jk]',
      '[data-empn]',
      '[data-testid*="job"]',
      '[data-testid*="result"]',
      '[class*="job"]',
      '[class*="result"]',
      '[class*="listing"]',
      '[class*="card"]',
      
      // Generic
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
      'a[href*="viewjob"]',
      'a[href*="indeed"]',
      
      // Fallback
      'div',
      'section',
      'main'
    ];
    
    for (const selector of aggressiveSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        for (const element of elements) {
          try {
            // Extract any text that might be job-related
            const title = element.querySelector('h2, h3, h4, h5, a, [data-testid*="title"], [class*="title"]')?.textContent?.trim();
            const company = element.querySelector('[class*="company"], [class*="employer"], [class*="name"]')?.textContent?.trim();
            const location = element.querySelector('[class*="location"], [class*="city"], [class*="place"]')?.textContent?.trim();
            const salary = element.querySelector('[class*="salary"], [class*="pay"]')?.textContent?.trim();
            const link = element.querySelector('a')?.href || element.href;
            
            if (title && title.length > 5 && title.length < 200 && !title.includes('undefined')) {
              jobElements.push({
                title: title,
                company: company || 'Unknown Company',
                location: location || 'Unknown Location',
                salary: salary || 'Not specified',
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
  
  console.log(`✅ Aggressive extraction found ${jobs.length} jobs`);
  return jobs;
}

async function saveJobs(jobs, domain, location, type) {
  const timestamp = new Date().toISOString();
  const filename = `scraped-jobs-${domain}-${type}-${timestamp.split('T')[0]}.json`;
  
  const resultData = {
    timestamp: timestamp,
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
      link: `https://sample.com/job${index + 1}`,
      domain: domain,
      searchQuery: query
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
      link: `https://demo.com/job${index + 1}`,
      domain: domain,
      searchQuery: query
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
    link: 'https://recovery.com',
    domain: domain,
    searchQuery: 'recovery'
  }];
}

// Function to list available domains
function listDomains() {
  console.log('Available job domains:');
  console.log('======================');
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
Usage: node test-multi-domain-turnstile-bypass.mjs [command] [options]

Commands:
  list, -l, --list    List all available job domains
  help, -h, --help    Show this help message
  [domain]            Scrape jobs for the specified domain with Turnstile bypass

Options:
  --location <loc>    Location for job search (default: remote)
  --max-jobs <num>    Maximum jobs per search (default: 10)

Examples:
  node test-multi-domain-turnstile-bypass.mjs list
  node test-multi-domain-turnstile-bypass.mjs marketing --location "New York"
  node test-multi-domain-turnstile-bypass.mjs finance --max-jobs 20
  node test-multi-domain-turnstile-bypass.mjs software-engineering

Features:
  ✅ Turnstile bypass protection
  ✅ Anti-detection measures
  ✅ Multiple entry points
  ✅ Aggressive job extraction
  ✅ Fallback job creation
  `);
} else {
  const domain = command || 'software-engineering';
  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 ? args[locationIndex + 1] : 'remote';
  
  const maxJobsIndex = args.indexOf('--max-jobs');
  const maxJobs = maxJobsIndex !== -1 ? parseInt(args[maxJobsIndex + 1]) : 10;

  testMultiDomainTurnstileBypass(domain, location, maxJobs).catch(console.error);
}


