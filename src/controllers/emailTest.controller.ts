import { Request, Response } from 'express';
import { gmailEmailService } from '../services/gmailEmailService.js';
import { logger } from '../config/logger.js';

export async function sendTestEmail(req: Request, res: Response) {
  try {
    const { to } = req.body;
    const userId = (req as any).user?.id || (req as any).user?._id || '000000000000000000000001';

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required',
        message: 'Please provide a valid email address in the "to" field'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    console.log(`📧 Sending test email to ${to} for user ${userId}`);

    const result = await gmailEmailService.sendTestEmail(userId, to);

    if (result.success) {
      logger.info('Test email sent successfully', {
        userId,
        to,
        messageId: result.messageId
      });

      return res.json({
        success: true,
        message: 'Test email sent successfully!',
        data: {
          to,
          messageId: result.messageId,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      logger.error('Failed to send test email', {
        userId,
        to,
        error: result.error
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        message: result.error || 'Unknown error occurred'
      });
    }

  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error('Test email controller error', { error: errorMessage });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: errorMessage
    });
  }
}

export async function sendCustomEmail(req: Request, res: Response) {
  try {
    const { to, subject, text, html, cc, bcc, replyTo } = req.body;
    const userId = (req as any).user?.id || (req as any).user?._id || '000000000000000000000001';

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide "to" and "subject" fields'
      });
    }

    if (!text && !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing email content',
        message: 'Please provide either "text" or "html" content'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    console.log(`📧 Sending custom email to ${to} for user ${userId}`);

    const emailOptions = {
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      replyTo
    };

    const result = await gmailEmailService.sendEmail(userId, emailOptions);

    if (result.success) {
      logger.info('Custom email sent successfully', {
        userId,
        to,
        subject,
        messageId: result.messageId
      });

      return res.json({
        success: true,
        message: 'Email sent successfully!',
        data: {
          to,
          subject,
          messageId: result.messageId,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      logger.error('Failed to send custom email', {
        userId,
        to,
        subject,
        error: result.error
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        message: result.error || 'Unknown error occurred'
      });
    }

  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error('Custom email controller error', { error: errorMessage });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: errorMessage
    });
  }
}

export async function getEmailStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id || '000000000000000000000001';

    const status = await gmailEmailService.getGmailStatus(userId);

    return res.json({
      success: true,
      data: status
    });

  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error('Email status controller error', { error: errorMessage });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: errorMessage
    });
  }
}
