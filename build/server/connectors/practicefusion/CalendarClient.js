import { PracticeFusionClient } from './PracticeFusionClient.js';
class V1CalendarClient extends PracticeFusionClient {
    constructor(config) {
        super({
            ...config,
            baseUrl: `${config.baseUrl}/ehr/calendar/v1`
        });
    }
    async getEventTypes() {
        try {
            const response = await this.get('/eventTypes');
            return response.eventTypes;
        }
        catch (error) {
            console.error('Error fetching event types:', error);
            throw error;
        }
    }
}
export class CalendarClient extends PracticeFusionClient {
    v1Client;
    constructor(config) {
        super({
            ...config,
            baseUrl: `${config.baseUrl}/ehr/calendar/v2`
        });
        this.v1Client = new V1CalendarClient(config);
    }
    async getEventTypes() {
        return this.v1Client.getEventTypes();
    }
    async queryEvents(params) {
        try {
            return await this.get('/events/query', params);
        }
        catch (error) {
            console.error('Error querying events:', error);
            throw error;
        }
    }
    async getEvent(eventId) {
        try {
            return await this.get(`/events/${eventId}`);
        }
        catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    }
    async getEvents(params) {
        try {
            return await this.get('/events', params);
        }
        catch (error) {
            console.error('Error fetching multiple events:', error);
            throw error;
        }
    }
    async createEvent(event) {
        try {
            return await this.post('/events', { event });
        }
        catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }
    async updateEvent(eventId, event) {
        try {
            return await this.put(`/events/${eventId}`, { event });
        }
        catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }
}
