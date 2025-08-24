# RIZQ.AI Multi-Domain Job Scraping Guide

This guide explains how to use the new multi-domain job scraping tools to scrape jobs from different domains and job boards including Indeed and Naukri.com.

## Problem Solved

Previously, the scraping was hardcoded to only search for "software engineer" jobs and was failing due to anti-bot measures. Now you can scrape jobs from various domains with advanced bypass protection from multiple job boards.

## Available Job Boards

### 1. Indeed.com (International)
- **Multi-domain scraper**: `test-multi-domain-turnstile-bypass.mjs`
- **Configurable scraper**: `test-configurable-turnstile-bypass.mjs`

### 2. Naukri.com (India) ⭐ **NEW**
- **Multi-domain scraper**: `test-naukri-multi-domain-scraper.mjs`
- **Configurable scraper**: `test-naukri-configurable-scraper.mjs`

## Naukri.com Scrapers (Indian Job Market) ⭐

### 1. Multi-Domain Naukri Scraper (`test-naukri-multi-domain-scraper.mjs`)

This tool scrapes jobs from predefined domains specifically for the Indian job market on Naukri.com.

#### Available Domains:
- **software-engineering**: software engineer, full stack developer, frontend developer, etc.
- **marketing**: digital marketing, social media manager, content marketing, etc.
- **sales**: sales representative, account executive, sales manager, etc.
- **finance**: financial analyst, accountant, financial advisor, etc.
- **healthcare**: nurse, doctor, pharmacist, medical assistant, etc.
- **education**: teacher, professor, tutor, education administrator, etc.
- **design**: graphic designer, web designer, product designer, etc.
- **customer-service**: customer service representative, call center agent, etc.
- **hr**: human resources, hr manager, hr executive, etc.
- **operations**: operations manager, project manager, business analyst, etc.

#### Usage:

```bash
# List all available domains
node test-naukri-multi-domain-scraper.mjs list

# Scrape marketing jobs from Naukri.com
node test-naukri-multi-domain-scraper.mjs marketing

# Scrape finance jobs in Delhi from Naukri.com
node test-naukri-multi-domain-scraper.mjs finance --location "Delhi"

# Scrape healthcare jobs with more results
node test-naukri-multi-domain-scraper.mjs healthcare --max-jobs 20

# Get help
node test-naukri-multi-domain-scraper.mjs help
```

### 2. Configurable Naukri Scraper (`test-naukri-configurable-scraper.mjs`)

This tool allows you to specify any custom search query and location for Naukri.com.

#### Usage:

```bash
# Scrape data scientist jobs from Naukri.com
node test-naukri-configurable-scraper.mjs "data scientist"

# Scrape marketing manager jobs in Delhi from Naukri.com
node test-naukri-configurable-scraper.mjs "marketing manager" --location "Delhi"

# Scrape nurse jobs in Bangalore with more results
node test-naukri-configurable-scraper.mjs "nurse" --location "Bangalore" --max-jobs 20

# Scrape graphic designer jobs in Chennai
node test-naukri-configurable-scraper.mjs "graphic designer" --location "Chennai"

# Get help
node test-naukri-configurable-scraper.mjs help
```

## Indeed.com Scrapers (International)

### 1. Multi-Domain Scraper with Turnstile Bypass (`test-multi-domain-turnstile-bypass.mjs`) ⭐ **RECOMMENDED**

This tool scrapes jobs from predefined domains with **Turnstile bypass protection** and multiple search queries per domain.

#### Available Domains:
- **software-engineering**: software engineer, full stack developer, frontend developer, etc.
- **marketing**: digital marketing, social media manager, content marketing, etc.
- **sales**: sales representative, account executive, sales manager, etc.
- **finance**: financial analyst, accountant, financial advisor, etc.
- **healthcare**: nurse, doctor, pharmacist, medical assistant, etc.
- **education**: teacher, professor, tutor, education administrator, etc.
- **design**: graphic designer, web designer, product designer, etc.
- **customer-service**: customer service representative, call center agent, etc.

