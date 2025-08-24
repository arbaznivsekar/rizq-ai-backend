import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test page inspection to understand current HTML structure
async function testPageInspection() {
  console.log('🔍 Testing RIZQ.AI Page Inspection!');
  console.log('==================================\n');

  try {
    // Get the scraper factory instance
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory instance created');

    // Create Indeed scraper
    const defaultConfig = factory.getDefaultConfig(JobBoardType.INDEED);
    const defaultSession = factory.getDefaultSession();
    
    console.log('🔍 Creating Indeed scraper...');
    const scraper = factory.createScraper(JobBoardType.INDEED, defaultConfig, defaultSession);
    console.log(`✅ Indeed scraper created: ${scraper.constructor.name}`);

    console.log('\n🔍 Testing page inspection...');
    console.log('This will launch a browser and inspect the page content...');
    
    try {
      // Access the browser and page from the scraper
      const browser = await scraper['browser'];
      const page = await scraper['page'];
      
      if (!browser || !page) {
        console.log('❌ Browser or page not available. Initializing...');
        await scraper['initializeBrowser']();
      }
      
      const currentPage = scraper['page'];
      if (!currentPage) {
        throw new Error('Failed to get page instance');
      }

      console.log('🌐 Navigating to Indeed homepage...');
      await currentPage.goto('https://www.indeed.com', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      console.log('✅ Page loaded successfully');
      
      // Wait a bit for dynamic content to load
      console.log('⏳ Waiting for page to fully load...');
      await currentPage.waitForTimeout(5000);
      
      // Get page title
      const title = await currentPage.title();
      console.log(`📄 Page title: ${title}`);
      
      // Get page URL
      const url = currentPage.url();
      console.log(`🔗 Current URL: ${url}`);
      
      // Check for common job-related elements
      console.log('\n🔍 Inspecting page elements...');
      
      // Check for various possible selectors
      const selectorsToCheck = [
        '[data-testid="jobsearch-ResultsList"]',
        '[data-testid="jobsearch-ResultsListPage"]',
        '.jobsearch-ResultsList',
        '.jobsearch-ResultsListPage',
        '.resultsList',
        '.jobs-list',
        '[class*="jobsearch"]',
        '[class*="results"]',
        '[class*="jobs"]',
        'main',
        'article',
        '.job',
        '.job-card',
        '.job-listing'
      ];
      
      console.log('🔍 Checking for job-related elements...');
      for (const selector of selectorsToCheck) {
        try {
          const element = await currentPage.$(selector);
          if (element) {
            console.log(`✅ Found element: ${selector}`);
            const text = await element.textContent();
            console.log(`   Content preview: ${text?.substring(0, 100)}...`);
          } else {
            console.log(`❌ Not found: ${selector}`);
          }
        } catch (error) {
          console.log(`⚠️ Error checking ${selector}: ${error.message}`);
        }
      }
      
      // Get all elements with data-testid attributes
      console.log('\n🔍 Looking for all data-testid attributes...');
      const testIds = await currentPage.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        const ids = [];
        elements.forEach(el => {
          ids.push(el.getAttribute('data-testid'));
        });
        return [...new Set(ids)]; // Remove duplicates
      });
      
      if (testIds.length > 0) {
        console.log(`✅ Found ${testIds.length} data-testid attributes:`);
        testIds.forEach(id => console.log(`   - ${id}`));
      } else {
        console.log('❌ No data-testid attributes found');
      }
      
      // Get all elements with class names containing 'job'
      console.log('\n🔍 Looking for job-related classes...');
      const jobClasses = await currentPage.evaluate(() => {
        const elements = document.querySelectorAll('[class*="job"]');
        const classes = [];
        elements.forEach(el => {
          el.classList.forEach(cls => {
            if (cls.toLowerCase().includes('job')) {
              classes.push(cls);
            }
          });
        });
        return [...new Set(classes)]; // Remove duplicates
      });
      
      if (jobClasses.length > 0) {
        console.log(`✅ Found ${jobClasses.length} job-related classes:`);
        jobClasses.forEach(cls => console.log(`   - ${cls}`));
      } else {
        console.log('❌ No job-related classes found');
      }
      
      // Take a screenshot for manual inspection
      console.log('\n📸 Taking screenshot for manual inspection...');
      await currentPage.screenshot({ 
        path: './indeed-page-inspection.png',
        fullPage: true 
      });
      console.log('✅ Screenshot saved as indeed-page-inspection.png');
      
      // Get page HTML structure (first 2000 characters)
      console.log('\n🔍 Getting page HTML structure...');
      const html = await currentPage.content();
      console.log(`📄 Page HTML length: ${html.length} characters`);
      console.log(`📄 HTML preview (first 1000 chars):`);
      console.log(html.substring(0, 1000));
      
      console.log('\n🎉 Page inspection completed successfully!');
      
    } catch (inspectionError) {
      console.log(`\n❌ Page inspection failed: ${inspectionError.message}`);
      console.log('This could be due to:');
      console.log('   - Browser not launching properly');
      console.log('   - Network connectivity issues');
      console.log('   - Indeed blocking automated access');
    }

    console.log('\n🎉 Page inspection test completed!');

  } catch (error) {
    console.error('❌ Error in page inspection test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPageInspection().catch(console.error);
