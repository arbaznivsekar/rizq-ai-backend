import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test bypassing Indeed's verification with human-like behavior
async function testBypassVerification() {
  console.log('🚀 Testing RIZQ.AI Bypass Verification!');
  console.log('=======================================\n');

  try {
    // Get the scraper factory instance
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory instance created');

    // Create Indeed scraper with human-like settings
    const defaultConfig = factory.getDefaultConfig(JobBoardType.INDEED);
    const defaultSession = factory.getDefaultSession();
    
    // Modify config for more human-like behavior
    const humanConfig = {
      ...defaultConfig,
      maxPagesPerSearch: 1,
      maxJobsPerPage: 3,
      delayBetweenRequests: 15000,  // 15 second delay
      maxRetries: 1,
      simulateHumanBehavior: true,
      rotateUserAgents: true
    };
    
    console.log('🔍 Creating Indeed scraper with human-like config...');
    const scraper = factory.createScraper(JobBoardType.INDEED, humanConfig, defaultSession);
    console.log(`✅ Indeed scraper created: ${scraper.constructor.name}`);

    console.log('\n🔍 Testing human-like behavior...');
    console.log('This will try to bypass verification with more natural interactions...');
    
    try {
      // Initialize browser
      await scraper['initializeBrowser']();
      const currentPage = scraper['page'];
      
      if (!currentPage) {
        throw new Error('Failed to get page instance');
      }

      // Set a more realistic user agent
      console.log('🔧 Setting realistic user agent...');
      await currentPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport to a common resolution
      await currentPage.setViewportSize({ width: 1920, height: 1080 });
      
      // Add some random mouse movements to simulate human behavior
      console.log('🖱️ Adding human-like mouse movements...');
      await currentPage.mouse.move(Math.random() * 1920, Math.random() * 1080);
      
      console.log('🌐 Navigating to Indeed with human-like approach...');
      
      // Try different approaches to avoid detection
      const approaches = [
        'https://www.indeed.com',
        'https://www.indeed.com/jobs',
        'https://www.indeed.com/career-advice'
      ];
      
      let success = false;
      for (const approach of approaches) {
        try {
          console.log(`🔍 Trying approach: ${approach}`);
          
          await currentPage.goto(approach, { 
            waitUntil: 'domcontentloaded', // Less strict than networkidle
            timeout: 30000 
          });
          
          // Wait a bit
          await currentPage.waitForTimeout(3000 + Math.random() * 2000);
          
          // Check if we hit verification
          const pageContent = await currentPage.content();
          if (pageContent.includes('verification') || pageContent.includes('captcha') || pageContent.includes('robot')) {
            console.log(`⚠️ Hit verification page on ${approach}`);
            continue;
          }
          
          console.log(`✅ Successfully loaded ${approach}`);
          success = true;
          break;
          
        } catch (error) {
          console.log(`❌ Failed on ${approach}: ${error.message}`);
          continue;
        }
      }
      
      if (success) {
        console.log('\n🎉 Successfully bypassed verification!');
        
        // Now try to find search elements
        console.log('\n🔍 Looking for search elements...');
        
        // Wait a bit more
        await currentPage.waitForTimeout(5000);
        
        // Check current URL
        const currentUrl = currentPage.url();
        console.log(`🔗 Current URL: ${currentUrl}`);
        
        // Look for search form elements
        const searchElements = await currentPage.evaluate(() => {
          const elements = {
            searchInputs: [],
            locationInputs: [],
            buttons: [],
            forms: []
          };
          
          // Find all input elements
          document.querySelectorAll('input').forEach(input => {
            const type = input.type;
            const name = input.name;
            const placeholder = input.placeholder || '';
            const id = input.id || '';
            
            if (type === 'text' || type === 'search') {
              if (placeholder.toLowerCase().includes('job') || 
                  placeholder.toLowerCase().includes('title') ||
                  placeholder.toLowerCase().includes('keyword') ||
                  name === 'q' || name === 'query' ||
                  id.includes('what') || id.includes('job')) {
                elements.searchInputs.push({
                  selector: input.tagName.toLowerCase() + (input.id ? '#' + input.id : '') + (input.className ? '.' + input.className.split(' ').join('.') : ''),
                  placeholder: placeholder,
                  name: name,
                  id: id
                });
              }
              
              if (placeholder.toLowerCase().includes('city') || 
                  placeholder.toLowerCase().includes('location') ||
                  name === 'l' || name === 'location' ||
                  id.includes('where') || id.includes('location')) {
                elements.locationInputs.push({
                  selector: input.tagName.toLowerCase() + (input.id ? '#' + input.id : '') + (input.className ? '.' + input.className.split(' ').join('.') : ''),
                  placeholder: placeholder,
                  name: name,
                  id: id
                });
              }
            }
          });
          
          // Find all buttons
          document.querySelectorAll('button').forEach(button => {
            const text = button.textContent || '';
            const ariaLabel = button.getAttribute('aria-label') || '';
            
            if (text.toLowerCase().includes('search') || 
                text.toLowerCase().includes('find') ||
                ariaLabel.toLowerCase().includes('search') ||
                ariaLabel.toLowerCase().includes('find')) {
              elements.buttons.push({
                selector: button.tagName.toLowerCase() + (button.id ? '#' + button.id : '') + (button.className ? '.' + button.className.split(' ').join('.') : ''),
                text: text,
                ariaLabel: ariaLabel
              });
            }
          });
          
          // Find all forms
          document.querySelectorAll('form').forEach(form => {
            const action = form.action || '';
            const method = form.method || '';
            if (action.includes('search') || action.includes('jobs')) {
              elements.forms.push({
                selector: form.tagName.toLowerCase() + (form.id ? '#' + form.id : '') + (form.className ? '.' + form.className.split(' ').join('.') : ''),
                action: action,
                method: method
              });
            }
          });
          
          return elements;
        });
        
        console.log('\n📋 Found search elements:');
        console.log('Search inputs:', searchElements.searchInputs);
        console.log('Location inputs:', searchElements.locationInputs);
        console.log('Buttons:', searchElements.buttons);
        console.log('Forms:', searchElements.forms);
        
        // Take a screenshot
        console.log('\n📸 Taking screenshot...');
        await currentPage.screenshot({ 
          path: './indeed-bypass-success.png',
          fullPage: true 
        });
        console.log('✅ Screenshot saved as indeed-bypass-success.png');
        
      } else {
        console.log('\n❌ Failed to bypass verification on all approaches');
        console.log('This suggests Indeed has strong anti-bot measures');
        
        // Take a screenshot of the verification page
        console.log('\n📸 Taking screenshot of verification page...');
        await currentPage.screenshot({ 
          path: './indeed-verification-page.png',
          fullPage: true 
        });
        console.log('✅ Screenshot saved as indeed-verification-page.png');
      }
      
      console.log('\n🎉 Bypass verification test completed!');
      
    } catch (bypassError) {
      console.log(`\n❌ Bypass verification failed: ${bypassError.message}`);
      console.log('This could be due to:');
      console.log('   - Indeed\'s anti-bot measures are too strong');
      console.log('   - Network connectivity issues');
      console.log('   - Browser automation detection');
    }

    console.log('\n🎉 Bypass verification test completed!');

  } catch (error) {
    console.error('❌ Error in bypass verification test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testBypassVerification().catch(console.error);
