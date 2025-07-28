import { PracticeFusionClient, PracticeFusionConfig } from './PracticeFusionClient.js';

export interface CalendarEventType {
  eventTypeGuid: string;
  eventTypeName: string;
  eventCategory: 'Appointment' | 'BlockedTime';
}

export interface CalendarEvent {
  eventId: string;
  practiceGuid: string;
  ehrUserGuid?: string;
  facilityGuid?: string;
  patientPracticeGuid?: string;
  chiefComplaint?: string;
  eventType: CalendarEventType;
  startDateTimeUtc: string;
  startDateTimeFlt: string;
  duration: string;
  appointmentConfirmation?: {
    appointmentConfirmed: boolean;
    confirmationMethodCode?: string;
    notes?: string;
    confirmedByUserGuid?: string;
    confirmedAtDateTimeUtc?: string;
    confirmedAtDateTimeFlt?: string;
  };
  appointmentStatus?: {
    statusName: string;
    reasonForNoShowOrCancellation?: string;
    roomLocation?: string;
  };
  encounterGuid?: string;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

export interface CalendarEventQueryParams {
  minimumStartDateTimeUtc: string;
  maximumStartDateTimeUtc: string;
  eventTypeCategory?: 'Appointment' | 'BlockedTime';
  ehrUserGuid?: string;
  facilityGuid?: string;
}

export interface CalendarEventResponse {
  event: CalendarEvent;
}

export interface GetEventsParams {
  eventId: string[];
}

export interface CreateEventRequest {
  practiceGuid: string;
  ehrUserGuid?: string;
  facilityGuid?: string;
  patientPracticeGuid?: string;
  chiefComplaint?: string;
  eventType: CalendarEventType;
  startDateTimeUtc: string;
  startDateTimeFlt: string;
  duration: string;
  appointmentConfirmation?: {
    appointmentConfirmed: boolean;
    confirmationMethodCode?: string;
    notes?: string;
  };
  appointmentStatus?: {
    statusName: string;
    reasonForNoShowOrCancellation?: string;
    roomLocation?: string;
  };
}

class V1CalendarClient extends PracticeFusionClient {
  constructor(config: PracticeFusionConfig) {
    super({
      ...config,
      baseUrl: `${config.baseUrl}/ehr/calendar/v1`
    });
  }

  async getEventTypes(): Promise<CalendarEventType[]> {
    try {
      const response = await this.get<{ eventTypes: CalendarEventType[] }>('/eventTypes');
      return response.eventTypes;
    } catch (error) {
      this.logger.error('Error fetching event types', {}, error as Error);
      throw error;
    }
  }
}

export class CalendarClient extends PracticeFusionClient {
  private v1Client: V1CalendarClient;

  constructor(config: PracticeFusionConfig) {
    super({
      ...config,
      baseUrl: `${config.baseUrl}/ehr/calendar/v2`
    });

    this.v1Client = new V1CalendarClient(config);
  }

  async getEventTypes(): Promise<CalendarEventType[]> {
    return this.v1Client.getEventTypes();
  }

  async queryEvents(params: CalendarEventQueryParams): Promise<CalendarEventsResponse> {
    try {
      return await this.get<CalendarEventsResponse>('/events/query', params);
    } catch (error) {
      this.logger.error('Error querying events', { params }, error as Error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<CalendarEventResponse> {
    try {
      return await this.get<CalendarEventResponse>(`/events/${eventId}`);
    } catch (error) {
      this.logger.error('Error fetching event', { eventId }, error as Error);
      throw error;
    }
  }

  async getEvents(params: GetEventsParams): Promise<CalendarEventsResponse> {
    try {
      return await this.get<CalendarEventsResponse>('/events', params);
    } catch (error) {
      this.logger.error('Error fetching multiple events', { params }, error as Error);
      throw error;
    }
  }

  async createEvent(event: CreateEventRequest): Promise<CalendarEventResponse> {
    try {
      return await this.post<CalendarEventResponse>('/events', { event });
    } catch (error) {
      this.logger.error('Error creating event', { eventData: event }, error as Error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updatedFields: Partial<CreateEventRequest>): Promise<CalendarEventResponse> {
    try {
      // First, get the current event
      const currentEventResponse = await this.getEvent(eventId);
      const currentEvent = currentEventResponse.event;
      
      // Apply updates to the event object while preserving the exact structure
      const updatedEvent = {
        ...currentEvent,
        ...updatedFields
      };
      
      // Handle nested objects
      if (updatedFields.appointmentConfirmation) {
        updatedEvent.appointmentConfirmation = {
          ...currentEvent.appointmentConfirmation,
          ...updatedFields.appointmentConfirmation
        };
      }
      
      if (updatedFields.appointmentStatus) {
        updatedEvent.appointmentStatus = {
          ...currentEvent.appointmentStatus,
          ...updatedFields.appointmentStatus
        };
      }
      
      if (updatedFields.eventType) {
        updatedEvent.eventType = {
          ...currentEvent.eventType,
          ...updatedFields.eventType
        };
      }
      
      // Send the complete event object to the API
      return await this.put<CalendarEventResponse>(`/events/${eventId}`, { event: updatedEvent });
    } catch (error) {
      this.logger.error('Error updating event', { eventId, updatedFields }, error as Error);
      throw error;
    }
  }
} 