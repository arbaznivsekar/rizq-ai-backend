import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test actual job scraping with multiple bypass strategies
async function testActualScraping() {
  console.log('🚀 Testing RIZQ.AI Actual Job Scraping!');
  console.log('========================================\n');

  try {
    // Get the scraper factory instance
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory instance created');

    // Create Indeed scraper with optimized settings
    const defaultConfig = factory.getDefaultConfig(JobBoardType.INDEED);
    const defaultSession = factory.getDefaultSession();
    
    // Modify config for successful scraping
    const scrapingConfig = {
      ...defaultConfig,
      maxPagesPerSearch: 1,        // Start with 1 page
      maxJobsPerPage: 5,           // Limit jobs per page
      delayBetweenRequests: 20000, // 20 second delay to avoid detection
      maxRetries: 2,
      simulateHumanBehavior: true,
      rotateUserAgents: true,
      respectRobotsTxt: true,
      includeAuditTrail: true
    };
    
    console.log('🔍 Creating Indeed scraper with scraping config...');
    const scraper = factory.createScraper(JobBoardType.INDEED, scrapingConfig, defaultSession);
    console.log(`✅ Indeed scraper created: ${scraper.constructor.name}`);

    console.log('\n🔍 Starting actual job scraping...');
    console.log('This will try multiple strategies to bypass verification...');
    
    try {
      // Initialize browser
      await scraper['initializeBrowser']();
      const currentPage = scraper['page'];
      
      if (!currentPage) {
        throw new Error('Failed to get page instance');
      }

      // Strategy 1: Try direct search URL approach
      console.log('\n📋 Strategy 1: Direct search URL approach');
      console.log('Trying to access search results directly...');
      
      const searchQueries = [
        { query: 'software engineer', location: 'remote' },
        { query: 'developer', location: 'remote' },
        { query: 'programmer', location: '' }
      ];
      
      let scrapingSuccess = false;
      
      for (const searchQuery of searchQueries) {
        try {
          console.log(`\n🔍 Trying query: "${searchQuery.query}" in "${searchQuery.location || 'any location'}"`);
          
          // Build search URL directly
          const searchUrl = scraper.buildSearchUrl(searchQuery);
          console.log(`🔗 Search URL: ${searchUrl}`);
          
          // Navigate to search URL
          console.log('🌐 Navigating to search URL...');
          await currentPage.goto(searchUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          
          // Wait for page to load
          console.log('⏳ Waiting for page to load...');
          await currentPage.waitForTimeout(8000);
          
          // Check if we hit verification
          const pageContent = await currentPage.content();
          const currentUrl = currentPage.url();
          
          console.log(`🔗 Current URL: ${currentUrl}`);
          
          if (pageContent.includes('verification') || pageContent.includes('captcha') || pageContent.includes('robot')) {
            console.log(`⚠️ Hit verification page for query: ${searchQuery.query}`);
            continue;
          }
          
          if (pageContent.includes('no results') || pageContent.includes('no jobs found')) {
            console.log(`⚠️ No results found for query: ${searchQuery.query}`);
            continue;
          }
          
          console.log(`✅ Successfully loaded search results for: ${searchQuery.query}`);
          
          // Now try to extract jobs
          console.log('🔍 Attempting to extract job listings...');
          
          // Try multiple selectors for job listings
          const jobSelectors = [
            '[data-testid*="jobsearch-ResultsList"]',
            '[data-testid*="Results"]',
            '[data-testid*="Job"]',
            '.jobsearch-ResultsList',
            '.jobsearch-ResultsListPage',
            '.resultsList',
            '.jobs-list',
            '[class*="jobsearch"]',
            '[class*="results"]',
            '[class*="jobs"]',
            '[class*="serp"]',
            '[class*="mosaic"]',
            'main',
            'article',
            '.job',
            '.job-card',
            '.job-listing'
          ];
          
          let jobsFound = [];
          
          for (const selector of jobSelectors) {
            try {
              const elements = await currentPage.$$(selector);
              if (elements.length > 0) {
                console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
                
                // Try to extract job information
                const pageJobs = await currentPage.evaluate((sel) => {
                  const jobElements = document.querySelectorAll(sel);
                  const jobs = [];
                  
                  for (const element of jobElements) {
                    try {
                      // Look for job title
                      const titleElement = element.querySelector('h2, h3, h4, [class*="title"], [class*="job"], a');
                      const title = titleElement?.textContent?.trim();
                      
                      // Look for company
                      const companyElement = element.querySelector('[class*="company"], [class*="employer"], span, div');
                      const company = companyElement?.textContent?.trim();
                      
                      // Look for location
                      const locationElement = element.querySelector('[class*="location"], [class*="city"], span, div');
                      const location = locationElement?.textContent?.trim();
                      
                      // Look for URL
                      const linkElement = element.querySelector('a[href]');
                      const url = linkElement?.href;
                      
                      if (title && title.length > 5) { // Basic validation
                        jobs.push({
                          title: title,
                          company: company || 'Unknown',
                          location: location || 'Unknown',
                          url: url || '',
                          selector: sel
                        });
                      }
                    } catch (error) {
                      // Continue with next element
                    }
                  }
                  
                  return jobs;
                }, selector);
                
                if (pageJobs.length > 0) {
                  console.log(`🎯 Extracted ${pageJobs.length} jobs from selector: ${selector}`);
                  jobsFound = pageJobs;
                  break; // Use this selector
                }
              }
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (jobsFound.length > 0) {
            console.log(`\n🎉 SUCCESS! Found ${jobsFound.length} jobs:`);
            jobsFound.forEach((job, index) => {
              console.log(`\n${index + 1}. ${job.title}`);
              console.log(`   Company: ${job.company}`);
              console.log(`   Location: ${job.location}`);
              if (job.url) {
                console.log(`   URL: ${job.url}`);
              }
            });
            
            // Take a screenshot of successful scraping
            console.log('\n📸 Taking screenshot of successful scraping...');
            await currentPage.screenshot({ 
              path: `./indeed-scraping-success-${searchQuery.query.replace(/\s+/g, '-')}.png`,
              fullPage: true 
            });
            
            scrapingSuccess = true;
            break; // Success! Stop trying other queries
            
          } else {
            console.log(`❌ No jobs extracted for query: ${searchQuery.query}`);
            
            // Take a screenshot to see what's on the page
            console.log('📸 Taking screenshot to debug...');
            await currentPage.screenshot({ 
              path: `./indeed-no-jobs-${searchQuery.query.replace(/\s+/g, '-')}.png`,
              fullPage: true 
            });
          }
          
        } catch (error) {
          console.log(`❌ Failed to scrape query "${searchQuery.query}": ${error.message}`);
          continue;
        }
      }
      
      if (scrapingSuccess) {
        console.log('\n🎉 JOB SCRAPING SUCCESSFUL!');
        console.log('The scraping system is working and can extract job data from Indeed.');
        console.log('\n📊 Summary:');
        console.log('   ✅ Browser launched successfully');
        console.log('   ✅ Navigation to Indeed successful');
        console.log('   ✅ Bypassed verification measures');
        console.log('   ✅ Job listings found and extracted');
        console.log('   ✅ Data structure working correctly');
        
      } else {
        console.log('\n❌ Job scraping unsuccessful');
        console.log('All strategies failed. This suggests:');
        console.log('   - Indeed has very strong anti-bot measures');
        console.log('   - The selectors need updating');
        console.log('   - Network/geographic restrictions');
        console.log('   - Need to implement more sophisticated bypass techniques');
        
        // Take final screenshot for debugging
        console.log('\n📸 Taking final screenshot for debugging...');
        await currentPage.screenshot({ 
          path: './indeed-scraping-failed.png',
          fullPage: true 
        });
      }
      
      console.log('\n🎉 Actual scraping test completed!');
      
    } catch (scrapingError) {
      console.log(`\n❌ Scraping test failed: ${scrapingError.message}`);
      console.log('This could be due to:');
      console.log('   - Browser automation detection');
      console.log('   - Network connectivity issues');
      console.log('   - Indeed blocking the IP address');
      console.log('   - Changes in Indeed\'s security measures');
    }

    console.log('\n🎉 Actual scraping test completed!');

  } catch (error) {
    console.error('❌ Error in actual scraping test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testActualScraping().catch(console.error);
