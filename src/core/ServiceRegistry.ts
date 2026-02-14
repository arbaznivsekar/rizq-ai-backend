/**
 * Unified Service Registry and Configuration Management
 * @module core
 */

import { logger } from '../config/logger.js';
import { redis } from '../db/redis.js';
import { JobModel } from '../data/models/Job.js';

/**
 * Service health status
 */
export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string;
  version: string;
  enabled: boolean;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  healthCheckInterval: number;
  dependencies: string[];
  environment: Record<string, string>;
}

/**
 * Service health information
 */
export interface ServiceHealth {
  status: ServiceStatus;
  timestamp: Date;
  responseTime: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Service interface
 */
export interface IService {
  getName(): string;
  getVersion(): string;
  isEnabled(): boolean;
  getConfig(): ServiceConfig;
  healthCheck(): Promise<ServiceHealth>;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Service registry for managing all application services
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, IService> = new Map();
  private healthCache: Map<string, ServiceHealth> = new Map();
  private healthTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: Map<string, ServiceConfig> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Initialize default service configurations
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs: ServiceConfig[] = [
      {
        name: 'database',
        version: '1.0.0',
        enabled: true,
        timeout: 5000,
        retryAttempts: 3,
        retryDelay: 1000,
        circuitBreakerThreshold: 5,
        healthCheckInterval: 30000,
        dependencies: [],
        environment: {
          MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rizq-ai',
          REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
        }
      },
      {
        name: 'jobs',
        version: '1.0.0',
        enabled: true,
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        circuitBreakerThreshold: 5,
        healthCheckInterval: 60000,
        dependencies: ['database'],
        environment: {}
      },
      {
        name: 'scraping',
        version: '1.0.0',
        enabled: true,
        timeout: 30000,
        retryAttempts: 2,
        retryDelay: 2000,
        circuitBreakerThreshold: 3,
        healthCheckInterval: 120000,
        dependencies: ['database', 'redis'],
        environment: {}
      },
      {
        name: 'email',
        version: '1.0.0',
        enabled: true,
        timeout: 15000,
        retryAttempts: 3,
        retryDelay: 1000,
        circuitBreakerThreshold: 5,
        healthCheckInterval: 90000,
        dependencies: ['database'],
        environment: {}
      },
      {
        name: 'ai',
        version: '1.0.0',
        enabled: true,
        timeout: 30000,
        retryAttempts: 2,
        retryDelay: 2000,
        circuitBreakerThreshold: 5,
        healthCheckInterval: 180000,
        dependencies: [],
        environment: {}
      },
      {
        name: 'auth',
        version: '1.0.0',
        enabled: true,
        timeout: 5000,
        retryAttempts: 3,
        retryDelay: 1000,
        circuitBreakerThreshold: 5,
        healthCheckInterval: 60000,
        dependencies: ['database'],
        environment: {}
      }
    ];

    defaultConfigs.forEach(config => {
      this.config.set(config.name, config);
    });
  }

  /**
   * Register a service
   */
  public registerService(service: IService): void {
    const serviceName = service.getName();
    this.services.set(serviceName, service);

    logger.info(`Registered service: ${serviceName} v${service.getVersion()}`);

    // Start health monitoring
    this.startHealthMonitoring(service);
  }

  /**
   * Unregister a service
   */
  public unregisterService(serviceName: string): void {
    const service = this.services.get(serviceName);
    if (service) {
      // Stop health monitoring
      this.stopHealthMonitoring(serviceName);

      this.services.delete(serviceName);
      this.healthCache.delete(serviceName);

      logger.info(`Unregistered service: ${serviceName}`);
    }
  }

  /**
   * Get service by name
   */
  public getService<T extends IService>(serviceName: string): T | null {
    return (this.services.get(serviceName) as T) || null;
  }

  /**
   * Get all registered services
   */
  public getAllServices(): Map<string, IService> {
    return new Map(this.services);
  }

  /**
   * Get service configuration
   */
  public getServiceConfig(serviceName: string): ServiceConfig | null {
    return this.config.get(serviceName) || null;
  }

  /**
   * Update service configuration
   */
  public updateServiceConfig(serviceName: string, config: Partial<ServiceConfig>): void {
    const existingConfig = this.config.get(serviceName);
    if (existingConfig) {
      const updatedConfig = { ...existingConfig, ...config };
      this.config.set(serviceName, updatedConfig);

      logger.info(`Updated configuration for service: ${serviceName}`);
    }
  }

