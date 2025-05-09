import { Auth } from './server/utils/Auth.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UsersClient } from './server/connectors/practicefusion/UsersClient.js';
import { FacilitiesClient } from './server/connectors/practicefusion/FacilitiesClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPracticeFusionApis() {
    let auth: Auth | undefined;

    try {
        // Read config
        const configPath = path.join(__dirname, '..', 'config', 'claude_desktop_config_practicefusion.json');
        const configFile = JSON.parse(readFileSync(configPath, 'utf8'));
        const config = configFile.mcpServers['mcp-scheduler-bot'].env;

        // Initialize auth
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

        // Get initial token
        console.log('Getting initial token...');
        await auth.executeWithAuth(async () => {
            console.log('Successfully authenticated!');
        });

        // Initialize clients
        const usersClient = new UsersClient({
            baseUrl: config.BASE_URL,
            auth
        });

        const facilitiesClient = new FacilitiesClient({
            baseUrl: config.BASE_URL,
            auth
        });

        // Test Users API
        console.log('\nTesting Users API...');
        const currentUser = await usersClient.getCurrentUser();
        console.log('Current User:', JSON.stringify(currentUser, null, 2));

        // Test Facilities API
        console.log('\nTesting Facilities API...');
        const facilities = await facilitiesClient.getFacilities();
        console.log('All Facilities:', JSON.stringify(facilities, null, 2));

        // Get primary facility
        const primaryFacility = await facilitiesClient.getPrimaryFacility();
        console.log('\nPrimary Facility:', JSON.stringify(primaryFacility, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Clean up the server
        auth?.cleanup();
    }
}

testPracticeFusionApis().catch(console.error); 