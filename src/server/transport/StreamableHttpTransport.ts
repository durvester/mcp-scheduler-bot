import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { 
  JSONRPCRequest, 
  JSONRPCResponse, 
  JSONRPCNotification,
  JSONRPCError,
  JSONRPCMessage,
  InitializeRequestSchema,
  InitializeResult
} from '@modelcontextprotocol/sdk/types.js';
import { SessionManager, Session } from './SessionManager.js';
import { SecurityMiddleware, SecurityConfig } from './SecurityMiddleware.js';
import { Logger } from '../utils/Logger.js';

export interface HttpTransportConfig {
  port: number;
  host: string;
  security: SecurityConfig;
  sessionTimeoutMs?: number;
}

export interface SseClient {
  id: string;
  sessionId?: string;
  response: Response;
  lastEventId?: string;
  connectedAt: Date;
}

export class StreamableHttpTransport implements Transport {
  private app: Express;
  private server: HttpServer | null = null;
  private mcpServer: Server;
  private sessionManager: SessionManager;
  private securityMiddleware: SecurityMiddleware;
  private logger: Logger;
  private config: HttpTransportConfig;
  private sseClients: Map<string, SseClient> = new Map();
  private isShuttingDown = false;

  // Request-Response Correlation System
  // Maps JSON-RPC request IDs to their corresponding HTTP Response objects
  private pendingHttpRequests: Map<string | number, Response> = new Map();
  
  // Maps JSON-RPC request IDs to their SSE stream contexts for streaming responses
  private pendingSSERequests: Map<string | number, string> = new Map();

