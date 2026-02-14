import { CacheService } from '../services/CacheService.js';

export class CacheWarmTask {
  private cache = new CacheService();
  async run() {
    // Placeholder warm keys to verify connectivity; extend as needed.
    await this.cache.setJSON('jobs:warmup:ping', { t: Date.now() }, 60);
  }
}


