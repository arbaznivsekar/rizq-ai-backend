import { chromium } from 'playwright';
import fs from 'fs/promises';
// Optional DB ingest (build TS first: npm run build)
import { connectMongo } from './dist/src/db/mongo.js';
import { ingestJob } from './dist/src/data/pipelines/ingestEntry.js';

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
      try {
        await connectMongo();
        await persistToDatabase(jobs, { defaultCity: location, source: 'naukri_gulf' });
        console.log('💾 Saved jobs to MongoDB (ingest pipeline)');
      } catch (e) {
        console.log('⚠️ Skipped DB ingest:', e?.message || e);
      }

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
  console.log('🔍 Using multiple strategies to extract real jobs...');
  
  const jobs = await page.evaluate((maxJobs) => {
    const jobElements = [];
    
    // Strategy 1: Look for job cards with specific Naukri selectors
    const selectors = [
      // Naukri-specific selectors
      '[data-job-id]',
      '[data-testid*="job" i]',
      'article[class*="job" i]',
      '[class*="jobTuple" i]',
      '[class*="jobCard" i]',
      '[class*="job-listing" i]',
      '[class*="job-item" i]',
      '[class*="jobTupleHeader" i]',
      
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

// Scroll results list incrementally to trigger lazy loading
async function incrementalScroll(page, passes = 4) {
  for (let i = 0; i < passes; i++) {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(800 + Math.floor(Math.random() * 700));
  }
  // Final smooth scroll to bottom
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const step = 600;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total > document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });
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
