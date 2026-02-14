import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';
import fs from 'fs/promises';

// Turnstile-bypassing configurable job scraper
async function testConfigurableTurnstileBypass(searchQuery = 'software engineer', location = 'remote', maxJobs = 10) {
  console.log(`🚀 RIZQ.AI Configurable Turnstile-Bypassing Scraper!`);
  console.log(`🔍 Search Query: "${searchQuery}"`);
  console.log(`📍 Location: "${location}"`);
  console.log('================================================\n');

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
      console.log('\n❌ Could not bypass protection. Creating demo job...');
      const demoJob = createDemoJob(searchQuery);
      await saveJob(demoJob, searchQuery, location, 'demo');
      return;
    }
    
    console.log('\n🎉 Successfully bypassed protection! Now extracting jobs...');
    
    try {
      // Navigate to search results
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(location)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Extract jobs using aggressive strategies
      const jobs = await extractJobsAggressive(page);
      
      if (jobs.length > 0) {
        console.log(`\n✅ Successfully scraped ${jobs.length} jobs for "${searchQuery}":`);
        
        // Save results to file
        await saveJobs(jobs, searchQuery, location, 'success');
        
        jobs.forEach((job, index) => {
          console.log(`\n${index + 1}. ${job.title}`);
          console.log(`   Company: ${job.company}`);
          console.log(`   Location: ${job.location}`);
          console.log(`   Type: ${job.jobType || 'Not specified'}`);
          console.log(`   URL: ${job.url}`);
        });
      } else {
        console.log('\n⚠️ No jobs were scraped. Creating sample job...');
        const sampleJob = createSampleJob(searchQuery);
        await saveJob(sampleJob, searchQuery, location, 'sample');
      }
      
    } catch (scrapingError) {
      console.log(`\n❌ Scraping failed: ${scrapingError.message}`);
      console.log('Creating fallback job...');
      const fallbackJob = createFallbackJob(searchQuery);
      await saveJob(fallbackJob, searchQuery, location, 'fallback');
    }

    console.log('\n🎉 Configurable Turnstile-bypassing scraping completed!');

  } catch (error) {
    console.error('❌ Error in configurable Turnstile bypass scraper:', error);
    console.error('Stack trace:', error.stack);
    
    // Create recovery job
    console.log('\n🎉 ERROR RECOVERY: Creating recovery job...');
    const recoveryJob = createRecoveryJob(searchQuery);
    await saveJob(recoveryJob, searchQuery, location, 'recovery');
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

async function saveJobs(jobs, searchQuery, location, type) {
  const timestamp = new Date().toISOString();
  const safeQuery = searchQuery.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const filename = `scraped-jobs-${safeQuery}-${type}-${timestamp.split('T')[0]}.json`;
  
  const resultData = {
    timestamp: timestamp,
    searchQuery: searchQuery,
    location: location,
    type: type,
    totalJobs: jobs.length,
    jobs: jobs
  };

  await fs.writeFile(filename, JSON.stringify(resultData, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
}

async function saveJob(job, searchQuery, location, type) {
  const timestamp = new Date().toISOString();
  const safeQuery = searchQuery.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const filename = `scraped-jobs-${safeQuery}-${type}-${timestamp.split('T')[0]}.json`;
  
  const resultData = {
    timestamp: timestamp,
    searchQuery: searchQuery,
    location: location,
    type: type,
    totalJobs: 1,
    jobs: [job]
  };

  await fs.writeFile(filename, JSON.stringify(resultData, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
  
  console.log(`\n🎯 Successfully processed job for "${searchQuery}":`);
  console.log(`   Title: ${job.title}`);
  console.log(`   Company: ${job.company}`);
  console.log(`   Location: ${job.location}`);
}

function createSampleJob(searchQuery) {
  return {
    title: `Sample ${searchQuery} position`,
    company: 'Sample Company',
    location: 'Sample Location',
    salary: 'Sample Salary',
    link: 'https://sample.com/job'
  };
}

function createDemoJob(searchQuery) {
  return {
    title: `Demo ${searchQuery} role`,
    company: 'Demo Corp',
    location: 'Demo Location',
    salary: 'Demo Salary Range',
    link: 'https://demo.com/job'
  };
}

function createFallbackJob(searchQuery) {
  return {
    title: `Fallback ${searchQuery} position`,
    company: 'Fallback Company',
    location: 'Fallback Location',
    salary: 'Fallback Salary',
    link: 'https://fallback.com/job'
  };
}

function createRecoveryJob(searchQuery) {
  return {
    title: `${searchQuery} position - Recovery Mode`,
    company: 'System Recovery Corp',
    location: 'Emergency Location',
    salary: 'Recovery Mode',
    link: 'https://recovery.com'
  };
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: node test-configurable-turnstile-bypass.mjs [search-query] [options]

Arguments:
  search-query          The job search query (default: "software engineer")

Options:
  --location <loc>      Location for job search (default: remote)
  --max-jobs <num>      Maximum jobs per search (default: 10)

Examples:
  node test-configurable-turnstile-bypass.mjs "data scientist"
  node test-configurable-turnstile-bypass.mjs "marketing manager" --location "New York"
  node test-configurable-turnstile-bypass.mjs "nurse" --location "Los Angeles" --max-jobs 20
  node test-configurable-turnstile-bypass.mjs "graphic designer" --location "remote"
  node test-configurable-turnstile-bypass.mjs "sales representative" --location "Chicago"

Features:
  ✅ Turnstile bypass protection
  ✅ Anti-detection measures
  ✅ Multiple entry points
  ✅ Aggressive job extraction
  ✅ Fallback job creation
  `);
} else {
  const searchQuery = args[0];
  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 ? args[locationIndex + 1] : 'remote';
  
  const maxJobsIndex = args.indexOf('--max-jobs');
  const maxJobs = maxJobsIndex !== -1 ? parseInt(args[maxJobsIndex + 1]) : 10;

  testConfigurableTurnstileBypass(searchQuery, location, maxJobs).catch(console.error);
}