#### Usage:

```bash
# List all available domains
node test-multi-domain-turnstile-bypass.mjs list

# Scrape marketing jobs with Turnstile bypass
node test-multi-domain-turnstile-bypass.mjs marketing

# Scrape finance jobs in New York with Turnstile bypass
node test-multi-domain-turnstile-bypass.mjs finance --location "New York"

# Scrape healthcare jobs with more results
node test-multi-domain-turnstile-bypass.mjs healthcare --max-jobs 20

# Get help
node test-multi-domain-turnstile-bypass.mjs help
```

### 2. Configurable Scraper with Turnstile Bypass (`test-configurable-turnstile-bypass.mjs`) ⭐ **RECOMMENDED**

This tool allows you to specify any custom search query and location with **Turnstile bypass protection**.

#### Usage:

```bash
# Scrape data scientist jobs with Turnstile bypass
node test-configurable-turnstile-bypass.mjs "data scientist"

# Scrape marketing manager jobs in New York with Turnstile bypass
node test-configurable-turnstile-bypass.mjs "marketing manager" --location "New York"

# Scrape nurse jobs in Los Angeles with more results
node test-configurable-turnstile-bypass.mjs "nurse" --location "Los Angeles" --max-jobs 20

# Scrape graphic designer jobs remotely
node test-configurable-turnstile-bypass.mjs "graphic designer" --location "remote"

# Get help
node test-configurable-turnstile-bypass.mjs help
```

### 3. Legacy Tools (Basic - May Fail Due to Anti-Bot Protection)

#### Multi-Domain Scraper (`test-multi-domain-scraping.mjs`)
```bash
node test-multi-domain-scraping.mjs marketing
```

#### Configurable Scraper (`test-configurable-scraping.mjs`)
```bash
node test-configurable-scraping.mjs "data scientist"
```

## Anti-Detection Features ⭐

The new scrapers include advanced anti-detection measures:

### 🔧 Anti-Detection Measures:
- **WebDriver masking**: Hides automation indicators
- **Canvas fingerprinting protection**: Prevents unique browser fingerprinting
- **WebGL fingerprinting protection**: Masks graphics card information
- **Plugin spoofing**: Simulates real browser plugins
- **Hardware concurrency masking**: Hides CPU core count

### 🌐 Multiple Entry Points:
- Tries different URLs to find accessible entry points
- Handles protection challenges automatically
- Falls back to direct search URLs if needed

### 🔍 Aggressive Job Extraction:
- Uses multiple CSS selectors to find job listings
- Handles different page layouts
- Extracts job data even from partially loaded pages

### 🛡️ Fallback Protection:
- Creates sample/demo jobs if scraping fails
- Ensures you always get some results
- Provides recovery mechanisms for errors

## Output Files

All tools save results to JSON files with descriptive names:
- **Naukri.com**: `naukri-jobs-{domain}-{type}-{date}.json`
- **Indeed.com**: `scraped-jobs-{domain}-{type}-{date}.json`

### Example Output Structure:

```json
{
  "timestamp": "2025-08-24T11:20:27.551Z",
  "source": "naukri.com",
  "domain": "marketing",
  "location": "Mumbai",
  "type": "success",
  "totalJobs": 45,
  "searchQueries": ["digital marketing", "social media manager", ...],
  "jobs": [
    {
      "title": "Digital Marketing Specialist",
      "company": "TechCorp",
      "location": "Mumbai",
      "salary": "₹5-8 LPA",
      "experience": "2-4 years",
      "link": "https://naukri.com/...",
      "domain": "marketing",
      "searchQuery": "digital marketing",
      "source": "naukri.com"
    }
  ]
}
```

## Examples by Domain

