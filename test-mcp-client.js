#!/usr/bin/env node

import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';

// Simple test to verify MCP server works with .env credentials
async function testMCPServer() {
  console.log('Testing MCP server with .env credentials...');
  
  // Start the server
  const server = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  let responseData = '';
  
  server.stdout.on('data', (data) => {
    responseData += data.toString();
    console.log('Server response:', data.toString());
  });

  server.stderr.on('data', (data) => {
    console.log('Server stderr:', data.toString());
  });

  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  console.log('Sending initialize request...');
  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait a bit then send tools/list request
  setTimeout(() => {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    
    console.log('Sending tools/list request...');
    server.stdin.write(JSON.stringify(toolsRequest) + '\n');

    // Clean up after test
    setTimeout(() => {
      server.kill();
    }, 3000);
  }, 1000);
}

testMCPServer().catch(console.error);