#!/bin/bash

echo "🧪 Testing HTTP Transport Fix..."

# Clean up any existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3457 | xargs kill -9 2>/dev/null || true

# Start the server
echo "🚀 Starting MCP server..."
MCP_TRANSPORT=http MCP_HOST=127.0.0.1 MCP_PORT=3000 PF_CALLBACK_PORT=3457 node build/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "📡 Testing tools/list endpoint..."

# Test tools/list request
RESPONSE=$(curl -s -X POST http://127.0.0.1:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')

echo "Response: $RESPONSE"

# Check if response contains tools
if echo "$RESPONSE" | grep -q "tools"; then
    echo "✅ SUCCESS: tools/list returned tools"
    
    # Test a specific tool call
    echo "📡 Testing tool call..."
    TOOL_RESPONSE=$(curl -s -X POST http://127.0.0.1:3000/mcp \
      -H "Content-Type: application/json" \
      -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"pf_get_patient_info","arguments":{"patientGuid":"test-guid"}}}')
    
    echo "Tool call response: $TOOL_RESPONSE"
    
    if echo "$TOOL_RESPONSE" | grep -q -E "jsonrpc|result|error"; then
        echo "✅ SUCCESS: Tool call returned proper JSON-RPC response"
    else
        echo "❌ FAILED: Tool call did not return proper response"
    fi
    
else
    echo "❌ FAILED: tools/list did not return tools"
    echo "Response was: $RESPONSE"
fi

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
sleep 1

echo "✅ Test complete"