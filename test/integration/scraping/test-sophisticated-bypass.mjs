import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// Test sophisticated bypass techniques for Indeed
async function testSophisticatedBypass() {
  console.log('🚀 Testing RIZQ.AI Sophisticated Bypass Techniques!');
  console.log('===================================================\n');

  try {
    // Get the scraper factory instance
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory instance created');

    // Create Indeed scraper with advanced bypass settings
    const defaultConfig = factory.getDefaultConfig(JobBoardType.INDEED);
    const defaultSession = factory.getDefaultSession();
    
    // Advanced bypass configuration
    const bypassConfig = {
      ...defaultConfig,
      maxPagesPerSearch: 1,
      maxJobsPerPage: 3,
      delayBetweenRequests: 30000, // 30 second delay
      maxRetries: 3,
      simulateHumanBehavior: true,
      rotateUserAgents: true,
      respectRobotsTxt: true,
      includeAuditTrail: true,
      // Advanced bypass settings
      useProxies: true,
      rotateProxies: true,
      stealthMode: true,
      fingerprintSpoofing: true
    };
    
    console.log('🔍 Creating Indeed scraper with advanced bypass config...');
    const scraper = factory.createScraper(JobBoardType.INDEED, bypassConfig, defaultSession);
    console.log(`✅ Indeed scraper created: ${scraper.constructor.name}`);

    console.log('\n🔍 Implementing sophisticated bypass techniques...');
    
    try {
      // Initialize browser with advanced settings
      await scraper['initializeBrowser']();
      const currentPage = scraper['page'];
      
      if (!currentPage) {
        throw new Error('Failed to get page instance');
      }

      // Technique 1: Advanced User Agent Rotation
      console.log('\n🔧 Technique 1: Advanced User Agent Rotation');
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
      ];
      
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      console.log(`🔄 Setting user agent: ${randomUserAgent.substring(0, 50)}...`);
      await currentPage.setUserAgent(randomUserAgent);
      
      // Technique 2: Viewport and Device Fingerprint Spoofing
      console.log('\n🔧 Technique 2: Device Fingerprint Spoofing');
      const viewports = [
        { width: 1920, height: 1080, deviceScaleFactor: 1 },
        { width: 1366, height: 768, deviceScaleFactor: 1 },
        { width: 1440, height: 900, deviceScaleFactor: 1 },
        { width: 1536, height: 864, deviceScaleFactor: 1 }
      ];
      
      const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
      console.log(`🔄 Setting viewport: ${randomViewport.width}x${randomViewport.height}`);
      await currentPage.setViewportSize(randomViewport);
      
      // Technique 3: Advanced Browser Fingerprint Spoofing
      console.log('\n🔧 Technique 3: Browser Fingerprint Spoofing');
      await currentPage.addInitScript(() => {
        // Override navigator properties
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Override languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Override platform
        Object.defineProperty(navigator, 'platform', {
          get: () => 'Win32',
        });
        
        // Override hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
        });
        
        // Override device memory
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8,
        });
        
        // Override connection
        Object.defineProperty(navigator, 'connection', {
          get: () => ({
            effectiveType: '4g',
            rtt: 50,
            downlink: 10,
            saveData: false
          }),
        });
      });
      
      // Technique 4: Cookie and Storage Management
      console.log('\n🔧 Technique 4: Cookie and Storage Management');
      await currentPage.addInitScript(() => {
        // Set some realistic cookies
        document.cookie = 'indeed_visited=true; path=/; max-age=86400';
        document.cookie = 'lang=en; path=/; max-age=86400';
        
        // Set localStorage
        if (window.localStorage) {
          localStorage.setItem('indeed_preferences', '{"theme":"light","notifications":true}');
        }
        
        // Set sessionStorage
        if (window.sessionStorage) {
          sessionStorage.setItem('session_id', 'session_' + Date.now());
        }
      });
      
      // Technique 5: Human-like Behavior Simulation
      console.log('\n🔧 Technique 5: Human-like Behavior Simulation');
      
      // Random mouse movements
      const simulateHumanMouse = async () => {
        for (let i = 0; i < 3; i++) {
          const x = Math.random() * randomViewport.width;
          const y = Math.random() * randomViewport.height;
          await currentPage.mouse.move(x, y);
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        }
      };
      
      // Random scrolling
      const simulateHumanScrolling = async () => {
        const scrollAmount = Math.random() * 500;
        await currentPage.evaluate((amount) => {
          window.scrollBy(0, amount);
        }, scrollAmount);
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      };
      
      // Technique 6: Multiple Entry Points
      console.log('\n🔧 Technique 6: Multiple Entry Points Strategy');
      const entryPoints = [
        'https://www.indeed.com',
        'https://www.indeed.com/jobs',
        'https://www.indeed.com/career-advice',
        'https://www.indeed.com/companies',
        'https://www.indeed.com/salary'
      ];
      
      let successfulEntry = false;
      let currentEntryPoint = '';
      
      for (const entryPoint of entryPoints) {
        try {
          console.log(`\n🌐 Trying entry point: ${entryPoint}`);
          
          // Navigate to entry point
          await currentPage.goto(entryPoint, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          
          // Wait for page to load
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
          
          // Simulate human behavior
          await simulateHumanMouse();
          await simulateHumanScrolling();
          
          // Check if we hit verification
          const pageContent = await currentPage.content();
          const currentUrl = currentPage.url();
          
          console.log(`🔗 Current URL: ${currentUrl}`);
          
          if (pageContent.includes('verification') || pageContent.includes('captcha') || pageContent.includes('robot')) {
            console.log(`⚠️ Hit verification page on ${entryPoint}`);
            continue;
          }
          
          if (pageContent.includes('blocked') || pageContent.includes('access denied')) {
            console.log(`⚠️ Access blocked on ${entryPoint}`);
            continue;
          }
          
          console.log(`✅ Successfully accessed: ${entryPoint}`);
          successfulEntry = true;
          currentEntryPoint = entryPoint;
          break;
          
        } catch (error) {
          console.log(`❌ Failed to access ${entryPoint}: ${error.message}`);
          continue;
        }
      }
      
      if (successfulEntry) {
        console.log(`\n🎉 Successfully bypassed verification using entry point: ${currentEntryPoint}`);
        
        // Technique 7: Gradual Search Approach
        console.log('\n🔧 Technique 7: Gradual Search Approach');
        
        // Wait a bit more to seem more human
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 3000));
        
        // Try to find search elements gradually
        console.log('🔍 Looking for search elements...');
        
        // First, look for any form elements
        const forms = await currentPage.$$('form');
        console.log(`📋 Found ${forms.length} forms on the page`);
        
        // Look for search-related elements
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
            const className = input.className || '';
            
            if (type === 'text' || type === 'search') {
              if (placeholder.toLowerCase().includes('job') || 
                  placeholder.toLowerCase().includes('title') ||
                  placeholder.toLowerCase().includes('keyword') ||
                  name === 'q' || name === 'query' ||
                  id.includes('what') || id.includes('job') ||
                  className.includes('search') || className.includes('job')) {
                elements.searchInputs.push({
                  selector: input.tagName.toLowerCase() + (input.id ? '#' + input.id : '') + (input.className ? '.' + input.className.split(' ').join('.') : ''),
                  placeholder: placeholder,
                  name: name,
                  id: id,
                  className: className
                });
              }
              
              if (placeholder.toLowerCase().includes('city') || 
                  placeholder.toLowerCase().includes('location') ||
                  name === 'l' || name === 'location' ||
                  id.includes('where') || id.includes('location') ||
                  className.includes('location') || className.includes('city')) {
                elements.locationInputs.push({
                  selector: input.tagName.toLowerCase() + (input.id ? '#' + input.id : '') + (input.className ? '.' + input.className.split(' ').join('.') : ''),
                  placeholder: placeholder,
                  name: name,
                  id: id,
                  className: className
                });
              }
            }
          });
          
          // Find all buttons
          document.querySelectorAll('button').forEach(button => {
            const text = button.textContent || '';
            const ariaLabel = button.getAttribute('aria-label') || '';
            const className = button.className || '';
            
            if (text.toLowerCase().includes('search') || 
                text.toLowerCase().includes('find') ||
                ariaLabel.toLowerCase().includes('search') ||
                ariaLabel.toLowerCase().includes('find') ||
                className.includes('search') || className.includes('submit')) {
              elements.buttons.push({
                selector: button.tagName.toLowerCase() + (button.id ? '#' + button.id : '') + (button.className ? '.' + button.className.split(' ').join('.') : ''),
                text: text,
                ariaLabel: ariaLabel,
                className: className
              });
            }
          });
          
          return elements;
        });
        
        console.log('\n📋 Found search elements:');
        console.log('Search inputs:', searchElements.searchInputs);
        console.log('Location inputs:', searchElements.locationInputs);
        console.log('Buttons:', searchElements.buttons);
        
        // Technique 8: Smart Search Execution
        if (searchElements.searchInputs.length > 0) {
          console.log('\n🔧 Technique 8: Smart Search Execution');
          
          // Use the first search input found
          const searchInput = searchElements.searchInputs[0];
          console.log(`✍️ Using search input: ${searchInput.selector}`);
          
          try {
            // Find the input element
            const inputElement = await currentPage.$(searchInput.selector);
            if (inputElement) {
              // Clear the input first
              await inputElement.click();
              await currentPage.keyboard.down('Control');
              await currentPage.keyboard.press('a');
              await currentPage.keyboard.up('Control');
              await currentPage.keyboard.press('Backspace');
              
              // Type like a human
              const searchTerm = 'software engineer';
              console.log(`🔍 Typing search term: "${searchTerm}"`);
              
              for (const char of searchTerm) {
                await inputElement.type(char);
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
              }
              
              console.log('✅ Search term entered successfully');
              
              // Look for search button
              if (searchElements.buttons.length > 0) {
                const searchButton = searchElements.buttons[0];
                console.log(`🔍 Using search button: ${searchButton.selector}`);
                
                const buttonElement = await currentPage.$(searchButton.selector);
                if (buttonElement) {
                  // Wait a bit before clicking
                  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                  
                  console.log('🔍 Clicking search button...');
                  await buttonElement.click();
                  
                  // Wait for search results
                  console.log('⏳ Waiting for search results...');
                  await new Promise(resolve => setTimeout(resolve, 8000 + Math.random() * 4000));
                  
                  // Check if we got results
                  const searchUrl = currentPage.url();
                  console.log(`🔗 Search URL: ${searchUrl}`);
                  
                  if (searchUrl.includes('jobs') && searchUrl.includes('q=')) {
                    console.log('✅ Search executed successfully!');
                    
                    // Now try to extract jobs
                    console.log('🔍 Attempting to extract job listings...');
                    
                    // Take a screenshot of the search results
                    console.log('📸 Taking screenshot of search results...');
                    await currentPage.screenshot({ 
                      path: './indeed-search-results-bypass.png',
                      fullPage: true 
                    });
                    
                    // Try to find job listings
                    const jobElements = await currentPage.evaluate(() => {
                      // Look for various job listing patterns
                      const selectors = [
                        '[data-testid*="job"]',
                        '[data-testid*="result"]',
                        '[class*="job"]',
                        '[class*="result"]',
                        '[class*="listing"]',
                        'article',
                        '.job',
                        '.result',
                        '.listing'
                      ];
                      
                      const jobs = [];
                      
                      for (const selector of selectors) {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                          console.log(`Found ${elements.length} elements with selector: ${selector}`);
                          
                          for (const element of elements) {
                            try {
                              // Extract job information
                              const title = element.querySelector('h2, h3, h4, a')?.textContent?.trim();
                              const company = element.querySelector('[class*="company"], [class*="employer"]')?.textContent?.trim();
                              const location = element.querySelector('[class*="location"], [class*="city"]')?.textContent?.trim();
                              
                              if (title && title.length > 5) {
                                jobs.push({
                                  title: title,
                                  company: company || 'Unknown',
                                  location: location || 'Unknown',
                                  selector: selector
                                });
                              }
                            } catch (error) {
                              // Continue with next element
                            }
                          }
                          
                          if (jobs.length > 0) break;
                        }
                      }
                      
                      return jobs;
                    });
                    
                    if (jobElements.length > 0) {
                      console.log(`\n🎉 SUCCESS! Extracted ${jobElements.length} jobs:`);
                      jobElements.forEach((job, index) => {
                        console.log(`\n${index + 1}. ${job.title}`);
                        console.log(`   Company: ${job.company}`);
                        console.log(`   Location: ${job.location}`);
                      });
                      
                      console.log('\n🎉 SOPHISTICATED BYPASS SUCCESSFUL!');
                      console.log('Advanced anti-detection techniques worked!');
                      
                    } else {
                      console.log('\n⚠️ Search executed but no jobs extracted');
                      console.log('This suggests the selectors need updating');
                    }
                    
                  } else {
                    console.log('❌ Search did not produce expected results');
                  }
                  
                } else {
                  console.log('❌ Search button element not found');
                }
              } else {
                console.log('❌ No search buttons found');
              }
              
            } else {
              console.log('❌ Search input element not found');
            }
            
          } catch (error) {
            console.log(`❌ Error during search execution: ${error.message}`);
          }
          
        } else {
          console.log('❌ No search inputs found on the page');
        }
        
      } else {
        console.log('\n❌ All entry points failed');
        console.log('Indeed has very strong anti-bot measures');
        
        // Take a screenshot for debugging
        console.log('📸 Taking screenshot for debugging...');
        await currentPage.screenshot({ 
          path: './indeed-bypass-failed.png',
          fullPage: true 
        });
      }
      
      console.log('\n🎉 Sophisticated bypass test completed!');
      
    } catch (bypassError) {
      console.log(`\n❌ Sophisticated bypass failed: ${bypassError.message}`);
      console.log('This suggests:');
      console.log('   - Indeed has extremely sophisticated detection');
      console.log('   - Need to implement even more advanced techniques');
      console.log('   - Consider using residential proxies');
      console.log('   - May need to implement CAPTCHA solving');
    }

    console.log('\n🎉 Sophisticated bypass test completed!');

  } catch (error) {
    console.error('❌ Error in sophisticated bypass test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSophisticatedBypass().catch(console.error);
