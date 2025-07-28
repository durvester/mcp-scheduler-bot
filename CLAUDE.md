# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Running
```bash
npm run build          # Compile TypeScript to build/ directory
npm run start          # Start MCP server in STDIO mode
npm run watch          # Watch mode for development
```

### Testing and Development
```bash
npm run inspector      # Launch MCP Inspector for debugging

# Direct execution
node build/index.js    # Start server in STDIO mode
```

### Debugging
```bash
DEBUG=* node build/index.js                 # Full debug logging
node --inspect build/index.js               # Node inspector for debugging
```

## Architecture Overview

This is a **STDIO-only MCP server** that provides Practice Fusion EHR integration following the Model Context Protocol specification. The architecture is intentionally simple and focused.

### Core Components

**Main Entry Point**: `src/index.ts`
- Pure STDIO MCP server implementation
- Environment validation and configuration
- Direct Practice Fusion API integration
- MCP-compliant request/response handling

**Tool Handling System**:
- `src/server/handlers/ToolHandlerNew.ts` - Main tool registry and dispatcher
- Handler classes per domain: Patient, Calendar, Payer, UserFacility
- All handlers extend `BaseToolHandler.ts` for consistent patterns

**Practice Fusion Integration**:
- `src/server/connectors/practicefusion/` - API client implementations
- `PracticeFusionClient.ts` - Base client with OAuth2 and retry logic
- Domain-specific clients: Patients, Calendar, Facilities, Users, Payer

### Key Design Patterns

**STDIO MCP Server**: Follows the MCP specification exactly - uses standard input/output for JSON-RPC message exchange, with logging to stderr only.

**Modular Handler Architecture**: Each domain (patients, calendar, etc.) has dedicated handlers that register their tools with the main server. When adding new tools, extend the appropriate handler or create new ones following the BaseToolHandler pattern.

**OAuth2 Integration**: Practice Fusion API access uses OAuth2 with automatic token refresh. The Auth utility handles the OAuth flow including launching a local callback server.

**Comprehensive Error Handling**: All components use structured logging and proper error propagation. Network operations include retry logic with exponential backoff.

## Configuration System

### Environment Variables
The system uses environment configuration for:
- Practice Fusion API credentials (`PF_CLIENT_ID`, `PF_CLIENT_SECRET`)
- OAuth settings (`PF_CALLBACK_URL`, `PF_CALLBACK_PORT`)
- API endpoint configuration (`PF_API_URL`)

### Required Environment Variables
```bash
# Practice Fusion API credentials
PF_CLIENT_ID=your_client_id_here
PF_CLIENT_SECRET=your_client_secret_here

# API configuration (optional, has defaults)
PF_API_URL=https://qa-api.practicefusion.com
PF_CALLBACK_URL=http://localhost:3456/oauth/callback
PF_CALLBACK_PORT=3456

# OAuth scopes (optional, has comprehensive defaults)
PF_SCOPES="calendar:a_confirmation_v1 calendar:a_events_v1 ..."
```

## Practice Fusion API Integration

### Client Architecture
Base class `PracticeFusionClient.ts` provides:
- OAuth2 token management with automatic refresh
- Standardized error handling and logging
- Retry logic for transient failures
- Request/response logging for debugging

### API Clients by Domain
- **PatientsClient**: Patient search, CRUD operations, insurance management
- **CalendarClient**: Event scheduling, querying, availability checking
- **FacilitiesClient**: Practice locations and facility information
- **UsersClient**: Provider and user management
- **PayerClient**: Insurance payer directory and plan lookup

### Adding New API Integration
1. Extend `PracticeFusionClient` for the new domain
2. Create a handler class extending `BaseToolHandler`
3. Register tools in the handler and add to `ToolHandlerNew.ts`
4. Add tool definitions to `src/server/constants/practicefusion-tools.ts`

## MCP Implementation Details

### Tools System
Tools are defined in `src/server/constants/practicefusion-tools.ts` with full schema validation. Each tool handler processes requests and returns standardized responses.

### Resources System
Located in `src/server/handlers/ResourceHandler.ts`:
- Provides structured data access (facilities, schedules, etc.)
- Supports dynamic resources with parameters (patient profiles, availability)
- Implements subscription support for real-time updates

### Prompts System
Located in `src/server/handlers/PromptHandler.ts`:
- Workflow templates for common healthcare tasks
- Interactive prompts with argument collection
- Contextual guidance for complex operations

## Development Guidelines

### When Adding New Features
1. Follow the existing handler pattern for tool implementations
2. Add comprehensive error handling and logging
3. Include input validation using Zod schemas
4. Test with MCP Inspector and Claude Desktop
5. Update tool definitions in the constants file

### Testing Strategy
- Use MCP Inspector for interactive testing (`npm run inspector`)
- Test with Claude Desktop for real-world usage
- Verify OAuth flows with real Practice Fusion credentials
- Test error scenarios and edge cases

### Security Considerations
- Never commit credentials to the repository
- Use environment variables for all sensitive configuration
- Validate all inputs using Zod schemas
- Handle Practice Fusion API errors gracefully
- Implement proper OAuth token management

## Troubleshooting Common Issues

### Build Issues
- Clear `build/` directory if encountering stale compilation issues
- Check TypeScript configuration in `tsconfig.json` for module resolution

### MCP Connection Issues
- Verify the server is running in STDIO mode
- Check that messages are properly formatted JSON-RPC
- Ensure no extra output is written to stdout (only stderr for logging)

### Practice Fusion API Issues
- Verify credentials are configured in `.env` file
- Check OAuth token expiration and refresh logic
- Review API scopes for required permissions
- Monitor debug logs for API request/response details

### Claude Desktop Integration Issues
- Verify MCP server configuration in Claude Desktop settings
- Check server logs (stderr) for error messages
- Test with MCP Inspector to isolate issues
- Ensure server binary is executable (`chmod +x build/index.js`)

## Important Files to Know

- `src/index.ts` - Main STDIO MCP server entry point
- `src/server/handlers/ToolHandlerNew.ts` - Main tool registry
- `src/server/connectors/practicefusion/PracticeFusionClient.ts` - Base API client
- `src/server/constants/practicefusion-tools.ts` - Tool definitions
- `src/server/utils/Auth.ts` - OAuth2 implementation
- `package.json` - Dependencies and build scripts

## Claude Desktop Integration

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "practice-fusion": {
      "command": "node",
      "args": ["/path/to/mcp-scheduler-bot/build/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important**: 
- Credentials are read from the `.env` file in the project directory, not from Claude Desktop config
- The server must be built (`npm run build`) before use
- Logs appear in Claude Desktop's MCP server logs section