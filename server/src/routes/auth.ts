/**
 * Auth Routes — Google OAuth Token Exchange and JWT Session Management
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'lifevault_default_jwt_secret_2026';

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * GET /api/auth/google/url
 * Returns the Google OAuth consent URL for client redirection.
 */
authRouter.get('/google/url', (req: Request, res: Response) => {
  const state = (req.query.state as string) || Math.random().toString(36).substring(2);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url, state, clientId: GOOGLE_CLIENT_ID });
});

/**
 * POST /api/auth/google/callback
 * Exchanges authorization code for Google access & refresh tokens securely on server.
 */
authRouter.post('/google/callback', async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri || GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange authorization code with Google',
        details: tokenData,
      });
    }

    // Retrieve user profile information using the fresh access token
    let profile: any = null;
    try {
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (profileResponse.ok) {
        profile = await profileResponse.json();
      }
    } catch (e) {
      console.warn('Could not fetch user profile info:', e);
    }

    const userPayload = {
      id: profile?.id ? `google_${profile.id}` : `user_${Date.now()}`,
      email: profile?.email || '',
      name: profile?.name || 'LifeVault User',
      photoUrl: profile?.picture || '',
    };

    // Issue LifeVault JWT
    const lifeVaultJwt = jwt.sign(
      {
        sub: userPayload.id,
        email: userPayload.email,
        name: userPayload.name,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
        idToken: tokenData.id_token,
      },
      user: userPayload,
      token: lifeVaultJwt,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'OAuth exchange internal error',
      message: error?.message || 'Unknown error',
    });
  }
});

/**
 * POST /api/auth/google/refresh
 * Refreshes an expired Google access token using the refresh token.
 */
authRouter.post('/google/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to refresh token with Google',
        details: data,
      });
    }

    return res.json({
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Token refresh error',
      message: error?.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/auth/verify
 * Verifies LifeVault JWT token
 */
authRouter.get('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, error: 'Bearer token missing' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, user: decoded });
  } catch {
    return res.status(401).json({ valid: false, error: 'Token invalid or expired' });
  }
});
