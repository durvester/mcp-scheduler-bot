# Practice Fusion MCP Server

## Overview

This is a Model Context Protocol (MCP) server that provides comprehensive access to Practice Fusion EHR APIs through both **STDIO** and **HTTP** transports. The server exposes Practice Fusion's patient management, scheduling, and administrative capabilities to LLM clients.

## Features

### ✅ Complete MCP Implementation
- **19 Practice Fusion Tools**: Patient search, scheduling, demographics, insurance, and more
- **MCP Resources System**: Structured data access (practice facilities, patient profiles, calendar schedules)
- **MCP Prompts System**: 9 workflow templates for common healthcare tasks
- **Dual Transport Support**: STDIO (traditional) and HTTP (remote-capable)

### 🔧 Tools Available
- Patient search and management
- Appointment scheduling and management
- Insurance plan management
- User and facility management
- Calendar event management
- Document management

### 📋 Resources Available
- `practice://facilities` - Practice facilities and locations
- `practice://users` - Practice users and providers directory
- `practice://event-types` - Available appointment types
- `patient://profile/{guid}` - Patient demographics and contact info
- `patient://insurance/{guid}` - Patient insurance plans
- `calendar://schedule/{facility}/{date}` - Daily facility schedule
- `calendar://availability/{provider}/{start}/{end}` - Provider availability
- `payers://directory` - Insurance payers directory

### 📝 Prompts Available
- `schedule-appointment` - Interactive appointment scheduling workflow
- `reschedule-appointment` - Appointment rescheduling with conflict checking
- `check-availability` - Provider availability analysis
- `patient-intake` - New patient registration workflow
- `update-patient-info` - Patient information updates
- `insurance-verification` - Insurance setup and verification
- `daily-schedule-review` - Comprehensive schedule analysis
- `patient-search-optimization` - Search strategy guidance
- `appointment-status-update` - Appointment status management

## Transport Modes

### STDIO Transport (Default)
Traditional MCP transport for local usage with MCP clients like Claude Desktop.

### HTTP Transport (New!) 
Remote-capable HTTP transport supporting:
- **Streamable HTTP**: Latest MCP specification (2025-06-18)
- **Server-Sent Events (SSE)**: Real-time bidirectional communication
- **Session Management**: Secure session handling with timeout
- **Security Features**: CORS, Origin validation, Rate limiting
- **Health & Status Endpoints**: Monitoring and diagnostics

## Quick Start

### Prerequisites
1. **Practice Fusion API Access**
   - Client ID and Client Secret
   - API scopes for desired functionality

2. **Node.js Environment**
   - Node.js 18+ recommended
   - npm or yarn package manager

### Installation
```bash
npm install
npm run build
```

### Configuration

Create a `.env` file with your Practice Fusion credentials:

```bash
# Practice Fusion API Configuration
PF_CLIENT_ID=your_client_id_here
PF_CLIENT_SECRET=your_client_secret_here
PF_API_URL=https://qa-api.practicefusion.com
PF_SCOPES="calendar:a_confirmation_v1 calendar:a_events_v1..."

# Transport Configuration (Optional)
TRANSPORT_TYPE=stdio                    # or 'http' for HTTP transport
HTTP_PORT=3000                          # HTTP server port
HTTP_HOST=127.0.0.1                     # HTTP server host
HTTP_ALLOWED_ORIGINS=http://localhost:*  # Allowed origins for CORS
```

### Usage

#### STDIO Mode (Default)
For use with Claude Desktop or other local MCP clients:

```bash
npm start
# or
node build/index.js
```

#### HTTP Mode
For remote access or web-based integrations:

```bash
# Set environment for HTTP transport
export TRANSPORT_TYPE=http
export HTTP_PORT=3000
export HTTP_HOST=127.0.0.1

# Start server
npm start

# Server will be available at:
# Health: http://127.0.0.1:3000/health
# Status: http://127.0.0.1:3000/status  
# MCP Endpoint: http://127.0.0.1:3000/mcp
```

