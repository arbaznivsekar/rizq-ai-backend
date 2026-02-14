import { Request, Response } from 'express';
import { gmailTokenService } from '../services/gmailTokenService.js';
import { logger } from '../config/logger.js';

export async function testGmailConnection(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    // Test if Gmail is connected
    const isConnected = await gmailTokenService.isGmailConnected(userId);
    if (!isConnected) {
      return res.json({
        success: false,
        message: 'Gmail not connected. Please connect Gmail first.',
        action: 'Connect Gmail at /api/v1/auth/google/connect'
      });
    }

    // Test getting valid access token
    const accessToken = await gmailTokenService.getValidAccessToken(userId);
    if (!accessToken) {
      return res.json({
        success: false,
        message: 'Failed to get valid access token. Please reconnect Gmail.',
        action: 'Reconnect Gmail at /api/v1/auth/google/connect'
      });
    }

    // Test Gmail service
    const gmailService = await gmailTokenService.getGmailService(userId);
    if (!gmailService) {
      return res.json({
        success: false,
        message: 'Failed to create Gmail service. Please reconnect Gmail.',
        action: 'Reconnect Gmail at /api/v1/auth/google/connect'
      });
    }

    // Try to get user profile to verify connection
    try {
      const profile = await gmailService.users.getProfile({ userId: 'me' });
      res.json({
        success: true,
        message: 'Gmail connection is working perfectly!',
        data: {
          email: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
          hasValidToken: true
        }
      });
    } catch (gmailError) {
      logger.error('Gmail API test failed:', gmailError);
      res.json({
        success: false,
        message: 'Gmail connected but API test failed. Token may be invalid.',
        error: (gmailError as Error).message,
        action: 'Try reconnecting Gmail at /api/v1/auth/google/connect'
      });
    }

  } catch (error) {
    logger.error('Gmail connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'internal_error',
      message: 'Failed to test Gmail connection'
    });
  }
}

