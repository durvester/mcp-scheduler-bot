import { PracticeFusionClient } from './PracticeFusionClient.js';
export class CalendarClient extends PracticeFusionClient {
    constructor(config) {
        super({
            ...config,
            baseUrl: `${config.baseUrl}/ehr/calendar/v2`
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
    async queryEvents(params) {
        try {
            return await this.get('/events/query', params);
        }
        catch (error) {
            console.error('Error querying events:', error);
            throw error;
        }
    }
}
