import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    fileParallelism: false,
    isolate: false,
    maxConcurrency: 1,
    minWorkers: 1,
    maxWorkers: 1,
    reporters: ['default'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      },
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/types/',
        'scripts/'
      ]
    },
    setupFiles: ["test/setup.ts"],
    testTimeout: 60000, // Increased timeout for integration tests
    hookTimeout: 60000,
    onConsoleLog: () => false,
  },
});