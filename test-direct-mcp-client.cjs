#!/usr/bin/env node

const http = require('http');

// Test our MCP server directly
async function testMcpServer() {
  console.log('🧪 Testing MCP Server directly...\n');

  // Step 1: Initialize session
  console.log('1️⃣ Initializing session...');
  const initResponse = await makeRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, resources: {}, prompts: {} },
      clientInfo: { name: 'direct-test-client', version: '1.0.0' }
    }
  });

  if (initResponse.error) {
    console.error('❌ Initialization failed:', initResponse.error);
    return;
  }

  console.log('✅ Session initialized');
  console.log('📋 Server info:', initResponse.result.serverInfo);
  console.log('🔧 Capabilities:', JSON.stringify(initResponse.result.capabilities, null, 2));

  // Get session ID from response headers
  const sessionId = initResponse._sessionId;
  console.log('🆔 Session ID:', sessionId);

  // Step 2: List tools
  console.log('\n2️⃣ Listing tools...');
  const toolsResponse = await makeRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  }, sessionId);

  if (toolsResponse.error) {
    console.error('❌ Tools list failed:', toolsResponse.error);
    return;
  }

  const tools = toolsResponse.result.tools || [];
  console.log(`✅ Found ${tools.length} tools:`);
  tools.forEach((tool, i) => {
    console.log(`   ${i + 1}. ${tool.name} - ${tool.description.substring(0, 60)}...`);
  });

  // Step 3: List resources  
  console.log('\n3️⃣ Listing resources...');
  const resourcesResponse = await makeRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'resources/list'
  }, sessionId);

  if (resourcesResponse.error) {
    console.error('❌ Resources list failed:', resourcesResponse.error);
    return;
  }

  const resources = resourcesResponse.result.resources || [];
  console.log(`✅ Found ${resources.length} resources:`);
  resources.forEach((resource, i) => {
    console.log(`   ${i + 1}. ${resource.uri} - ${resource.description || 'No description'}`);
  });

  // Step 4: List prompts
  console.log('\n4️⃣ Listing prompts...');
  const promptsResponse = await makeRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'prompts/list'
  }, sessionId);

  if (promptsResponse.error) {
    console.error('❌ Prompts list failed:', promptsResponse.error);
    return;
  }

  const prompts = promptsResponse.result.prompts || [];
  console.log(`✅ Found ${prompts.length} prompts:`);
  prompts.forEach((prompt, i) => {
    console.log(`   ${i + 1}. ${prompt.name} - ${prompt.description || 'No description'}`);
  });

  console.log('\n🎉 All tests passed! MCP server is working perfectly.');
}

function makeRequest(jsonData, sessionId = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(jsonData);
    
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Accept': 'application/json, text/event-stream'
      }
    };

    if (sessionId) {
      options.headers['Mcp-Session-Id'] = sessionId;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          // Capture session ID from response headers
          if (res.headers['mcp-session-id']) {
            result._sessionId = res.headers['mcp-session-id'];
          }
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      reject(new Error('Request timeout'));
    });

    req.setTimeout(10000); // 10 second timeout
    req.write(data);
    req.end();
  });
}

// Run the test
testMcpServer().catch(console.error); 