import axios, { AxiosInstance } from 'axios';
import { Auth } from '../utils/Auth.js';
import { Logger } from '../utils/Logger.js';

export interface PracticeFusionConfig {
    baseUrl: string;
    auth: Auth;
}

export class PracticeFusionClient {
    protected client: AxiosInstance;
    protected auth: Auth;
    protected logger: Logger;

    constructor(config: PracticeFusionConfig) {
        this.auth = config.auth;
        this.logger = Logger.create('PracticeFusionClient');
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

    protected async get<T>(path: string, params?: Record<string, any>): Promise<T> {
        try {
            const response = await this.client.get(path, { params });
            return response.data;
        } catch (error: any) {
            this.logger.error('PracticeFusion API GET error', { path, params: params || {} }, error);
            throw error;
        }
    }

    protected async post<T>(path: string, data: any): Promise<T> {
        try {
            const response = await this.client.post(path, data);
            return response.data;
        } catch (error: any) {
            this.logger.error('PracticeFusion API POST error', { path, data }, error);
            throw error;
        }
    }

    protected async put<T>(path: string, data: any): Promise<T> {
        try {
            const response = await this.client.put(path, data);
            return response.data;
        } catch (error: any) {
            this.logger.error('PracticeFusion API PUT error', { path, data }, error);
            throw error;
        }
    }
} 