  /**
   * Get service health status
   */
  public getServiceHealth(serviceName: string): ServiceHealth | null {
    return this.healthCache.get(serviceName) || null;
  }

  /**
   * Get health status for all services
   */
  public getAllServiceHealth(): Map<string, ServiceHealth> {
    return new Map(this.healthCache);
  }

  /**
   * Start health monitoring for a service
   */
  private startHealthMonitoring(service: IService): void {
    const serviceName = service.getName();
    const config = this.getServiceConfig(serviceName);

    if (!config) return;

    const interval = setInterval(async () => {
      try {
        const startTime = Date.now();
        const health = await service.healthCheck();
        health.timestamp = new Date();
        health.responseTime = Date.now() - startTime;

        this.healthCache.set(serviceName, health);

        // Log health status changes
        const previousHealth = this.healthCache.get(serviceName);
        if (previousHealth && previousHealth.status !== health.status) {
          logger.info(`Service ${serviceName} health changed: ${previousHealth.status} -> ${health.status}`);
        }

      } catch (error) {
        logger.error(`Health check failed for service ${serviceName}:`, error);
        this.healthCache.set(serviceName, {
          status: ServiceStatus.UNHEALTHY,
          timestamp: new Date(),
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, config.healthCheckInterval);

    this.healthTimers.set(serviceName, interval);
  }

  /**
   * Stop health monitoring for a service
   */
  private stopHealthMonitoring(serviceName: string): void {
    const timer = this.healthTimers.get(serviceName);
    if (timer) {
      clearInterval(timer);
      this.healthTimers.delete(serviceName);
    }
  }

  /**
   * Check if all dependencies are healthy
   */
  public async checkDependencies(serviceName: string): Promise<boolean> {
    const config = this.getServiceConfig(serviceName);
    if (!config || config.dependencies.length === 0) {
      return true;
    }

    for (const dependency of config.dependencies) {
      const health = this.getServiceHealth(dependency);
      if (!health || health.status !== ServiceStatus.HEALTHY) {
        logger.warn(`Dependency ${dependency} is not healthy for service ${serviceName}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Initialize all registered services
   */
  public async initializeAllServices(): Promise<void> {
    logger.info('Initializing all registered services...');

    for (const [name, service] of this.services) {
      try {
        // Check dependencies first
        const dependenciesHealthy = await this.checkDependencies(name);
        if (!dependenciesHealthy) {
          logger.warn(`Skipping service ${name} due to unhealthy dependencies`);
          continue;
        }

        await service.initialize();
        logger.info(`Initialized service: ${name}`);
      } catch (error) {
        logger.error(`Failed to initialize service ${name}:`, error);
        throw error;
      }
    }

    logger.info('All services initialized successfully');
  }

  /**
   * Shutdown all registered services
   */
  public async shutdownAllServices(): Promise<void> {
    logger.info('Shutting down all registered services...');

    // Stop health monitoring
    for (const timer of this.healthTimers.values()) {
      clearInterval(timer);
    }
    this.healthTimers.clear();

    // Shutdown services in reverse order
    const services = Array.from(this.services.values()).reverse();

    for (const service of services) {
      try {
        await service.shutdown();
        logger.info(`Shutdown service: ${service.getName()}`);
      } catch (error) {
        logger.error(`Failed to shutdown service ${service.getName()}:`, error);
      }
    }

    this.services.clear();
    this.healthCache.clear();

    logger.info('All services shutdown successfully');
  }

  /**
   * Get overall system health
   */
  public getSystemHealth(): {
    status: ServiceStatus;
    services: Map<string, ServiceHealth>;
    timestamp: Date;
  } {
    const services = this.getAllServiceHealth();
    const statuses = Array.from(services.values()).map(h => h.status);

    let overallStatus = ServiceStatus.HEALTHY;

    if (statuses.includes(ServiceStatus.UNHEALTHY)) {
      overallStatus = ServiceStatus.UNHEALTHY;
    } else if (statuses.includes(ServiceStatus.DEGRADED)) {
      overallStatus = ServiceStatus.DEGRADED;
    } else if (statuses.includes(ServiceStatus.UNKNOWN)) {
      overallStatus = ServiceStatus.UNKNOWN;
    }

    return {
      status: overallStatus,
      services,
      timestamp: new Date()
    };
  }
}
