import { Auth } from './server/utils/Auth.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRefresh() {
    let auth: Auth | undefined;

    try {
        // Read config
        const configPath = path.join(__dirname, '..', 'config', 'claude_desktop_config_practicefusion.json');
        const configFile = JSON.parse(readFileSync(configPath, 'utf8'));
        const config = configFile.mcpServers['mcp-scheduler-bot'].env;

        // Initialize auth
        console.log('Initializing auth with config:', {
            clientId: config.OAUTH_CLIENT_ID,
            tokenHost: config.BASE_URL,
            tokenPath: config.OAUTH_TOKEN_PATH,
            authorizePath: config.OAUTH_AUTHORIZE_PATH,
            callbackURL: config.OAUTH_CALLBACK_URL,
            scopes: config.OAUTH_SCOPES,
            clientSecret: '***' // Hide secret in logs
        });

        auth = new Auth({
            clientId: config.OAUTH_CLIENT_ID,
            clientSecret: config.OAUTH_CLIENT_SECRET,
            tokenHost: config.BASE_URL,
            tokenPath: config.OAUTH_TOKEN_PATH,
            authorizePath: config.OAUTH_AUTHORIZE_PATH,
            authorizationMethod: 'requestbody',
            callbackURL: config.OAUTH_CALLBACK_URL,
            callbackPort: parseInt(config.OAUTH_CALLBACK_PORT),
            scopes: config.OAUTH_SCOPES,
            audience: '' // Practice Fusion doesn't use audience
        });

        // First get an initial token
        console.log('Getting initial token...');
        const initialResult = await auth.executeWithAuth(async () => {
            return 'Initial auth successful!';
        });
        console.log('Initial auth result:', initialResult);

        // Force a token refresh immediately
        console.log('Forcing immediate token refresh...');
        // @ts-ignore - Accessing private method for testing
        await auth['refreshToken']();
        console.log('Refresh token operation completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Clean up the server
        auth?.cleanup();
    }
}

testRefresh().catch(console.error); 