  // Transport interface properties
  sessionId?: string;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage, extra?: { authInfo?: any }) => void;

  constructor(mcpServer: Server, config: HttpTransportConfig) {
    this.logger = Logger.create('StreamableHttpTransport');
    this.mcpServer = mcpServer;
    this.config = config;
    
    this.sessionManager = new SessionManager(config.sessionTimeoutMs);
    this.securityMiddleware = new SecurityMiddleware(config.security);
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    
    this.logger.debug('StreamableHttpTransport initialized', { config });
    this.logger.debug('Express app created but NOT listening yet - waiting for start() call');
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.logger.info('Attempting to start HTTP server', {
          host: this.config.host,
          port: this.config.port
        });
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          this.logger.info('MCP HTTP server started', {
            host: this.config.host,
            port: this.config.port,
            url: `http://${this.config.host}:${this.config.port}/mcp`
          });
          resolve();
        });

        this.server.on('error', (error) => {
          this.logger.error('HTTP server error', {}, error);
          reject(error);
        });

        // Handle server shutdown gracefully
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());

      } catch (error) {
        this.logger.error('Failed to start HTTP server', {}, error as Error);
        reject(error);
      }
    });
  }

  /**
   * Stop the HTTP server (implements Transport interface)
   */
  async close(): Promise<void> {
    return this.shutdown();
  }

  /**
   * Stop the HTTP server
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    this.logger.info('Shutting down HTTP transport...');

    // Close all SSE connections
    for (const [clientId, client] of this.sseClients.entries()) {
      client.response.end();
      this.sseClients.delete(clientId);
    }

    // Shutdown session manager
    this.sessionManager.shutdown();

    // Close HTTP server
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.logger.info('HTTP server shut down');
          if (this.onclose) {
            this.onclose();
          }
          resolve();
        });
      });
    }
  }

  /**
   * Send a JSON-RPC message (implements Transport interface)
   * This is called by the MCP Server when it wants to send responses or server-initiated messages
   */
  async send(message: JSONRPCMessage, options?: any): Promise<void> {
    this.logger.debug('Transport sending message', { 
      messageType: 'method' in message ? 'request/notification' : 'response',
      id: 'id' in message ? message.id : 'no-id',
      method: 'method' in message ? message.method : undefined,
      pendingHttpRequests: Array.from(this.pendingHttpRequests.keys()),
      pendingSSERequests: Array.from(this.pendingSSERequests.keys())
    });
    
    // Check if this is a response to a pending HTTP request
    if ('id' in message && message.id !== undefined && this.pendingHttpRequests.has(message.id)) {
      // Route response back to the original HTTP request
      const httpResponse = this.pendingHttpRequests.get(message.id)!;
      this.pendingHttpRequests.delete(message.id);
      
      // Send JSON-RPC response via HTTP
      httpResponse.json(message);
      
      this.logger.debug('✅ Successfully routed response to HTTP request', { 
        requestId: message.id,
        requestIdType: typeof message.id,
        pendingRequests: this.pendingHttpRequests.size 
      });
      return;
    } else if ('id' in message && message.id !== undefined) {
      this.logger.warn('❌ Response ID not found in pending requests', {
        responseId: message.id,
        responseIdType: typeof message.id,
        pendingIds: Array.from(this.pendingHttpRequests.keys()),
        pendingIdTypes: Array.from(this.pendingHttpRequests.keys()).map(id => typeof id)
      });
    }
    
    // Check if this is a response to a pending SSE request
    if ('id' in message && message.id !== undefined && this.pendingSSERequests.has(message.id)) {
      // Route response back to the specific SSE stream
      const sseClientId = this.pendingSSERequests.get(message.id)!;
      this.pendingSSERequests.delete(message.id);
      
      const client = this.sseClients.get(sseClientId);
      if (client) {
        // Send the response via SSE
        this.sendSseEvent(client, {
          event: 'response',
          data: JSON.stringify(message),
          id: `resp_${message.id}`
        });
        
        // Close the SSE stream after sending the response (per MCP spec)
        setTimeout(() => {
          client.response.end();
          this.sseClients.delete(sseClientId);
        }, 100);
        
        this.logger.debug('Routed response to SSE stream', { 
          requestId: message.id,
          sseClientId 
        });
      }
      return;
    }
    
    // Server-initiated message (notifications/requests from server to client)
    // Broadcast to all connected SSE clients per MCP spec
    if (this.sseClients.size > 0) {
      const messageData = JSON.stringify(message);
      for (const [clientId, client] of this.sseClients.entries()) {
        this.sendSseEvent(client, {
          event: 'message',
          data: messageData,
          id: 'id' in message ? `srv_${message.id}` : `srv_${Date.now()}`
        });
      }
      
      this.logger.debug('Broadcasted server-initiated message to SSE clients', { 
        clientCount: this.sseClients.size,
        messageType: 'method' in message ? message.method : 'response'
      });
    } else {
      this.logger.warn('No clients to send server-initiated message to', {
        messageType: 'method' in message ? message.method : 'response'
      });
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security middleware
    this.app.use(this.securityMiddleware.requestLogging());
    this.app.use(this.securityMiddleware.corsMiddleware());
    this.app.use(this.securityMiddleware.securityHeaders());
    this.app.use(this.securityMiddleware.validateOrigin());
    this.app.use(this.securityMiddleware.validateMcpProtocol());
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // Main MCP endpoint - POST for sending messages to server
    this.app.post('/mcp', this.handleMcpPost.bind(this));

    // Main MCP endpoint - GET for receiving messages from server via SSE
    this.app.get('/mcp', this.handleMcpGet.bind(this));

    // Session termination endpoint
    this.app.delete('/mcp', this.handleSessionDelete.bind(this));

    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));

    // Status endpoint with session information
    this.app.get('/status', this.handleStatus.bind(this));

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'MCP endpoint is available at POST/GET /mcp'
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use(this.securityMiddleware.errorHandler());
  }

  /**
   * Handle POST requests to /mcp endpoint
   */
  private async handleMcpPost(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.get('Mcp-Session-Id');
      const protocolVersion = req.get('MCP-Protocol-Version') || '2025-03-26';
      
      // Validate JSON-RPC message
      const message = req.body;
      if (!this.isValidJsonRpcMessage(message)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid JSON-RPC message format'
        });
        return;
      }

      // Handle session management for non-initialization requests
      if (message.method !== 'initialize' && sessionId) {
        if (!this.sessionManager.isValidSession(sessionId)) {
          res.status(404).json({
            error: 'Not Found',
            message: 'Session not found or expired'
          });
          return;
        }
      }

      // Handle different message types
      if (this.isJsonRpcRequest(message)) {
        await this.handleJsonRpcRequest(message, req, res);
      } else if (this.isJsonRpcNotification(message) || this.isJsonRpcResponse(message)) {
        await this.handleJsonRpcNotificationOrResponse(message, req, res);
      } else {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Unknown JSON-RPC message type'
        });
      }

    } catch (error) {
      this.logger.error('Error handling MCP POST request', {}, error as Error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process request'
      });
    }
  }

  /**
   * Handle GET requests to /mcp endpoint (SSE stream)
   */
  private handleMcpGet(req: Request, res: Response): void {
    const sessionId = req.get('Mcp-Session-Id');
    const lastEventId = req.get('Last-Event-ID');
    
    // Validate session if provided
    if (sessionId && !this.sessionManager.isValidSession(sessionId)) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found or expired'
      });
      return;
    }

    // Check if client accepts SSE (required for GET endpoint per MCP spec)
    const acceptHeader = req.get('Accept') || '';
    if (!acceptHeader.includes('text/event-stream')) {
      res.status(405).json({
        error: 'Method Not Allowed',
        message: 'GET endpoint requires text/event-stream Accept header'
      });
      return;
    }

    // Setup SSE connection
    const sseClientId = this.setupSseConnection(req, res, sessionId, lastEventId);
    
    this.logger.debug('SSE connection established for GET request', {
      sseClientId,
      sessionId,
      lastEventId
    });
  }

  /**
   * Handle DELETE requests to /mcp endpoint (session termination)
   */
  private handleSessionDelete(req: Request, res: Response): void {
    const sessionId = req.get('Mcp-Session-Id');
    
    if (!sessionId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Mcp-Session-Id header required'
      });
      return;
    }

    if (this.sessionManager.terminateSession(sessionId)) {
      this.logger.info('Session terminated by client request', { sessionId });
      res.status(200).json({ message: 'Session terminated' });
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }
  }

  /**
   * Handle health check requests
   */
  private handleHealthCheck(req: Request, res: Response): void {
    const stats = this.sessionManager.getStats();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      sessions: stats,
      sseConnections: this.sseClients.size
    });
  }

  /**
   * Handle status requests with detailed information
   */
  private handleStatus(req: Request, res: Response): void {
    const stats = this.sessionManager.getStats();
    const sseConnections = Array.from(this.sseClients.values()).map(client => ({
      id: client.id,
      sessionId: client.sessionId,
      connectedAt: client.connectedAt,
      lastEventId: client.lastEventId
    }));

    res.json({
      server: {
        status: 'running',
        version: '0.1.0',
        protocol: 'MCP Streamable HTTP',
        supportedVersions: ['2025-06-18', '2025-03-26', '2024-11-05']
      },
      sessions: {
        ...stats,
        details: this.sessionManager.getActiveSessions().map(s => ({
          id: s.id,
          createdAt: s.createdAt,
          lastActivity: s.lastActivity,
          isActive: s.isActive
        }))
      },
      connections: {
        sse: {
          count: this.sseClients.size,
          clients: sseConnections
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle JSON-RPC requests (require response)
   */
  private async handleJsonRpcRequest(
    request: JSONRPCRequest, 
    req: Request, 
    res: Response
  ): Promise<void> {
    try {
      // Special handling for initialize request
      if (request.method === 'initialize') {
        await this.handleInitializeRequest(request, req, res);
        return;
      }

      this.logger.debug('Processing JSON-RPC request', { 
        method: request.method, 
        id: request.id 
      });

      // MCP Protocol: Prefer JSON responses for standard requests
      // Only use SSE for long-running operations or when specifically needed
      const acceptHeader = req.get('Accept') || '';
      const supportsSSE = acceptHeader.includes('text/event-stream');
      const supportsJSON = acceptHeader.includes('application/json');
      
      // Validate Accept header per MCP spec
      if (!supportsJSON && !supportsSSE) {
        res.status(406).json({
          error: 'Not Acceptable',
          message: 'Must accept application/json or text/event-stream'
        });
        return;
      }
      
      // Use JSON for standard requests (tools/list, resources/list, prompts/list, etc.)
      // This improves compatibility with MCP Inspector and reduces complexity
      await this.handleRequestWithJson(request, req, res);

    } catch (error) {
      this.logger.error('Error processing JSON-RPC request', {}, error as Error);
      
      const errorResponse = {
        jsonrpc: '2.0' as const,
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: (error as Error).message
        }
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Handle request with JSON response
   */
  private async handleRequestWithJson(
    request: JSONRPCRequest,
    req: Request,
    res: Response
  ): Promise<void> {
    this.logger.debug('Handling request with JSON response', { method: request.method });
    
    try {
      // Process the request through MCP server handlers
      // The response will be sent automatically via the correlation system when MCP server calls send()
      await this.processRequestThroughMcp(request, req, res);
      
      // No need to handle response here - it's handled by the correlation system
      // The response will be sent when the MCP server calls transport.send()
      
    } catch (error) {
      // Only send error if response hasn't been sent yet
      if (!res.headersSent) {
        this.logger.error('Error processing MCP request', { method: request.method }, error as Error);
        
        const errorResponse = {
          jsonrpc: '2.0' as const,
          id: request.id,
          error: {
            code: -32603,
            message: 'Internal error processing request',
            data: (error as Error).message
          }
        };
        
        res.status(500).json(errorResponse);
      }
      
      // Clean up correlation if error occurred
      this.pendingHttpRequests.delete(request.id);
    }
  }

  /**
   * Process request through MCP server using proper transport interface
   * No more hacks - just delegate to MCP server and let correlation system handle responses
   */
  private async processRequestThroughMcp(
    request: JSONRPCRequest,
    req: Request,
    res: Response
  ): Promise<void> {
    // Store the HTTP response in correlation map for when MCP server calls send()
    this.pendingHttpRequests.set(request.id, res);
    
    this.logger.debug('Added request to correlation map', {
      requestId: request.id,
      requestIdType: typeof request.id,
      method: request.method,
      totalPendingRequests: this.pendingHttpRequests.size,
      allPendingIds: Array.from(this.pendingHttpRequests.keys())
    });
    
    // Set timeout to clean up orphaned requests
    const timeoutMs = 30000;
    const timeoutId = setTimeout(() => {
      if (this.pendingHttpRequests.has(request.id)) {
        this.pendingHttpRequests.delete(request.id);
        
        // Send timeout error response
        const errorResponse = {
          jsonrpc: '2.0' as const,
          id: request.id,
          error: {
            code: -32603,
            message: `Request timeout after ${timeoutMs}ms`
          }
        };
        
        if (!res.headersSent) {
          res.status(408).json(errorResponse);
        }
        
        this.logger.warn('Request timed out', { requestId: request.id, method: request.method });
      }
    }, timeoutMs);
    
    // Clear timeout if response comes back normally
    const originalRequestId = request.id;
    const checkForCompletion = () => {
      if (!this.pendingHttpRequests.has(originalRequestId)) {
        clearTimeout(timeoutId);
      } else {
        // Check again in 100ms
        setTimeout(checkForCompletion, 100);
      }
    };
    setTimeout(checkForCompletion, 100);
    
    try {
      // Delegate to MCP server through proper onmessage callback
      if (this.onmessage) {
        this.onmessage(request);
        this.logger.debug('Delegated request to MCP server', { 
          requestId: request.id, 
          method: request.method,
          pendingRequests: this.pendingHttpRequests.size
        });
      } else {
        // No MCP server connected - this shouldn't happen
        this.pendingHttpRequests.delete(request.id);
        clearTimeout(timeoutId);
        
        const errorResponse = {
          jsonrpc: '2.0' as const,
          id: request.id,
          error: {
            code: -32603,
            message: 'MCP server not available'
          }
        };
        
        if (!res.headersSent) {
          res.status(500).json(errorResponse);
        }
        
        this.logger.error('MCP server onmessage handler not available', { requestId: request.id });
      }
    } catch (error) {
      // Clean up on error
      this.pendingHttpRequests.delete(request.id);
      clearTimeout(timeoutId);
      
      const errorResponse = {
        jsonrpc: '2.0' as const,
        id: request.id,
        error: {
          code: -32603,
          message: `Error processing request: ${(error as Error).message}`
        }
      };
      
      if (!res.headersSent) {
        res.status(500).json(errorResponse);
      }
      
      this.logger.error('Error delegating request to MCP server', { 
        requestId: request.id, 
        method: request.method 
      }, error as Error);
    }
  }

  /**
   * Handle request with SSE streaming response
   */
  private handleRequestWithSSE(
    request: JSONRPCRequest,
    req: Request,
    res: Response
  ): void {
    const sessionId = req.get('Mcp-Session-Id');
    
    this.logger.debug('Handling request with SSE response', { 
      method: request.method,
      sessionId 
    });

    // Setup SSE connection for this request
    const sseClientId = this.setupSseConnection(req, res, sessionId);
    
    // Store correlation between request ID and SSE client ID
    this.pendingSSERequests.set(request.id, sseClientId);
    
    // Set timeout for SSE requests
    const timeoutMs = 30000;
    setTimeout(() => {
      if (this.pendingSSERequests.has(request.id)) {
        this.pendingSSERequests.delete(request.id);
        
        const client = this.sseClients.get(sseClientId);
        if (client) {
          // Send timeout error via SSE
          this.sendSseEvent(client, {
            event: 'error',
            data: JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32603,
                message: `Request timeout after ${timeoutMs}ms`
              }
            }),
            id: `err_${request.id}`
          });
          
          // Close the stream
          setTimeout(() => {
            client.response.end();
            this.sseClients.delete(sseClientId);
          }, 100);
        }
        
        this.logger.warn('SSE request timed out', { requestId: request.id, method: request.method });
      }
    }, timeoutMs);

    try {
      // Delegate to MCP server through proper onmessage callback
      // The response will come back through send() and be routed to the correct SSE stream
      if (this.onmessage) {
        this.onmessage(request);
        this.logger.debug('Delegated SSE request to MCP server', { 
          requestId: request.id, 
          method: request.method,
          sseClientId,
          pendingSSERequests: this.pendingSSERequests.size
        });
      } else {
        // No MCP server connected
        this.pendingSSERequests.delete(request.id);
        
        const client = this.sseClients.get(sseClientId);
        if (client) {
          this.sendSseEvent(client, {
            event: 'error',
            data: JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32603,
                message: 'MCP server not available'
              }
            }),
            id: `err_${request.id}`
          });
          
          // Close the stream
          setTimeout(() => {
            client.response.end();
            this.sseClients.delete(sseClientId);
          }, 100);
        }
        
        this.logger.error('MCP server onmessage handler not available for SSE request', { requestId: request.id });
      }
    } catch (error) {
      // Clean up on error
      this.pendingSSERequests.delete(request.id);
      
      const client = this.sseClients.get(sseClientId);
      if (client) {
        this.sendSseEvent(client, {
          event: 'error',
          data: JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32603,
              message: `Error processing request: ${(error as Error).message}`
            }
          }),
          id: `err_${request.id}`
        });
        
        // Close the stream
        setTimeout(() => {
          client.response.end();
          this.sseClients.delete(sseClientId);
        }, 100);
      }
      
      this.logger.error('Error delegating SSE request to MCP server', { 
        requestId: request.id, 
        method: request.method 
      }, error as Error);
    }
  }

  /**
   * Handle initialize request and create session
   */
  private async handleInitializeRequest(
    request: JSONRPCRequest,
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Validate initialize request
      const parseResult = InitializeRequestSchema.safeParse(request);
      if (!parseResult.success) {
        const errorResponse = {
          jsonrpc: '2.0' as const,
          id: request.id,
          error: {
            code: -32602,
            message: 'Invalid initialize request parameters'
          }
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Create new session
      const session = this.sessionManager.createSession({
        clientInfo: parseResult.data.params.clientInfo,
        protocolVersion: parseResult.data.params.protocolVersion
      });

      // Create initialize result
      const initializeResult: InitializeResult = {
        protocolVersion: '2025-06-18',
        capabilities: {
          resources: {
            subscribe: true,
            listChanged: true
          },
          tools: {
            listChanged: true
          },
          prompts: {
            listChanged: true
          },
          logging: {}
        },
        serverInfo: {
          name: 'practice-fusion-mcp-server',
          version: '0.1.0'
        }
      };

      const response: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: initializeResult
      };

      // Set session ID header
      res.setHeader('Mcp-Session-Id', session.id);
      res.json(response);

      this.logger.info('New MCP session initialized', { 
        sessionId: session.id,
        clientInfo: parseResult.data.params.clientInfo 
      });

    } catch (error) {
      this.logger.error('Error handling initialize request', {}, error as Error);
      
      const errorResponse = {
        jsonrpc: '2.0' as const,
        id: request.id,
        error: {
          code: -32603,
          message: 'Failed to initialize session'
        }
      };

      res.status(500).json(errorResponse);
    }
  }

  /**
   * Handle JSON-RPC notifications and responses
   */
  private async handleJsonRpcNotificationOrResponse(
    message: JSONRPCNotification | JSONRPCResponse,
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logger.debug('Processing JSON-RPC notification/response', { 
        method: 'method' in message ? message.method : 'response',
        id: 'id' in message ? message.id : 'notification'
      });

      // Process the message (delegate to MCP server in real implementation)
      
      // Return 202 Accepted for notifications/responses
      res.status(202).end();

    } catch (error) {
      this.logger.error('Error processing notification/response', {}, error as Error);
      res.status(400).json({
        error: 'Bad Request',
        message: 'Failed to process message'
      });
    }
  }

  /**
   * Setup Server-Sent Events connection
   * Returns the client ID for correlation purposes
   */
  private setupSseConnection(
    req: Request, 
    res: Response, 
    sessionId?: string, 
    lastEventId?: string
  ): string {
    const clientId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Create SSE client record
    const client: SseClient = {
      id: clientId,
      sessionId,
      response: res,
      lastEventId,
      connectedAt: new Date()
    };

    this.sseClients.set(clientId, client);

    this.logger.debug('SSE connection established', { 
      clientId, 
      sessionId, 
      lastEventId,
      totalConnections: this.sseClients.size 
    });

    // Handle client disconnect
    req.on('close', () => {
      this.sseClients.delete(clientId);
      this.logger.debug('SSE connection closed', { 
        clientId, 
        sessionId,
        remainingConnections: this.sseClients.size 
      });
    });

    // Send initial connection confirmation
    this.sendSseEvent(client, {
      event: 'connected',
      data: JSON.stringify({
        clientId,
        sessionId,
        timestamp: new Date().toISOString()
      })
    });
    
    // Return client ID for correlation purposes
    return clientId;
  }

  /**
   * Send SSE event to client
   */
  private sendSseEvent(client: SseClient, event: { event?: string; data: string; id?: string }): void {
    try {
      if (event.id) {
        client.response.write(`id: ${event.id}\n`);
        client.lastEventId = event.id;
      }
      
      if (event.event) {
        client.response.write(`event: ${event.event}\n`);
      }
      
      client.response.write(`data: ${event.data}\n\n`);
      
    } catch (error) {
      this.logger.error('Error sending SSE event', { clientId: client.id }, error as Error);
      this.sseClients.delete(client.id);
    }
  }

  /**
   * Validate JSON-RPC message format
   */
  private isValidJsonRpcMessage(message: any): boolean {
    return message && 
           typeof message === 'object' && 
           message.jsonrpc === '2.0' &&
           (typeof message.method === 'string' || typeof message.id !== 'undefined');
  }

  /**
   * Check if message is a JSON-RPC request
   */
  private isJsonRpcRequest(message: any): message is JSONRPCRequest {
    return message.method && message.id !== undefined;
  }

  /**
   * Check if message is a JSON-RPC notification
   */
  private isJsonRpcNotification(message: any): message is JSONRPCNotification {
    return message.method && message.id === undefined;
  }

  /**
   * Check if message is a JSON-RPC response
   */
  private isJsonRpcResponse(message: any): message is JSONRPCResponse {
    return !message.method && message.id !== undefined && (message.result !== undefined || message.error !== undefined);
  }

}