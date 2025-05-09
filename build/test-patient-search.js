import { Auth } from './server/utils/Auth.js';
import { PatientsClient } from './server/connectors/practicefusion/PatientsClient.js';
import fs from 'fs';
import path from 'path';
async function testPatientSearch() {
    try {
        // Read the config file
        const configPath = path.join(process.cwd(), 'config', 'claude_desktop_config_practicefusion.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const env = config.mcpServers['mcp-scheduler-bot'].env;
        // Extract base URL
        const baseUrl = 'https://qa-api.practicefusion.com';
        // Filter out the non-existent scope
        const scopes = env.OAUTH_SCOPES.split(' ')
            .filter((scope) => scope !== 'calendar:r_freeslots_v2')
            .join(' ');
        const authConfig = {
            clientId: env.OAUTH_CLIENT_ID,
            clientSecret: env.OAUTH_CLIENT_SECRET,
            tokenHost: baseUrl,
            tokenPath: '/ehr/oauth2/token',
            authorizePath: '/ehr/oauth2/auth',
            authorizationMethod: env.OAUTH_AUTHORIZATION_METHOD,
            audience: env.OAUTH_AUDIENCE || "",
            callbackURL: env.OAUTH_CALLBACK_URL,
            scopes: scopes,
            callbackPort: parseInt(env.OAUTH_CALLBACK_PORT)
        };
        // Initialize auth
        const auth = new Auth(authConfig);
        // Initialize patients client with correct config
        const practiceFusionConfig = {
            baseUrl,
            auth
        };
        const patientsClient = new PatientsClient(practiceFusionConfig);
        // Test 1: Search with first name and last name (AND condition)
        const searchParams1 = {
            FirstName: "John",
            LastName: "Doe",
            BirthDate: "1980-01-01",
            IsActive: true
        };
        console.log('\nTest 1: Search with first name and last name');
        console.log('Search params:', searchParams1);
        const results1 = await auth.executeWithAuth(async () => {
            return patientsClient.searchPatients(searchParams1);
        });
        console.log('Search results:', JSON.stringify(results1, null, 2));
        // Test 2: Search with birth date (OR condition)
        const searchParams2 = {
            BirthDate: "1990-01-01",
            onlyActive: true
        };
        console.log('\nTest 2: Search with birth date');
        console.log('Search params:', searchParams2);
        const results2 = await auth.executeWithAuth(async () => {
            return patientsClient.searchPatients(searchParams2);
        });
        console.log('Search results:', JSON.stringify(results2, null, 2));
        // Test 3: Search with FirstOrLastName
        const searchParams3 = {
            FirstOrLastName: "John",
            onlyActive: true
        };
        console.log('\nTest 3: Search with FirstOrLastName');
        console.log('Search params:', searchParams3);
        const results3 = await auth.executeWithAuth(async () => {
            return patientsClient.searchPatients(searchParams3);
        });
        console.log('Search results:', JSON.stringify(results3, null, 2));
    }
    catch (error) {
        console.error('Error testing patient search:', error);
    }
}
// Run the test
testPatientSearch();
