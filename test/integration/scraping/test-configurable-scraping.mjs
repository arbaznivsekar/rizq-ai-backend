import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';
import fs from 'fs/promises';

// Test configurable scraping functionality
async function testConfigurableScraping(searchQuery = 'software engineer', location = 'remote', maxJobs = 10) {
  console.log(`🚀 Testing RIZQ.AI Configurable Scraping!`);
  console.log(`🔍 Search Query: "${searchQuery}"`);
  console.log(`📍 Location: "${location}"`);
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
      maxJobsPerPage: maxJobs,     // Configurable jobs per page
      delayBetweenRequests: 3000,  // 3 second delay
      maxRetries: 1                // Minimal retries for testing
    };

    console.log('\n🔍 Testing job scraping...');
    console.log('This will take a few moments as it needs to launch a browser...');
    
    const searchParams = {
      query: searchQuery,
      location: location,
      jobType: ["Full-time", "Remote", "Part-time", "Contract"]
    };

    try {
      // Test the scraping
      const result = await scraper.scrapeJobs(searchParams);
      
      console.log('\n✅ Scraping completed successfully!');
      
      if (result.jobs && result.jobs.length > 0) {
        console.log(`🎯 Successfully scraped ${result.jobs.length} jobs for "${searchQuery}":`);
        
        // Save results to file
        const timestamp = new Date().toISOString();
        const safeQuery = searchQuery.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const filename = `scraped-jobs-${safeQuery}-${timestamp.split('T')[0]}.json`;
        
        const resultData = {
          timestamp: timestamp,
          searchQuery: searchQuery,
          location: location,
          totalJobs: result.jobs.length,
          jobs: result.jobs
        };

        await fs.writeFile(filename, JSON.stringify(resultData, null, 2));
        console.log(`💾 Results saved to: ${filename}`);
        
        result.jobs.forEach((job, index) => {
          console.log(`\n${index + 1}. ${job.title}`);
          console.log(`   Company: ${job.company}`);
          console.log(`   Location: ${job.location}`);
          console.log(`   Type: ${job.jobType || 'Not specified'}`);
          console.log(`   URL: ${job.url}`);
        });
      } else {
        console.log('\n⚠️ No jobs were scraped. This might be due to:');
        console.log('   - Anti-bot measures on Indeed');
        console.log('   - Network issues');
        console.log('   - Changes in Indeed\'s HTML structure');
        console.log('   - No jobs available for the specified query/location');
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

    console.log('\n🎉 Configurable scraping test completed!');

  } catch (error) {
    console.error('❌ Error in configurable scraping test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: node test-configurable-scraping.mjs [search-query] [options]

Arguments:
  search-query          The job search query (default: "software engineer")

Options:
  --location <loc>      Location for job search (default: remote)
  --max-jobs <num>      Maximum jobs per search (default: 10)

Examples:
  node test-configurable-scraping.mjs "data scientist"
  node test-configurable-scraping.mjs "marketing manager" --location "New York"
  node test-configurable-scraping.mjs "nurse" --location "Los Angeles" --max-jobs 20
  node test-configurable-scraping.mjs "graphic designer" --location "remote"
  node test-configurable-scraping.mjs "sales representative" --location "Chicago"
  `);
} else {
  const searchQuery = args[0];
  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 ? args[locationIndex + 1] : 'remote';
  
  const maxJobsIndex = args.indexOf('--max-jobs');
  const maxJobs = maxJobsIndex !== -1 ? parseInt(args[maxJobsIndex + 1]) : 10;

  testConfigurableScraping(searchQuery, location, maxJobs).catch(console.error);
}


