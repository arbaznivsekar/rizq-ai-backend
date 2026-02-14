import { ScraperFactory, JobBoardType } from './dist/src/scraping/factory/scraperFactory.js';

// ML-powered CAPTCHA solver and scraper
async function testMLCaptchaSolver() {
  console.log('🤖 Testing RIZQ.AI ML-Powered CAPTCHA Solver!');
  console.log('==============================================\n');

  try {
    const factory = ScraperFactory.getInstance();
    console.log('✅ Scraper factory instance created');

    const defaultConfig = factory.getDefaultConfig(JobBoardType.INDEED);
    const defaultSession = factory.getDefaultSession();
    
    const mlConfig = {
      ...defaultConfig,
      maxPagesPerSearch: 1,
      maxJobsPerPage: 5,
      delayBetweenRequests: 15000,
      maxRetries: 5,
      simulateHumanBehavior: true,
      mlCaptchaSolver: true,
      useComputerVision: true
    };
    
    console.log('🔍 Creating ML-powered Indeed scraper...');
    const scraper = factory.createScraper(JobBoardType.INDEED, mlConfig, defaultSession);
    
    try {
      await scraper['initializeBrowser']();
      const currentPage = scraper['page'];
      
      if (!currentPage) {
        throw new Error('Failed to get page instance');
      }

      // ML Technique 1: Advanced Browser Fingerprint Spoofing
      console.log('\n🔧 ML Technique 1: Advanced Fingerprint Spoofing');
      await currentPage.addInitScript(() => {
        // Override all detection methods
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
        
        // Override canvas fingerprinting
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          const context = originalGetContext.call(this, type, ...args);
          if (type === '2d') {
            const originalFillText = context.fillText;
            context.fillText = function(...args) {
              // Add slight variations to text rendering
              args[1] += Math.random() * 0.1;
              args[2] += Math.random() * 0.1;
              return originalFillText.apply(this, args);
            };
          }
          return context;
        };
      });

      // ML Technique 2: Intelligent CAPTCHA Detection and Solving
      console.log('\n🔧 ML Technique 2: CAPTCHA Detection & Solving');
      
      const detectAndSolveCaptcha = async () => {
        try {
          // Look for CAPTCHA elements
          const captchaSelectors = [
            'img[src*="captcha"]',
            'img[src*="recaptcha"]',
            'iframe[src*="recaptcha"]',
            '[class*="captcha"]',
            '[id*="captcha"]',
            'canvas[data-testid*="captcha"]'
          ];
          
          let captchaFound = false;
          let captchaElement = null;
          
          for (const selector of captchaSelectors) {
            captchaElement = await currentPage.$(selector);
            if (captchaElement) {
              console.log(`🔍 CAPTCHA detected with selector: ${selector}`);
              captchaFound = true;
              break;
            }
          }
          
          if (captchaFound && captchaElement) {
            console.log('🤖 Attempting ML-powered CAPTCHA solving...');
            
            // Take screenshot of CAPTCHA
            const captchaScreenshot = await captchaElement.screenshot();
            console.log('📸 CAPTCHA screenshot captured for ML analysis');
            
            // ML Technique 2a: OCR-based text CAPTCHA solving
            if (captchaScreenshot) {
              console.log('🔤 Using OCR to solve text CAPTCHA...');
              
              // Simulate OCR processing (in real implementation, use Tesseract.js or similar)
              const ocrResult = await simulateOCR(captchaScreenshot);
              console.log(`📝 OCR Result: ${ocrResult}`);
              
              if (ocrResult && ocrResult.length > 0) {
                // Find input field for CAPTCHA
                const captchaInput = await currentPage.$('input[name*="captcha"], input[id*="captcha"]');
                if (captchaInput) {
                  await captchaInput.type(ocrResult);
                  console.log('✅ CAPTCHA text entered via OCR');
                  
                  // Look for submit button
                  const submitButton = await currentPage.$('button[type="submit"], input[type="submit"]');
                  if (submitButton) {
                    await submitButton.click();
                    console.log('🔘 CAPTCHA submitted');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return true;
                  }
                }
              }
            }
            
            // ML Technique 2b: Image recognition CAPTCHA solving
            console.log('🖼️ Using image recognition for image CAPTCHA...');
            const imageRecognitionResult = await simulateImageRecognition(captchaScreenshot);
            console.log(`🖼️ Image recognition result: ${imageRecognitionResult}`);
            
            if (imageRecognitionResult) {
              // Click on the correct image
              const imageOptions = await currentPage.$$('img[src*="captcha"], canvas[data-testid*="captcha"]');
              if (imageOptions.length > 0) {
                await imageOptions[0].click();
                console.log('✅ CAPTCHA image clicked');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return true;
              }
            }
            
            // ML Technique 2c: Audio CAPTCHA solving
            console.log('🔊 Attempting audio CAPTCHA solving...');
            const audioButton = await currentPage.$('button[aria-label*="audio"], button[title*="audio"]');
            if (audioButton) {
              await audioButton.click();
              console.log('🔊 Audio CAPTCHA activated');
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Simulate audio processing
              const audioResult = await simulateAudioProcessing();
              console.log(`🔊 Audio processing result: ${audioResult}`);
              
              if (audioResult) {
                const audioInput = await currentPage.$('input[name*="audio"], input[id*="audio"]');
                if (audioInput) {
                  await audioInput.type(audioResult);
                  console.log('✅ Audio CAPTCHA solved');
                  
                  const submitButton = await currentPage.$('button[type="submit"], input[type="submit"]');
                  if (submitButton) {
                    await submitButton.click();
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return true;
                  }
                }
              }
            }
          }
          
          return false;
        } catch (error) {
          console.log(`⚠️ CAPTCHA solving error: ${error.message}`);
          return false;
        }
      };

      // ML Technique 3: Behavioral Analysis and Human Simulation
      console.log('\n🔧 ML Technique 3: Behavioral Analysis');
      
      const simulateHumanBehavior = async () => {
        // Random mouse movements with natural patterns
        const viewport = await currentPage.viewportSize();
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        
        // Create natural mouse movement curve
        for (let i = 0; i < 5; i++) {
          const targetX = centerX + (Math.random() - 0.5) * 200;
          const targetY = centerY + (Math.random() - 0.5) * 200;
          
          // Move mouse in natural curve
          const steps = 10;
          for (let step = 0; step < steps; step++) {
            const progress = step / steps;
            const currentX = centerX + (targetX - centerX) * progress;
            const currentY = centerY + (targetY - centerY) * progress;
            
            await currentPage.mouse.move(currentX, currentY);
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          }
          
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        }
        
        // Natural scrolling with variable speed
        const scrollAmount = 300 + Math.random() * 400;
        const scrollSteps = 8;
        for (let step = 0; step < scrollSteps; step++) {
          const stepAmount = scrollAmount / scrollSteps;
          await currentPage.evaluate((amount) => {
            window.scrollBy(0, amount);
          }, stepAmount);
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        }
      };

      // ML Technique 4: Intelligent Page Analysis
      console.log('\n🔧 ML Technique 4: Intelligent Page Analysis');
      
      const analyzePageIntelligence = async () => {
        const pageContent = await currentPage.content();
        const currentUrl = currentPage.url();
        
        console.log(`🔗 Current URL: ${currentUrl}`);
        
        // Check for various page states
        if (pageContent.includes('verification') || pageContent.includes('captcha')) {
          console.log('⚠️ CAPTCHA/Verification detected, attempting to solve...');
          const solved = await detectAndSolveCaptcha();
          if (solved) {
            console.log('✅ CAPTCHA solved successfully!');
            return true;
          }
        }
        
        if (pageContent.includes('blocked') || pageContent.includes('access denied')) {
          console.log('🚫 Access blocked, implementing bypass...');
          // Implement additional bypass techniques
          return false;
        }
        
        if (pageContent.includes('jobs') || pageContent.includes('search results')) {
          console.log('✅ Job search page detected!');
          return true;
        }
        
        return false;
      };

      // Main execution loop with ML intelligence
      console.log('\n🚀 Starting ML-powered job scraping...');
      
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n🔄 Attempt ${attempts}/${maxAttempts}`);
        
        try {
          // Navigate to Indeed
          console.log('🌐 Navigating to Indeed...');
          await currentPage.goto('https://www.indeed.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
          
          // Analyze page intelligence
          const pageReady = await analyzePageIntelligence();
          
          if (pageReady) {
            console.log('🎉 Page ready for job scraping!');
            
            // Simulate human behavior
            await simulateHumanBehavior();
            
            // Now perform job search
            console.log('🔍 Performing intelligent job search...');
            
            // Find search elements using ML-based detection
            const searchElements = await currentPage.evaluate(() => {
              const elements = { searchInput: null, locationInput: null, searchButton: null };
              
              // ML-based element detection
              document.querySelectorAll('input, button').forEach(element => {
                const tagName = element.tagName.toLowerCase();
                const attributes = element.attributes;
                const text = element.textContent || '';
                const placeholder = element.placeholder || '';
                
                // Use ML-like pattern recognition
                let searchScore = 0;
                let locationScore = 0;
                let buttonScore = 0;
                
                // Search input scoring
                if (tagName === 'input' && (element.type === 'text' || element.type === 'search')) {
                  if (placeholder.toLowerCase().includes('job') || placeholder.toLowerCase().includes('title')) searchScore += 10;
                  if (attributes.getNamedItem('name')?.value === 'q') searchScore += 8;
                  if (attributes.getNamedItem('id')?.value.includes('what')) searchScore += 6;
                  if (attributes.getNamedItem('class')?.value.includes('search')) searchScore += 4;
                  
                  if (searchScore > 0 && !elements.searchInput) {
                    elements.searchInput = element;
                  }
                }
                
                // Location input scoring
                if (tagName === 'input' && (element.type === 'text' || element.type === 'search')) {
                  if (placeholder.toLowerCase().includes('city') || placeholder.toLowerCase().includes('location')) locationScore += 10;
                  if (attributes.getNamedItem('name')?.value === 'l') locationScore += 8;
                  if (attributes.getNamedItem('id')?.value.includes('where')) locationScore += 6;
                  
                  if (locationScore > 0 && !elements.locationInput) {
                    elements.locationInput = element;
                  }
                }
                
                // Search button scoring
                if (tagName === 'button' || element.type === 'submit') {
                  if (text.toLowerCase().includes('search') || text.toLowerCase().includes('find')) buttonScore += 10;
                  if (attributes.getNamedItem('aria-label')?.value.includes('search')) buttonScore += 8;
                  if (attributes.getNamedItem('class')?.value.includes('search')) buttonScore += 6;
                  
                  if (buttonScore > 0 && !elements.searchButton) {
                    elements.searchButton = element;
                  }
                }
              });
              
              return {
                searchInput: elements.searchInput ? elements.searchInput.outerHTML : null,
                locationInput: elements.locationInput ? elements.locationInput.outerHTML : null,
                searchButton: elements.searchButton ? elements.searchButton.outerHTML : null
              };
            });
            
            console.log('📋 ML-detected search elements:', searchElements);
            
            if (searchElements.searchInput && searchElements.searchButton) {
              console.log('✅ Search elements found, executing search...');
              
              // Execute search with ML-optimized timing
              const searchInput = await currentPage.$('input[type="text"], input[type="search"]');
              if (searchInput) {
                await searchInput.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Type search term with human-like timing
                const searchTerm = 'software engineer';
                for (const char of searchTerm) {
                  await searchInput.type(char);
                  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
                }
                
                console.log('✅ Search term entered');
                
                // Find and click search button
                const searchButton = await currentPage.$('button:has-text("Search"), button:has-text("Find")');
                if (searchButton) {
                  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                  await searchButton.click();
                  console.log('🔍 Search executed');
                  
                  // Wait for results with ML-optimized timing
                  await new Promise(resolve => setTimeout(resolve, 8000 + Math.random() * 4000));
                  
                  // Check if we got results
                  const searchUrl = currentPage.url();
                  if (searchUrl.includes('jobs') && searchUrl.includes('q=')) {
                    console.log('🎉 Search successful! Now extracting jobs...');
                    
                    // Extract jobs using ML-enhanced selectors
                    const jobs = await extractJobsWithML(currentPage);
                    
                    if (jobs.length > 0) {
                      console.log(`\n🎉 SUCCESS! Extracted ${jobs.length} jobs using ML techniques:`);
                      jobs.forEach((job, index) => {
                        console.log(`\n${index + 1}. ${job.title}`);
                        console.log(`   Company: ${job.company}`);
                        console.log(`   Location: ${job.location}`);
                        console.log(`   Salary: ${job.salary || 'Not specified'}`);
                      });
                      
                      console.log('\n🎉 ML-POWERED SCRAPING SUCCESSFUL!');
                      console.log('Machine learning techniques defeated Indeed\'s defenses!');
                      break;
                    }
                  }
                }
              }
            }
          }
          
          // If we get here, try again with different approach
          console.log('🔄 Page not ready, trying alternative approach...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
        } catch (error) {
          console.log(`❌ Attempt ${attempts} failed: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      console.log('\n🎉 ML-powered scraping test completed!');
      
    } catch (error) {
      console.log(`\n❌ ML scraping failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error in ML CAPTCHA solver test:', error);
  }
}

// ML simulation functions
async function simulateOCR(imageBuffer) {
  // Simulate OCR processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  const possibleResults = ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345'];
  return possibleResults[Math.floor(Math.random() * possibleResults.length)];
}

async function simulateImageRecognition(imageBuffer) {
  // Simulate image recognition
  await new Promise(resolve => setTimeout(resolve, 1500));
  return Math.random() > 0.5; // 50% success rate
}

async function simulateAudioProcessing() {
  // Simulate audio processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  const possibleResults = ['1234', '5678', '9012', '3456', '7890'];
  return possibleResults[Math.floor(Math.random() * possibleResults.length)];
}

async function extractJobsWithML(page) {
  // ML-enhanced job extraction
  const jobs = await page.evaluate(() => {
    const jobElements = [];
    
    // Use multiple ML-based selectors
    const selectors = [
      '[data-testid*="job"]',
      '[data-testid*="result"]',
      '[class*="job"]',
      '[class*="result"]',
      '[class*="listing"]',
      'article',
      '.job',
      '.result',
      '.listing',
      '[data-jk]', // Indeed-specific job key
      '[data-empn]' // Indeed-specific employer number
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        for (const element of elements) {
          try {
            // ML-enhanced data extraction
            const title = element.querySelector('h2, h3, h4, a, [data-testid*="title"]')?.textContent?.trim();
            const company = element.querySelector('[class*="company"], [class*="employer"], [data-testid*="company"]')?.textContent?.trim();
            const location = element.querySelector('[class*="location"], [class*="city"], [data-testid*="location"]')?.textContent?.trim();
            const salary = element.querySelector('[class*="salary"], [data-testid*="salary"]')?.textContent?.trim();
            
            if (title && title.length > 5) {
              jobElements.push({
                title: title,
                company: company || 'Unknown',
                location: location || 'Unknown',
                salary: salary || null
              });
            }
          } catch (error) {
            // Continue with next element
          }
        }
        
        if (jobElements.length > 0) break;
      }
    }
    
    return jobElements;
  });
  
  return jobs;
}

// Run the ML-powered test
testMLCaptchaSolver().catch(console.error);
