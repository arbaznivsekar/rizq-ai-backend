/**
 * Email Redirect Service - Test Mode Email Routing
 * 
 * Enterprise-grade email redirection service for development/testing environments.
 * Redirects production recruiter emails to safe test email addresses.
 * 
 * Features:
 * - Round-robin distribution across test email addresses
 * - Environment-based configuration
 * - Comprehensive audit logging
 * - Production safety guardrails
 * - Original recipient preservation
 * 
 * @module services/emailRedirectService
 * @author RIZQ.AI Engineering Team
 * @version 1.0.0
 */

import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Email redirect result with audit metadata
 */
export interface EmailRedirectResult {
  /** Final recipient (test email if redirected, original if not) */
  recipient: string;
  /** Whether the email was redirected */
  isRedirected: boolean;
  /** Original recruiter email (only present if redirected) */
  originalRecipient?: string;
  /** Redirect reason/mode */
  redirectMode?: 'test' | 'production';
  /** Test email distribution index (for round-robin tracking) */
  distributionIndex?: number;
}

/**
 * Email redirect configuration
 */
export interface EmailRedirectConfig {
  /** Enable test mode email redirection */
  testMode: boolean;
  /** List of test email addresses for round-robin distribution */
  testEmails: string[];
  /** Current environment (development/production) */
  environment: string;
}

/**
 * Email Redirect Service
 * 
 * Handles intelligent email routing for testing environments.
 * Uses round-robin distribution to evenly spread test emails.
 * 
 * Design Pattern: Strategy Pattern (redirects based on environment)
 * SOLID Principle: Single Responsibility (only handles email routing)
 */
