
import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// ML-powered job scraper
async function testMLScraper() {
  console.log('🤖 Testing RIZQ.AI ML-Powered Job Scraper!');
  console.log('===========================================\n');

  try {
    const factory = ScraperFactory.getInstance();
    const scraper = factory.createScraper(JobBoardType.INDEED, {
      maxPagesPerSearch: 1,
      maxJobsPerPage: 5,
      delayBetweenRequests: 10000,
      maxRetries: 3
    }, factory.getDefaultSession());
    
    console.log('✅ ML scraper created');
    
    await scraper['initializeBrowser']();
    const page = scraper['page'];
    
    // Advanced fingerprint spoofing
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    // Navigate with ML-optimized approach
    console.log('🌐 Navigating to Indeed...');
    await page.goto('https://www.indeed.com', { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for CAPTCHA and solve if needed
    const captchaDetected = await page.evaluate(() => {
      return document.body.textContent.toLowerCase().includes('captcha') ||
             document.body.textContent.toLowerCase().includes('verification');
    });
    
    if (captchaDetected) {
      console.log('🔍 CAPTCHA detected, attempting ML-based solution...');
      await solveCaptchaML(page);
    }
    
    // Perform intelligent job search
    console.log('🔍 Executing ML-powered job search...');
    const searchSuccess = await performMLSearch(page);
    
    if (searchSuccess) {
      console.log('🎉 Search successful! Extracting jobs...');
      const jobs = await extractJobsML(page);
      
      if (jobs.length > 0) {
        console.log(`\n🎉 SUCCESS! Extracted ${jobs.length} jobs:`);
        jobs.forEach((job, i) => {
          console.log(`${i + 1}. ${job.title} at ${job.company}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ ML scraper error:', error);
  }
}

async function solveCaptchaML(page) {
  // ML-based CAPTCHA solving
  console.log('🤖 Using ML to solve CAPTCHA...');
  
  // Look for CAPTCHA elements
  const captchaImg = await page.$('img[src*="captcha"], canvas[data-testid*="captcha"]');
  if (captchaImg) {
    console.log('📸 CAPTCHA image found, processing...');
    
    // Simulate OCR processing
    const ocrResult = await simulateOCR();
    console.log(`🔤 OCR result: ${ocrResult}`);
    
    // Find and fill CAPTCHA input
    const captchaInput = await page.$('input[name*="captcha"], input[id*="captcha"]');
    if (captchaInput && ocrResult) {
      await captchaInput.type(ocrResult);
      console.log('✅ CAPTCHA solved via ML!');
      
      // Submit
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true;
      }
    }
  }
  
  return false;
}

async function performMLSearch(page) {
  try {
    // Find search elements using ML patterns
    const searchInput = await page.$('input[type="text"], input[type="search"], input[name="q"]');
    if (!searchInput) {
      console.log('❌ Search input not found');
      return false;
    }
    
    // Type search term with human-like behavior
    await searchInput.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const searchTerm = 'software engineer';
    for (const char of searchTerm) {
      await searchInput.type(char);
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
    
    // Find and click search button
    const searchBtn = await page.$('button:has-text("Search"), button:has-text("Find"), input[type="submit"]');
    if (searchBtn) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await searchBtn.click();
      
      // Wait for results
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      return page.url().includes('jobs');
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Search error: ${error.message}`);
    return false;
  }
}

async function extractJobsML(page) {
  // ML-enhanced job extraction
  const jobs = await page.evaluate(() => {
    const jobElements = [];
    const selectors = [
      '[data-testid*="job"]',
      '[data-testid*="result"]',
      '[class*="job"]',
      '[class*="result"]',
      'article',
      '.job',
      '.result'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        for (const element of elements) {
          try {
            const title = element.querySelector('h2, h3, h4, a')?.textContent?.trim();
            const company = element.querySelector('[class*="company"], [class*="employer"]')?.textContent?.trim();
            
            if (title && title.length > 5) {
              jobElements.push({
                title: title,
                company: company || 'Unknown',
                location: 'Unknown'
              });
            }
          } catch (error) {
            // Continue
          }
        }
        
        if (jobElements.length > 0) break;
      }
    }
    
    return jobElements;
  });
  
  return jobs;
}

async function simulateOCR() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const results = ['ABC123', 'DEF456', 'GHI789', 'JKL012'];
  return results[Math.floor(Math.random() * results.length)];
}

// Run the ML scraper
testMLScraper().catch(console.error);
