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

    this.oauth2.authorizeURL({
      redirect_uri: this.authConfig.callbackURL,
      scope: this.authConfig.scopes,
      state: randomUUID()
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
      console.log('Token refresh request:', {
        url: tokenUrl,
        params: {
          grant_type: 'refresh_token',
          refresh_token: '***', // Hide token in logs
          redirect_uri: this.authConfig.callbackURL,
          client_id: this.authConfig.clientId,
          client_secret: '***' // Hide secret in logs
        }
      });

      const response = await axios.post(
        tokenUrl,
        params.toString(),
        { headers }
      );

      console.log('Token refresh response:', {
        status: response.status,
        data: {
          ...response.data,
          access_token: response.data.access_token ? '***' : undefined,
          refresh_token: response.data.refresh_token ? '***' : undefined
        }
      });

      this.token = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: new Date(Date.now() + response.data.expires_in * 1000)
      };
    } catch (error: any) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      this.token = null;
      throw error;
    }
  }

  private isTokenExpired(): boolean {
    if (!this.token?.expires_at) return true;
    // Add 5 minute buffer
    return new Date(this.token.expires_at).getTime() - 5 * 60 * 1000 < Date.now();
  }

  async ensureValidToken(): Promise<string> {
    if (!this.token) {
      throw new Error('No token available');
    }

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
    console.log('Token exchange request:', {
      url: tokenUrl,
      params: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.authConfig.callbackURL,
        client_id: this.authConfig.clientId,
        client_secret: '***' // Hide secret in logs
      }
    });

    try {
        const response = await axios.post(
            tokenUrl,
            params.toString(),
            { headers }
        );
        console.log('Token exchange response:', {
            status: response.status,
            data: {
                ...response.data,
                access_token: response.data.access_token ? '***' : undefined,
                refresh_token: response.data.refresh_token ? '***' : undefined
            }
        });

        return {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: new Date(Date.now() + response.data.expires_in * 1000)
        };
    } catch (error: any) {
        // Log detailed error information
        if (error.response) {
            console.error('Token exchange failed:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        }
        throw new Error(`Error getting token: ${error.message} . URL: ${tokenUrl}`);
    }
  }

  private setupCallbackServer() {
    const app = express();
    const port = this.authConfig.callbackPort;
    
    //callback handler
    app.get('/oauth/callback', async (req, res) => {      
        const { code, state, error } = req.query;
        const stateHandler = this.authState.get(state as string);
  
        if (!stateHandler) {
          console.error('No state handler found for state:', state);
          res.status(400).send('Invalid state');
          return;
        }

        try {
            if (error) {
              stateHandler.reject(new Error(error as string));
            } else {
              const token:Token = await this.exchangeCodeForToken(code as string,this.authConfig.authorizationMethod);
              this.token = token;
              // Execute the pending operation with the new token
              const result = await stateHandler.pendingOperation();
              stateHandler.resolve(result);
            }
          } catch (err) {
            stateHandler.reject(err as Error);
          } finally {
            this.authState.delete(state as string);
        }
        try {
            const filePath = fileURLToPath(new URL('./auth-success.html', import.meta.url));
            res.sendFile(filePath);
        } catch (error) {
            console.error('Error reading auth success template:', error);
            res.send('Authentication successful! You can close this window.');
        }
    });
    
    // Add a test endpoint to verify server is running
    app.get('/health', (req, res) => {
      res.send('OAuth callback server is running');
    });

    this.callbackServer = app.listen(port, () => {
        // console.log(`OAuth callback server listening at http://localhost:${port}`);
    });

    this.callbackServer.on('error', (error:any) => {
      if ((error as any).code === 'EADDRINUSE') {
        throw new Error(`Port ${port} is already in use`);
      }
    });

    // Add graceful shutdown
    process.on('SIGTERM', () => {
      this.callbackServer.close(() => {
        console.log('OAuth server closed');
      });
    });
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
        authUrl.searchParams.append('aud', this.authConfig.audience);
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
      this.callbackServer.close();
    }
  }
}

export default Auth;
