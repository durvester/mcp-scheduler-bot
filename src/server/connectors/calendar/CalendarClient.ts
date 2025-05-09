import axios, { AxiosInstance } from 'axios';
import { Auth } from '../../utils/Auth.js';

export interface CalendarEventType {
  eventTypeGuid: string;
  eventTypeName: string;
  eventCategory: 'Appointment' | 'BlockedTime';
}

interface CalendarClientConfig {
  baseUrl: string;
  auth: Auth;
}

export class CalendarClient {
  private client: AxiosInstance;
  private auth: Auth;

  constructor(config: CalendarClientConfig) {
    this.auth = config.auth;
    this.client = axios.create({
      baseURL: `${config.baseUrl}/ehr/calendar/v1`,
    });
  }

  async getEventTypes(): Promise<CalendarEventType[]> {
    try {
      const token = await this.auth.ensureValidToken();
      const response = await this.client.get('/eventTypes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.eventTypes;
    } catch (error) {
      console.error('Error fetching event types:', error);
      throw error;
    }
  }
} 