import { Auth } from "../utils/Auth.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { Logger } from "../utils/Logger.js";
import { ValidationUtil } from "../utils/ValidationUtil.js";
import { ToolArguments } from "../types/tool-types.js";

export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

export abstract class BaseToolHandler {
  protected auth: Auth;
  protected authConfig: AuthConfig;
  protected baseUrl: string;
  protected logger: Logger;

  constructor(authConfig: AuthConfig, baseUrl: string, componentName: string, sharedAuth: Auth) {
    this.authConfig = authConfig;
    this.baseUrl = baseUrl;
    this.logger = Logger.create(componentName);
    this.auth = sharedAuth; // Use the shared Auth instance
    this.logger.debug('Initialized with shared Auth instance');
  }

  protected createSuccessResponse(data: any): ToolResponse {
    return {
      content: [{
        type: "text",
        text: JSON.stringify(data, null, 2)
      }]
    };
  }

  protected createErrorResponse(message: string): ToolResponse {
    return {
      content: [{
        type: "text",
        text: message
      }]
    };
  }

  protected createValidationErrorResponse(errors: string[]): ToolResponse {
    return {
      content: [{
        type: "text",
        text: `Validation error: ${errors.join('; ')}`
      }]
    };
  }

  protected async executeWithAuth<T>(operation: () => Promise<T>): Promise<T> {
    return this.auth.executeWithAuth(operation);
  }

  protected validateRequiredParam(param: any, paramName: string): void {
    if (!param) {
      throw new Error(`${paramName} is required`);
    }
  }

  protected validateGuid(guid: any, paramName: string): void {
    this.validateRequiredParam(guid, paramName);
    if (!ValidationUtil.PATTERNS.UUID.test(guid)) {
      throw new Error(`${paramName} must be a valid UUID`);
    }
  }

  protected sanitizeAndValidatePhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    const sanitized = ValidationUtil.sanitizePhoneNumber(phone);
    if (phone && !sanitized) {
      throw new Error('Phone number must be 10 digits');
    }
    return sanitized;
  }

  protected sanitizeAndValidateEmail(email?: string): string | undefined {
    if (!email) return undefined;
    const sanitized = ValidationUtil.sanitizeEmail(email);
    if (email && !sanitized) {
      throw new Error('Invalid email format');
    }
    return sanitized;
  }

  abstract getToolNames(): string[];
  abstract handleTool(toolName: string, args: ToolArguments): Promise<ToolResponse>;
}