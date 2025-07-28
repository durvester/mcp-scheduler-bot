#!/usr/bin/env node
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ToolHandler } from "./server/handlers/ToolHandler.js";
import { PRACTICE_FUSION_TOOLS } from "./server/constants/practicefusion-tools.js";
import { getDefaultScopes } from "./server/constants/practice-fusion-scopes.js";
import { Logger } from "./server/utils/Logger.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables from .env file in the project root
dotenv.config({ path: join(__dirname, '..', '.env') });
// Initialize logger
const logger = Logger.create('MCP Server');
// Validate environment variables (credentials are optional at startup)
function validateEnvironment() {
    // Check if credentials are provided
    const hasCredentials = process.env.PF_CLIENT_ID && process.env.PF_CLIENT_SECRET;
    if (!hasCredentials) {
        logger.warn('Practice Fusion credentials not provided at startup');
        logger.warn('Server will start normally, but tools/resources requiring Practice Fusion API will trigger OAuth when accessed');
        logger.info('To configure credentials, create a .env file with:');
        logger.info('PF_CLIENT_ID=your_client_id_here');
        logger.info('PF_CLIENT_SECRET=your_client_secret_here');
        logger.info('');
    }
    else {
        logger.info('Practice Fusion credentials found - OAuth will be available for tools/resources');
    }
}
// Validate environment before proceeding
validateEnvironment();
// Config values from environment variables (with defaults for missing credentials)
const authConfig = {
    clientId: process.env.PF_CLIENT_ID || "not-configured",
    clientSecret: process.env.PF_CLIENT_SECRET || "not-configured",
    tokenHost: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
    tokenPath: process.env.PF_TOKEN_PATH || "/ehr/oauth2/token",
    authorizePath: process.env.PF_AUTHORIZE_PATH || "/ehr/oauth2/auth",
    authorizationMethod: "requestbody",
    audience: "",
    callbackURL: process.env.PF_CALLBACK_URL || "http://localhost:3456/oauth/callback",
    scopes: process.env.PF_SCOPES || getDefaultScopes(),
    callbackPort: parseInt(process.env.PF_CALLBACK_PORT || "3456")
};
const baseUrl = process.env.PF_API_URL || "https://qa-api.practicefusion.com";
// Create MCP server with capabilities
const mcpServer = new Server({
    name: "practice-fusion-mcp-server",
    version: "0.1.0"
}, {
    capabilities: {
        resources: {
            subscribe: true,
            listChanged: true
        },
        tools: {
            list: PRACTICE_FUSION_TOOLS,
            listChanged: true
        },
        prompts: {
            listChanged: true
        },
        logging: {}
    }
});
// Add error handling
mcpServer.onerror = (error) => {
    logger.error("MCP Server error", {}, error);
};
// Create and register tool handler
const toolHandler = new ToolHandler(authConfig, baseUrl);
toolHandler.register(mcpServer);
// Setup graceful shutdown
const shutdown = async () => {
    logger.info("Received shutdown signal, shutting down gracefully...");
    try {
        await mcpServer.close();
        logger.info("Server shutdown complete");
        process.exit(0);
    }
    catch (error) {
        logger.error("Error during shutdown", {}, error);
        process.exit(1);
    }
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
// Start the server
async function main() {
    try {
        logger.info("Starting Practice Fusion MCP server...");
        // Use STDIO transport
        const transport = new StdioServerTransport();
        await mcpServer.connect(transport);
        logger.info("Practice Fusion MCP server running on stdio");
        logger.info("Ready to handle MCP requests from clients like Claude Desktop");
    }
    catch (error) {
        logger.error("Fatal error during server startup", {}, error);
        process.exit(1);
    }
}
main().catch((error) => {
    logger.error("Unhandled error in main", {}, error);
    process.exit(1);
});
