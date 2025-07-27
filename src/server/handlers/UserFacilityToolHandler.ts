import { BaseToolHandler, ToolResponse } from "./BaseToolHandler.js";
import { UsersClient } from "../connectors/practicefusion/UsersClient.js";
import { FacilitiesClient } from "../connectors/practicefusion/FacilitiesClient.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { Auth } from "../utils/Auth.js";

export class UserFacilityToolHandler extends BaseToolHandler {
  private usersClient?: UsersClient;
  private facilitiesClient?: FacilitiesClient;

  constructor(authConfig: AuthConfig, baseUrl: string, sharedAuth: Auth) {
    super(authConfig, baseUrl, 'UserFacilityToolHandler', sharedAuth);
  }

  getToolNames(): string[] {
    return [
      'get_users',
      'get_facilities'
    ];
  }

  private async ensureUsersClient(): Promise<UsersClient> {
    if (!this.usersClient) {
      this.usersClient = new UsersClient({
        baseUrl: this.baseUrl,
        auth: this.auth
      });
    }
    return this.usersClient;
  }

  private async ensureFacilitiesClient(): Promise<FacilitiesClient> {
    if (!this.facilitiesClient) {
      this.facilitiesClient = new FacilitiesClient({
        baseUrl: this.baseUrl,
        auth: this.auth
      });
    }
    return this.facilitiesClient;
  }

  async handleTool(toolName: string, args: any): Promise<ToolResponse> {
    try {
      switch (toolName) {
        case 'get_users':
          return await this.handleGetUsers(args);
        case 'get_facilities':
          return await this.handleGetFacilities(args);
        default:
          return this.createErrorResponse(`Unknown tool: ${toolName}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in ${toolName}`, { args }, error);
      return this.createErrorResponse(`Error in ${toolName}: ${error.message}`);
    }
  }

  private async handleGetUsers(args: any): Promise<ToolResponse> {
    const client = await this.ensureUsersClient();
    
    // Default to including profile and login fields
    const includeFields = args?.includeFields || ['profile', 'login'];
    
    const result = await this.executeWithAuth(() => 
      client.getUsers(includeFields)
    );
    return this.createSuccessResponse(result);
  }

  private async handleGetFacilities(args: any): Promise<ToolResponse> {
    const client = await this.ensureFacilitiesClient();
    
    const result = await this.executeWithAuth(() => 
      client.getFacilities()
    );
    return this.createSuccessResponse(result);
  }
}