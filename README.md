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
For local testing, create a `.env` file in the root directory with the following variables:

```
# Practice Fusion API credentials
PF_CLIENT_ID=your_client_id
PF_CLIENT_SECRET=your_client_secret

# API URLs
PF_API_URL=https://qa-api.practicefusion.com

# OAuth settings
PF_TOKEN_PATH=/ehr/oauth2/token
PF_AUTHORIZE_PATH=/ehr/oauth2/auth
PF_CALLBACK_URL=http://localhost:3456/oauth/callback
PF_CALLBACK_PORT=3456

# Practice Fusion API scopes
PF_SCOPES=calendar:a_confirmation_v1 calendar:a_events_v1 calendar:a_events_v2 ... etc

# Optional: Practice GUID
PF_PRACTICE_GUID=your_practice_guid
```

## Start MCP Server Locally 
```
git clone {practice-fusion-mcp-github path}
cd practice-fusion-mcp
npm install
# Create .env file with your credentials
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
        "NODE_ENV": "production"
      }
    }
  }
}
```

Notice that you no longer need to include sensitive credentials in the Claude Desktop configuration. All credentials are stored and loaded from the `.env` file on the server.

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
