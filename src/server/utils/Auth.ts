import { AuthorizationCode } from 'simple-oauth2';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { platform } from 'node:os';
import { exec } from 'node:child_process';
import { AuthConfig, Token } from "./AuthConfig.js";
import { fileURLToPath } from 'url';
import axios from 'axios';

interface StateHandler {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    pendingOperation: () => Promise<any>;
}

export class Auth {
  private authConfig:any;
  private oauth2: AuthorizationCode;
  private authState = new Map<string, StateHandler>();
  private token: Token | null = null;
  private callbackServer: any;

  constructor(authConfig:AuthConfig) {
    this.authConfig = authConfig;
      
    this.oauth2 = new AuthorizationCode({
      client: {
        id: authConfig.clientId,
        secret: authConfig.clientSecret
      },
      auth: {
        tokenHost: authConfig.tokenHost,
        tokenPath: authConfig.tokenPath,
        authorizePath: authConfig.authorizePath
      }
    });
    
    this.setupCallbackServer();
  }

  public openBrowser = async (url: string) => {
    // Platform-specific commands
    const commands:any = {
      darwin: `open "${url}"`,              // macOS
      win32: `start "" "${url}"`,           // Windows 
      linux: `xdg-open "${url}"`            // Linux
    };
    
    const cmd = commands[platform()];
    if (!cmd) {
      throw new Error('Unsupported platform');
    }
  
    return new Promise((resolve, reject) => {
      exec(cmd, (error:any) => {
        if (error) reject(error);
        else resolve(undefined);
      });
    });
  };

  private isTokenExpired(): boolean {
    if (!this.token?.expires_at) return true;
    // Add 5 minute buffer
    return new Date(this.token.expires_at).getTime() - 5 * 60 * 1000 < Date.now();
  }

  async ensureValidToken(): Promise<string> {
    if (!this.token) {
      throw new Error('No token available');
    }

    // Only refresh if token is expired or will expire in the next 5 minutes
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    return this.token.access_token;
  }
    
  private async exchangeCodeForToken(code: string, authMethod: 'body' | 'header' | 'requestbody' = 'body'): Promise<Token> {
    // Create request body with exact parameters as required by Practice Fusion
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', this.authConfig.callbackURL);
    params.append('client_id', this.authConfig.clientId);
    params.append('client_secret', this.authConfig.clientSecret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    let tokenUrl = `${this.authConfig.tokenHost}${this.authConfig.tokenPath}`;

    try {
        const response = await axios.post(
            tokenUrl,
            params.toString(),
            { headers }
        );

        // Calculate expiration time based on expires_in
        const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

        return {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: expiresAt,
            pf_practice_guid: response.data.pf_practice_guid
        };
    } catch (error: any) {
        throw new Error(`Error getting token: ${error.message} . URL: ${tokenUrl}`);
    }
  }

  private async refreshToken(): Promise<void> {
    if (!this.token?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      // Create request body with exact parameters as required by Practice Fusion
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', this.token.refresh_token);
      params.append('redirect_uri', this.authConfig.callbackURL);
      params.append('client_id', this.authConfig.clientId);
      params.append('client_secret', this.authConfig.clientSecret);

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      let tokenUrl = `${this.authConfig.tokenHost}${this.authConfig.tokenPath}`;

      const response = await axios.post(
        tokenUrl,
        params.toString(),
        { headers }
      );

      // Calculate expiration time based on expires_in
      const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      this.token = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: expiresAt,
        pf_practice_guid: response.data.pf_practice_guid
      };
    } catch (error: any) {
      this.token = null;
      throw error;
    }
  }

  private setupCallbackServer() {
    const app = express();
    
    app.get('/oauth/callback', async (req, res) => {
      const { code, state } = req.query;
      
      if (!code || !state) {
        res.status(400).send('Missing code or state parameter');
        return;
      }

      const stateHandler = this.authState.get(state as string);
      if (!stateHandler) {
        res.status(400).send('Invalid state parameter');
        return;
      }

      try {
        const token = await this.exchangeCodeForToken(code as string);
        this.token = token;
        const operationResult = await stateHandler.pendingOperation();
        stateHandler.resolve(operationResult);
        res.send('Authentication successful! You can close this window.');
      } catch (error) {
        stateHandler.reject(error as Error);
        res.status(500).send('Authentication failed. Please try again.');
      } finally {
        this.authState.delete(state as string);
        // Clean up the server after successful authentication
        this.cleanup();
      }
    });

    try {
      this.callbackServer = app.listen(this.authConfig.callbackPort, () => {
        // Server started
      });

      this.callbackServer.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          // Try to clean up any existing server
          this.cleanup();
          throw new Error(`Port ${this.authConfig.callbackPort} is already in use. Please ensure no other instance is running.`);
        }
        throw error;
      });
    } catch (error) {
      throw error;
    }
  }

  async executeWithAuth<T>(operation: () => Promise<T>): Promise<T> {
    try {
      if (this.token) {
        await this.ensureValidToken();
        return await operation();
      }

      // Need to authenticate first
      return new Promise((resolve, reject) => {
        const state = randomUUID();
        this.authState.set(state, {
          resolve,
          reject,
          pendingOperation: operation
        });

        const baseAuthUrl = this.oauth2.authorizeURL({
          redirect_uri: this.authConfig.callbackURL,
          scope: this.authConfig.scopes,
          state: state
        });

        // Add audience parameter manually
        const authUrl = new URL(baseAuthUrl);
        if (this.authConfig.audience) {
          authUrl.searchParams.append('aud', this.authConfig.audience);
        }
        const authorizationUri = authUrl.toString();

        this.openBrowser(authorizationUri).catch(reject);
      });
    } catch (error:any) {
      if (error.message.includes('refresh')) {
        this.token = null;
        return this.executeWithAuth(operation);
      }
      throw error;
    }
  }

  cleanup() {
    if (this.callbackServer) {
      try {
        this.callbackServer.close();
      } catch (error) {
        // Ignore errors closing the server
      }
      this.callbackServer = null;
    }
  }

  public getPracticeGuid(): string | undefined {
    return this.token?.pf_practice_guid;
  }
}

export default Auth;
