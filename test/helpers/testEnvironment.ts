import mongoose from 'mongoose';
import app from '../../src/app.js';
import supertest from 'supertest';
import { logger } from '../../src/config/logger.js';
import User from '../../src/models/User.js';
import { JobModel } from '../../src/data/models/Job.js';
import Application from '../../src/models/Application.js';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env.js';

export class TestEnvironment {
  public static request = supertest(app);
  
  static async setup() {
    try {
      // Silence logger during tests
      logger.silent = true;
      
      // Use a test database (you can change this to your test database)
      const testMongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/rizq_ai_test';
      
      // Disconnect existing connection if any
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      // Configure mongoose for testing
      mongoose.set('bufferCommands', true);
      
      // Connect with timeout
      await mongoose.connect(testMongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      // Wait for connection to be ready
      await new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
          resolve(true);
        } else {
          mongoose.connection.once('connected', resolve);
          mongoose.connection.once('error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 10000);
        }
      });
      
      console.log('✅ Test environment setup complete');
    } catch (error) {
      console.error('❌ Test environment setup failed:', error);
      // Continue with tests even if setup fails
      console.warn('Continuing with tests without database...');
    }
  }
  
  static async cleanup() {
    try {
      // Clear all collections
      await this.clearDatabase();
      
      // Disconnect MongoDB
      await mongoose.disconnect();
      
      console.log('✅ Test environment cleanup complete');
    } catch (error) {
      console.error('❌ Test environment cleanup failed:', error);
    }
  }
  
  static async clearDatabase() {
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, skipping database clear');
      return;
    }
    
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    } catch (error) {
      console.warn('Error clearing database:', error);
    }
  }
  
  static async seedTestData() {
    // Create test users
    const testUsers = await User.insertMany([
      {
        name: 'Test User 1',
        email: 'test1@example.com',
        roles: ['user']
      },
      {
        name: 'Admin User',
        email: 'admin@example.com', 
        roles: ['admin']
      }
    ]);
    
    // Create test jobs
    const testJobs = await JobModel.insertMany([
      {
        title: 'Software Engineer',
        company: { name: 'Tech Corp', domain: 'techcorp.com' },
        location: { city: 'San Francisco', state: 'CA', country: 'US', remoteType: 'hybrid' },
        description: 'Looking for a skilled software engineer...',
        skills: ['JavaScript', 'React', 'Node.js'],
        postedAt: new Date(),
        source: 'indeed',
        compositeKey: 'indeed-job-1'
      },
      {
        title: 'Marketing Manager',
        company: { name: 'Marketing Inc', domain: 'marketing.com' },
        location: { city: 'New York', state: 'NY', country: 'US', remoteType: 'onsite' },
        description: 'Seeking experienced marketing manager...',
        skills: ['Marketing', 'Analytics', 'Strategy'],
        postedAt: new Date(),
        source: 'linkedin',
        compositeKey: 'linkedin-job-1'
      }
    ]);
    
    return { testUsers, testJobs };
  }
}
