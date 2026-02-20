import { google } from 'googleapis';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { logger } from '../config/logger.js';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;  // ← CHANGE: string to Buffer
  }>;

}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class GmailEmailService {
  private async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.gmailRefreshToken) {
        throw new Error('User not found or Gmail not connected');
      }

      // Check if access token is still valid
      if (user.gmailAccessToken && user.gmailTokenExpiry && new Date() < user.gmailTokenExpiry) {
        return user.gmailAccessToken;
      }

      // Refresh the access token
      const oauth2Client = new google.auth.OAuth2(
        env.GMAIL_CLIENT_ID,
        env.GMAIL_CLIENT_SECRET,
        env.GMAIL_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: user.gmailRefreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      const newAccessToken = credentials.access_token;
      const newExpiry = new Date(Date.now() + ((credentials as any).expires_in || 3600) * 1000);

      // Update user with new token
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            gmailAccessToken: newAccessToken,
            gmailTokenExpiry: newExpiry,
            updatedAt: new Date()
          }
        }
      );

      return newAccessToken || null;
    } catch (error) {
      logger.error('Failed to get valid access token', { userId, error: (error as Error).message });
      return null;
    }
  }

  private createEmailMessage(options: EmailOptions): string {
    const { to, subject, text, html, cc, bcc, replyTo, attachments } = options;  // ← ADD: attachments
    
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `From: ${replyTo || 'noreply@rizq.ai'}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="boundary123"'  // ← CHANGE: multipart/mixed (to support attachments)
    ];

    if (cc && cc.length > 0) {
      headers.push(`Cc: ${cc.join(', ')}`);
    }

    if (bcc && bcc.length > 0) {
      headers.push(`Bcc: ${bcc.join(', ')}`);
    }

    if (replyTo) {
      headers.push(`Reply-To: ${replyTo}`);
    }

    let message = headers.join('\r\n') + '\r\n\r\n';
    message += '--boundary123\r\n';

    if (text) {
      message += 'Content-Type: text/plain; charset=UTF-8\r\n\r\n';
      message += text + '\r\n\r\n';
      message += '--boundary123\r\n';
    }

    if (html) {
      message += 'Content-Type: text/html; charset=UTF-8\r\n\r\n';
      message += html + '\r\n\r\n';
    }

    // ← ADD THIS SECTION: Handle attachments
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        message += '--boundary123\r\n';
        message += `Content-Type: application/pdf; name="${attachment.filename}"\r\n`;
        message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        message += 'Content-Transfer-Encoding: base64\r\n\r\n';
        
        // Convert Buffer to base64
        const base64Content = (attachment.content as Buffer).toString('base64');
        message += base64Content + '\r\n\r\n';
      }
    }

    message += '--boundary123--';

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async sendEmail(userId: string, options: EmailOptions): Promise<SendEmailResult> {
    try {
      console.log(`📧 Sending email to ${options.to} via Gmail...`);
      
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        return {
          success: false,
          error: 'Failed to get valid access token. Please reconnect Gmail.'
        };
      }

      const oauth2Client = new google.auth.OAuth2(
        env.GMAIL_CLIENT_ID,
        env.GMAIL_CLIENT_SECRET,
        env.GMAIL_REDIRECT_URI
      );

      oauth2Client.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const message = this.createEmailMessage(options);

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      const messageId = response.data.id;
      console.log(`✅ Email sent successfully! Message ID: ${messageId}`);

      logger.info('Email sent via Gmail', {
        userId,
        to: options.to,
        subject: options.subject,
        messageId
      });

      return {
        success: true,
        messageId: messageId || undefined
      };

    } catch (error) {
      const errorMessage = (error as Error).message;
      console.log(`❌ Failed to send email: ${errorMessage}`);
      
      logger.error('Failed to send email via Gmail', {
        userId,
        to: options.to,
        subject: options.subject,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async sendTestEmail(userId: string, toEmail: string): Promise<SendEmailResult> {
    const testEmailOptions: EmailOptions = {
      to: toEmail,
      subject: '🚀 RIZQ.AI Gmail Integration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Gmail Integration Working!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">RIZQ.AI Backend Email System</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">✅ Test Email Successful</h2>
            <p style="color: #666; line-height: 1.6;">
              Congratulations! Your Gmail integration is working perfectly. This test email was sent from your RIZQ.AI backend system.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin-top: 0;">🔧 Technical Details</h3>
              <ul style="color: #666; margin: 0;">
                <li><strong>User ID:</strong> ${userId}</li>
                <li><strong>Sent At:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Service:</strong> Gmail API v1</li>
                <li><strong>Status:</strong> Successfully Delivered</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">
                This is an automated test email from your RIZQ.AI backend system.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
RIZQ.AI Gmail Integration Test

Congratulations! Your Gmail integration is working perfectly.

Technical Details:
- User ID: ${userId}
- Sent At: ${new Date().toLocaleString()}
- Service: Gmail API v1
- Status: Successfully Delivered

This is an automated test email from your RIZQ.AI backend system.
      `
    };

    return await this.sendEmail(userId, testEmailOptions);
  }

  async getGmailStatus(userId: string): Promise<{
    connected: boolean;
    email?: string;
    lastConnected?: Date;
    tokenExpiry?: Date;
  }> {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.gmailRefreshToken) {
        return { connected: false };
      }

      return {
        connected: true,
        email: user.email || undefined,
        lastConnected: user.gmailConnectedAt || undefined,
        tokenExpiry: user.gmailTokenExpiry || undefined
      };
    } catch (error) {
      logger.error('Failed to get Gmail status', { userId, error: (error as Error).message });
      return { connected: false };
    }
  }
}

export const gmailEmailService = new GmailEmailService();
