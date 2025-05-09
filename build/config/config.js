export const config = {
    practiceFusion: {
        baseUrl: process.env.PF_API_URL || 'https://api.practicefusion.com',
        clientId: process.env.PF_CLIENT_ID || '',
        clientSecret: process.env.PF_CLIENT_SECRET || '',
        redirectUri: process.env.PF_REDIRECT_URI || ''
    }
};
