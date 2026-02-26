import { Request, Response } from 'express';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { logger } from '../config/logger.js';
import { createAccessAndRefreshTokens } from '../auth/tokenService.js';

function assertGmailEnv() {
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REDIRECT_URI) {
    throw new Error('Missing Gmail OAuth env: GMAIL_CLIENT_ID/SECRET/REDIRECT_URI');
  }
}

export async function googleConnect(req: Request, res: Response) {
  try {
    assertGmailEnv();
    // @ts-ignore dynamic import
    const { google } = await import('googleapis');
    const oauth2 = new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET, env.GMAIL_REDIRECT_URI);
    
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    });
    
    console.log('🔗 Generated Gmail OAuth URL for login');
    return res.redirect(url);
  } catch (e: any) {
    logger.error('Gmail OAuth login failed', { error: e.message });
    return res.status(500).json({ success: false, error: 'oauth_init_failed' });
  }
}

export async function googleCallback(req: Request, res: Response) {
  try {
    console.log('🔍 Gmail OAuth Callback called with:', req.query);
    assertGmailEnv();
    const code = String(req.query.code || '');
    
    if (!code) {
      console.log('❌ No authorization code provided');
      return res.status(400).json({ success: false, error: 'missing_code' });
    }
    
    console.log('✅ Authorization code received:', code.substring(0, 20) + '...');
    
    // @ts-ignore dynamic import
    const { google } = await import('googleapis');
    const oauth2 = new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET, env.GMAIL_REDIRECT_URI);
    
    console.log('🔄 Exchanging code for tokens...');
    const { tokens } = await oauth2.getToken(code);
    console.log('✅ Tokens received successfully');
    const gmailRefreshToken = tokens.refresh_token;
    const gmailAccessToken = tokens.access_token;

    // Get user profile information
    let email: string | undefined;
    let name: string | undefined;
    let profilePicture: string | undefined;
    
    try {
      if (gmailAccessToken) {
        oauth2.setCredentials({ access_token: gmailAccessToken });
        // @ts-ignore
        const oauth2api = google.oauth2({ version: 'v2', auth: oauth2 });
        const profile = await oauth2api.userinfo.get();
        email = (profile.data as any)?.email;
        name = (profile.data as any)?.name;
        profilePicture = (profile.data as any)?.picture;
      }
    } catch (e) {
      logger.warn('Failed to fetch user profile', { error: (e as Error).message });
    }

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'email_not_found',
        message: 'Could not retrieve email from Google profile'
      });
    }

    // Calculate token expiry (typically 1 hour from now)
    const tokenExpiry = new Date(Date.now() + ((tokens as any).expires_in || 3600) * 1000);
    
    console.log('🔄 Creating/updating user with email:', email);
    
    // Find existing user or create new one
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user with Gmail tokens
      user.gmailRefreshToken = gmailRefreshToken || undefined;
      user.gmailAccessToken = gmailAccessToken || undefined;
      user.gmailTokenExpiry = tokenExpiry;
      user.gmailConnectedAt = new Date();
      user.updatedAt = new Date();
      if (name) user.name = name;
      if (profilePicture) user.image = profilePicture;
      
      await user.save();
      console.log('✅ Updated existing user:', user._id);
    } else {
      // Create new user
      user = new User({
        email,
        name: name || email.split('@')[0],
        gmailRefreshToken: gmailRefreshToken,
        gmailAccessToken: gmailAccessToken,
        gmailTokenExpiry: tokenExpiry,
        gmailConnectedAt: new Date(),
        image: profilePicture,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await user.save();
      console.log('✅ Created new user:', user._id);
    }

    const authTokens = await createAccessAndRefreshTokens({
      sub: user._id.toString(),
      email: user.email,
      name: user.name ?? "",
      roles: user.roles
    });

    console.log('🎉 User authenticated successfully!');

    logger.info(`User authenticated via Gmail OAuth`, {
      userId: user._id,
      email: user.email,
      isNewUser: !user.gmailConnectedAt || (user.createdAt && user.gmailConnectedAt.getTime() === user.createdAt.getTime())
    });

    const frontendUrl = env.CORS_ORIGIN || 'http://localhost:3000';
    const hash = new URLSearchParams({
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
      expiresIn: String(authTokens.expiresIn)
    }).toString();
    const redirectUrl = `${frontendUrl}/auth/callback#${hash}`;
    return res.redirect(redirectUrl);
    
  } catch (e: any) {
    logger.error('Gmail OAuth callback failed', { error: e.message, details: e });
    
    // Redirect to frontend with error
    const frontendUrl = env.CORS_ORIGIN || 'http://localhost:3000';
    const errorUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(e.message)}`;
    
    return res.redirect(errorUrl);
  }
}


