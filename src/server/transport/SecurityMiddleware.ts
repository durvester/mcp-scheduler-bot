import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Logger } from '../utils/Logger.js';

export interface SecurityConfig {
  allowedOrigins?: string[];
  requireOriginValidation?: boolean;
  enableCors?: boolean;
  maxRequestSize?: string;
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
}

export class SecurityMiddleware {
  private logger: Logger;
  private config: Required<SecurityConfig>;

  constructor(config: SecurityConfig = {}) {
    this.logger = Logger.create('SecurityMiddleware');
    
    // Set defaults
    this.config = {
      allowedOrigins: config.allowedOrigins || ['http://localhost:*', 'https://localhost:*'],
      requireOriginValidation: config.requireOriginValidation ?? true,
      enableCors: config.enableCors ?? true,
      maxRequestSize: config.maxRequestSize || '10mb',
      rateLimitWindowMs: config.rateLimitWindowMs || 60000, // 1 minute
      rateLimitMaxRequests: config.rateLimitMaxRequests || 100
    };

    this.logger.debug('SecurityMiddleware initialized', { config: this.config });
  }

  /**
   * Origin validation middleware to prevent DNS rebinding attacks
   * This is crucial for MCP HTTP servers per the specification
   */
  validateOrigin() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!this.config.requireOriginValidation) {
        return next();
      }

      const origin = req.get('Origin') || req.get('Referer');
      
      if (!origin) {
        // Allow requests without Origin header (e.g., direct API calls, Postman, curl)
        this.logger.debug('Request without Origin header allowed', { 
          ip: req.ip, 
          userAgent: req.get('User-Agent'),
          url: req.url 
        });
        return next();
      }

      if (this.isOriginAllowed(origin)) {
        this.logger.debug('Origin validation passed', { origin, ip: req.ip });
        return next();
      }

      this.logger.warn('Origin validation failed - potential DNS rebinding attack', {
        origin,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Origin not allowed'
      });
      return;
    };
  }

  /**
   * CORS middleware with MCP-specific settings
   */
  corsMiddleware() {
    if (!this.config.enableCors) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        if (this.isOriginAllowed(origin)) {
          return callback(null, true);
        }

        this.logger.warn('CORS origin rejected', { origin });
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'MCP-Protocol-Version',
        'Mcp-Session-Id',
        'Last-Event-ID'
      ],
      exposedHeaders: [
        'MCP-Protocol-Version',
        'Mcp-Session-Id'
      ],
      optionsSuccessStatus: 200
    });
  }

  /**
   * Security headers middleware
   */
  securityHeaders() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Disable caching for API responses
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      next();
    };
  }

  /**
   * MCP protocol version validation middleware
   */
  validateMcpProtocol() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const protocolVersion = req.get('MCP-Protocol-Version');
      
      // Skip validation for health checks and OPTIONS requests
      if (req.method === 'OPTIONS' || req.path === '/health' || req.path === '/status') {
        return next();
      }

      if (!protocolVersion) {
        // Per MCP spec, assume 2025-03-26 if no version header
        req.headers['mcp-protocol-version'] = '2025-03-26';
        this.logger.debug('No MCP protocol version provided, assuming 2025-03-26');
        return next();
      }

      // Validate supported protocol versions
      const supportedVersions = ['2025-06-18', '2025-03-26', '2024-11-05'];
      if (!supportedVersions.includes(protocolVersion)) {
        this.logger.warn('Unsupported MCP protocol version', { 
          version: protocolVersion,
          supportedVersions 
        });
        
        res.status(400).json({
          error: 'Bad Request',
          message: `Unsupported MCP protocol version: ${protocolVersion}. Supported versions: ${supportedVersions.join(', ')}`
        });
        return;
      }

      this.logger.debug('MCP protocol version validated', { version: protocolVersion });
      next();
    };
  }

  /**
   * Request logging middleware
   */
  requestLogging() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      
      // Log request
      this.logger.debug('HTTP request received', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        sessionId: req.get('Mcp-Session-Id'),
        protocolVersion: req.get('MCP-Protocol-Version')
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any): any {
        const duration = Date.now() - startTime;
        
        // Log response
        Logger.create('SecurityMiddleware').debug('HTTP response sent', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          contentType: res.get('Content-Type'),
          sessionId: req.get('Mcp-Session-Id')
        });

        // Restore original end and call it
        res.end = originalEnd;
        return res.end(chunk, encoding);
      };

      next();
    };
  }

  /**
   * Error handling middleware
   */
  errorHandler() {
    return (error: Error, req: Request, res: Response, next: NextFunction): void => {
      this.logger.error('HTTP request error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        sessionId: req.get('Mcp-Session-Id')
      });

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: error.stack })
      });
    };
  }

  /**
   * Check if origin is allowed based on configuration
   */
  private isOriginAllowed(origin: string): boolean {
    if (!origin) return false;

    for (const allowedOrigin of this.config.allowedOrigins) {
      if (this.matchOrigin(origin, allowedOrigin)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Match origin against pattern (supports wildcards)
   */
  private matchOrigin(origin: string, pattern: string): boolean {
    // Exact match
    if (origin === pattern) {
      return true;
    }

    // Wildcard pattern matching
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$'
      );
      return regex.test(origin);
    }

    return false;
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.debug('Security configuration updated', { config: this.config });
  }
}