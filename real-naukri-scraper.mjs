import { chromium } from 'playwright';
import fs from 'fs/promises';

// Real Naukri.com job scraper using Playwright - No fake jobs!
async function scrapeNaukriJobs(searchQuery = 'software engineer', location = 'Mumbai', maxJobs = 10) {
  console.log(`🚀 REAL Naukri.com Job Scraper - No Fake Jobs!`);
  console.log(`🔍 Search Query: "${searchQuery}"`);
  console.log(`📍 Location: "${location}"`);
  console.log('================================================\n');

  let browser;
  
  try {
    // Launch browser with anti-detection
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: false, // Set to true for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });

    const page = await context.newPage();

    // Anti-detection measures
    await page.addInitScript(() => {
      // Override webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    console.log('✅ Browser launched successfully');

    // Navigate to Naukri.com
    console.log('🌐 Navigating to Naukri.com...');
    await page.goto('https://www.naukri.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('✅ Successfully loaded Naukri.com');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if we're on the main page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    // Navigate to search results
    const searchUrl = `https://www.naukri.com/${encodeURIComponent(searchQuery.replace(/\s+/g, '-'))}-jobs-in-${encodeURIComponent(location.replace(/\s+/g, '-'))}`;
    console.log(`🔍 Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('✅ Successfully loaded search results');

    // Wait for jobs to load
    await page.waitForTimeout(5000);

    // Extract real jobs using multiple strategies
    console.log('🔍 Extracting real jobs...');
    const jobs = await extractRealJobs(page, maxJobs);

    if (jobs.length > 0) {
      console.log(`\n🎉 SUCCESS! Found ${jobs.length} REAL jobs:`);
      
      // Save real jobs to file
      await saveRealJobs(jobs, searchQuery, location);
      
      // Display jobs
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

  } catch (error) {
    console.error('❌ Error during scraping:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

async function extractRealJobs(page, maxJobs) {
  console.log('🔍 Using multiple strategies to extract real jobs...');
  
  const jobs = await page.evaluate((maxJobs) => {
    const jobElements = [];
    
    // Strategy 1: Look for job cards with specific Naukri selectors
    const selectors = [
      // Naukri-specific selectors
      '[data-job-id]',
      '[data-testid*="job"]',
      '[class*="jobTuple"]',
      '[class*="jobCard"]',
      '[class*="job-listing"]',
      '[class*="job-item"]',
      '[class*="jobTupleHeader"]',
      
      // Generic selectors
      'article[data-job-id]',
      'div[data-job-id]',
      'div[class*="job"]',
      'div[class*="result"]',
      'div[class*="listing"]',
      
      // Fallback selectors
      'article',
      '.job',
      '.result',
      '.listing',
      '.card'
    ];

    console.log('🔍 Trying different selectors...');
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      
      if (elements.length > 0) {
        for (const element of elements) {
          try {
            // Extract job information
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
            console.log('Error extracting job:', error.message);
          }
        }
        
        if (jobElements.length > 0) {
          console.log(`✅ Successfully extracted ${jobElements.length} jobs using selector: ${selector}`);
          break;
        }
      }
    }
    
    // Strategy 2: Look for any text that looks like job titles
    if (jobElements.length === 0) {
      console.log('🔍 Trying text-based extraction...');
      
      const allTextElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, a, span, div');
      
      for (const element of allTextElements) {
        const text = element.textContent?.trim();
        
        if (text && 
            text.length > 10 && 
            text.length < 100 &&
            (text.includes('Engineer') || 
             text.includes('Developer') || 
             text.includes('Manager') || 
             text.includes('Analyst') ||
             text.includes('Specialist') ||
             text.includes('Consultant'))) {
          
          const parent = element.closest('div, article, section');
          if (parent) {
            const company = parent.querySelector('[class*="company"], [class*="employer"]')?.textContent?.trim();
            const location = parent.querySelector('[class*="location"], [class*="city"]')?.textContent?.trim();
            const link = parent.querySelector('a')?.href || element.href;
            
            jobElements.push({
              title: text,
              company: company || 'Unknown Company',
              location: location || 'Unknown Location',
              salary: 'Not specified',
              experience: 'Not specified',
              link: link || 'Not available',
              extractedAt: new Date().toISOString()
            });
            
            if (jobElements.length >= maxJobs) break;
          }
        }
      }
    }
    
    return jobElements;
  }, maxJobs);

  console.log(`✅ Real job extraction completed. Found ${jobs.length} jobs`);
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
🚀 REAL Naukri.com Job Scraper - No Fake Jobs!

Usage: node real-naukri-scraper.mjs [search-query] [options]

Arguments:
  search-query          The job search query (default: "software engineer")

Options:
  --location <loc>      Location for job search (default: Mumbai)
  --max-jobs <num>      Maximum jobs per search (default: 10)

Examples:
  node real-naukri-scraper.mjs "data scientist"
  node real-naukri-scraper.mjs "marketing manager" --location "Delhi"
  node real-naukri-scraper.mjs "python developer" --location "Bangalore" --max-jobs 20

Features:
  ✅ REAL job scraping - No fake data!
  ✅ Anti-detection measures
  ✅ Multiple extraction strategies
  ✅ Real-time job data
  ✅ Indian job market focused
  `);
} else {
  const searchQuery = args[0];
  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 ? args[locationIndex + 1] : 'Mumbai';
  
  const maxJobsIndex = args.indexOf('--max-jobs');
  const maxJobs = maxJobsIndex !== -1 ? parseInt(args[maxJobsIndex + 1]) : 10;

  scrapeNaukriJobs(searchQuery, location, maxJobs).catch(console.error);
}
