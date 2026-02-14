import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test search inspection to find correct selectors on search results page
async function testSearchInspection() {
  console.log('🔍 Testing RIZQ.AI Search Inspection!');
  console.log('=====================================\n');

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

    console.log('\n🔍 Testing search page inspection...');
    console.log('This will perform a job search and inspect the results page...');
    
    try {
      // Initialize browser
      await scraper['initializeBrowser']();
      const currentPage = scraper['page'];
      
      if (!currentPage) {
        throw new Error('Failed to get page instance');
      }

      console.log('🌐 Navigating to Indeed homepage...');
      await currentPage.goto('https://www.indeed.com', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      console.log('✅ Homepage loaded successfully');
      
      // Wait for page to load
      await currentPage.waitForTimeout(3000);
      
      // Check if we're redirected to a different country
      const currentUrl = currentPage.url();
      console.log(`🔗 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('in.indeed.com')) {
        console.log('⚠️ Redirected to Indian Indeed. Trying US site...');
        await currentPage.goto('https://www.indeed.com/jobs', { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        console.log(`🔗 New URL: ${currentPage.url()}`);
      }
      
      // Wait for page to load
      await currentPage.waitForTimeout(3000);
      
      // Try to find and fill the search form
      console.log('🔍 Looking for search form...');
      
      // Look for common search input selectors
      const searchSelectors = [
        'input[name="q"]',
        'input[name="query"]',
        'input[placeholder*="job"]',
        'input[placeholder*="title"]',
        'input[placeholder*="keyword"]',
        '[data-testid="text-input-userInput"]',
        '[data-testid="jobsearch-TextInput"]',
        '#text-input-what',
        '#what',
        '.jobsearch-TextInput'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          searchInput = await currentPage.$(selector);
          if (searchInput) {
            console.log(`✅ Found search input: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (searchInput) {
        console.log('✍️ Filling search form...');
        await searchInput.fill('software engineer');
        console.log('✅ Search term entered');
        
        // Look for location input
        const locationSelectors = [
          'input[name="l"]',
          'input[name="location"]',
          'input[placeholder*="city"]',
          'input[placeholder*="location"]',
          '[data-testid="text-input-location"]',
          '#text-input-where',
          '#where'
        ];
        
        let locationInput = null;
        for (const selector of locationSelectors) {
          try {
            locationInput = await currentPage.$(selector);
            if (locationInput) {
              console.log(`✅ Found location input: ${selector}`);
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }
        
        if (locationInput) {
          await locationInput.fill('remote');
          console.log('✅ Location entered');
        }
        
        // Look for search button
        const searchButtonSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button[aria-label*="search"]',
          'button[aria-label*="find"]',
          '[data-testid="jobsearch-Button"]',
          '.jobsearch-Button',
          '#jobsearch-button'
        ];
        
        let searchButton = null;
        for (const selector of searchButtonSelectors) {
          try {
            searchButton = await currentPage.$(selector);
            if (searchButton) {
              console.log(`✅ Found search button: ${selector}`);
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }
        
        if (searchButton) {
          console.log('🔍 Clicking search button...');
          await searchButton.click();
          console.log('✅ Search button clicked');
          
          // Wait for search results to load
          console.log('⏳ Waiting for search results...');
          await currentPage.waitForTimeout(8000);
          
          // Check current URL
          const searchUrl = currentPage.url();
          console.log(`🔗 Search URL: ${searchUrl}`);
          
          // Now inspect the search results page
          console.log('\n🔍 Inspecting search results page...');
          
          // Check for job-related elements on results page
          const resultSelectors = [
            '[data-testid="jobsearch-ResultsList"]',
            '[data-testid="jobsearch-ResultsListPage"]',
            '[data-testid*="Results"]',
            '[data-testid*="Job"]',
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
            '.job-listing',
            '[class*="serp"]',
            '[class*="mosaic"]'
          ];
          
          console.log('🔍 Checking for job results elements...');
          for (const selector of resultSelectors) {
            try {
              const element = await currentPage.$(selector);
              if (element) {
                console.log(`✅ Found element: ${selector}`);
                const text = await element.textContent();
                console.log(`   Content preview: ${text?.substring(0, 150)}...`);
              } else {
                console.log(`❌ Not found: ${selector}`);
              }
            } catch (error) {
              console.log(`⚠️ Error checking ${selector}: ${error.message}`);
            }
          }
          
          // Get all data-testid attributes on results page
          console.log('\n🔍 Looking for all data-testid attributes on results page...');
          const testIds = await currentPage.evaluate(() => {
            const elements = document.querySelectorAll('[data-testid]');
            const ids = [];
            elements.forEach(el => {
              ids.push(el.getAttribute('data-testid'));
            });
            return [...new Set(ids)];
          });
          
          if (testIds.length > 0) {
            console.log(`✅ Found ${testIds.length} data-testid attributes:`);
            testIds.forEach(id => console.log(`   - ${id}`));
          }
          
          // Take a screenshot of results page
          console.log('\n📸 Taking screenshot of search results...');
          await currentPage.screenshot({ 
            path: './indeed-search-results.png',
            fullPage: true 
          });
          console.log('✅ Screenshot saved as indeed-search-results.png');
          
        } else {
          console.log('❌ Search button not found');
        }
      } else {
        console.log('❌ Search input not found');
      }
      
      console.log('\n🎉 Search inspection completed successfully!');
      
    } catch (inspectionError) {
      console.log(`\n❌ Search inspection failed: ${inspectionError.message}`);
      console.log('This could be due to:');
      console.log('   - Browser not launching properly');
      console.log('   - Network connectivity issues');
      console.log('   - Indeed blocking automated access');
      console.log('   - Changes in Indeed\'s search form structure');
    }

    console.log('\n🎉 Search inspection test completed!');

  } catch (error) {
    console.error('❌ Error in search inspection test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSearchInspection().catch(console.error);
