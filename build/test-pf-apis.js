import { Auth } from './server/utils/Auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { UsersClient } from './server/connectors/practicefusion/UsersClient.js';
import { FacilitiesClient } from './server/connectors/practicefusion/FacilitiesClient.js';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function testPracticeFusionApis() {
    let auth;
    try {
        // Initialize auth from environment variables
        auth = new Auth({
            clientId: process.env.PF_CLIENT_ID || "",
            clientSecret: process.env.PF_CLIENT_SECRET || "",
            tokenHost: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
            tokenPath: process.env.PF_TOKEN_PATH || "/ehr/oauth2/token",
            authorizePath: process.env.PF_AUTHORIZE_PATH || "/ehr/oauth2/auth",
            authorizationMethod: 'requestbody',
            callbackURL: process.env.PF_CALLBACK_URL || "http://localhost:3456/oauth/callback",
            callbackPort: parseInt(process.env.PF_CALLBACK_PORT || "3456"),
            scopes: process.env.PF_SCOPES || "",
            audience: '' // Practice Fusion doesn't use audience
        });
        // Get initial token
        console.log('Getting initial token...');
        await auth.executeWithAuth(async () => {
            console.log('Successfully authenticated!');
        });
        // Initialize clients
        const usersClient = new UsersClient({
            baseUrl: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
            auth
        });
        const facilitiesClient = new FacilitiesClient({
            baseUrl: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
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
    }
    catch (error) {
        console.error('Test failed:', error);
    }
    finally {
        // Clean up the server
        auth?.cleanup();
    }
}
testPracticeFusionApis().catch(console.error);
