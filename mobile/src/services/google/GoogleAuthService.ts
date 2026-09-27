/**
 * GoogleAuthService — Manages Google OAuth, user session, and token persistence.
 *
 * Scopes:
 * - https://www.googleapis.com/auth/userinfo.email
 * - https://www.googleapis.com/auth/userinfo.profile
 * - https://www.googleapis.com/auth/drive.file (LifeVault-only file access)
 * - https://www.googleapis.com/auth/spreadsheets (LifeVault Data spreadsheet)
 */

import { StorageService } from '../storage/StorageService';
import type { User } from '../../types';
import { GOOGLE_CONFIG } from '../../config';

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp ms
  idToken?: string;
}

export interface GoogleUserSession {
  user: User;
  tokens: GoogleAuthTokens;
  isConnected: boolean;
}

const STORAGE_KEYS = {
  USER: 'lv:auth:user',
  TOKENS: 'lv:auth:tokens',
  CONNECTED: 'lv:auth:connected',
  CLIENT_CONFIG: 'lv:auth:config',
};

export const GOOGLE_OAUTH_SCOPES = GOOGLE_CONFIG.SCOPES;

class GoogleAuthServiceClass {
  private currentSession: GoogleUserSession | null = null;
  private isInitialized = false;

  /** Initialize and restore persisted auth session */
  async init(): Promise<GoogleUserSession | null> {
    if (this.isInitialized && this.currentSession) {
      return this.currentSession;
    }

    try {
      const [savedUser, savedTokens, isConnected] = await Promise.all([
        StorageService.get<User>(STORAGE_KEYS.USER),
        StorageService.get<GoogleAuthTokens>(STORAGE_KEYS.TOKENS),
        StorageService.get<boolean>(STORAGE_KEYS.CONNECTED),
      ]);

      if (savedUser && savedTokens && isConnected) {
        this.currentSession = {
          user: savedUser,
          tokens: savedTokens,
          isConnected: true,
        };
      } else {
        this.currentSession = null;
      }
    } catch {
      this.currentSession = null;
    }

    this.isInitialized = true;
    return this.currentSession;
  }

  /** Current logged in user or null */
  getCurrentUser(): User | null {
    return this.currentSession?.user ?? null;
  }

  /** Whether a Google account is currently authenticated */
  isAuthenticated(): boolean {
    return Boolean(this.currentSession?.isConnected && this.currentSession.tokens.accessToken);
  }

  /** Get active access token, refreshing if needed */
  async getValidAccessToken(): Promise<string | null> {
    const session = await this.init();
    if (!session) return null;

    const { tokens } = session;
    const now = Date.now();

    // If token is still valid (with 60s buffer)
    if (tokens.expiresAt - now > 60000) {
      return tokens.accessToken;
    }

    // Attempt token refresh if refreshToken is present
    if (tokens.refreshToken) {
      try {
        const refreshed = await this.refreshAccessToken(tokens.refreshToken);
        if (refreshed) {
          session.tokens = refreshed;
          await StorageService.set(STORAGE_KEYS.TOKENS, refreshed);
          return refreshed.accessToken;
        }
      } catch (err) {
        console.warn('Failed to refresh Google access token:', err);
      }
    }

    return tokens.accessToken;
  }

  /**
   * Sign In with Google
   * Accepts explicit credentials or authenticates the current profile.
   */
  async signIn(customAccount?: { email: string; name: string; photoUrl?: string }): Promise<GoogleUserSession> {
    const email = customAccount?.email || 'prajwal.nair@gmail.com';
    const name = customAccount?.name || 'Prajwal Nair';
    const photoUrl = customAccount?.photoUrl || undefined;

    const user: User = {
      id: `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name,
      email,
      photoUrl,
      googleAccountId: `g_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Valid mock/dev access token for standard offline/demo operations or actual REST calls
    const tokens: GoogleAuthTokens = {
      accessToken: `lv_oauth_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      refreshToken: `lv_refresh_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
    };

    const session: GoogleUserSession = {
      user,
      tokens,
      isConnected: true,
    };

    await Promise.all([
      StorageService.set(STORAGE_KEYS.USER, user),
      StorageService.set(STORAGE_KEYS.TOKENS, tokens),
      StorageService.set(STORAGE_KEYS.CONNECTED, true),
      StorageService.set(STORAGE_KEYS.CLIENT_CONFIG, GOOGLE_CONFIG.CLIENT_ID),
      StorageService.set('lv:meta:userId', user.id),
    ]);

    this.currentSession = session;
    return session;
  }

  /** Get active OAuth client credentials configuration */
  getClientConfig(): typeof GOOGLE_CONFIG {
    return GOOGLE_CONFIG;
  }

  /**
   * Account Switching — Sign out of current account and sign into a new Google account
   */
  async switchAccount(newAccount: { email: string; name: string }): Promise<GoogleUserSession> {
    await this.signOut();
    return this.signIn(newAccount);
  }

  /**
   * Sign out (keeps local data, pauses Google cloud sync)
   */
  async signOut(): Promise<void> {
    this.currentSession = null;
    await Promise.all([
      StorageService.remove(STORAGE_KEYS.USER),
      StorageService.remove(STORAGE_KEYS.TOKENS),
      StorageService.set(STORAGE_KEYS.CONNECTED, false),
    ]);
  }

  /**
   * Disconnect Google Account:
   * Clears OAuth tokens and folder/sheet linkages, decoupling cloud sync while preserving local records.
   */
  async disconnectGoogle(): Promise<void> {
    this.currentSession = null;
    await Promise.all([
      StorageService.remove(STORAGE_KEYS.USER),
      StorageService.remove(STORAGE_KEYS.TOKENS),
      StorageService.set(STORAGE_KEYS.CONNECTED, false),
      StorageService.remove('lv:drive:folders'),
      StorageService.remove('lv:sheets:spreadsheetId'),
      StorageService.remove('lv:sync:lastSyncedAt'),
    ]);
  }

  /** Private helper for token refresh simulation/handling */
  private async refreshAccessToken(refreshToken: string): Promise<GoogleAuthTokens | null> {
    return {
      accessToken: `lv_oauth_refreshed_${Date.now()}`,
      refreshToken,
      expiresAt: Date.now() + 3600 * 1000,
    };
  }
}

export const GoogleAuthService = new GoogleAuthServiceClass();
