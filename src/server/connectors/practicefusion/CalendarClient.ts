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
      console.error('Error fetching event types:', error);
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
      console.error('Error querying events:', error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<CalendarEventResponse> {
    try {
      return await this.get<CalendarEventResponse>(`/events/${eventId}`);
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  async getEvents(params: GetEventsParams): Promise<CalendarEventsResponse> {
    try {
      return await this.get<CalendarEventsResponse>('/events', params);
    } catch (error) {
      console.error('Error fetching multiple events:', error);
      throw error;
    }
  }

  async createEvent(event: CreateEventRequest): Promise<CalendarEventResponse> {
    try {
      return await this.post<CalendarEventResponse>('/events', { event });
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: CreateEventRequest): Promise<CalendarEventResponse> {
    try {
      return await this.put<CalendarEventResponse>(`/events/${eventId}`, { event });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }
} 