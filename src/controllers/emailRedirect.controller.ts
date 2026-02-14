/**
 * Email Redirect Controller
 * Admin endpoints for monitoring email redirect service
 * 
 * @module controllers/emailRedirect
 */

import { Request, Response } from 'express';
import { logger } from '../config/logger.js';
import { emailRedirectService } from '../services/emailRedirectService.js';
import { EmailSendQueue } from '../models/emailOutreach.js';

/**
 * Get email redirect service status
 * Shows current configuration and statistics
 */
export const getRedirectStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = emailRedirectService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        testEmails: emailRedirectService.isTestMode() 
          ? emailRedirectService.getTestEmails() 
          : [],
        message: status.testMode 
          ? '⚠️  TEST MODE ACTIVE - Emails redirected to test addresses'
          : '✅ PRODUCTION MODE - Emails sent to actual recipients'
      }
    });
  } catch (error: any) {
    logger.error('Failed to get redirect status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve redirect status',
      details: error.message
    });
  }
};

/**
 * Get recent redirected emails
 * Shows last N emails that were redirected (test mode only)
 */
export const getRecentRedirectedEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Query emails with redirect metadata
    const redirectedEmails = await EmailSendQueue.find({
      'metadata.isRedirected': true
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('recipientEmail metadata emailContent.subject status createdAt sentAt')
      .lean();

    res.json({
      success: true,
      data: {
        count: redirectedEmails.length,
        emails: redirectedEmails.map(email => ({
          id: email._id,
          testRecipient: email.recipientEmail,
          originalRecipient: (email as any).metadata?.originalRecipient,
          company: (email as any).metadata?.company,
          jobTitle: (email as any).metadata?.jobTitle,
          subject: (email as any).emailContent?.subject,
          status: email.status,
          queuedAt: email.createdAt,
          sentAt: email.sentAt
        }))
      }
    });
  } catch (error: any) {
    logger.error('Failed to get redirected emails', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve redirected emails',
      details: error.message
    });
  }
};

/**
 * Get redirect distribution statistics
 * Shows how emails are distributed across test addresses
 */
export const getDistributionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!emailRedirectService.isTestMode()) {
      res.json({
        success: true,
        data: {
          message: 'Distribution stats only available in test mode',
          testMode: false
        }
      });
      return;
    }

    // Aggregate emails by test recipient
    const stats = await EmailSendQueue.aggregate([
      {
        $match: {
          'metadata.isRedirected': true
        }
      },
      {
        $group: {
          _id: '$recipientEmail',
          count: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          queued: {
            $sum: { $cond: [{ $eq: ['$status', 'queued'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        testMode: true,
        testEmails: emailRedirectService.getTestEmails(),
        distribution: stats.map(stat => ({
          testEmail: stat._id,
          totalEmails: stat.count,
          sent: stat.sent,
          failed: stat.failed,
          queued: stat.queued
        }))
      }
    });
  } catch (error: any) {
    logger.error('Failed to get distribution stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve distribution statistics',
      details: error.message
    });
  }
};

/**
 * Reset redirect distribution (admin only)
 * Resets the round-robin counter
 */
export const resetDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    emailRedirectService.resetDistribution();
    
    res.json({
      success: true,
      message: 'Email redirect distribution counter reset successfully'
    });
  } catch (error: any) {
    logger.error('Failed to reset distribution', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset distribution',
      details: error.message
    });
  }
};





