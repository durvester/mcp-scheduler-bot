#!/usr/bin/env node
import { Auth } from "./server/utils/Auth.js";
import { AuthConfig } from "./server/utils/AuthConfig.js";
import fs from 'fs';
import path from 'path';

// Read the config file
const configPath = path.join(process.cwd(), 'config', 'claude_desktop_config_practicefusion.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const env = config.mcpServers['mcp-scheduler-bot'].env;

// Extract base URL from token path
const baseUrl = 'https://qa-api.practicefusion.com';

// Filter out the non-existent scope
const scopes = env.OAUTH_SCOPES.split(' ')
  .filter((scope: string) => scope !== 'calendar:r_freeslots_v2')
  .join(' ');

const authConfig: AuthConfig = {
  clientId: env.OAUTH_CLIENT_ID,
  clientSecret: env.OAUTH_CLIENT_SECRET,
  tokenHost: baseUrl,
  tokenPath: '/ehr/oauth2/token',
  authorizePath: '/ehr/oauth2/auth',
  authorizationMethod: env.OAUTH_AUTHORIZATION_METHOD as "body" | "header",
  audience: env.OAUTH_AUDIENCE || "",
  callbackURL: env.OAUTH_CALLBACK_URL,
  scopes: scopes,
  callbackPort: parseInt(env.OAUTH_CALLBACK_PORT)
};

async function testAuth() {
  try {
    console.log("Initializing auth with config:", {
      ...authConfig,
      clientSecret: "***" // Hide the secret in logs
    });

    const auth = new Auth(authConfig);

    // Test the auth flow
    const result = await auth.executeWithAuth(async () => {
      const token = await auth.ensureValidToken();
      console.log("Successfully obtained token:", {
        access_token: token.substring(0, 10) + "...",
        // Don't log the full token for security
      });
      return "Auth successful!";
    });

    console.log("Auth flow result:", result);
  } catch (error) {
    console.error("Auth flow failed:", error);
  }
}

testAuth().catch(console.error); 