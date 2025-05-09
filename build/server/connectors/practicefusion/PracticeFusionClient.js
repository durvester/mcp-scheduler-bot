import axios from 'axios';
export class PracticeFusionClient {
    client;
    auth;
    constructor(config) {
        this.auth = config.auth;
        this.client = axios.create({
            baseURL: config.baseUrl,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        // Add request interceptor to add auth token
        this.client.interceptors.request.use(async (config) => {
            const token = await this.auth.ensureValidToken();
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }
    async get(path, params) {
        try {
            const response = await this.client.get(path, { params });
            return response.data;
        }
        catch (error) {
            console.error('PracticeFusion API error:', error.response?.data || error.message);
            throw error;
        }
    }
    async post(path, data) {
        try {
            const response = await this.client.post(path, data);
            return response.data;
        }
        catch (error) {
            console.error('PracticeFusion API error:', error.response?.data || error.message);
            throw error;
        }
    }
}
