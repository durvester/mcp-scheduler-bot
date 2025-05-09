export class PracticeFusionPatientsClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async searchPatients(params) {
        try {
            const queryParams = new URLSearchParams();
            // Add search parameters if they exist
            if (params.firstName)
                queryParams.append('FirstName', params.firstName);
            if (params.lastName)
                queryParams.append('LastName', params.lastName);
            if (params.dateOfBirth)
                queryParams.append('DateOfBirth', params.dateOfBirth);
            if (params.sex)
                queryParams.append('Sex', params.sex);
            if (params.email)
                queryParams.append('Email', params.email);
            if (params.phone)
                queryParams.append('Phone', params.phone);
            if (params.mrn)
                queryParams.append('MRN', params.mrn);
            // Ensure at least one search parameter is set
            if (queryParams.toString() === '') {
                throw new Error('At least one search parameter must be provided');
            }
            const response = await this.client.get(`/patients?${queryParams.toString()}`);
            return response.data;
        }
        catch (error) {
            console.error('PracticeFusion API error:', error);
            throw error;
        }
    }
}
