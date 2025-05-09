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

export class CalendarClient extends PracticeFusionClient {
  constructor(config: PracticeFusionConfig) {
    super({
      ...config,
      baseUrl: `${config.baseUrl}/ehr/calendar/v2`
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

  async queryEvents(params: CalendarEventQueryParams): Promise<CalendarEventsResponse> {
    try {
      return await this.get<CalendarEventsResponse>('/events/query', params);
    } catch (error) {
      console.error('Error querying events:', error);
      throw error;
    }
  }
} 