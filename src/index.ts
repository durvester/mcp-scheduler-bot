#!/usr/bin/env node
import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ToolHandler } from "./server/handlers/ToolHandlerNew.js";
import { AuthConfig } from "./server/utils/AuthConfig.js";
import { PRACTICE_FUSION_TOOLS } from "./server/constants/practicefusion-tools.js";
import { Logger } from "./server/utils/Logger.js";

// Load environment variables from .env file
dotenv.config();

// Initialize logger
const logger = Logger.create('MCP Server');

// Validate environment variables (credentials are optional at startup)
function validateEnvironment(): void {
  // Check if credentials are provided
  const hasCredentials = process.env.PF_CLIENT_ID && process.env.PF_CLIENT_SECRET;
  
  if (!hasCredentials) {
    logger.warn('Practice Fusion credentials not provided at startup');
    logger.warn('Server will start normally, but tools/resources requiring Practice Fusion API will trigger OAuth when accessed');
    logger.info('To configure credentials, create a .env file with:');
    logger.info('PF_CLIENT_ID=your_client_id_here');
    logger.info('PF_CLIENT_SECRET=your_client_secret_here');
    logger.info('');
  } else {
    logger.info('Practice Fusion credentials found - OAuth will be available for tools/resources');
  }
}

// Validate environment before proceeding
validateEnvironment();

// Config values from environment variables (with defaults for missing credentials)
const authConfig: AuthConfig = {
  clientId: process.env.PF_CLIENT_ID || "not-configured",
  clientSecret: process.env.PF_CLIENT_SECRET || "not-configured", 
  tokenHost: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
  tokenPath: process.env.PF_TOKEN_PATH || "/ehr/oauth2/token",
  authorizePath: process.env.PF_AUTHORIZE_PATH || "/ehr/oauth2/auth",
  authorizationMethod: "requestbody",
  audience: "",
  callbackURL: process.env.PF_CALLBACK_URL || "http://localhost:3456/oauth/callback",
  scopes: process.env.PF_SCOPES || "calendar:a_confirmation_v1 calendar:a_events_v1 calendar:a_events_v2 calendar:a_notes_v1 calendar:a_status_v1 calendar:d_events_v1 calendar:r_events_v1 calendar:r_events_v2 calendar:r_eventtypes_v1 calendar:r_notes_v1 chart:a_superbill_v2 chart:a_vxu_v2 document:a_document_v2 document:r_document_types_v2 document:r_document_v2 document:z_document_v2 encounter:a_diagnosis_v1 encounter:a_notes_v1 encounter:r_metadata_v1 encounter:r_summary_v1 me:r_erx_v2 me:r_login_v2 me:r_profile_v2 patient:a_contact_v4 patient:a_demographics_v1 patient:a_guarantor_v1 patient:a_insurance_plan_v1 patient:a_preferredPharmacy_v1 patient:a_relatedPerson_v1 patient:r_ccda_allergies_v2 patient:r_ccda_assessmentAndPlan_v2 patient:r_ccda_clinicalNotes_v2 patient:r_ccda_demographics_v2 patient:r_ccda_encounters_v2 patient:r_ccda_functionalStatus_v2 patient:r_ccda_goals_v2 patient:r_ccda_healthConcerns_v2 patient:r_ccda_immunizations_v2 patient:r_ccda_medicalEquipment_v2 patient:r_ccda_medications_v2 patient:r_ccda_mentalStatus_v2 patient:r_ccda_problems_v2 patient:r_ccda_procedures_v2 patient:r_ccda_reasonForReferral_v2 patient:r_ccda_results_v2 patient:r_ccda_socialHistory_v2 patient:r_ccda_vitalSigns_v2 patient:r_contact_v4 patient:r_demographics_v2 patient:r_diagnosis_v1 patient:r_guarantor_v1 patient:r_insurance_v3 patient:r_insurance_plan_v1 patient:r_preferredPharmacy_v1 patient:r_profile_v4 patient:r_relatedPerson_v1 patient:r_search_v2 payer:r_insurance_v1 payer:r_insurance_plan_v1 practice:r_facilities_v2 user:r_login_v2 user:r_profile_v2",
  callbackPort: parseInt(process.env.PF_CALLBACK_PORT || "3456")
};

const baseUrl = process.env.PF_API_URL || "https://qa-api.practicefusion.com";

// Create MCP server with capabilities
const mcpServer = new Server(
  { 
    name: "practice-fusion-mcp-server", 
    version: "0.1.0"
  },
  { 
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
  }
);

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
  } catch (error) {
    logger.error("Error during shutdown", {}, error as Error);
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
  } catch (error) {
    logger.error("Fatal error during server startup", {}, error as Error);
    console.error("STARTUP ERROR:", error);
    console.error("ERROR STACK:", (error as Error).stack);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error("Unhandled error in main", {}, error);
  process.exit(1);
});