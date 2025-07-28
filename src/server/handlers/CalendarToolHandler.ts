import { BaseToolHandler, ToolResponse } from "./BaseToolHandler.js";
import { ToolArguments } from "../types/tool-types.js";
import { CalendarClient, CreateEventRequest } from "../clients/CalendarClient.js";
import { ValidationUtil } from "../utils/ValidationUtil.js";
import { CalendarEventCreateSchema, CalendarEventUpdateSchema } from "../utils/ValidationSchemas.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { Auth } from "../utils/Auth.js";

export class CalendarToolHandler extends BaseToolHandler {
  private calendarClient?: CalendarClient;

  constructor(authConfig: AuthConfig, baseUrl: string, sharedAuth: Auth) {
    super(authConfig, baseUrl, 'CalendarToolHandler', sharedAuth);
  }

  getToolNames(): string[] {
    return [
      'get_event_types',
      'query_events',
      'get_event',
      'get_events',
      'create_event',
      'update_event'
    ];
  }

  private async ensureCalendarClient(): Promise<CalendarClient> {
    if (!this.calendarClient) {
      this.calendarClient = new CalendarClient({
        baseUrl: this.baseUrl,
        auth: this.auth
      });
    }
    return this.calendarClient;
  }

  async handleTool(toolName: string, args: ToolArguments): Promise<ToolResponse> {
    try {
      const client = await this.ensureCalendarClient();

      switch (toolName) {
        case 'get_event_types':
          return await this.handleGetEventTypes(client);
        case 'query_events':
          return await this.handleQueryEvents(client, args);
        case 'get_event':
          return await this.handleGetEvent(client, args);
        case 'get_events':
          return await this.handleGetEvents(client, args);
        case 'create_event':
          return await this.handleCreateEvent(client, args);
        case 'update_event':
          return await this.handleUpdateEvent(client, args);
        default:
          return this.createErrorResponse(`Unknown tool: ${toolName}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in ${toolName}`, { args }, error);
      return this.createErrorResponse(`Error in ${toolName}: ${error.message}`);
    }
  }

  private async handleGetEventTypes(client: CalendarClient): Promise<ToolResponse> {
    const result = await this.executeWithAuth(() => 
      client.getEventTypes()
    );
    return this.createSuccessResponse(result);
  }

  private async handleQueryEvents(client: CalendarClient, args: ToolArguments): Promise<ToolResponse> {
    const { minimumStartDateTimeUtc, maximumStartDateTimeUtc, eventTypeCategory, ehrUserGuid, facilityGuid } = args || {};
    
    if (!minimumStartDateTimeUtc || !maximumStartDateTimeUtc) {
      return this.createErrorResponse('minimumStartDateTimeUtc and maximumStartDateTimeUtc are required parameters');
    }

    const queryParams = {
      minimumStartDateTimeUtc: minimumStartDateTimeUtc as string,
      maximumStartDateTimeUtc: maximumStartDateTimeUtc as string,
      eventTypeCategory: eventTypeCategory as ('Appointment' | 'BlockedTime' | undefined),
      ehrUserGuid: ehrUserGuid as string | undefined,
      facilityGuid: facilityGuid as string | undefined
    };

    const result = await this.executeWithAuth(() => 
      client.queryEvents(queryParams)
    );
    return this.createSuccessResponse(result);
  }

  private async handleGetEvent(client: CalendarClient, args: ToolArguments): Promise<ToolResponse> {
    const { eventId } = args || {};
    
    this.validateRequiredParam(eventId, 'eventId');

    const result = await this.executeWithAuth(() => 
      client.getEvent(eventId as string)
    );
    return this.createSuccessResponse(result);
  }

  private async handleGetEvents(client: CalendarClient, args: ToolArguments): Promise<ToolResponse> {
    const { eventId: eventIds } = args || {};
    
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return this.createErrorResponse('eventId must be a non-empty array of event IDs');
    }

    const result = await this.executeWithAuth(() => 
      client.getEvents({ eventId: eventIds })
    );
    return this.createSuccessResponse(result);
  }

  private async handleCreateEvent(client: CalendarClient, args: ToolArguments): Promise<ToolResponse> {
    const validation = ValidationUtil.validate(CalendarEventCreateSchema, args);
    if (!validation.success) {
      return this.createValidationErrorResponse(validation.errors!);
    }

    const eventData = validation.data!;
    const result = await this.executeWithAuth(() => 
      client.createEvent(eventData as CreateEventRequest)
    );
    return this.createSuccessResponse(result);
  }

  private async handleUpdateEvent(client: CalendarClient, args: ToolArguments): Promise<ToolResponse> {
    const validation = ValidationUtil.validate(CalendarEventUpdateSchema, args);
    if (!validation.success) {
      return this.createValidationErrorResponse(validation.errors!);
    }

    const { eventId, ...updateData } = validation.data!;
    
    try {
      const result = await this.executeWithAuth(() => 
        client.updateEvent(eventId, updateData as any)
      );
      return this.createSuccessResponse(result);
    } catch (error: any) {
      this.logger.error('Error updating event', { eventId, updateData }, error);
      
      let errorMessage = `Error updating event: ${error.message || "Unknown error"}`;
      
      // Add hints for common issues
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        errorMessage += "\nHint: The event may not exist or you may not have permission to update it.";
      } else if (error.message?.includes('startDateTimeUtc') || error.message?.includes('startDateTimeFlt')) {
        errorMessage += "\nHint: There may be an issue with the date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ).";
      } else if (error.message?.includes('appointment')) {
        errorMessage += "\nHint: Make sure appointment-specific fields are provided for appointment events.";
      }
      
      return this.createErrorResponse(errorMessage);
    }
  }
}