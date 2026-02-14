import { chromium } from 'playwright';
import fs from 'fs/promises';
// Optional DB ingest - commented out for now
// import { connectMongo } from './dist/src/db/mongo.js';
// import { ingestJob } from './dist/src/data/pipelines/ingestEntry.js';

// Real Naukri.com job scraper using Playwright - No fake jobs!
async function scrapeNaukriJobs(searchQuery = 'software engineer', location = 'Mumbai', maxJobs = 10) {
  console.log(`🚀 REAL Naukri.com Job Scraper - No Fake Jobs!`);
  console.log(`🔍 Search Query: "${searchQuery}"`);
  console.log(`📍 Location: "${location}"`);
  console.log('================================================\n');

  let browser;
  
  try {
    // Launch browser with advanced anti-detection
    console.log('🌐 Launching browser with stealth mode...');
    browser = await chromium.launch({
      headless: false, // Use headed mode for better anti-detection
      slowMo: 50, // Slow down operations to appear more human
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--start-maximized'
      ]
    });

    const context = await browser.newContext({
      // Realistic user agent
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      // Add realistic browser properties
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata',
      permissions: ['geolocation'],
      geolocation: { latitude: 12.9716, longitude: 77.5946 }, // Bangalore coordinates
      colorScheme: 'light',
      // Add realistic headers
      extraHTTPHeaders: {
        'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    const page = await context.newPage();

    // Advanced anti-detection measures
    await page.addInitScript(() => {
      // Remove webdriver property
      delete Object.getPrototypeOf(navigator).webdriver;
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
        configurable: true
      });
      
      // Override automation indicators
      window.navigator.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // Add realistic plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ]
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-IN', 'en-GB', 'en-US', 'en'],
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Add realistic screen properties
      Object.defineProperty(screen, 'availWidth', { get: () => 1920 });
      Object.defineProperty(screen, 'availHeight', { get: () => 1040 });
      Object.defineProperty(screen, 'width', { get: () => 1920 });
      Object.defineProperty(screen, 'height', { get: () => 1080 });
      Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
      Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });
      
      // Override toString
      const originalToString = Function.prototype.toString;
      Function.prototype.toString = function() {
        if (this === window.navigator.permissions.query) {
          return 'function query() { [native code] }';
        }
        return originalToString.call(this);
      };
    });

    console.log('✅ Browser launched successfully with stealth mode');

    // Human-like behavior: Random delays
    const humanDelay = (min = 1000, max = 3000) => {
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      return new Promise(resolve => setTimeout(resolve, delay));
    };

    // Navigate to Naukri.com homepage first (like a real user)
    console.log('🌐 Navigating to Naukri.com homepage...');
    await page.goto('https://www.naukri.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    // Human behavior: Wait and move mouse randomly
    await humanDelay(2000, 4000);
    console.log('✅ Successfully loaded Naukri.com');

    // Simulate human mouse movements
    await page.mouse.move(100, 100);
    await humanDelay(500, 1000);
    await page.mouse.move(300, 200);
    await humanDelay(500, 1000);

    // Check if we're on the main page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    // If access denied, try to solve it
    if (pageTitle.includes('Access Denied') || pageTitle.includes('Attention Required')) {
      console.log('⚠️  Access Denied detected. Trying alternative approach...');
      
      // Wait for any CAPTCHA or challenge
      await humanDelay(5000, 8000);
      
      // Try clicking on the page to trigger human-like interaction
      await page.mouse.click(500, 500);
      await humanDelay(2000, 3000);
    }

    // Human behavior: Scroll a bit on homepage
    console.log('👤 Simulating human behavior on homepage...');
    await page.mouse.wheel(0, 300);
    await humanDelay(1000, 2000);
    await page.mouse.wheel(0, 300);
    await humanDelay(1000, 1500);

    // Navigate directly to search results URL (more reliable than search box)
    console.log('🔍 Navigating to search results page...');
    const searchUrl = `https://www.naukri.com/${encodeURIComponent(searchQuery.replace(/\s+/g, '-'))}-jobs-in-${encodeURIComponent(location.replace(/\s+/g, '-'))}`;
    console.log(`📍 Search URL: ${searchUrl}`);
    
    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await humanDelay(5000, 8000); // Wait for page to fully load

    console.log('✅ Successfully loaded search results');

    // DEBUG: Take screenshot and save HTML
    console.log('📸 Taking screenshot for debugging...');
    await page.screenshot({ path: 'debug-search-page.png', fullPage: false });
    const html = await page.content();
    await fs.writeFile('debug-page-source.html', html);
    console.log('✅ Debug files saved: debug-search-page.png & debug-page-source.html');

    // DEBUG: Get page title and URL
    const currentUrl = page.url();
    const currentTitle = await page.title();
    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`📄 Current title: ${currentTitle}`);

    // DEBUG: Count elements on page
    const debugInfo = await page.evaluate(() => {
      return {
        totalArticles: document.querySelectorAll('article').length,
        totalJobTuples: document.querySelectorAll('[class*="jobTuple" i]').length,
        totalDataJobIds: document.querySelectorAll('[data-job-id]').length,
        totalLinks: document.querySelectorAll('a').length,
        bodyClasses: document.body.className,
        mainHTML: document.querySelector('main')?.innerHTML?.substring(0, 500) || 'No main element'
      };
    });
    console.log('🔍 Page element count:', JSON.stringify(debugInfo, null, 2));

    // Wait for jobs to load and progressively scroll to ensure lazy content appears
    await waitForResultsToAppear(page);
    await incrementalScroll(page, 5);

    // Extract real jobs using multiple strategies
    console.log('🔍 Extracting real jobs...');
    const jobs = await extractRealJobs(page, maxJobs);

    if (jobs.length > 0) {
      console.log(`\n🎉 SUCCESS! Found ${jobs.length} REAL jobs:`);

      // Enrich each job with full description and key skills
      console.log('🧠 Enriching jobs with full description and key skills...');
      await enrichJobsWithDetails(context, jobs);

      // Persist to database via ingest pipeline
      // Disabled for now - jobs will be imported via the scraping service
      // try {
      //   await connectMongo();
      //   await persistToDatabase(jobs, { defaultCity: location, source: 'naukri_gulf' });
      //   console.log('💾 Saved jobs to MongoDB (ingest pipeline)');
      // } catch (e) {
      //   console.log('⚠️ Skipped DB ingest:', e?.message || e);
      // }

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
        if (job.keySkills && job.keySkills.length) {
          console.log(`   Key Skills: ${job.keySkills.slice(0, 8).join(', ')}`);
        }
        if (job.description) {
          console.log(`   Description: ${job.description.substring(0, 140)}...`);
        }
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
  console.log('🔍 Extracting job listings from Naukri search results...');
  
  // Wait for job listings to appear
  try {
    await page.waitForSelector('article.jobTuple, div.jobTuple, div[class*="srp-jobtuple"], article[class*="jobTuple"]', { timeout: 10000 });
    console.log('✅ Job listings container found');
  } catch (e) {
    console.log('⚠️  Could not find job listings container, trying alternative selectors...');
  }
  
  const jobs = await page.evaluate((maxJobs) => {
    const jobElements = [];
    
    // Naukri uses specific class names for job cards
    // Primary selector: Look for job tuple containers
    const primarySelectors = [
      'article.jobTuple',
      'div.jobTuple',
      'div[class*="srp-jobtuple"]',
      'article[class*="jobTuple"]',
      'div[class*="job-tuple"]'
    ];
    
    let allJobCards = [];
    
    // Try each primary selector
    for (const selector of primarySelectors) {
      const cards = Array.from(document.querySelectorAll(selector));
      if (cards.length > 0) {
        console.log(`Found ${cards.length} job cards with selector: ${selector}`);
        allJobCards = cards;
        break;
      }
    }
    
    // If no jobs found with primary selectors, try data attributes
    if (allJobCards.length === 0) {
      allJobCards = Array.from(document.querySelectorAll('[data-job-id]'));
      console.log(`Found ${allJobCards.length} jobs with data-job-id attribute`);
    }
    
    // Extract information from each job card
    for (const card of allJobCards) {
      if (jobElements.length >= maxJobs) break;
      
      try {
        // Extract job title - try multiple selectors
        const titleSelectors = [
          'a.title',
          'a[class*="title"]',
          'h2 a',
          'h3 a',
          '.title',
          '[class*="job-title"]',
          '[class*="jobTitle"]'
        ];
        
        let title = null;
        for (const sel of titleSelectors) {
          const el = card.querySelector(sel);
          if (el && el.textContent.trim().length > 3) {
            title = el.textContent.trim();
            break;
          }
        }
        
        // Extract company name
        const companySelectors = [
          'a.comp-name',
          'a[class*="comp"]',
          '.comp-name',
          '[class*="company"]',
          '[class*="companyInfo"]',
          'a[title*="company" i]'
        ];
        
        let company = 'Unknown Company';
        for (const sel of companySelectors) {
          const el = card.querySelector(sel);
          if (el && el.textContent.trim()) {
            company = el.textContent.trim();
            break;
          }
        }
        
        // Extract location
        const locationSelectors = [
          '.loc-wrap .location',
          '.location',
          '[class*="loc"]',
          '[class*="jobLocation"]',
          'span[title*="location" i]'
        ];
        
        let location = 'Not specified';
        for (const sel of locationSelectors) {
          const el = card.querySelector(sel);
          if (el && el.textContent.trim()) {
            location = el.textContent.trim();
            break;
          }
        }
        
        // Extract salary
        const salarySelectors = [
          '.sal-wrap .salary',
          '.salary',
          '[class*="sal"]',
          '[class*="ctc"]'
        ];
        
        let salary = 'Not disclosed';
        for (const sel of salarySelectors) {
          const el = card.querySelector(sel);
          if (el && el.textContent.trim()) {
            salary = el.textContent.trim();
            break;
          }
        }
        
        // Extract experience
        const expSelectors = [
          '.exp-wrap .experience',
          '.experience',
          '[class*="exp"]',
          'span[title*="experience" i]'
        ];
        
        let experience = 'Not specified';
        for (const sel of expSelectors) {
          const el = card.querySelector(sel);
          if (el && el.textContent.trim()) {
            experience = el.textContent.trim();
            break;
          }
        }
        
        // Extract job URL
        let jobUrl = 'Not available';
        const linkEl = card.querySelector('a.title, a[class*="title"], h2 a, h3 a');
        if (linkEl && linkEl.href) {
          jobUrl = linkEl.href;
        }
        
        // Extract job ID if available
        const jobId = card.getAttribute('data-job-id') || card.id || null;
        
        // Only add if we have a valid title
        if (title && 
            title.length > 3 && 
            title.length < 200 &&
            !title.includes('Jobs') && // Filter out menu items
            !title.includes('See all') &&
            !title.includes('View all') &&
            jobUrl !== 'Not available') {
          
          jobElements.push({
            title: title,
            company: company,
            location: location,
            salary: salary,
            experience: experience,
            link: jobUrl,
            jobId: jobId,
            extractedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.log('Error extracting job from card:', error.message);
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

// Map and persist scraped jobs to Mongo using ingest pipeline
async function persistToDatabase(jobs, opts = { defaultCity: 'Mumbai', source: 'naukri_gulf' }) {
  for (const j of jobs) {
    const dto = {
      source: opts.source,
      externalId: null,
      canonicalUrl: j.link || null,
      title: j.title || 'Unknown',
      company: { name: (j.company || 'Unknown Company').trim() },
      location: {
        city: (j.location || opts.defaultCity || '').toString().split(',')[0].trim() || undefined,
        country: 'IN',
        remoteType: 'onsite'
      },
      postedAt: new Date().toISOString(),
      description: j.description || undefined,
      skills: Array.isArray(j.keySkills) ? j.keySkills : [],
      benefits: Array.isArray(j.benefits) ? j.benefits : []
    };
    try {
      await ingestJob(dto);
    } catch (e) {
      console.log('Ingest error:', e?.message || e);
    }
  }
}

// Scroll results list incrementally with human-like behavior
async function incrementalScroll(page, passes = 4) {
  console.log('👤 Scrolling page with human-like behavior...');
  
  // Random mouse movements while scrolling
  for (let i = 0; i < passes; i++) {
    // Random scroll amount (simulate reading)
    const scrollAmount = 800 + Math.floor(Math.random() * 600);
    await page.mouse.wheel(0, scrollAmount);
    
    // Random pause (simulate reading)
    const pauseTime = 1200 + Math.floor(Math.random() * 1800);
    await page.waitForTimeout(pauseTime);
    
    // Occasional mouse movement
    if (Math.random() > 0.5) {
      const x = 200 + Math.floor(Math.random() * 800);
      const y = 200 + Math.floor(Math.random() * 600);
      await page.mouse.move(x, y);
      await page.waitForTimeout(200 + Math.floor(Math.random() * 300));
    }
    
    // Occasional scroll up (like re-reading)
    if (Math.random() > 0.7) {
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(500 + Math.floor(Math.random() * 500));
    }
  }
  
  // Final smooth scroll to load more content
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const step = 400 + Math.floor(Math.random() * 300);
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total > document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200 + Math.floor(Math.random() * 150));
    });
  });
  
  // Wait for content to load
  await page.waitForTimeout(2000);
  console.log('✅ Page scrolling completed');
}

// Wait until any likely result container appears and stabilizes
async function waitForResultsToAppear(page) {
  const candidates = [
    '[data-job-id]',
    '[class*="list" i] [data-job-id]',
    '[class*="results" i] [data-job-id]',
    '[class*="jobTuple" i]'
  ];
  for (const sel of candidates) {
    try {
      await page.waitForSelector(sel, { timeout: 10000 });
      // brief settle time
      await page.waitForTimeout(800);
      return;
    } catch (_) { /* try next */ }
  }
}

// Visit each job detail page to extract full description and key skills
async function enrichJobsWithDetails(context, jobs) {
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!job.link || !job.link.startsWith('http')) continue;

    try {
      const detailPage = await context.newPage();
      await detailPage.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await detailPage.waitForTimeout(2000);

      // Try to expand truncated content (Read more / View more)
      try {
        const expandSelectors = [
          'button:has-text("Read more")',
          'button:has-text("View more")',
          'button:has-text("Show more")',
          'a:has-text("Read more")',
          'a:has-text("View more")',
          'a:has-text("Show more")',
          '[class*="readMore" i]',
          '[class*="showMore" i]',
          '[class*="viewMore" i]'
        ];
        for (const sel of expandSelectors) {
          const el = await detailPage.$(sel);
          if (el) {
            await el.click({ force: true }).catch(() => {});
            await detailPage.waitForTimeout(800);
          }
        }
      } catch (_) {}

      const details = await detailPage.evaluate(() => {
        // Try multiple selectors for description
        const descriptionSelectors = [
          // Naukri common containers
          'div.dang-inner-html',
          '[class*="dang-inner-html" i]',
          '[class*="job-description" i]',
          '[data-testid*="jobDescription" i]',
          '[class*="description" i]',
          '[id*="description" i]',
          'section[data-section*="description" i]',
          'article'
        ];

        let descriptionText = '';
        for (const sel of descriptionSelectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText && el.innerText.length > 100) {
            descriptionText = el.innerText.trim();
            break;
          }
        }

        // Try multiple selectors for key skills
        const skillsSelectors = [
          // Naukri key skills area often has anchors/spans with title
          '[class*="key" i][class*="skill" i] a',
          '[class*="key" i][class*="skill" i] span[title]',
          '[data-testid*="keySkill" i] a',
          '[data-testid*="keySkill" i] span',
          '[class*="skills" i] a',
          '[class*="skills" i] span',
          '[class*="tags" i] a',
          '[class*="tags" i] span'
        ];

        const skillsSet = new Set();
        for (const sel of skillsSelectors) {
          let nodes;
          try {
            nodes = document.querySelectorAll(sel);
          } catch (_) {
            nodes = [];
          }
          nodes.forEach(node => {
            const t = ((node.getAttribute && node.getAttribute('title')) || node.textContent || '').trim();
            if (t && t.length > 1 && t.length < 60) {
              skillsSet.add(t);
            }
          });
        }

        // Extract structured sections by heading labels
        const headingCandidates = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, strong, b'));
        const sections = [];
        headingCandidates.forEach(h => {
          const text = (h.textContent || '').trim().toLowerCase();
          if (!text) return;
          const labelMap = [
            { key: 'responsibilities', patterns: ['responsibilit', 'role', 'what you will do', 'you will', 'job duties', 'about the role'] },
            { key: 'requirements', patterns: ['requirement', 'qualification', 'must have', 'we are looking for', 'skills & experience', 'experience required', 'eligibilit'] },
            { key: 'niceToHave', patterns: ['nice to have', 'good to have', 'preferred', 'bonus', 'plus'] }
          ];
          for (const m of labelMap) {
            if (m.patterns.some(p => text.includes(p))) {
              // Collect sibling list items or paragraphs until next heading
              const items = [];
              // Walk a few next siblings to gather content
              let walker = h.nextElementSibling;
              let steps = 0;
              while (walker && steps < 12) {
                const tag = walker.tagName.toLowerCase();
                if (['h1','h2','h3','h4','h5','strong','b'].includes(tag)) break;
                // Gather list items
                const lis = walker.querySelectorAll('li');
                if (lis.length) {
                  lis.forEach(li => {
                    const t = (li.textContent || '').replace(/\s+/g,' ').trim();
                    if (t && t.length > 2) items.push(t);
                  });
                } else {
                  // Fallback to paragraph text
                  const t = (walker.textContent || '').replace(/\s+/g,' ').trim();
                  if (t && t.length > 20) items.push(t);
                }
                walker = walker.nextElementSibling;
                steps++;
              }
              sections.push({ key: m.key, items });
              break;
            }
          }
        });

        const keySkills = Array.from(skillsSet);
        const byKey = (k) => (sections.find(s => s.key === k)?.items || []).slice(0, 50);
        return { 
          description: descriptionText, 
          keySkills,
          responsibilities: byKey('responsibilities'),
          requirements: byKey('requirements'),
          niceToHave: byKey('niceToHave')
        };
      });

      job.description = details.description || job.description || '';
      job.keySkills = (details.keySkills && details.keySkills.length ? details.keySkills : job.keySkills) || [];
      job.responsibilities = details.responsibilities || [];
      job.requirements = details.requirements || [];
      job.niceToHave = details.niceToHave || [];

      await detailPage.close();
      // Small delay between detail requests
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      // Skip enrichment failure for this job
      continue;
    }
  }
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
