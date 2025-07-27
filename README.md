# Practice Fusion MCP Server

A comprehensive Model Context Protocol (MCP) server that provides healthcare tools, resources, and prompts for interacting with Practice Fusion EHR using any MCP client. Supports both **STDIO** (traditional) and **HTTP** (remote-capable) transports.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Practice Fusion API credentials** (optional at startup - see [Getting Practice Fusion Credentials](#getting-practice-fusion-credentials))

### Installation & Build
```bash
git clone <repository-url>
cd practice-fusion-mcp-server
npm install
npm run build
```

### Basic Usage (STDIO Mode)
```bash
# Start server in STDIO mode (default) - no credentials needed at startup
node build/index.js

# OAuth will trigger when tools/resources are accessed
# Configure credentials in .env for Practice Fusion integration
```

### HTTP Mode (Remote Access)
```bash
# Set environment for HTTP transport
export TRANSPORT_TYPE=http
export HTTP_PORT=3000

# Start HTTP server - no credentials needed at startup
node build/index.js

# Server available at:
# Health: http://127.0.0.1:3000/health  ← Works immediately
# Status: http://127.0.0.1:3000/status   ← Works immediately  
# MCP: http://127.0.0.1:3000/mcp         ← Works immediately
```

## 🏥 Features

### Complete Practice Fusion Integration
- **19 Practice Fusion Tools**: Patient search, scheduling, demographics, insurance management
- **MCP Resources System**: Structured data access (facilities, patient profiles, schedules)
- **MCP Prompts System**: 9 workflow templates for common healthcare tasks
- **OAuth2 Authentication**: Secure Practice Fusion API access with automatic token refresh

### Dual Transport Support
- **STDIO Transport**: Traditional MCP transport for local clients (Claude Desktop)
- **HTTP Transport**: Remote-capable HTTP transport with SSE streaming (NEW!)

### Enterprise Features
- **Session Management**: Secure session handling with configurable timeout
- **Security Middleware**: CORS, Origin validation, Rate limiting
- **Health Monitoring**: Health check and status endpoints
- **Comprehensive Logging**: Structured logging with debug modes

## 🛠️ Available Tools (19 Total)

### Patient Management
- `search_patients` - Search patients by name, DOB, demographics, or identifiers
- `get_patient_v4` - Get complete patient details with profile, contact, demographics
- `create_patient_v4` - Register new patients with validation
- `update_patient_v4` - Update patient information (demographics, contact, insurance)
- `get_patient_insurance_plans` - Retrieve patient insurance coverage details
- `create_patient_insurance_plan` - Add new insurance plans for patients

### Scheduling & Calendar
- `query_events` - Query appointments and calendar events with filtering
- `get_event` - Get detailed appointment information by event ID
- `create_event` - Schedule new appointments with validation
- `update_event` - Modify existing appointments (time, status, details)
- `get_event_types` - List available appointment types and categories
- `get_event_confirmation` - Retrieve appointment confirmation details
- `update_event_confirmation` - Update appointment confirmation status

### Practice Administration
- `get_users` - List all practice users and providers with profiles
- `get_facilities` - Get practice facilities with locations and contact information
- `find_payers` - Search insurance payers and coverage plans

### Document Management
- `get_document_types` - List available document types for practice
- `get_document` - Retrieve specific documents by ID
- `create_document` - Upload and create new documents

## 📋 MCP Resources (Structured Data Access)

### Practice Resources
- `practice://facilities` - All practice facilities with locations and details
- `practice://users` - Complete users and providers directory
- `practice://event-types` - Available appointment types and categories

### Patient Resources (Dynamic)
- `patient://profile/{patientGuid}` - Patient demographics and contact information
- `patient://insurance/{patientGuid}` - Patient insurance plans and coverage

### Calendar Resources (Dynamic)
- `calendar://schedule/{facilityGuid}/{date}` - Daily facility schedule (YYYY-MM-DD)
- `calendar://availability/{ehrUserGuid}/{startDate}/{endDate}` - Provider availability

### Payer Resources
- `payers://directory` - Insurance payers directory with available plans

## 📝 MCP Prompts (Workflow Templates)

### Scheduling Workflows
- `schedule-appointment` - Interactive appointment scheduling with validation
- `reschedule-appointment` - Appointment rescheduling with conflict checking
- `check-availability` - Provider availability analysis and optimization

### Patient Management Workflows
- `patient-intake` - New patient registration workflow with insurance setup
- `update-patient-info` - Guided patient information updates
- `insurance-verification` - Step-by-step insurance verification and setup

### Administrative Workflows
- `daily-schedule-review` - Comprehensive daily schedule analysis
- `patient-search-optimization` - Search strategy guidance and best practices
- `appointment-status-update` - Appointment status management workflow

## ⚙️ Configuration

### Getting Practice Fusion Credentials

To use this MCP server, you need Practice Fusion API credentials:

1. **Contact Practice Fusion Developer Support**
   - Email: `developer-support@practicefusion.com`
   - Request API access for your practice/organization

2. **Request Required Information**
   - Client ID and Client Secret
   - API URL (typically `https://api.practicefusion.com` for production)
   - Required OAuth scopes for your use case

3. **Scopes You'll Need**
   ```
   calendar:a_confirmation_v1 calendar:a_events_v1 calendar:a_events_v2
   calendar:a_notes_v1 calendar:a_status_v1 calendar:d_events_v1
   calendar:r_events_v1 calendar:r_events_v2 calendar:r_eventtypes_v1
   patient:a_contact_v4 patient:a_demographics_v1 patient:a_insurance_plan_v1
   patient:r_profile_v4 patient:r_contact_v4 patient:r_search_v2
   practice:r_facilities_v2 user:r_login_v2 user:r_profile_v2
   payer:r_insurance_v1 document:r_document_v2
   ```

### Environment Configuration

Create a `.env` file in the project root:

```bash
# ========================================
# PRACTICE FUSION API CREDENTIALS
# ========================================
# REQUIRED: Get these from Practice Fusion Developer Support
PF_CLIENT_ID=your_client_id_here
PF_CLIENT_SECRET=your_client_secret_here

# ========================================
# PRACTICE FUSION API CONFIGURATION
# ========================================
# API Base URL (default: QA environment)
PF_API_URL=https://qa-api.practicefusion.com

# OAuth Endpoints (usually don't need to change)
PF_TOKEN_PATH=/ehr/oauth2/token
PF_AUTHORIZE_PATH=/ehr/oauth2/auth

# OAuth Callback (for local development)
PF_CALLBACK_URL=http://localhost:3456/oauth/callback
PF_CALLBACK_PORT=3456

# API Scopes (copy the scopes provided by Practice Fusion)
PF_SCOPES="calendar:a_confirmation_v1 calendar:a_events_v1 calendar:a_events_v2 calendar:a_notes_v1 calendar:a_status_v1 calendar:d_events_v1 calendar:r_events_v1 calendar:r_events_v2 calendar:r_eventtypes_v1 calendar:r_notes_v1 chart:a_superbill_v2 chart:a_vxu_v2 document:a_document_v2 document:r_document_types_v2 document:r_document_v2 document:z_document_v2 encounter:a_diagnosis_v1 encounter:a_notes_v1 encounter:r_metadata_v1 encounter:r_summary_v1 me:r_erx_v2 me:r_login_v2 me:r_profile_v2 patient:a_contact_v4 patient:a_demographics_v1 patient:a_guarantor_v1 patient:a_insurance_plan_v1 patient:a_preferredPharmacy_v1 patient:a_relatedPerson_v1 patient:r_ccda_allergies_v2 patient:r_ccda_assessmentAndPlan_v2 patient:r_ccda_clinicalNotes_v2 patient:r_ccda_demographics_v2 patient:r_ccda_encounters_v2 patient:r_ccda_functionalStatus_v2 patient:r_ccda_goals_v2 patient:r_ccda_healthConcerns_v2 patient:r_ccda_immunizations_v2 patient:r_ccda_medicalEquipment_v2 patient:r_ccda_medications_v2 patient:r_ccda_mentalStatus_v2 patient:r_ccda_problems_v2 patient:r_ccda_procedures_v2 patient:r_ccda_reasonForReferral_v2 patient:r_ccda_results_v2 patient:r_ccda_socialHistory_v2 patient:r_ccda_vitalSigns_v2 patient:r_contact_v4 patient:r_demographics_v2 patient:r_diagnosis_v1 patient:r_guarantor_v1 patient:r_insurance_v3 patient:r_insurance_plan_v1 patient:r_preferredPharmacy_v1 patient:r_profile_v4 patient:r_relatedPerson_v1 patient:r_search_v2 payer:r_insurance_v1 payer:r_insurance_plan_v1 practice:r_facilities_v2 user:r_login_v2 user:r_profile_v2"

# ========================================
# TRANSPORT CONFIGURATION
# ========================================
# Transport Type: 'stdio' (default) or 'http'
TRANSPORT_TYPE=stdio

# HTTP Transport Settings (only used when TRANSPORT_TYPE=http)
HTTP_PORT=3000
HTTP_HOST=127.0.0.1
HTTP_ALLOWED_ORIGINS=http://localhost:*,https://localhost:*
HTTP_REQUIRE_ORIGIN_VALIDATION=true
HTTP_ENABLE_CORS=true
HTTP_SESSION_TIMEOUT_MS=1800000
```

### Security Notes
- **Never commit credentials** to version control
- **.env file is gitignored** for security
- **Use environment variables** in production deployments
- **Restrict HTTP_HOST** to localhost (127.0.0.1) unless external access needed

## 🖥️ Transport Modes

### STDIO Transport (Default)
For local MCP clients like Claude Desktop:

```bash
# Default mode - no configuration needed
node build/index.js
```

### HTTP Transport (Remote Access)
For web applications and remote integrations:

```bash
# Enable HTTP transport
export TRANSPORT_TYPE=http
export HTTP_PORT=3000
export HTTP_HOST=127.0.0.1

# Start HTTP server
node build/index.js

# Available endpoints:
# http://127.0.0.1:3000/health   - Health check
# http://127.0.0.1:3000/status   - Server status
# http://127.0.0.1:3000/mcp      - MCP endpoint
```

### Quick HTTP Test
```bash
# Use provided test script
./start-http-test.sh

# Manual health check
curl http://127.0.0.1:3000/health
```

### HTTP Transport Testing

#### Build Command
```bash
npm run build
```

#### Test HTTP Transport Functionality
```bash
# Automated test suite
./test-http-only.sh

# Manual server start for testing
./start-http-test.sh
```

#### Manual HTTP Testing
```bash
# 1. Start server in HTTP mode
export TRANSPORT_TYPE=http
export HTTP_PORT=3000
export PF_CLIENT_ID=test
export PF_CLIENT_SECRET=test
node build/index.js

# 2. Test health endpoint
curl http://127.0.0.1:3000/health

# 3. Test initialization
curl -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "MCP-Protocol-Version: 2025-06-18" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "Test Client", "version": "1.0.0"}
    }
  }'
```

## 🔗 Integration Examples

### Claude Desktop (STDIO Mode)

Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "practice-fusion": {
      "command": "node",
      "args": ["/path/to/practice-fusion-mcp-server/build/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important**: Credentials are read from `.env` file, not Claude Desktop config for security.

### HTTP Client Integration (JavaScript)

```javascript
// Initialize MCP session
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
      clientInfo: { name: 'My App', version: '1.0.0' }
    }
  })
});

const sessionId = initResponse.headers.get('Mcp-Session-Id');

// Use tools with session
const searchResponse = await fetch('http://127.0.0.1:3000/mcp', {
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
      arguments: { FirstName: 'John', LastName: 'Smith' }
    }
  })
});
```

### Server-Sent Events (SSE) Example

```javascript
// Open SSE connection for real-time updates
const eventSource = new EventSource(
  `http://127.0.0.1:3000/mcp?Mcp-Session-Id=${sessionId}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

eventSource.addEventListener('response', (event) => {
  const response = JSON.parse(event.data);
  // Handle JSON-RPC response
});
```

## 🧪 Development & Testing

### Development Commands
```bash
npm run build          # TypeScript compilation
npm run watch          # Watch mode for development
npm run inspector      # Launch MCP Inspector
```

### MCP Inspector (Development Tool)
```bash
# Install globally
npm install -g @modelcontextprotocol/inspector

# Launch inspector
npx @modelcontextprotocol/inspector build/index.js

# Access at http://localhost:5173
```

### Testing Scripts
```bash
# Test HTTP transport functionality
./test-http-only.sh

# Start HTTP server for manual testing
./start-http-test.sh

# Test specific Practice Fusion APIs (requires real credentials)
npm run build && node build/test-pf-apis.js
```

### Environment Variables for Testing
```bash
# HTTP Transport Testing
export TRANSPORT_TYPE=http
export HTTP_PORT=3000
export HTTP_HOST=127.0.0.1
export HTTP_REQUIRE_ORIGIN_VALIDATION=false  # Disable for testing
export HTTP_ENABLE_CORS=true

# Use dummy credentials for HTTP transport testing
export PF_CLIENT_ID=test-client-id
export PF_CLIENT_SECRET=test-client-secret
```

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear build cache
rm -rf build/
npm run build
```

#### Port Conflicts
```bash
# Check if port is in use
lsof -i :3000
lsof -i :3456  # OAuth callback port

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### HTTP Transport Issues
```bash
# Check configuration
echo $TRANSPORT_TYPE $HTTP_PORT $HTTP_HOST

# Test health endpoint
curl http://127.0.0.1:3000/health

# Check server logs
TRANSPORT_TYPE=http node build/index.js
```

#### Practice Fusion Authentication
```bash
# Verify credentials are set
echo $PF_CLIENT_ID $PF_CLIENT_SECRET

# Check .env file exists and is loaded
cat .env | grep PF_

# Test with debug logging
DEBUG=* node build/index.js
```

#### Session Issues (HTTP Mode)
```bash
# Check session status
curl http://127.0.0.1:3000/status

# Clear sessions (restart server)
# Sessions are in-memory and cleared on restart
```

### Debug Mode
```bash
# Enable detailed logging
DEBUG=* node build/index.js

# HTTP transport with debug logs
DEBUG=* TRANSPORT_TYPE=http node build/index.js
```

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
TRANSPORT_TYPE=http
HTTP_HOST=0.0.0.0                    # Bind to all interfaces
HTTP_PORT=3000
HTTP_REQUIRE_ORIGIN_VALIDATION=true  # Enable security
HTTP_ALLOWED_ORIGINS=https://yourdomain.com
HTTP_SESSION_TIMEOUT_MS=3600000      # 1 hour
```

### Docker Example
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY build/ ./build/
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "build/index.js"]
```

### Security Recommendations
- **Use HTTPS** in production with proper SSL certificates
- **Configure firewall** to restrict access
- **Set up monitoring** for health endpoints
- **Use reverse proxy** (nginx, Apache) for advanced features
- **Implement log aggregation** for monitoring

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Test both STDIO and HTTP transports
- Ensure no credentials in code

## 📞 Support

For support and questions:
1. Check this README and [CLAUDE.md](./CLAUDE.md) documentation
2. Review error logs for specific issues
3. Test with health endpoints to isolate problems
4. Verify Practice Fusion credentials and permissions
5. Check MCP client compatibility

## 📚 Additional Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive technical documentation
- **[HTTP Transport Details](./CLAUDE.md#http-transport-details)** - In-depth HTTP implementation guide
- **[Security Considerations](./CLAUDE.md#security-considerations)** - Security best practices
- **[Integration Examples](./CLAUDE.md#integration-examples)** - More detailed integration examples

---

**⚠️ Security Notice**: This server handles healthcare data. Ensure compliance with HIPAA and other healthcare regulations in your deployment. Never commit credentials to version control.