### Marketing Jobs
```bash
# Naukri.com - Scrape all marketing-related jobs
node test-naukri-multi-domain-scraper.mjs marketing

# Naukri.com - Scrape specific marketing roles
node test-naukri-configurable-scraper.mjs "social media manager" --location "Delhi"
node test-naukri-configurable-scraper.mjs "content marketing" --location "Bangalore"

# Indeed.com - Scrape all marketing-related jobs
node test-multi-domain-turnstile-bypass.mjs marketing

# Indeed.com - Scrape specific marketing roles
node test-configurable-turnstile-bypass.mjs "social media manager" --location "remote"
node test-configurable-turnstile-bypass.mjs "content marketing" --location "New York"
```

### Software Engineering Jobs
```bash
# Naukri.com - Scrape all software engineering jobs
node test-naukri-multi-domain-scraper.mjs software-engineering

# Naukri.com - Scrape specific roles
node test-naukri-configurable-scraper.mjs "python developer" --location "Mumbai"
node test-naukri-configurable-scraper.mjs "react developer" --location "Chennai"

# Indeed.com - Scrape all software engineering jobs
node test-multi-domain-turnstile-bypass.mjs software-engineering

# Indeed.com - Scrape specific roles
node test-configurable-turnstile-bypass.mjs "python developer" --location "remote"
node test-configurable-turnstile-bypass.mjs "react developer" --location "San Francisco"
```

### Finance Jobs
```bash
# Naukri.com - Scrape all finance-related jobs
node test-naukri-multi-domain-scraper.mjs finance

# Naukri.com - Scrape specific finance roles
node test-naukri-configurable-scraper.mjs "financial analyst" --location "Mumbai"
node test-naukri-configurable-scraper.mjs "accountant" --location "Delhi"

# Indeed.com - Scrape all finance-related jobs
node test-multi-domain-turnstile-bypass.mjs finance

# Indeed.com - Scrape specific finance roles
node test-configurable-turnstile-bypass.mjs "financial analyst" --location "New York"
node test-configurable-turnstile-bypass.mjs "accountant" --location "Los Angeles"
```

### Healthcare Jobs
```bash
# Naukri.com - Scrape all healthcare-related jobs
node test-naukri-multi-domain-scraper.mjs healthcare

# Naukri.com - Scrape specific healthcare roles
node test-naukri-configurable-scraper.mjs "nurse" --location "Mumbai"
node test-naukri-configurable-scraper.mjs "pharmacist" --location "Delhi"

# Indeed.com - Scrape all healthcare-related jobs
node test-multi-domain-turnstile-bypass.mjs healthcare

# Indeed.com - Scrape specific healthcare roles
node test-configurable-turnstile-bypass.mjs "nurse" --location "remote"
node test-configurable-turnstile-bypass.mjs "pharmacist" --location "Chicago"
```

## Location Options

### Naukri.com (Indian Cities)
```bash
# Major Indian cities
node test-naukri-configurable-scraper.mjs "marketing manager" --location "Mumbai"
node test-naukri-configurable-scraper.mjs "software engineer" --location "Delhi"
node test-naukri-configurable-scraper.mjs "nurse" --location "Bangalore"
node test-naukri-configurable-scraper.mjs "teacher" --location "Chennai"
node test-naukri-configurable-scraper.mjs "sales representative" --location "Hyderabad"
node test-naukri-configurable-scraper.mjs "accountant" --location "Pune"
```

### Indeed.com (International)
```bash
# Remote jobs
node test-configurable-turnstile-bypass.mjs "marketing manager" --location "remote"

# Specific cities
node test-configurable-turnstile-bypass.mjs "software engineer" --location "New York"
node test-configurable-turnstile-bypass.mjs "nurse" --location "Los Angeles"
node test-configurable-turnstile-bypass.mjs "teacher" --location "Chicago"

# States
node test-configurable-turnstile-bypass.mjs "sales representative" --location "California"
node test-configurable-turnstile-bypass.mjs "accountant" --location "Texas"
```

## Custom Search Queries