#### Quick HTTP Test
```bash
# Use the provided test script
./start-http-test.sh

# Or test manually
curl http://127.0.0.1:3000/health
```

## HTTP Transport Details

### Endpoints

#### Health Check
```http
GET /health
```
Returns server health status and session statistics.

#### Status Information
```http
GET /status  
```
Returns detailed server status, active sessions, and connection information.

#### MCP Endpoint
```http
POST /mcp    # Send JSON-RPC requests
GET /mcp     # Open SSE stream for server messages
DELETE /mcp  # Terminate session
```

### Session Management
The HTTP transport implements secure session management:
- Sessions created during initialization
- Cryptographically secure session IDs
- Configurable session timeout (default: 30 minutes)
- Automatic cleanup of expired sessions

### Security Features
- **Origin Validation**: Prevents DNS rebinding attacks
- **CORS Support**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse (configurable)
- **Security Headers**: Standard security headers applied
- **localhost Binding**: Secure by default (127.0.0.1)

### Environment Variables

#### General Settings
```bash
TRANSPORT_TYPE=stdio|http              # Transport mode selection
```

#### HTTP Transport Settings
```bash
HTTP_PORT=3000                         # Server port (1-65535)
HTTP_HOST=127.0.0.1                    # Bind address (use 127.0.0.1 for security)
HTTP_ALLOWED_ORIGINS=http://localhost:* # Comma-separated allowed origins
HTTP_REQUIRE_ORIGIN_VALIDATION=true    # Enable origin validation
HTTP_ENABLE_CORS=true                  # Enable CORS middleware
HTTP_MAX_REQUEST_SIZE=10mb             # Maximum request body size
HTTP_RATE_LIMIT_WINDOW_MS=60000        # Rate limit window (milliseconds)
HTTP_RATE_LIMIT_MAX_REQUESTS=100       # Max requests per window
HTTP_SESSION_TIMEOUT_MS=1800000        # Session timeout (30 minutes)
```

## Integration Examples

