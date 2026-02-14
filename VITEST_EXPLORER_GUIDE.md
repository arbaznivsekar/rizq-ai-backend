# 🧪 Vitest Explorer Setup Guide for RIZQ.AI Backend

## ✅ **Installation Complete!**

Your Vitest Explorer is now configured for your RIZQ.AI backend project.

## 🎯 **How to Use Vitest Explorer:**

### **1. Access the Test Explorer:**
- **Method 1**: Click the "Test" icon in the Activity Bar (left sidebar)
- **Method 2**: Press `Ctrl+Shift+P` → "Test: Focus on Test Explorer View"
- **Method 3**: Use the Command Palette → "Vitest: Start"

### **2. Available Test Commands:**
- **Run All Tests**: Click the play button in Test Explorer
- **Run Individual Test**: Click the play button next to specific test
- **Debug Test**: Right-click test → "Debug Test"
- **Watch Mode**: Click the watch icon to auto-run tests on file changes

### **3. Test Categories in Your Project:**

#### **🔧 Unit Tests:**
- `test/endpoints/` - API endpoint tests
- `test/helpers/` - Utility function tests

#### **🔗 Integration Tests:**
- `test/integration/errorHandling.test.ts` - Error handling system
- `test/integration/scraping/` - Job scraping tests
- `test/integration/email/` - Email automation tests
- `test/integration/workflows/` - End-to-end workflow tests

### **4. Debugging Tests:**
- Set breakpoints in your test files
- Right-click test → "Debug Test"
- Use the debug console to inspect variables

### **5. Coverage Reports:**
- Tests automatically generate coverage reports
- Coverage data appears in the Test Explorer
- HTML coverage report: `coverage/index.html`

## 🚀 **Quick Start Commands:**

```bash
# Run all tests
npm run test

# Run specific test file
npm run test test/integration/errorHandling.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration
```

## 🎯 **Testing Your Error Handling System:**

1. **Open Test Explorer** in Cursor
2. **Navigate to** `test/integration/errorHandling.test.ts`
3. **Click the play button** to run error handling tests
4. **Set breakpoints** to debug specific error scenarios
5. **View coverage** to see which error handling code is tested

## 🔧 **Troubleshooting:**

### **If tests don't appear:**
- Restart Cursor
- Run `npm run test` once to initialize
- Check `.vscode/settings.json` configuration

### **If debugging doesn't work:**
- Ensure Node.js debugger extension is installed
- Check `launch.json` configuration
- Verify test file paths are correct

## 📊 **Test Structure Overview:**

```
test/
├── integration/
│   ├── errorHandling.test.ts    ← Your error handling tests
│   ├── scraping/                ← Job scraping tests
│   ├── email/                   ← Email automation tests
│   └── workflows/               ← E2E workflow tests
├── endpoints/                   ← API endpoint tests
├── helpers/                     ← Utility tests
└── fixtures/                    ← Test data
```

## 🎉 **You're Ready!**

Your Vitest Explorer is now fully configured for testing your RIZQ.AI backend error handling system and all other components!

