import { PracticeFusionClient, PracticeFusionConfig } from './PracticeFusionClient.js';

export interface PatientSearchRequest {
    Sex?: string;
    FirstName?: string;
    LastName?: string;
    MiddleName?: string;
    SocialSecurityNumber?: string;
    BirthDate?: string;
    PatientRecordNumber?: string;
    PatientPracticeGuid?: string;
    IsActive?: boolean;
    PracticeGuid?: string;
    FirstOrLastName?: string; // Additional field from controller
}

export interface PatientProfile {
    Sex: string;
    FirstName: string;
    LastName: string;
    MiddleName: string;
    SocialSecurityNumber: string | null; // Can be null if SSN scope not granted
    BirthDate: string;
    PatientRecordNumber: string;
    PatientPracticeGuid: string;
    IsActive: boolean;
    PracticeGuid: string;
    EmailAddress: string;
    HomePhone: string;
    OfficePhone: string;
    MobilePhone: string;
}

export class PatientsClient extends PracticeFusionClient {
    constructor(config: PracticeFusionConfig) {
        super(config);
    }

    /**
     * Search for patients based on provided criteria
     * @param searchParams The search parameters to filter patients
     * @param onlyActive Whether to return only active patients (defaults to true)
     * @returns Promise<PatientProfile[]>
     */
    async searchPatients(searchParams: PatientSearchRequest, onlyActive: boolean = true): Promise<PatientProfile[]> {
        // Validate that at least one search parameter (other than sex) is provided
        const hasSearchParam = searchParams.FirstName || searchParams.LastName || searchParams.BirthDate || 
            searchParams.SocialSecurityNumber || searchParams.PatientRecordNumber || searchParams.PatientPracticeGuid || 
            searchParams.PracticeGuid || searchParams.FirstOrLastName;

        if (!hasSearchParam) {
            throw new Error('At least one search parameter (other than sex) must be provided');
        }

        // Note: First name, last name, and gender work like AND
        // Birth date works like OR
        return this.post<PatientProfile[]>('/ehr/v2/patients/search', {
            ...searchParams,
            onlyActive
        });
    }

    /**
     * Helper method to parse sex/gender string to standardized format
     * @param gender The gender string to parse
     * @returns "male", "female", or "unknown"
     */
    private static parseSex(gender: string): string {
        if (gender.toLowerCase().startsWith('m')) {
            return 'male';
        }
        if (gender.toLowerCase().startsWith('f')) {
            return 'female';
        }
        return 'unknown';
    }
} 