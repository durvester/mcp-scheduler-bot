# Practice Fusion MCP Server

A Model Context Protocol (MCP) server that provides healthcare tools and prompts for interacting with Practice Fusion EMR data using Claude Desktop and Goose Desktop.

## Features
- Practice Fusion EMR integration using API endpoints
- Uses OAuth2 to authenticate with Practice Fusion
- Anthropic Claude Desktop integration
- Response caching
- Error handling
- Null-safe data formatting
- Comprehensive clinical analysis

## Tools

### Practice Fusion API Tools
- `get_users` - Get all users in the Practice Fusion practice
- `get_facilities` - Get all facilities in the Practice Fusion practice
- `search_patients` - Search for patients by name, DOB, or other identifiers
- `get_patient_v4` - Get patient details using the v4 API
- `create_patient_v4` - Create a new patient in Practice Fusion
- `update_patient_v4` - Update an existing patient in Practice Fusion
- And many more Practice Fusion API operations

## Development Configuration 
For local testing, create a `.env` file in the root directory or use these environment variables in claude desktop launch configuration.

```
OAUTH_CLIENT_ID="your_client_id",
OAUTH_CLIENT_SECRET="your_client_secret",
OAUTH_TOKEN_HOST="https://qa-api.practicefusion.com", 
OAUTH_AUTHORIZE_PATH="/ehr/oauth2/auth",
OAUTH_AUTHORIZATION_METHOD="requestbody",
OAUTH_TOKEN_PATH="/ehr/oauth2/token",
OAUTH_AUDIENCE="",
OAUTH_CALLBACK_URL="http://localhost:3456/oauth/callback",
OAUTH_SCOPES="calendar:a_confirmation_v1 calendar:a_events_v1 calendar:a_events_v2 calendar:a_notes_v1 calendar:a_status_v1 calendar:d_events_v1 calendar:r_events_v1 calendar:r_events_v2 calendar:r_eventtypes_v1 calendar:r_notes_v1 chart:a_superbill_v2 chart:a_vxu_v2 document:a_document_v2 document:r_document_types_v2 document:r_document_v2 document:z_document_v2 encounter:a_diagnosis_v1 encounter:a_notes_v1 encounter:r_metadata_v1 encounter:r_summary_v1 me:r_erx_v2 me:r_login_v2 me:r_profile_v2 patient:a_contact_v4 patient:a_demographics_v1 patient:a_guarantor_v1 patient:a_insurance_plan_v1 patient:a_preferredPharmacy_v1 patient:a_relatedPerson_v1 patient:r_ccda_allergies_v2 patient:r_ccda_assessmentAndPlan_v2 patient:r_ccda_clinicalNotes_v2 patient:r_ccda_demographics_v2 patient:r_ccda_encounters_v2 patient:r_ccda_functionalStatus_v2 patient:r_ccda_goals_v2 patient:r_ccda_healthConcerns_v2 patient:r_ccda_immunizations_v2 patient:r_ccda_medicalEquipment_v2 patient:r_ccda_medications_v2 patient:r_ccda_mentalStatus_v2 patient:r_ccda_problems_v2 patient:r_ccda_procedures_v2 patient:r_ccda_reasonForReferral_v2 patient:r_ccda_results_v2 patient:r_ccda_socialHistory_v2 patient:r_ccda_vitalSigns_v2 patient:r_contact_v4 patient:r_demographics_v2 patient:r_diagnosis_v1 patient:r_guarantor_v1 patient:r_insurance_v3 patient:r_insurance_plan_v1 patient:r_preferredPharmacy_v1 patient:r_profile_v4 patient:r_relatedPerson_v1 patient:r_search_v2 payer:r_insurance_v1 payer:r_insurance_plan_v1 practice:r_facilities_v2 user:r_login_v2 user:r_profile_v2",
OAUTH_CALLBACK_PORT="3456"
```

## Start MCP Server Locally 
```
git clone {practice-fusion-mcp-github path}
cd practice-fusion-mcp
npm install
npm run build
```

## Use with Claude Desktop
```
For Claude Desktop, update your configuration:
macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/your-username/Desktop"
      ]
    },
    "practice-fusion-mcp": {
      "command": "node",
      "args": [
        "/Users/your-username/{download-path}/practice-fusion-mcp-server/build/index.js"
      ],
      "env": {
        "OAUTH_CLIENT_ID": "your_client_id",
        "OAUTH_CLIENT_SECRET": "your_client_secret",
        "OAUTH_TOKEN_HOST": "https://qa-api.practicefusion.com",
        "OAUTH_AUTHORIZE_PATH": "/ehr/oauth2/auth",
        "OAUTH_AUTHORIZATION_METHOD": "requestbody",
        "OAUTH_TOKEN_PATH": "/ehr/oauth2/token",
        "OAUTH_AUDIENCE": "",
        "OAUTH_CALLBACK_URL": "http://localhost:3456/oauth/callback",
        "OAUTH_SCOPES": "calendar:a_confirmation_v1 calendar:a_events_v1 ... etc",
        "OAUTH_CALLBACK_PORT": "3456"
      }
    }
  }
}
```

## Use MCP Inspector
(MCP Server using inspector. Make sure to update the .env file with the correct values.)
```
npm install -g @modelcontextprotocol/inspector
mcp-inspector build/index.js
http://localhost:5173
```

## Troubleshooting:
If Claude desktop is running it uses port 3456 for Auth. You need to terminate that process using the following command:
```
kill -9 $(lsof -t -i:3456)
```
