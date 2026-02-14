import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';
import fs from 'fs/promises';
import path from 'path';

// Job domains with different search queries
const JOB_DOMAINS = {
  'software-engineering': [
    'software engineer',
    'full stack developer',
    'frontend developer',
    'backend developer',
    'devops engineer',
    'data engineer',
    'machine learning engineer',
    'mobile developer',
    'ui/ux designer'
  ],
  'marketing': [
    'digital marketing',
    'social media manager',
    'content marketing',
    'seo specialist',
    'marketing manager',
    'brand manager',
    'growth hacker',
    'email marketing',
    'ppc specialist'
  ],
  'sales': [
    'sales representative',
    'account executive',
    'sales manager',
    'business development',
    'sales director',
    'inside sales',
    'field sales',
    'sales engineer',
    'customer success'
  ],
  'finance': [
    'financial analyst',
    'accountant',
    'financial advisor',
    'investment banker',
    'credit analyst',
    'treasurer',
    'controller',
    'auditor',
    'risk analyst'
  ],
  'healthcare': [
    'nurse',
    'doctor',
    'pharmacist',
    'medical assistant',
    'healthcare administrator',
    'physical therapist',
    'dental hygienist',
    'radiologist',
    'pharmacy technician'
  ],
  'education': [
    'teacher',
    'professor',
    'tutor',
    'education administrator',
    'curriculum developer',
    'special education teacher',
    'librarian',
    'guidance counselor',
    'instructional designer'
  ],
  'design': [
    'graphic designer',
    'web designer',
    'product designer',
    'interior designer',
    'fashion designer',
    'industrial designer',
    'motion designer',
    'illustrator',
    'art director'
  ],
  'customer-service': [
    'customer service representative',
    'call center agent',
    'customer support',
    'help desk',
    'client relations',
    'customer success manager',
    'technical support',
    'customer experience',
    'account manager'
  ]
};

// Test multi-domain scraping functionality
async function testMultiDomainScraping(domain = 'software-engineering', location = 'remote', maxJobs = 10) {
  console.log(`🚀 Testing RIZQ.AI Multi-Domain Scraping for: ${domain.toUpperCase()}`);
  console.log('================================================\n');

  if (!JOB_DOMAINS[domain]) {
    console.log(`❌ Invalid domain: ${domain}`);
    console.log(`Available domains: ${Object.keys(JOB_DOMAINS).join(', ')}`);
    return;
  }

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

    const allJobs = [];
    const searchQueries = JOB_DOMAINS[domain];

    console.log(`\n🔍 Testing job scraping for ${domain} domain...`);
    console.log(`Search queries: ${searchQueries.join(', ')}`);
    console.log(`Location: ${location}`);
    console.log('This will take a few moments as it needs to launch a browser...\n');

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`\n📋 Scraping for: "${query}" (${i + 1}/${searchQueries.length})`);
      
      const searchParams = {
        query: query,
        location: location,
        jobType: ["Full-time", "Remote", "Part-time"]
      };

      try {
        // Test the scraping
        const result = await scraper.scrapeJobs(searchParams);
        
        if (result.jobs && result.jobs.length > 0) {
          console.log(`✅ Found ${result.jobs.length} jobs for "${query}"`);
          
          // Add domain information to each job
          const jobsWithDomain = result.jobs.map(job => ({
            ...job,
            domain: domain,
            searchQuery: query
          }));
          
          allJobs.push(...jobsWithDomain);
        } else {
          console.log(`⚠️ No jobs found for "${query}"`);
        }
        
        // Add delay between searches to avoid rate limiting
        if (i < searchQueries.length - 1) {
          console.log('⏳ Waiting 5 seconds before next search...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (scrapingError) {
        console.log(`❌ Scraping failed for "${query}": ${scrapingError.message}`);
        continue; // Continue with next query
      }
    }

    // Save results to file
    if (allJobs.length > 0) {
      const timestamp = new Date().toISOString();
      const filename = `scraped-jobs-${domain}-${timestamp.split('T')[0]}.json`;
      
      const resultData = {
        timestamp: timestamp,
        domain: domain,
        location: location,
        totalJobs: allJobs.length,
        searchQueries: searchQueries,
        jobs: allJobs
      };

      await fs.writeFile(filename, JSON.stringify(resultData, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
      
      console.log(`\n🎯 Successfully scraped ${allJobs.length} total jobs for ${domain} domain:`);
      
      // Group jobs by search query
      const jobsByQuery = {};
      allJobs.forEach(job => {
        if (!jobsByQuery[job.searchQuery]) {
          jobsByQuery[job.searchQuery] = [];
        }
        jobsByQuery[job.searchQuery].push(job);
      });

      Object.entries(jobsByQuery).forEach(([query, jobs]) => {
        console.log(`\n📋 "${query}": ${jobs.length} jobs`);
        jobs.slice(0, 3).forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
        });
        if (jobs.length > 3) {
          console.log(`   ... and ${jobs.length - 3} more`);
        }
      });
      
    } else {
      console.log('\n⚠️ No jobs were scraped for any query in this domain.');
      console.log('This might be due to:');
      console.log('   - Anti-bot measures on Indeed');
      console.log('   - Network issues');
      console.log('   - Changes in Indeed\'s HTML structure');
      console.log('   - No jobs available for the specified location');
    }

    console.log('\n🎉 Multi-domain scraping test completed!');

  } catch (error) {
    console.error('❌ Error in multi-domain scraping test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Function to list available domains
function listDomains() {
  console.log('Available job domains:');
  console.log('======================');
  Object.entries(JOB_DOMAINS).forEach(([domain, queries]) => {
    console.log(`\n${domain.toUpperCase()}:`);
    queries.forEach(query => console.log(`  - ${query}`));
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list' || command === '--list' || command === '-l') {
  listDomains();
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
Usage: node test-multi-domain-scraping.mjs [command] [options]

Commands:
  list, -l, --list    List all available job domains
  help, -h, --help    Show this help message
  [domain]            Scrape jobs for the specified domain

Options:
  --location <loc>    Location for job search (default: remote)
  --max-jobs <num>    Maximum jobs per search (default: 10)

Examples:
  node test-multi-domain-scraping.mjs list
  node test-multi-domain-scraping.mjs marketing --location "New York"
  node test-multi-domain-scraping.mjs finance --max-jobs 20
  node test-multi-domain-scraping.mjs software-engineering
  `);
} else {
  const domain = command || 'software-engineering';
  const locationIndex = args.indexOf('--location');
  const location = locationIndex !== -1 ? args[locationIndex + 1] : 'remote';
  
  const maxJobsIndex = args.indexOf('--max-jobs');
  const maxJobs = maxJobsIndex !== -1 ? parseInt(args[maxJobsIndex + 1]) : 10;

  testMultiDomainScraping(domain, location, maxJobs).catch(console.error);
}
