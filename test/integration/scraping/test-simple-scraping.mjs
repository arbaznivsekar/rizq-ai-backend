import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test simple scraping functionality
async function testSimpleScraping() {
  console.log('🚀 Testing RIZQ.AI Simple Scraping!');
  console.log('====================================\n');

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

    // Test with minimal configuration to avoid rate limiting
    const testConfig = {
      ...defaultConfig,
      maxPagesPerSearch: 1,        // Only 1 page for testing
      maxJobsPerPage: 5,           // Only 5 jobs for testing
      delayBetweenRequests: 5000,  // 5 second delay
      maxRetries: 1                // Minimal retries for testing
    };

    console.log('\n🔍 Testing job scraping...');
    console.log('This will take a few moments as it needs to launch a browser...');
    
    const searchParams = {
      query: "software engineer",
      location: "remote",
      jobType: ["Full-time", "Remote"]
    };

    try {
      // Test the scraping
      const result = await scraper.scrapeJobs(searchParams);
      
      console.log('\n✅ Scraping completed successfully!');
      console.log(`📊 Results: ${JSON.stringify(result, null, 2)}`);
      
      if (result.jobs && result.jobs.length > 0) {
        console.log(`\n🎯 Successfully scraped ${result.jobs.length} jobs:`);
        result.jobs.forEach((job, index) => {
          console.log(`\n${index + 1}. ${job.title}`);
          console.log(`   Company: ${job.company}`);
          console.log(`   Location: ${job.location}`);
          console.log(`   Type: ${job.jobType}`);
          console.log(`   URL: ${job.url}`);
        });
      } else {
        console.log('\n⚠️ No jobs were scraped. This might be due to:');
        console.log('   - Anti-bot measures on Indeed');
        console.log('   - Network issues');
        console.log('   - Changes in Indeed\'s HTML structure');
      }
      
    } catch (scrapingError) {
      console.log(`\n❌ Scraping failed: ${scrapingError.message}`);
      console.log('This is common during testing due to:');
      console.log('   - Anti-bot detection');
      console.log('   - Network timeouts');
      console.log('   - Indeed\'s security measures');
      
      if (scrapingError.message.includes('browser')) {
        console.log('\n💡 Browser-related error. This might indicate:');
        console.log('   - Playwright browser not properly installed');
        console.log('   - System resource limitations');
        console.log('   - Antivirus blocking browser launch');
      }
    }

    console.log('\n🎉 Simple scraping test completed!');

  } catch (error) {
    console.error('❌ Error in simple scraping test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSimpleScraping().catch(console.error);
