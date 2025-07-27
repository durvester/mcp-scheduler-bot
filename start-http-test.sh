#!/bin/bash

# Start HTTP Transport Test Script
echo "🚀 Starting Practice Fusion MCP Server with HTTP Transport..."

# Set environment for HTTP transport
export TRANSPORT_TYPE=http
export HTTP_PORT=3000
export HTTP_HOST=127.0.0.1
export HTTP_ALLOWED_ORIGINS="http://localhost:*,https://localhost:*"
export HTTP_REQUIRE_ORIGIN_VALIDATION=false  # Disable for testing
export HTTP_ENABLE_CORS=true

# Practice Fusion credentials (optional at startup)
if [ -z "$PF_CLIENT_ID" ] || [ -z "$PF_CLIENT_SECRET" ]; then
    echo "ℹ️  Practice Fusion credentials not set."
    echo "   Server will start normally - HTTP transport and MCP protocol will work."
    echo "   Tools/resources requiring Practice Fusion API will prompt for OAuth when accessed."
    echo "   To configure: set PF_CLIENT_ID and PF_CLIENT_SECRET in .env file."
    echo ""
else
    echo "✅ Practice Fusion credentials found - OAuth available for tools."
    echo ""
fi

echo "📝 Configuration:"
echo "   Transport: $TRANSPORT_TYPE"
echo "   Host: $HTTP_HOST"
echo "   Port: $HTTP_PORT"
echo "   URL: http://$HTTP_HOST:$HTTP_PORT/mcp"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Start the server
echo "🌐 Starting HTTP server..."
echo "   Health check: http://$HTTP_HOST:$HTTP_PORT/health"
echo "   Status: http://$HTTP_HOST:$HTTP_PORT/status"
echo "   MCP Endpoint: http://$HTTP_HOST:$HTTP_PORT/mcp"
echo ""
echo "Press Ctrl+C to stop the server"
echo "---"

node build/index.js