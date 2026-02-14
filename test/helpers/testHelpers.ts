
import { scrapingQueue } from '../../src/queues/index.js';
import { vi } from 'vitest';

export class TestHelpers {
  
  static async waitForQueueProcessing(timeoutMs: number = 5000) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeoutMs);
    });
  }
  
  static async getQueueStats(queueName: string) {
    let queue;
    switch (queueName) {
      case 'scraping':
        queue = scrapingQueue;
        break;
      // case 'email-outreach':
      //   queue = emailOutreachQueue;
      //   break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
    
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
    
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed()
    ]);
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }
  
  static async cleanQueues() {
    const queues = [scrapingQueue].filter(Boolean);
    
    for (const queue of queues) {
      await queue.obliterate({ force: true });
    }
  }
  
  static mockExternalServices() {
    // Mock implementations will be added per test file as needed
    return {
      restoreAll: () => {
        // Vitest doesn't have jest.restoreAllMocks, using vi instead
        if (typeof vi !== 'undefined' && vi.restoreAllMocks) {
          vi.restoreAllMocks();
        }
      }
    };
  }
  
  static async waitForCondition(
    condition: () => Promise<boolean> | boolean,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    return false;
  }
  
  static generateRandomEmail() {
    return `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`;
  }
  
  static generateRandomString(length: number = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  }
}
