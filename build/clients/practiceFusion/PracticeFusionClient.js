import axios from 'axios';
export class PracticeFusionClient {
    client;
    constructor(baseURL, accessToken) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    }
    async get(path) {
        const response = await this.client.get(path);
        return { data: response.data };
    }
    async post(path, data) {
        const response = await this.client.post(path, data);
        return { data: response.data };
    }
    async put(path, data) {
        const response = await this.client.put(path, data);
        return { data: response.data };
    }
    async delete(path) {
        const response = await this.client.delete(path);
        return { data: response.data };
    }
}
