import axios from 'axios';
export class CalendarClient {
    client;
    auth;
    constructor(config) {
        this.auth = config.auth;
        this.client = axios.create({
            baseURL: `${config.baseUrl}/ehr/calendar/v1`,
        });
    }
    async getEventTypes() {
        try {
            const token = await this.auth.ensureValidToken();
            const response = await this.client.get('/eventTypes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data.eventTypes;
        }
        catch (error) {
            console.error('Error fetching event types:', error);
            throw error;
        }
    }
}
