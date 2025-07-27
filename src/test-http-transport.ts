#!/usr/bin/env node
/**
 * Test script for HTTP transport functionality
 * This tests the basic HTTP transport without requiring full Practice Fusion authentication
 */

import * as dotenv from "dotenv";
import fetch from 'node-fetch';
import { Logger } from "./server/utils/Logger.js";

// Load environment variables
dotenv.config();

const logger = Logger.create('HTTP Transport Test');

interface TestResult {
  test: string;
  passed: boolean;
  details?: any;
  error?: string;
}

class HttpTransportTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://127.0.0.1:3000') {
    this.baseUrl = baseUrl;
  }

  async runAllTests(): Promise<void> {
    logger.info('Starting HTTP transport tests...');

    // Test 1: Health check endpoint
    await this.testHealthCheck();

    // Test 2: Status endpoint
    await this.testStatusEndpoint();

    // Test 3: Initialize request
    await this.testInitializeRequest();

    // Test 4: SSE connection
    await this.testSseConnection();

    // Test 5: Invalid requests
    await this.testInvalidRequests();

    // Print results
    this.printResults();
  }

  private async testHealthCheck(): Promise<void> {
    try {
      logger.debug('Testing health check endpoint...');
      
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json() as any;

      const passed = response.status === 200 && data.status === 'healthy';
      
      this.results.push({
        test: 'Health Check',
        passed,
        details: { status: response.status, data }
      });

      logger.debug('Health check test completed', { passed, status: response.status });
    } catch (error) {
      this.results.push({
        test: 'Health Check',
        passed: false,
        error: (error as Error).message
      });
      logger.error('Health check test failed', {}, error as Error);
    }
  }

  private async testStatusEndpoint(): Promise<void> {
    try {
      logger.debug('Testing status endpoint...');
      
      const response = await fetch(`${this.baseUrl}/status`);
      const data = await response.json() as any;

      const passed = response.status === 200 && 
                    data.server && 
                    data.server.status === 'running' &&
                    data.server.protocol === 'MCP Streamable HTTP';
      
      this.results.push({
        test: 'Status Endpoint',
        passed,
        details: { status: response.status, data }
      });

      logger.debug('Status endpoint test completed', { passed, status: response.status });
    } catch (error) {
      this.results.push({
        test: 'Status Endpoint',
        passed: false,
        error: (error as Error).message
      });
      logger.error('Status endpoint test failed', {}, error as Error);
    }
  }

  private async testInitializeRequest(): Promise<void> {
    try {
      logger.debug('Testing initialize request...');
      
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: {
            name: 'HTTP Transport Test Client',
            version: '1.0.0'
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'MCP-Protocol-Version': '2025-06-18'
        },
        body: JSON.stringify(initRequest)
      });

      const data = await response.json() as any;
      const sessionId = response.headers.get('Mcp-Session-Id');

      const passed = response.status === 200 && 
                    data.jsonrpc === '2.0' && 
                    data.id === 1 &&
                    data.result &&
                    !!sessionId;
      
      this.results.push({
        test: 'Initialize Request',
        passed,
        details: { 
          status: response.status, 
          sessionId,
          response: data 
        }
      });

      logger.debug('Initialize request test completed', { 
        passed, 
        status: response.status,
        sessionId 
      });
    } catch (error) {
      this.results.push({
        test: 'Initialize Request',
        passed: false,
        error: (error as Error).message
      });
      logger.error('Initialize request test failed', {}, error as Error);
    }
  }

  private async testSseConnection(): Promise<void> {
    try {
      logger.debug('Testing SSE connection...');
      
      // This is a simplified SSE test
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'MCP-Protocol-Version': '2025-06-18'
        }
      });

      const passed = response.status === 200 && 
                    response.headers.get('content-type')?.includes('text/event-stream');
      
      // Don't try to read the stream, just verify headers

      this.results.push({
        test: 'SSE Connection',
        passed: passed || false,
        details: { 
          status: response.status,
          contentType: response.headers.get('content-type')
        }
      });

      logger.debug('SSE connection test completed', { passed, status: response.status });
    } catch (error) {
      this.results.push({
        test: 'SSE Connection',
        passed: false,
        error: (error as Error).message
      });
      logger.error('SSE connection test failed', {}, error as Error);
    }
  }

  private async testInvalidRequests(): Promise<void> {
    try {
      logger.debug('Testing invalid requests...');
      
      // Test invalid JSON
      const invalidJsonResponse = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'MCP-Protocol-Version': '2025-06-18'
        },
        body: 'invalid json'
      });

      // Test missing protocol version
      const missingVersionResponse = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'test', id: 1 })
      });

      // Test invalid protocol version
      const invalidVersionResponse = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'MCP-Protocol-Version': 'invalid-version'
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'test', id: 1 })
      });

      const passed = invalidJsonResponse.status === 400 &&
                    missingVersionResponse.status >= 200 && // Should default to 2025-03-26
                    invalidVersionResponse.status === 400;
      
      this.results.push({
        test: 'Invalid Requests',
        passed,
        details: { 
          invalidJson: invalidJsonResponse.status,
          missingVersion: missingVersionResponse.status,
          invalidVersion: invalidVersionResponse.status
        }
      });

      logger.debug('Invalid requests test completed', { passed });
    } catch (error) {
      this.results.push({
        test: 'Invalid Requests',
        passed: false,
        error: (error as Error).message
      });
      logger.error('Invalid requests test failed', {}, error as Error);
    }
  }

  private printResults(): void {
    logger.info('\n=== HTTP Transport Test Results ===');
    
    let passedCount = 0;
    let totalCount = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      logger.info(`${status} - ${result.test}`);
      
      if (!result.passed && result.error) {
        logger.error(`  Error: ${result.error}`);
      }
      
      if (result.details) {
        logger.debug(`  Details:`, result.details);
      }

      if (result.passed) {
        passedCount++;
      }
    });

    logger.info(`\nOverall: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      logger.info('🎉 All HTTP transport tests passed!');
    } else {
      logger.error('❌ Some HTTP transport tests failed. Check the details above.');
    }
  }
}

// Main execution
async function main() {
  // Check if HTTP transport is enabled
  const transportType = process.env.TRANSPORT_TYPE?.toLowerCase();
  
  if (transportType !== 'http') {
    logger.warn('HTTP transport is not enabled. Set TRANSPORT_TYPE=http to test.');
    logger.info('Current TRANSPORT_TYPE:', transportType || 'stdio (default)');
    process.exit(1);
  }

  const port = parseInt(process.env.HTTP_PORT || '3000');
  const host = process.env.HTTP_HOST || '127.0.0.1';
  const baseUrl = `http://${host}:${port}`;

  logger.info('Testing HTTP transport', { baseUrl, transportType });

  // Wait a moment for the server to start (if running alongside)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const tester = new HttpTransportTester(baseUrl);
  await tester.runAllTests();
}

// Run if this script is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  main().catch(error => {
    logger.error('Test execution failed', {}, error);
    process.exit(1);
  });
}