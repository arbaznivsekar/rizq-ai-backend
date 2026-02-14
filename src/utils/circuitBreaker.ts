/**
 * Circuit Breaker Pattern Implementation
 * @module utils/circuitBreaker
 */

import { logger } from '../config/logger.js';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerOptions {
  failureThreshold: number;        // Number of failures before opening
  resetTimeout: number;           // Time in ms before attempting reset
  monitoringPeriod: number;       // Time in ms to monitor failures
  successThreshold: number;       // Number of successes needed to close from half-open
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastResetTime: Date = new Date();

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      successThreshold: 3
    }
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if circuit breaker should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime.getTime() >= this.options.resetTimeout;
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.failureCount = 0;
    this.lastResetTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        logger.info(`Circuit breaker ${this.name} transitioning to CLOSED`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
        logger.warn(`Circuit breaker ${this.name} transitioning to OPEN after ${this.failureCount} failures`);
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
      logger.warn(`Circuit breaker ${this.name} transitioning to OPEN from HALF_OPEN`);
    }

    // Reset failure count if monitoring period has passed
    if (Date.now() - this.lastResetTime.getTime() >= this.options.monitoringPeriod) {
      this.failureCount = 0;
      this.lastResetTime = new Date();
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.lastResetTime = new Date();
    logger.info(`Circuit breaker ${this.name} manually reset to CLOSED`);
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN;
  }
}

/**
 * Circuit breaker manager for multiple services
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create circuit breaker for service
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    options?: CircuitBreakerOptions
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName, options);
    return breaker.execute(fn);
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Record<string, CircuitBreakerStats> {
    const states: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      states[name] = breaker.getStats();
    }
    return states;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Get unhealthy circuit breakers
   */
  getUnhealthyBreakers(): string[] {
    const unhealthy: string[] = [];
    for (const [name, breaker] of this.breakers) {
      if (!breaker.isHealthy()) {
        unhealthy.push(name);
      }
    }
    return unhealthy;
  }
}

// Global circuit breaker manager instance
export const circuitBreakerManager = new CircuitBreakerManager();

/**
 * Decorator for circuit breaker protection
 */
export function withCircuitBreaker(
  serviceName: string,
  options?: CircuitBreakerOptions
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      return circuitBreakerManager.execute(serviceName, () => method.apply(this, args), options);
    };
  };
}




