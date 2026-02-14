/**
 * Service Registry Initialization
 * @module core
 */

import { ServiceRegistry } from './ServiceRegistry.js';
import { JobsService } from '../services/JobsService.js';
import { logger } from '../config/logger.js';

/**
 * Initialize and register all application services
 */
export async function initializeServices(): Promise<ServiceRegistry> {
  const registry = ServiceRegistry.getInstance();

  try {
    logger.info('Initializing application services...');

    // Register core services
    const jobsService = new JobsService();
    registry.registerService(jobsService);

    // TODO: Register additional services as they are implemented
    // const scrapingService = new ScrapingService();
    // registry.registerService(scrapingService);

    // const emailService = new EmailService();
    // registry.registerService(emailService);

    // const aiService = new AIService();
    // registry.registerService(aiService);

    // const authService = new AuthService();
    // registry.registerService(authService);

    // Initialize all services
    await registry.initializeAllServices();

    logger.info('All services initialized successfully');

    return registry;
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Shutdown all application services
 */
export async function shutdownServices(): Promise<void> {
  const registry = ServiceRegistry.getInstance();

  try {
    await registry.shutdownAllServices();
    logger.info('All services shutdown successfully');
  } catch (error) {
    logger.error('Failed to shutdown services:', error);
    throw error;
  }
}

/**
 * Get service registry instance (for use in controllers)
 */
export function getServiceRegistry(): ServiceRegistry {
  return ServiceRegistry.getInstance();
}
