import { PracticeFusionConfig } from '../config/config.js';

export class Auth {
    private config: PracticeFusionConfig;
    private token: string | null = null;
    private tokenExpiry: number = 0;

    constructor(config: PracticeFusionConfig) {
        this.config = config;
    }

    /**
     * Ensures a valid token is available for API calls
     * @returns Promise<string> The valid token
     */
    async ensureValidToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        // TODO: Implement token refresh logic
        // For now, throw an error if token is not set
        if (!this.token) {
            throw new Error('Authentication token not set. Please authenticate first.');
        }

        return this.token;
    }

    /**
     * Sets the authentication token
     * @param token The token to set
     * @param expiresInSeconds Number of seconds until token expires
     */
    setToken(token: string, expiresInSeconds: number): void {
        this.token = token;
        this.tokenExpiry = Date.now() + (expiresInSeconds * 1000);
    }
} 