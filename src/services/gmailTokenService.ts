import { google } from 'googleapis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import User from '../models/User.js';

export class GmailTokenService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      env.GMAIL_CLIENT_ID,
      env.GMAIL_CLIENT_SECRET,
      env.GMAIL_REDIRECT_URI
    );
  }

  /**
   * Get valid access token for user, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const user = await User.findById(userId).lean();
      if (!user?.gmailRefreshToken) {
        logger.warn(`No Gmail refresh token found for user ${userId}`);
        return null;
      }

      // Check if current access token is still valid
      if (user.gmailAccessToken && user.gmailTokenExpiry && new Date() < user.gmailTokenExpiry) {
        logger.debug(`Using existing valid access token for user ${userId}`);
        return user.gmailAccessToken;
      }

      // Token expired or doesn't exist, refresh it
      logger.info(`Refreshing Gmail access token for user ${userId}`);
      return await this.refreshAccessToken(userId, user.gmailRefreshToken);
    } catch (error) {
      logger.error(`Failed to get valid access token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      const accessToken = credentials.access_token;
      const tokenExpiry = new Date(Date.now() + (credentials.expires_in || 3600) * 1000);

      // Update user with new access token
      await User.updateOne(
        { _id: userId },
        { 
          $set: { 
            gmailAccessToken: accessToken,
            gmailTokenExpiry: tokenExpiry
          }
        }
      );

      logger.info(`Successfully refreshed Gmail access token for user ${userId}`);
      return accessToken;
    } catch (error) {
      logger.error(`Failed to refresh access token for user ${userId}:`, error);
      
      // If refresh fails, clear the tokens (user needs to re-authenticate)
      await User.updateOne(
        { _id: userId },
        { 
          $unset: { 
            gmailRefreshToken: 1,
            gmailAccessToken: 1,
            gmailTokenExpiry: 1,
            gmailConnectedAt: 1
          }
        }
      );
      
      return null;
    }
  }

  /**
   * Check if user has valid Gmail connection
   */
  async isGmailConnected(userId: string): Promise<boolean> {
    const user = await User.findById(userId).lean();
    return !!(user?.gmailRefreshToken);
  }

  /**
   * Disconnect Gmail for user
   */
  async disconnectGmail(userId: string): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { 
        $unset: { 
          gmailRefreshToken: 1,
          gmailAccessToken: 1,
          gmailTokenExpiry: 1,
          gmailConnectedAt: 1
        }
      }
    );
    logger.info(`Gmail disconnected for user ${userId}`);
  }

  /**
   * Get Gmail service instance with valid auth
   */
  async getGmailService(userId: string): Promise<any | null> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) return null;

    this.oauth2Client.setCredentials({ access_token: accessToken });
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }
}

export const gmailTokenService = new GmailTokenService();

