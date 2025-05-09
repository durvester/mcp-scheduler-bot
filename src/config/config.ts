export interface PracticeFusionConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface Config {
    practiceFusion: PracticeFusionConfig;
}

export const config: Config = {
    practiceFusion: {
        baseUrl: process.env.PF_API_URL || 'https://api.practicefusion.com',
        clientId: process.env.PF_CLIENT_ID || '',
        clientSecret: process.env.PF_CLIENT_SECRET || '',
        redirectUri: process.env.PF_REDIRECT_URI || ''
    }
}; 