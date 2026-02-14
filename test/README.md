# RIZQ.AI Test Suite Organization

## 📁 Directory Structure

```
test/
├── integration/           # Integration tests for complete workflows
│   ├── scraping/         # Job scraping integration tests
│   ├── email/           # Email automation integration tests
│   └── workflows/       # End-to-end user journey tests
├── fixtures/            # Test data and mock responses
│   ├── jobs/           # Job data fixtures
│   └── users/          # User data fixtures
├── screenshots/         # Visual test artifacts
├── scripts/            # Database and system utility scripts
├── legacy/             # Legacy test files and utilities
└── helpers/            # Test utilities and factories
```

## 🧪 Test Categories

### Integration Tests (`test/integration/`)
- **Scraping Tests**: Job board scraping functionality
- **Email Tests**: Gmail OAuth and email automation
- **Workflow Tests**: Complete user journey testing

### Fixtures (`test/fixtures/`)
- **Job Data**: Real scraped job data for testing
- **User Data**: Mock user profiles and authentication data

### Scripts (`test/scripts/`)
- **Database Scripts**: Database connection and data validation
- **System Scripts**: Token management and system checks

### Legacy (`test/legacy/`)
- **Old Test Files**: Deprecated test files and utilities
- **PowerShell Scripts**: Windows-specific test scripts

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:integration
npm run test:unit
npm run test:e2e

# Run scraping tests
npm run test:scraping

# Run email tests
npm run test:email
```

## 📋 Test File Naming Convention

- `test-*.mjs` - Integration test files
- `check-*.js` - Database/system check scripts
- `debug-*.js` - Debug and utility scripts
- `REAL-*.json` - Real data fixtures
- `*.png` - Screenshot artifacts

## 🔧 Maintenance

- Keep test files organized by functionality
- Use descriptive names for test files
- Maintain clean separation between test types
- Regular cleanup of legacy files

