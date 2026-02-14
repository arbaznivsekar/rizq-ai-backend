import { Request, Response } from 'express';
import { gmailTokenService } from '../services/gmailTokenService.js';
import { logger } from '../config/logger.js';
import User from '../models/User.js';

export async function getGmailStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const user = await User.findById(userId).select('email gmailRefreshToken gmailConnectedAt gmailTokenExpiry').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'user_not_found' });
    }

    const isConnected = await gmailTokenService.isGmailConnected(userId);
    const hasValidToken = user.gmailAccessToken && user.gmailTokenExpiry && new Date() < user.gmailTokenExpiry;

    res.json({
      success: true,
      data: {
        connected: isConnected,
        hasValidToken,
        email: user.email,
        connectedAt: user.gmailConnectedAt,
        tokenExpiry: user.gmailTokenExpiry,
        needsReauth: isConnected && !hasValidToken
      }
    });
  } catch (error) {
    logger.error('Failed to get Gmail status:', error);
    res.status(500).json({ success: false, error: 'internal_error' });
  }
}

export async function disconnectGmail(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    await gmailTokenService.disconnectGmail(userId);
    
    res.json({
      success: true,
      message: 'Gmail disconnected successfully'
    });
  } catch (error) {
    logger.error('Failed to disconnect Gmail:', error);
    res.status(500).json({ success: false, error: 'internal_error' });
  }
}

