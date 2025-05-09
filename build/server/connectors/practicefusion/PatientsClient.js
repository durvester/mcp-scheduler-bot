import { PracticeFusionClient } from './PracticeFusionClient.js';
export class PatientsClient extends PracticeFusionClient {
    constructor(config) {
        super(config);
    }
    /**
     * Validates a US state code
     * @param state Two-letter US state code
     * @returns boolean
     */
    static isValidStateCode(state) {
        const validStates = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
            'DC', 'PR', 'VI', 'GU', 'MP', 'AS'
        ];
        return validStates.includes(state.toUpperCase());
    }
    /**
     * Validates a US ZIP code
     * @param zip ZIP code
     * @returns boolean
     */
    static isValidZipCode(zip) {
        // Basic ZIP code validation (5 digits or 5+4 format)
        return /^\d{5}(-\d{4})?$/.test(zip);
    }
    /**
     * Validates a phone number
     * @param phone Phone number
     * @returns boolean
     */
    static isValidPhoneNumber(phone) {
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');
        // Check if it's a valid US phone number (10 digits)
        return digits.length === 10;
    }
    /**
     * Validates a date in MM/DD/YYYY format
     * @param date Date string
     * @returns boolean
     */
    static isValidDate(date) {
        // Check if date matches MM/DD/YYYY format
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            return false;
        }
        const [month, day, year] = date.split('/').map(Number);
        // Check if date is valid
        const dateObj = new Date(year, month - 1, day);
        return dateObj.getMonth() === month - 1 &&
            dateObj.getDate() === day &&
            dateObj.getFullYear() === year;
    }
    /**
     * Validates an email address
     * @param email Email address
     * @returns boolean
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Format a phone number to (XXX) XXX-XXXX format
     * @param phone Phone number
     * @returns string
     */
    static formatPhoneNumber(phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length !== 10)
            return phone;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    /**
     * Format a date to MM/DD/YYYY format
     * @param date Date string
     * @returns string
     */
    static formatDate(date) {
        try {
            const dateObj = new Date(date);
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const year = dateObj.getFullYear();
            return `${month}/${day}/${year}`;
        }
        catch {
            return date;
        }
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
     * Get a patient by their Practice Fusion ID using v4 API
     * @param patientPracticeGuid The unique identifier of the patient
     * @param fields Optional array of fields to include in the response (profile, contact, demographics, ssn)
     * @returns Promise<PatientProfile>
     */
    async getPatientV4(patientPracticeGuid, fields) {
        if (!patientPracticeGuid) {
            throw new Error('Patient Practice GUID is required');
        }
        // Always include profile, contact, and demographics
        const defaultFields = ['profile', 'contact', 'demographics'];
        const allFields = [...new Set([...defaultFields, ...(fields || [])])];
        // Remove ssn if it was included
        const filteredFields = allFields.filter(field => field !== 'ssn');
        return this.get(`/ehr/v4/patients/${patientPracticeGuid}`, {
            fields: filteredFields.join(',')
        });
    }
    /**
     * Create a new patient using v4 API
     * @param patientData The patient data to create
     * @returns Promise<PatientProfile>
     */
    async createPatientV4(patientData) {
        // Validate required fields
        if (!patientData.profile.firstName || !patientData.profile.lastName ||
            !patientData.profile.sex || !patientData.profile.birthDate) {
            throw new Error('First name, last name, sex, and birth date are required');
        }
        if (!patientData.contact.address.streetAddress1 || !patientData.contact.address.city ||
            !patientData.contact.address.state || !patientData.contact.address.postalCode) {
            throw new Error('Street address, city, state, and postal code are required');
        }
        // Validate state code
        if (!PatientsClient.isValidStateCode(patientData.contact.address.state)) {
            throw new Error('Invalid state code. Please provide a valid two-letter US state code.');
        }
        // Validate ZIP code
        if (!PatientsClient.isValidZipCode(patientData.contact.address.postalCode)) {
            throw new Error('Invalid ZIP code. Please provide a valid US ZIP code (e.g., 12345 or 12345-6789).');
        }
        // Validate and format birth date
        const formattedBirthDate = PatientsClient.formatDate(patientData.profile.birthDate);
        if (!PatientsClient.isValidDate(formattedBirthDate)) {
            throw new Error('Invalid birth date. Please provide a valid date in MM/DD/YYYY format.');
        }
        patientData.profile.birthDate = formattedBirthDate;
        // Validate contact information based on doesNotHave flags
        if (patientData.contact.doesNotHaveMobilePhone === false && !patientData.contact.mobilePhone) {
            throw new Error('Mobile phone is required when doesNotHaveMobilePhone is false');
        }
        if (patientData.contact.doesNotHaveEmail === false && !patientData.contact.emailAddress) {
            throw new Error('Email address is required when doesNotHaveEmail is false');
        }
        // Validate and format phone numbers if provided
        if (patientData.contact.mobilePhone) {
            if (!PatientsClient.isValidPhoneNumber(patientData.contact.mobilePhone)) {
                throw new Error('Invalid mobile phone number. Please provide a valid 10-digit US phone number.');
            }
            patientData.contact.mobilePhone = PatientsClient.formatPhoneNumber(patientData.contact.mobilePhone);
        }
        if (patientData.contact.homePhone) {
            if (!PatientsClient.isValidPhoneNumber(patientData.contact.homePhone)) {
                throw new Error('Invalid home phone number. Please provide a valid 10-digit US phone number.');
            }
            patientData.contact.homePhone = PatientsClient.formatPhoneNumber(patientData.contact.homePhone);
        }
        if (patientData.contact.officePhone) {
            if (!PatientsClient.isValidPhoneNumber(patientData.contact.officePhone)) {
                throw new Error('Invalid office phone number. Please provide a valid 10-digit US phone number.');
            }
            patientData.contact.officePhone = PatientsClient.formatPhoneNumber(patientData.contact.officePhone);
        }
        // Validate email if provided
        if (patientData.contact.emailAddress && !PatientsClient.isValidEmail(patientData.contact.emailAddress)) {
            throw new Error('Invalid email address format.');
        }
        // Validate sex/gender
        const validSexValues = ['male', 'female', 'unknown'];
        if (!validSexValues.includes(patientData.profile.sex.toLowerCase())) {
            throw new Error('Invalid sex value. Must be one of: male, female, unknown');
        }
        return this.post('/ehr/v4/patients', patientData);
    }
    /**
     * Update an existing patient using v4 API
     * @param patientPracticeGuid The unique identifier of the patient to update
     * @param patientData The patient data to update
     * @returns Promise<PatientProfile>
     */
    async updatePatientV4(patientPracticeGuid, patientData) {
        if (!patientPracticeGuid) {
            throw new Error('Patient Practice GUID is required');
        }
        // Validate required fields
        if (!patientData.profile.firstName || !patientData.profile.lastName ||
            !patientData.profile.sex || !patientData.profile.birthDate) {
            throw new Error('First name, last name, sex, and birth date are required');
        }
        if (!patientData.contact.address.streetAddress1 || !patientData.contact.address.city ||
            !patientData.contact.address.state || !patientData.contact.address.postalCode) {
            throw new Error('Street address, city, state, and postal code are required');
        }
        // Validate state code
        if (!PatientsClient.isValidStateCode(patientData.contact.address.state)) {
            throw new Error('Invalid state code. Please provide a valid two-letter US state code.');
        }
        // Validate ZIP code
        if (!PatientsClient.isValidZipCode(patientData.contact.address.postalCode)) {
            throw new Error('Invalid ZIP code. Please provide a valid US ZIP code (e.g., 12345 or 12345-6789).');
        }
        // Validate and format birth date
        const formattedBirthDate = PatientsClient.formatDate(patientData.profile.birthDate);
        if (!PatientsClient.isValidDate(formattedBirthDate)) {
            throw new Error('Invalid birth date. Please provide a valid date in MM/DD/YYYY format.');
        }
        patientData.profile.birthDate = formattedBirthDate;
        // Validate contact information based on doesNotHave flags
        if (patientData.contact.doesNotHaveMobilePhone === false && !patientData.contact.mobilePhone) {
            throw new Error('Mobile phone is required when doesNotHaveMobilePhone is false');
        }
        if (patientData.contact.doesNotHaveEmail === false && !patientData.contact.emailAddress) {
            throw new Error('Email address is required when doesNotHaveEmail is false');
        }
        // Validate and format phone numbers if provided
        if (patientData.contact.mobilePhone) {
            if (!PatientsClient.isValidPhoneNumber(patientData.contact.mobilePhone)) {
                throw new Error('Invalid mobile phone number. Please provide a valid 10-digit US phone number.');
            }
            patientData.contact.mobilePhone = PatientsClient.formatPhoneNumber(patientData.contact.mobilePhone);
        }
        if (patientData.contact.homePhone) {
            if (!PatientsClient.isValidPhoneNumber(patientData.contact.homePhone)) {
                throw new Error('Invalid home phone number. Please provide a valid 10-digit US phone number.');
            }
            patientData.contact.homePhone = PatientsClient.formatPhoneNumber(patientData.contact.homePhone);
        }
        if (patientData.contact.officePhone) {
            if (!PatientsClient.isValidPhoneNumber(patientData.contact.officePhone)) {
                throw new Error('Invalid office phone number. Please provide a valid 10-digit US phone number.');
            }
            patientData.contact.officePhone = PatientsClient.formatPhoneNumber(patientData.contact.officePhone);
        }
        // Validate email if provided
        if (patientData.contact.emailAddress && !PatientsClient.isValidEmail(patientData.contact.emailAddress)) {
            throw new Error('Invalid email address format.');
        }
        // Validate sex/gender
        const validSexValues = ['male', 'female', 'unknown'];
        if (!validSexValues.includes(patientData.profile.sex.toLowerCase())) {
            throw new Error('Invalid sex value. Must be one of: male, female, unknown');
        }
        return this.put(`/ehr/v4/patients/${patientPracticeGuid}`, patientData);
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
