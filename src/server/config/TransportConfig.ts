import { SecurityConfig } from '../transport/SecurityMiddleware.js';

export type TransportType = 'stdio' | 'http';

export interface BaseTransportConfig {
  type: TransportType;
}

export interface StdioTransportConfig extends BaseTransportConfig {
  type: 'stdio';
}

export interface HttpTransportConfig extends BaseTransportConfig {
  type: 'http';
  port: number;
  host: string;
  security: SecurityConfig;
  sessionTimeoutMs?: number;
}

export type TransportConfig = StdioTransportConfig | HttpTransportConfig;

/**
 * Create transport configuration from environment variables
 */
export function createTransportConfigFromEnv(): TransportConfig {
  const transportType = (process.env.TRANSPORT_TYPE?.toLowerCase() as TransportType) || 'stdio';
  
  if (transportType === 'stdio') {
    return {
      type: 'stdio'
    };
  }

  if (transportType === 'http') {
    const port = parseInt(process.env.HTTP_PORT || '3000');
    const host = process.env.HTTP_HOST || '127.0.0.1'; // localhost by default for security
    
    // Parse allowed origins
    const allowedOriginsEnv = process.env.HTTP_ALLOWED_ORIGINS;
    const allowedOrigins = allowedOriginsEnv 
      ? allowedOriginsEnv.split(',').map(o => o.trim())
      : ['http://localhost:*', 'https://localhost:*'];

    const securityConfig: SecurityConfig = {
      allowedOrigins,
      requireOriginValidation: process.env.HTTP_REQUIRE_ORIGIN_VALIDATION !== 'false',
      enableCors: process.env.HTTP_ENABLE_CORS !== 'false',
      maxRequestSize: process.env.HTTP_MAX_REQUEST_SIZE || '10mb',
      rateLimitWindowMs: parseInt(process.env.HTTP_RATE_LIMIT_WINDOW_MS || '60000'),
      rateLimitMaxRequests: parseInt(process.env.HTTP_RATE_LIMIT_MAX_REQUESTS || '100')
    };

    const sessionTimeoutMs = parseInt(process.env.HTTP_SESSION_TIMEOUT_MS || '1800000'); // 30 minutes

    return {
      type: 'http',
      port,
      host,
      security: securityConfig,
      sessionTimeoutMs
    };
  }

  throw new Error(`Unsupported transport type: ${transportType}. Supported types: stdio, http`);
}

/**
 * Validate transport configuration
 */
export function validateTransportConfig(config: TransportConfig): void {
  if (config.type === 'http') {
    const httpConfig = config as HttpTransportConfig;
    
    if (!httpConfig.port || httpConfig.port < 1 || httpConfig.port > 65535) {
      throw new Error(`Invalid HTTP port: ${httpConfig.port}. Must be between 1 and 65535.`);
    }

    if (!httpConfig.host) {
      throw new Error('HTTP host is required');
    }

    // Validate security configuration
    if (httpConfig.security.allowedOrigins && httpConfig.security.allowedOrigins.length === 0) {
      throw new Error('At least one allowed origin must be specified');
    }

    if (httpConfig.sessionTimeoutMs && httpConfig.sessionTimeoutMs < 60000) {
      throw new Error('Session timeout must be at least 60 seconds (60000ms)');
    }
  }
}

/**
 * Get default environment variables for transport configuration
 */
export function getDefaultTransportEnvVars(): Record<string, string> {
  return {
    // Transport type
    TRANSPORT_TYPE: 'stdio',
    
    // HTTP Transport Configuration
    HTTP_PORT: '3000',
    HTTP_HOST: '127.0.0.1',
    HTTP_ALLOWED_ORIGINS: 'http://localhost:*,https://localhost:*',
    HTTP_REQUIRE_ORIGIN_VALIDATION: 'true',
    HTTP_ENABLE_CORS: 'true',
    HTTP_MAX_REQUEST_SIZE: '10mb',
    HTTP_RATE_LIMIT_WINDOW_MS: '60000',
    HTTP_RATE_LIMIT_MAX_REQUESTS: '100',
    HTTP_SESSION_TIMEOUT_MS: '1800000' // 30 minutes
  };
}

/**
 * Generate environment variable documentation
 */
export function generateTransportEnvDocs(): string {
  const defaults = getDefaultTransportEnvVars();
  
  return `
# Transport Configuration Environment Variables

## General Transport Settings
TRANSPORT_TYPE=${defaults.TRANSPORT_TYPE}           # Transport type: 'stdio' or 'http'

## HTTP Transport Settings (only used when TRANSPORT_TYPE=http)
HTTP_PORT=${defaults.HTTP_PORT}                     # HTTP server port (1-65535)
HTTP_HOST=${defaults.HTTP_HOST}               # HTTP server bind address (use 127.0.0.1 for security)
HTTP_ALLOWED_ORIGINS=${defaults.HTTP_ALLOWED_ORIGINS}  # Comma-separated allowed origins (supports wildcards)
HTTP_REQUIRE_ORIGIN_VALIDATION=${defaults.HTTP_REQUIRE_ORIGIN_VALIDATION}  # Require origin header validation
HTTP_ENABLE_CORS=${defaults.HTTP_ENABLE_CORS}               # Enable CORS middleware
HTTP_MAX_REQUEST_SIZE=${defaults.HTTP_MAX_REQUEST_SIZE}             # Maximum request body size
HTTP_RATE_LIMIT_WINDOW_MS=${defaults.HTTP_RATE_LIMIT_WINDOW_MS}      # Rate limiting window in milliseconds
HTTP_RATE_LIMIT_MAX_REQUESTS=${defaults.HTTP_RATE_LIMIT_MAX_REQUESTS}   # Maximum requests per window
HTTP_SESSION_TIMEOUT_MS=${defaults.HTTP_SESSION_TIMEOUT_MS}    # Session timeout in milliseconds

## Security Notes:
# - Always use 127.0.0.1 (localhost) for HTTP_HOST unless you need external access
# - Validate allowed origins carefully to prevent security issues
# - Session timeout should be appropriate for your use case (minimum 60 seconds)
# - Rate limiting helps prevent abuse in HTTP mode
`.trim();
}