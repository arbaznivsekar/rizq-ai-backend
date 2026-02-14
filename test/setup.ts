import { logger } from "../src/config/logger.js";
import { transports, format } from "winston";
import mongoose from "mongoose";
import { TestEnvironment } from "./helpers/testEnvironment.js";

// During tests, silence or simplify logging to avoid passing complex objects between workers
try {
  logger.clear();
  logger.add(new transports.Console({
    silent: true,
    format: format.simple(),
  }));
} catch {}

// Ensure test env and tame mongoose/indexing to avoid noisy warnings and background work
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
try {
  mongoose.set('autoIndex', false);
  mongoose.set('bufferCommands', true); // Enable buffering for tests
  // mongoose.set('bufferMaxEntries', 0); // Disable mongoose buffering - deprecated option
} catch {}

// Silence Node process warnings that Vitest tries to serialize across RPC
try {
  process.removeAllListeners('warning');
  process.on('warning', () => {});
} catch {}

// Global test setup and teardown
beforeAll(async () => {
  try {
    await TestEnvironment.setup();
  } catch (error) {
    console.warn('Test environment setup failed, continuing with tests...', error);
  }
});

afterAll(async () => {
  try {
    await TestEnvironment.cleanup();
  } catch (error) {
    console.warn('Test environment cleanup failed:', error);
  }
});

beforeEach(async () => {
  try {
    await TestEnvironment.clearDatabase();
  } catch (error) {
    console.warn('Database clear failed, continuing with test...', error);
  }
});


