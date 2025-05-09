import axios, { AxiosInstance } from 'axios';
import { Auth } from '../../utils/Auth.js';

export interface PracticeFusionConfig {
    baseUrl: string;
    auth: Auth;
}

export class PracticeFusionClient {
    protected client: AxiosInstance;
    protected auth: Auth;

    constructor(config: PracticeFusionConfig) {
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

    protected async get<T>(path: string, params?: Record<string, string>): Promise<T> {
        try {
            const response = await this.client.get(path, { params });
            return response.data;
        } catch (error: any) {
            console.error('PracticeFusion API error:', error.response?.data || error.message);
            throw error;
        }
    }

    protected async post<T>(path: string, data: any): Promise<T> {
        try {
            const response = await this.client.post(path, data);
            return response.data;
        } catch (error: any) {
            console.error('PracticeFusion API error:', error.response?.data || error.message);
            throw error;
        }
    }

    protected async put<T>(path: string, data: any): Promise<T> {
        try {
            const response = await this.client.put(path, data);
            return response.data;
        } catch (error: any) {
            console.error('PracticeFusion API error:', error.response?.data || error.message);
            throw error;
        }
    }
} 