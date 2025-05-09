import { PracticeFusionClient } from './PracticeFusionClient.js';
export class PatientsClient extends PracticeFusionClient {
    constructor(config) {
        super(config);
    }
    /**
     * Search for patients based on provided criteria
     * @param searchParams The search parameters to filter patients
     * @param onlyActive Whether to return only active patients (defaults to true)
     * @returns Promise<PatientProfile[]>
     */
    async searchPatients(searchParams, onlyActive = true) {
        // Validate that at least one search parameter (other than sex) is provided
        const hasSearchParam = searchParams.FirstName || searchParams.LastName || searchParams.BirthDate ||
            searchParams.SocialSecurityNumber || searchParams.PatientRecordNumber || searchParams.PatientPracticeGuid ||
            searchParams.PracticeGuid || searchParams.FirstOrLastName;
        if (!hasSearchParam) {
            throw new Error('At least one search parameter (other than sex) must be provided');
        }
        // Note: First name, last name, and gender work like AND
        // Birth date works like OR
        return this.post('/ehr/v2/patients/search', {
            ...searchParams,
            onlyActive
        });
    }
    /**
     * Helper method to parse sex/gender string to standardized format
     * @param gender The gender string to parse
     * @returns "male", "female", or "unknown"
     */
    static parseSex(gender) {
        if (gender.toLowerCase().startsWith('m')) {
            return 'male';
        }
        if (gender.toLowerCase().startsWith('f')) {
            return 'female';
        }
        return 'unknown';
    }
}