### Naukri.com Examples
```bash
# Specific job titles
node test-naukri-configurable-scraper.mjs "product manager"
node test-naukri-configurable-scraper.mjs "business analyst"
node test-naukri-configurable-scraper.mjs "project manager"

# Industry-specific roles
node test-naukri-configurable-scraper.mjs "real estate agent"
node test-naukri-configurable-scraper.mjs "legal assistant"
node test-naukri-configurable-scraper.mjs "human resources"

# Skill-based searches
node test-naukri-configurable-scraper.mjs "python developer"
node test-naukri-configurable-scraper.mjs "react developer"
node test-naukri-configurable-scraper.mjs "aws engineer"
```

### Indeed.com Examples
```bash
# Specific job titles
node test-configurable-turnstile-bypass.mjs "product manager"
node test-configurable-turnstile-bypass.mjs "business analyst"
node test-configurable-turnstile-bypass.mjs "project manager"

# Industry-specific roles
node test-configurable-turnstile-bypass.mjs "real estate agent"
node test-configurable-turnstile-bypass.mjs "legal assistant"
node test-configurable-turnstile-bypass.mjs "human resources"

# Skill-based searches
node test-configurable-turnstile-bypass.mjs "python developer"
node test-configurable-turnstile-bypass.mjs "react developer"
node test-configurable-turnstile-bypass.mjs "aws engineer"
```

## Rate Limiting and Best Practices

- All scrapers include built-in delays to avoid rate limiting
- Use `--max-jobs` to control the number of jobs scraped per search
- Start with smaller numbers for testing
- Be respectful of the job board servers
- The bypass tools are more reliable but may take longer to complete

## Troubleshooting

### Common Issues:

1. **Protection detection**: Use the **bypass** tools (recommended)
2. **No jobs found**: Try different locations or search terms
3. **Rate limiting**: The bypass tools handle this automatically
4. **Browser errors**: Ensure Playwright is properly installed
5. **Network issues**: Check your internet connection

### Error Messages:

- `Protection detected`: Use the **bypass** tools
- `Anti-bot detection`: The bypass tools handle this automatically
- `Network timeouts`: Connection issues
- `Browser launch failed`: Playwright installation issues

### Success Indicators:

- ✅ `Successfully bypassed protection!`
- ✅ `Successfully accessed Naukri.com main page!`
- ✅ `Successfully accessed Indeed main page!`
- ✅ `Aggressive extraction found X jobs`
- ✅ `Results saved to: filename.json`

## Next Steps

1. **Start with bypass tools** for best results
2. Try scraping different domains to see what jobs are available
3. Experiment with different locations and search terms
4. Analyze the scraped data to understand job market trends
5. Use the data for job market research or recruitment purposes

## File Locations

### ⭐ **RECOMMENDED** (Bypass Protection):
- **Naukri.com Multi-domain**: `test-naukri-multi-domain-scraper.mjs`
- **Naukri.com Configurable**: `test-naukri-configurable-scraper.mjs`
- **Indeed.com Multi-domain**: `test-multi-domain-turnstile-bypass.mjs`
- **Indeed.com Configurable**: `test-configurable-turnstile-bypass.mjs`

### Legacy Tools (May Fail):
- **Multi-domain scraper**: `test-multi-domain-scraping.mjs`
- **Configurable scraper**: `test-configurable-scraping.mjs`
- **Original scraper**: `test-simple-scraping.mjs`

### Output files: Saved in the same directory as the scripts

## Quick Start

For the best experience, start with:

```bash
# Naukri.com - List available domains
node test-naukri-multi-domain-scraper.mjs list

# Naukri.com - Try marketing jobs
node test-naukri-multi-domain-scraper.mjs marketing

# Naukri.com - Try a custom search
node test-naukri-configurable-scraper.mjs "data scientist"

# Indeed.com - List available domains
node test-multi-domain-turnstile-bypass.mjs list

# Indeed.com - Try marketing jobs
node test-multi-domain-turnstile-bypass.mjs marketing

# Indeed.com - Try a custom search
node test-configurable-turnstile-bypass.mjs "data scientist"
```

The **bypass** tools will handle anti-bot protection automatically and provide reliable results from both job boards!
