export class Auth {
    config;
    token = null;
    tokenExpiry = 0;
    constructor(config) {
        this.config = config;
    }
    /**
     * Ensures a valid token is available for API calls
     * @returns Promise<string> The valid token
     */
    async ensureValidToken() {
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
    setToken(token, expiresInSeconds) {
        this.token = token;
        this.tokenExpiry = Date.now() + (expiresInSeconds * 1000);
    }
}
