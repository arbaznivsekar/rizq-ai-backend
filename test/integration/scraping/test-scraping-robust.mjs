import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test robust scraping functionality
async function testRobustScraping() {
  console.log('🚀 Testing RIZQ.AI Robust Scraping!');
  console.log('====================================\n');

  try {
    // Get the scraper factory instance
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory instance created');

    // Create Indeed scraper with more lenient settings
    const defaultConfig = factory.getDefaultConfig(JobBoardType.INDEED);
    const defaultSession = factory.getDefaultSession();
    
    // Modify config for testing
    const testConfig = {
      ...defaultConfig,
      maxPagesPerSearch: 1,
      maxJobsPerPage: 3,
      delayBetweenRequests: 10000,  // 10 second delay
      maxRetries: 2,
      // Increase timeouts
      timeout: 30000  // 30 seconds
    };
    
    console.log('🔍 Creating Indeed scraper with test config...');
    const scraper = factory.createScraper(JobBoardType.INDEED, testConfig, defaultSession);
    console.log(`✅ Indeed scraper created: ${scraper.constructor.name}`);

    console.log('\n🔍 Testing basic browser functionality...');
    
    try {
      // Test if we can at least navigate to Indeed homepage
      console.log('Testing navigation to Indeed homepage...');
      
      // We'll test a simpler approach - just navigate to the homepage first
      const baseUrl = 'https://www.indeed.com';
      console.log(`Navigating to: ${baseUrl}`);
      
      // This is a basic test to see if the browser can connect
      const result = await scraper.scrapeJobs({
        query: "test",
        location: "",
        customFilters: {}
      });
      
      console.log('\n✅ Basic scraping test completed!');
      console.log(`📊 Results summary:`);
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Jobs found: ${result.jobs.length}`);
      console.log(`   - Duration: ${result.duration}ms`);
      console.log(`   - Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.code}: ${error.message}`);
        });
      }
      
      if (result.jobs.length > 0) {
        console.log('\n🎯 Jobs scraped:');
        result.jobs.forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
        });
      }
      
    } catch (scrapingError) {
      console.log(`\n❌ Scraping test failed: ${scrapingError.message}`);
      
      // Provide detailed error analysis
      if (scrapingError.message.includes('Timeout')) {
        console.log('\n💡 Timeout Error Analysis:');
        console.log('   - The page took too long to load');
        console.log('   - This could be due to:');
        console.log('     * Slow internet connection');
        console.log('   - Indeed\'s anti-bot measures');
        console.log('     * Network congestion');
        console.log('     * Page complexity');
      } else if (scrapingError.message.includes('NetworkError')) {
        console.log('\n💡 Network Error Analysis:');
        console.log('   - Failed to establish connection');
        console.log('   - This could be due to:');
        console.log('     * Firewall blocking the connection');
        console.log('     * Proxy/VPN issues');
        console.log('     * Indeed blocking the IP');
      } else if (scrapingError.message.includes('browser')) {
        console.log('\n💡 Browser Error Analysis:');
        console.log('   - Browser-related issue');
        console.log('   - This could be due to:');
        console.log('     * Playwright browser not properly installed');
        console.log('     * System resource limitations');
        console.log('     * Antivirus blocking browser launch');
      }
      
      console.log('\n🔧 Troubleshooting suggestions:');
      console.log('   1. Check internet connection');
      console.log('   2. Try running without VPN/proxy');
      console.log('   3. Check if Indeed is accessible in your browser');
      console.log('   4. Consider increasing timeouts in the config');
    }

    console.log('\n🎉 Robust scraping test completed!');

  } catch (error) {
    console.error('❌ Error in robust scraping test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRobustScraping().catch(console.error);