### Claude Desktop (STDIO)
Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "practice-fusion": {
      "command": "node",
      "args": ["/path/to/practice-fusion-mcp-server/build/index.js"],
      "env": {
        "PF_CLIENT_ID": "your_client_id",
        "PF_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### HTTP Client (JavaScript)
```javascript
// Initialize session
const initResponse = await fetch('http://127.0.0.1:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'MCP-Protocol-Version': '2025-06-18'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'My Client', version: '1.0.0' }
    }
  })
});

const sessionId = initResponse.headers.get('Mcp-Session-Id');

// Use tools with session
const toolResponse = await fetch('http://127.0.0.1:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'MCP-Protocol-Version': '2025-06-18',
    'Mcp-Session-Id': sessionId
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'search_patients',
      arguments: { FirstName: 'John' }
    }
  })
});
```

### SSE Streaming Example
```javascript
// Open SSE connection
const eventSource = new EventSource('http://127.0.0.1:3000/mcp?' + 
  new URLSearchParams({
    'Mcp-Session-Id': sessionId
  }));

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

eventSource.addEventListener('response', (event) => {
  const response = JSON.parse(event.data);
  // Handle JSON-RPC response
});
```

## Development

### Project Structure
```
src/
├── index.ts                 # Main entry point
├── server/
│   ├── AgentCareServer.ts   # Core server implementation
│   ├── config/
│   │   └── TransportConfig.ts   # Transport configuration
│   ├── transport/
│   │   ├── StreamableHttpTransport.ts  # HTTP transport implementation
│   │   ├── SessionManager.ts           # Session management
│   │   └── SecurityMiddleware.ts       # Security features
│   ├── handlers/            # MCP request handlers
│   ├── connectors/          # Practice Fusion API clients
│   └── utils/               # Utilities and helpers
```

### Building
```bash
npm run build          # TypeScript compilation
npm run watch          # Watch mode for development
```

### Testing
```bash
# Test HTTP transport functionality
./test-http-only.sh

# Manual testing
./start-http-test.sh
```

### Development Tips

1. **HTTP Transport Development**
   - Use `HTTP_REQUIRE_ORIGIN_VALIDATION=false` for testing
   - Monitor logs for security warnings
   - Test session timeout behavior

2. **Practice Fusion Integration**
   - Use QA environment for development
   - Handle OAuth token expiration gracefully
   - Implement proper error handling

3. **MCP Protocol Compliance**
   - Follow MCP specification for transport implementation
   - Test with multiple MCP clients
   - Validate JSON-RPC message formats

## Troubleshooting

### Common Issues

#### HTTP Transport Won't Start
```bash
# Check if port is available
lsof -i :3000

# Check environment variables
echo $TRANSPORT_TYPE $HTTP_PORT $HTTP_HOST

# Check logs for binding errors
TRANSPORT_TYPE=http node build/index.js
```

#### Session Issues
```bash
# Check session status
curl http://127.0.0.1:3000/status

# Verify session headers in requests
curl -H "Mcp-Session-Id: your-session-id" http://127.0.0.1:3000/mcp
```

#### CORS Problems
```bash
# Check allowed origins
echo $HTTP_ALLOWED_ORIGINS

# Disable origin validation for testing
HTTP_REQUIRE_ORIGIN_VALIDATION=false node build/index.js
```

#### Practice Fusion Authentication
```bash
# Verify credentials
echo $PF_CLIENT_ID $PF_CLIENT_SECRET

# Check token exchange
# (Monitor logs during startup)
```

### Debug Mode
Enable detailed logging:
```bash
DEBUG=* node build/index.js
```

## Security Considerations

### HTTP Transport Security
- **Bind to localhost (127.0.0.1)** by default
- **Validate origins** to prevent DNS rebinding attacks
- **Use HTTPS** in production deployments
- **Configure firewalls** appropriately
- **Monitor sessions** for unusual activity

### Practice Fusion Integration
- **Secure credential storage** (environment variables, not code)
- **Token expiration handling** (automatic refresh)
- **Audit trail** for all API calls
- **Rate limiting** to prevent abuse

## Production Deployment

### Recommended Setup
1. **Use HTTPS** with proper SSL certificates
2. **Configure reverse proxy** (nginx, Apache)
3. **Set up monitoring** (health checks, logs)
4. **Implement backup** and disaster recovery
5. **Use container orchestration** (Docker, Kubernetes)

### Environment Variables for Production
```bash
TRANSPORT_TYPE=http
HTTP_HOST=0.0.0.0                      # Bind to all interfaces
HTTP_PORT=3000
HTTP_REQUIRE_ORIGIN_VALIDATION=true    # Enable security
HTTP_ALLOWED_ORIGINS=https://yourdomain.com
HTTP_SESSION_TIMEOUT_MS=3600000        # 1 hour timeout
```

### Docker Example
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY build/ ./build/
EXPOSE 3000
CMD ["node", "build/index.js"]
```

## Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Follow MCP specification compliance
- Test with multiple transport modes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
1. **Check this documentation** first
2. **Review error logs** for specific issues
3. **Test with health endpoints** to isolate problems
4. **Verify Practice Fusion credentials** and permissions
5. **Check MCP client compatibility**

## Version History

### v0.2.0 - HTTP Transport Support
- ✅ Added Streamable HTTP transport (MCP 2025-06-18 spec)
- ✅ Implemented session management with secure IDs
- ✅ Added security middleware (CORS, Origin validation)
- ✅ Created health and status monitoring endpoints
- ✅ Added comprehensive environment configuration
- ✅ Maintained backward compatibility with STDIO transport

### v0.1.0 - Initial Release  
- ✅ 19 Practice Fusion tools implementation
- ✅ MCP Resources system for structured data access
- ✅ MCP Prompts system with 9 workflow templates
- ✅ STDIO transport support
- ✅ OAuth2 authentication with Practice Fusion
- ✅ Comprehensive error handling and logging