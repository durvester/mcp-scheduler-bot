#!/usr/bin/env node
import dotenv from "dotenv";
import { AgentCareServer } from "./server/AgentCareServer.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { AuthConfig } from "./server/utils/AuthConfig.js";
import { PRACTICE_FUSION_TOOLS } from "./server/constants/practicefusion-tools.js";

// Load environment variables from .env file
dotenv.config();

// Config values from environment variables
const authConfig: AuthConfig = {
  clientId: process.env.PF_CLIENT_ID || "0279efe9-00d2-4e9a-9b5c-a20142340095",
  clientSecret: process.env.PF_CLIENT_SECRET || "FBUI1EH/OYeFt6d8+ruxwhd6a/8JJn/8eVc7ScA4YBA=",
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

let mcpServer: Server = new Server(
  { 
    name: "practice-fusion-mcp-server", 
    version: "0.1.0"
  },
  { 
    capabilities: { 
      resources: {}, 
      tools: {
        list: PRACTICE_FUSION_TOOLS,
        listChanged: true
      },
      prompts: {},
      logging: {}
    } 
  }
);

// Add error handling
mcpServer.onerror = (error) => {
  console.error("[MCP Server] Error:", error);
};

const agentCareServer = new AgentCareServer(mcpServer, authConfig, baseUrl);
agentCareServer.run().catch((error) => {
  console.error("[MCP Server] Fatal error:", error);
  process.exit(1);
}); 
