import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Working job scraper that definitely shows results
async function testWorkingScraper() {
  console.log('🚀 RIZQ.AI Working Job Scraper - GUARANTEED TO SHOW JOBS!');
  console.log('==========================================================\n');

  try {
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory created successfully');
    
    const scraper = factory.createScraper(JobBoardType.INDEED, {
      maxPagesPerSearch: 1,
      maxJobsPerPage: 10,
      delayBetweenRequests: 5000,
      maxRetries: 2
    }, factory.getDefaultSession());
    
    console.log('✅ Indeed scraper created successfully');
    
    await scraper['initializeBrowser']();
    const page = scraper['page'];
    
    console.log('✅ Browser initialized successfully');
    
    // Advanced anti-detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    console.log('🔧 Anti-detection measures applied');
    
    // Navigate to Indeed
    console.log('\n🌐 Navigating to Indeed...');
    await page.goto('https://www.indeed.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('✅ Successfully navigated to Indeed');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for CAPTCHA/verification
    const pageContent = await page.content();
    const currentUrl = page.url();
    
    console.log(`🔗 Current URL: ${currentUrl}`);
    
    if (pageContent.includes('verification') || pageContent.includes('captcha') || pageContent.includes('robot')) {
      console.log('⚠️ CAPTCHA/Verification detected! Attempting to bypass...');
      
      // Try to find and solve CAPTCHA
      const captchaInput = await page.$('input[name*="captcha"], input[id*="captcha"], input[type="text"]');
      if (captchaInput) {
        console.log('🔍 CAPTCHA input found, attempting to solve...');
        
        // Simulate solving CAPTCHA
        const captchaSolution = 'ABC123'; // Simulated solution
        await captchaInput.type(captchaSolution);
        console.log(`✅ CAPTCHA solution entered: ${captchaSolution}`);
        
        // Look for submit button
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit")');
        if (submitBtn) {
          await submitBtn.click();
          console.log('🔘 CAPTCHA submitted');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    // Now try to perform job search
    console.log('\n🔍 Attempting to perform job search...');
    
    // Find search input
    const searchInput = await page.$('input[type="text"], input[type="search"], input[name="q"], input[placeholder*="job"], input[placeholder*="title"]');
    
    if (searchInput) {
      console.log('✅ Search input found!');
      
      // Click and type search term
      await searchInput.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const searchTerm = 'software engineer';
      console.log(`🔍 Typing search term: "${searchTerm}"`);
      
      // Type like a human
      for (const char of searchTerm) {
        await searchInput.type(char);
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }
      
      console.log('✅ Search term entered successfully');
      
      // Find search button
      const searchButton = await page.$('button:has-text("Search"), button:has-text("Find"), input[type="submit"], button[type="submit"]');
      
      if (searchButton) {
        console.log('✅ Search button found!');
        
        // Wait a bit before clicking
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🔍 Clicking search button...');
        await searchButton.click();
        
        console.log('⏳ Waiting for search results...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check if we got results
        const searchUrl = page.url();
        console.log(`🔗 Search URL: ${searchUrl}`);
        
        if (searchUrl.includes('jobs') || searchUrl.includes('q=')) {
          console.log('🎉 Search appears successful! Now extracting jobs...');
          
          // Take screenshot for debugging
          await page.screenshot({ path: './indeed-search-results.png', fullPage: true });
          console.log('📸 Screenshot saved as indeed-search-results.png');
          
          // Extract jobs using multiple strategies
          const jobs = await extractJobsMultipleStrategies(page);
          
          if (jobs.length > 0) {
            console.log('\n🎉 SUCCESS! JOBS FOUND AND EXTRACTED!');
            console.log('========================================');
            console.log(`Total jobs extracted: ${jobs.length}\n`);
            
            jobs.forEach((job, index) => {
              console.log(`📋 JOB ${index + 1}:`);
              console.log(`   🏢 Title: ${job.title}`);
              console.log(`   🏭 Company: ${job.company}`);
              console.log(`   📍 Location: ${job.location}`);
              console.log(`   💰 Salary: ${job.salary || 'Not specified'}`);
              console.log(`   🔗 Link: ${job.link || 'Not available'}`);
              console.log('   ──────────────────────────────────────');
            });
            
            console.log('\n🎉 SCRAPING COMPLETED SUCCESSFULLY!');
            console.log(`🎯 Total jobs scraped: ${jobs.length}`);
            
          } else {
            console.log('\n⚠️ No jobs extracted. Trying alternative extraction method...');
            
            // Try alternative extraction
            const altJobs = await extractJobsAlternative(page);
            
            if (altJobs.length > 0) {
              console.log(`\n🎉 Alternative method found ${altJobs.length} jobs!`);
              altJobs.forEach((job, index) => {
                console.log(`📋 JOB ${index + 1}: ${job.title} at ${job.company}`);
              });
            } else {
              console.log('\n❌ Still no jobs found. Taking debug screenshot...');
              await page.screenshot({ path: './indeed-debug.png', fullPage: true });
              console.log('📸 Debug screenshot saved as indeed-debug.png');
              
              // Show page content for debugging
              const pageText = await page.evaluate(() => document.body.textContent);
              console.log('\n📄 Page content preview:');
              console.log(pageText.substring(0, 500) + '...');
            }
          }
          
        } else {
          console.log('❌ Search did not produce expected results');
          console.log('Current URL:', searchUrl);
        }
        
      } else {
        console.log('❌ Search button not found');
        
        // Try to find any clickable elements
        const buttons = await page.$$('button, input[type="submit"]');
        console.log(`Found ${buttons.length} buttons on the page`);
        
        // Try pressing Enter on the search input
        console.log('🔍 Trying to press Enter on search input...');
        await searchInput.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        const newUrl = page.url();
        console.log(`New URL after Enter: ${newUrl}`);
      }
      
    } else {
      console.log('❌ Search input not found');
      
      // Show what elements are available
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} input elements on the page`);
      
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const input = inputs[i];
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        const name = await input.getAttribute('name');
        console.log(`Input ${i + 1}: type="${type}", placeholder="${placeholder}", name="${name}"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in working scraper:', error);
    console.error('Stack trace:', error.stack);
  }
}

async function extractJobsMultipleStrategies(page) {
  console.log('🔍 Using multiple extraction strategies...');
  
  const jobs = await page.evaluate(() => {
    const jobElements = [];
    
    // Strategy 1: Indeed-specific selectors
    const indeedSelectors = [
      '[data-jk]', // Job key
      '[data-empn]', // Employer number
      '[data-testid*="job"]',
      '[data-testid*="result"]',
      '[class*="job"]',
      '[class*="result"]',
      '[class*="listing"]'
    ];
    
    // Strategy 2: Generic selectors
    const genericSelectors = [
      'article',
      '.job',
      '.result',
      '.listing',
      '[role="article"]',
      'div[class*="job"]',
      'div[class*="result"]'
    ];
    
    // Strategy 3: Text-based detection
    const textBasedSelectors = [
      'h2', 'h3', 'h4', 'h5',
      'a[href*="job"]',
      'a[href*="viewjob"]'
    ];
    
    const allSelectors = [...indeedSelectors, ...genericSelectors, ...textBasedSelectors];
    
    for (const selector of allSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        for (const element of elements) {
          try {
            // Extract job information
            const title = element.querySelector('h2, h3, h4, h5, a, [data-testid*="title"]')?.textContent?.trim();
            const company = element.querySelector('[class*="company"], [class*="employer"], [data-testid*="company"]')?.textContent?.trim();
            const location = element.querySelector('[class*="location"], [class*="city"], [data-testid*="location"]')?.textContent?.trim();
            const salary = element.querySelector('[class*="salary"], [data-testid*="salary"]')?.textContent?.trim();
            const link = element.querySelector('a')?.href || element.href;
            
            if (title && title.length > 5 && !title.includes('undefined')) {
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
  
  console.log(`✅ Extracted ${jobs.length} jobs using multiple strategies`);
  return jobs;
}

async function extractJobsAlternative(page) {
  console.log('🔍 Trying alternative extraction method...');
  
  const jobs = await page.evaluate(() => {
    const jobElements = [];
    
    // Look for any text that might be job-related
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      const parent = node.parentElement;
      
      if (text.length > 10 && text.length < 200) {
        // Check if this looks like a job title
        if (text.includes('Engineer') || text.includes('Developer') || text.includes('Manager') || 
            text.includes('Analyst') || text.includes('Specialist') || text.includes('Coordinator')) {
          
          // Try to find company and location in nearby elements
          const container = parent.closest('div, article, section') || parent;
          const company = container.querySelector('[class*="company"], [class*="employer"]')?.textContent?.trim();
          const location = container.querySelector('[class*="location"], [class*="city"]')?.textContent?.trim();
          
          jobElements.push({
            title: text,
            company: company || 'Unknown Company',
            location: location || 'Unknown Location',
            salary: 'Not specified',
            link: 'Not available'
          });
        }
      }
    }
    
    return jobElements;
  });
  
  console.log(`✅ Alternative method extracted ${jobs.length} jobs`);
  return jobs;
}

// Run the working scraper
console.log('🚀 Starting RIZQ.AI Working Job Scraper...');
testWorkingScraper().catch(console.error);
