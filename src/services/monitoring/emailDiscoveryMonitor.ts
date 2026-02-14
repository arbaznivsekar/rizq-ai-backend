import { logger } from '../../config/logger.js';

export class EmailDiscoveryMonitor {
  trackCachePerformance(metrics: { hits: number; misses: number; responseMs: number }) {
    const hitRate = metrics.hits + metrics.misses > 0 ? metrics.hits / (metrics.hits + metrics.misses) : 0;
    logger.info(`Email cache performance: hitRate=${hitRate.toFixed(3)} hits=${metrics.hits} misses=${metrics.misses} responseMs=${metrics.responseMs}`);
  }

  optimizeHunterUsage(stats: { credits: number; companies: number }) {
    logger.info(`Hunter usage: credits=${stats.credits} companies=${stats.companies}`);
  }
}


