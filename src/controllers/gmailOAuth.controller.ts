import { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../config/logger.js';
import User from '../models/User.js';

const GOOGLE_OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function required(name: string, value?: string) {
  if (!value) throw new Error(`${name} not configured`);
  return value;
}

export async function startGmailOAuth(req: Request, res: Response) {
  try {
    const clientId = required('GMAIL_CLIENT_ID', process.env.GMAIL_CLIENT_ID);
    const redirectUri = required('GMAIL_REDIRECT_URI', process.env.GMAIL_REDIRECT_URI);
    const scopes = [
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes.join(' '),
      state: String((req as any).user?.id || (req as any).user?._id || '')
    });
    return res.redirect(`${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`);
  } catch (e) {
    logger.error('startGmailOAuth failed', { error: (e as Error).message });
    return res.status(500).json({ success: false, error: 'oauth_init_failed' });
  }
}

export async function gmailOAuthCallback(req: Request, res: Response) {
  try {
    const code = String(req.query.code || '');
    if (!code) return res.status(400).json({ success: false, error: 'code_missing' });

    const clientId = required('GMAIL_CLIENT_ID', process.env.GMAIL_CLIENT_ID);
    const clientSecret = required('GMAIL_CLIENT_SECRET', process.env.GMAIL_CLIENT_SECRET);
    const redirectUri = required('GMAIL_REDIRECT_URI', process.env.GMAIL_REDIRECT_URI);

    const tokenRes = await axios.post(
      GOOGLE_OAUTH_TOKEN_URL,
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenRes.data.access_token as string | undefined;
    const refreshToken = tokenRes.data.refresh_token as string | undefined;
    if (!accessToken) return res.status(500).json({ success: false, error: 'access_token_missing' });

    const profileRes = await axios.get(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    const email = profileRes.data?.email as string | undefined;
    const userId = (req as any).user?.id || (req as any).user?._id || req.query.state;
    if (!userId) {
      // For testing: use a default user ID if none provided
      const defaultUserId = process.env.MOCK_USER_ID || '000000000000000000000001';
      logger.warn('No user ID found in OAuth callback, using default for testing', { defaultUserId });
      return res.status(401).json({ 
        success: false, 
        error: 'unauthorized',
        message: 'No user session found. Please start OAuth flow from authenticated session.',
        debug: { state: req.query.state, hasUser: !!(req as any).user }
      });
    }

    const update: any = {};
    if (email) update.email = email;
    if (refreshToken) update.gmailRefreshToken = refreshToken;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'user_not_found' });
    Object.assign(user, update);
    await user.save();

    const redirect = (process.env.APP_BASE_URL || '') + '/settings/email?connected=1';
    return res.redirect(redirect || '/');
  } catch (e) {
    logger.error('gmailOAuthCallback failed', { error: (e as Error).message });
    return res.status(500).json({ success: false, error: 'oauth_callback_failed' });
  }
}



