import { ScrapingService } from './dist/src/scraping/services/scrapingService.js';
import { JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test the scraping service directly
async function testScrapingService() {
  console.log('🚀 Testing RIZQ.AI Scraping Service Directly!');
  console.log('==============================================\n');

  try {
    // Get the scraping service instance
    const scrapingService = ScrapingService.getInstance();
    console.log('✅ Scraping service instance created');

    // Test getting scraper stats
    const stats = scrapingService.getStats();
    console.log(`✅ Scraper stats: ${JSON.stringify(stats, null, 2)}`);

    // Get available scrapers from stats
    const availableScrapers = stats.availableScrapers || [];
    console.log(`✅ Available scrapers: ${JSON.stringify(availableScrapers)}`);

    // Test starting a scraping job
    if (availableScrapers.includes(JobBoardType.INDEED)) {
      console.log('\n🔍 Testing Indeed scraper...');
      
      const searchParams = {
        query: "software engineer",
        location: "remote",
        jobType: ["Full-time", "Remote"]
      };

      const config = {
        maxPagesPerSearch: 2,
        delayBetweenRequests: 2000,
        maxJobsPerPage: 10
      };

      console.log('Starting scraping job...');
      const jobId = await scrapingService.startScrapingJob(
        JobBoardType.INDEED,
        searchParams,
        config
      );

      console.log(`✅ Scraping job started with ID: ${jobId}`);

      // Wait a bit and check job status
      console.log('Waiting for job to progress...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const jobStatus = scrapingService.getJobStatus(jobId);
      if (jobStatus) {
        console.log(`✅ Job status: ${JSON.stringify(jobStatus, null, 2)}`);
      } else {
        console.log('⚠️ Job status not found');
      }

    } else {
      console.log('❌ Indeed scraper not available');
    }

    console.log('\n🎉 Direct testing completed!');

  } catch (error) {
    console.error('❌ Error testing scraping service:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testScrapingService().catch(console.error);