export class EmailRedirectService {
  private config: EmailRedirectConfig;
  private currentIndex: number = 0;
  private redirectCount: number = 0;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
    this.logInitialization();
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): EmailRedirectConfig {
    // Parse test mode flag
    const testMode = env.EMAIL_TEST_MODE === 'true';
    
    // Parse comma-separated test email list
    const testEmailsRaw = env.EMAIL_TEST_RECIPIENTS || '';
    const testEmails = testEmailsRaw
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    return {
      testMode,
      testEmails,
      environment: env.NODE_ENV
    };
  }

  /**
   * Validate configuration and apply safety checks
   * Prevents accidental test mode activation in production
   */
  private validateConfiguration(): void {
    // PRODUCTION SAFETY: Never allow test mode in production
    if (this.config.environment === 'production' && this.config.testMode) {
      const error = new Error(
        '🚨 CRITICAL: EMAIL_TEST_MODE cannot be enabled in production environment! ' +
        'This would redirect real recruiter emails to test addresses.'
      );
      logger.error('Production safety check failed', {
        environment: this.config.environment,
        testMode: this.config.testMode,
        error: error.message
      });
      throw error;
    }

    // Validate test emails are configured if test mode is enabled
    if (this.config.testMode && this.config.testEmails.length === 0) {
      logger.warn('Test mode enabled but no test emails configured', {
        testMode: this.config.testMode,
        testEmails: this.config.testEmails
      });
      throw new Error(
        'EMAIL_TEST_MODE is enabled but EMAIL_TEST_RECIPIENTS is not configured. ' +
        'Please provide comma-separated test email addresses.'
      );
    }

    // Validate email format (basic check)
    if (this.config.testMode) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = this.config.testEmails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        throw new Error(
          `Invalid test email addresses detected: ${invalidEmails.join(', ')}. ` +
          'Please provide valid email addresses in EMAIL_TEST_RECIPIENTS.'
        );
      }
    }
  }

  /**
   * Log service initialization with configuration details
   */
  private logInitialization(): void {
    if (this.config.testMode) {
      logger.warn('🧪 Email Redirect Service initialized in TEST MODE', {
        mode: 'TEST',
        environment: this.config.environment,
        testEmailCount: this.config.testEmails.length,
        testEmails: this.config.testEmails,
        distributionStrategy: 'round-robin',
        message: '⚠️  All recruiter emails will be redirected to test addresses'
      });
    } else {
      logger.info('✅ Email Redirect Service initialized in PRODUCTION MODE', {
        mode: 'PRODUCTION',
        environment: this.config.environment,
        message: 'Emails will be sent to actual recruiters'
      });
    }
  }

  /**
   * Get recipient email address (with optional test mode redirection)
   * 
   * This is the main entry point for email routing logic.
   * 
   * @param originalRecipient - The actual recruiter email from Hunter.io
   * @param context - Context information for logging (jobId, company, etc.)
   * @returns EmailRedirectResult with final recipient and metadata
   */
  public getRecipient(
    originalRecipient: string,
    context?: {
      jobId?: string;
      company?: string;
      jobTitle?: string;
      userId?: string;
    }
  ): EmailRedirectResult {
    // Production mode: use original recipient
    if (!this.config.testMode) {
      return {
        recipient: originalRecipient,
        isRedirected: false,
        redirectMode: 'production'
      };
    }

    // Test mode: redirect to test email using round-robin
    const testRecipient = this.getNextTestEmail();
    this.redirectCount++;

    // Create comprehensive audit log
    const logContext = {
      mode: 'TEST',
      originalRecipient,
      testRecipient,
      distributionIndex: this.currentIndex - 1, // Already incremented
      redirectCount: this.redirectCount,
      jobId: context?.jobId,
      company: context?.company,
      jobTitle: context?.jobTitle,
      userId: context?.userId,
      timestamp: new Date().toISOString()
    };

    logger.warn('🧪 TEST MODE: Email redirected', logContext);

    // Emit metrics for monitoring (if metrics service exists)
    this.emitMetrics('email.redirected', logContext);

    return {
      recipient: testRecipient,
      isRedirected: true,
      originalRecipient,
      redirectMode: 'test',
      distributionIndex: this.currentIndex - 1
    };
  }

  /**
   * Get next test email using round-robin distribution
   * Ensures even distribution across all test email addresses
   */
  private getNextTestEmail(): string {
    const testEmail = this.config.testEmails[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.config.testEmails.length;
    return testEmail;
  }

  /**
   * Get current service status and statistics
   */
  public getStatus(): {
    testMode: boolean;
    environment: string;
    testEmailCount: number;
    redirectCount: number;
    uptime: number;
    currentDistributionIndex: number;
  } {
    return {
      testMode: this.config.testMode,
      environment: this.config.environment,
      testEmailCount: this.config.testEmails.length,
      redirectCount: this.redirectCount,
      uptime: Date.now() - this.startTime.getTime(),
      currentDistributionIndex: this.currentIndex
    };
  }

  /**
   * Check if service is in test mode
   */
  public isTestMode(): boolean {
    return this.config.testMode;
  }

  /**
   * Get configured test emails
   */
  public getTestEmails(): string[] {
    return [...this.config.testEmails]; // Return copy to prevent mutation
  }

  /**
   * Emit metrics for monitoring (placeholder for future metrics service)
   */
  private emitMetrics(metricName: string, data: any): void {
    // Future integration with monitoring service (Prometheus, DataDog, etc.)
    // For now, we just log structured metrics
    logger.debug(`[METRIC] ${metricName}`, data);
  }

  /**
   * Reset round-robin counter (useful for testing)
   */
  public resetDistribution(): void {
    this.currentIndex = 0;
    this.redirectCount = 0;
    logger.info('Email redirect distribution reset', {
      testMode: this.config.testMode,
      resetAt: new Date().toISOString()
    });
  }

  /**
   * Get redirect statistics grouped by test email
   */
  public getDistributionStats(): Record<string, number> {
    // This would track actual distribution in a production system
    // For now, return empty object (future enhancement)
    return {};
  }
}

/**
 * Singleton instance of Email Redirect Service
 * Ensures consistent round-robin state across the application
 */
export const emailRedirectService = new EmailRedirectService();

/**
 * Export for testing purposes
 */
export default emailRedirectService;





