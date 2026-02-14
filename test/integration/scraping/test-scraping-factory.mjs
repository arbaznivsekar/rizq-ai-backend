import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test the scraper factory directly
async function testScraperFactory() {
  console.log('🚀 Testing RIZQ.AI Scraper Factory!');
  console.log('=====================================\n');

  try {
    // Get the scraper factory instance
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory instance created');

    // Test getting available scrapers
    const availableScrapers = factory.getAvailableScrapers();
    console.log(`✅ Available scrapers: ${JSON.stringify(availableScrapers)}`);

    // Test getting scraper stats
    const stats = factory.getScraperStats();
    console.log(`✅ Scraper stats: ${JSON.stringify(stats, null, 2)}`);

    // Test getting default config for Indeed
    if (availableScrapers.includes(JobBoardType.INDEED)) {
      console.log('\n🔍 Testing Indeed scraper configuration...');
      
      const defaultConfig = factory.getDefaultConfig(JobBoardType.INDEED);
      console.log(`✅ Indeed default config: ${JSON.stringify(defaultConfig, null, 2)}`);

      const defaultSession = factory.getDefaultSession();
      console.log(`✅ Default session: ${JSON.stringify(defaultSession, null, 2)}`);

      // Test creating a scraper
      console.log('\n🔍 Testing scraper creation...');
      try {
        const scraper = factory.createScraper(JobBoardType.INDEED, defaultConfig, defaultSession);
        console.log(`✅ Indeed scraper created: ${scraper.constructor.name}`);
        
        // Test basic scraper methods
        const baseUrl = scraper.getBaseUrl();
        console.log(`✅ Base URL: ${baseUrl}`);
        
        // Test building search URL
        const searchParams = {
          query: "software engineer",
          location: "remote",
          jobType: ["Full-time", "Remote"]
        };
        
        const searchUrl = scraper.buildSearchUrl(searchParams);
        console.log(`✅ Search URL: ${searchUrl}`);
        
        console.log('\n🎉 Scraper factory testing completed successfully!');
        
      } catch (error) {
        console.log(`❌ Scraper creation failed: ${error.message}`);
        console.log('This might be expected if Playwright is not fully set up');
      }
    } else {
      console.log('❌ Indeed scraper not available');
    }

  } catch (error) {
    console.error('❌ Error testing scraper factory:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testScraperFactory().catch(console.error);
