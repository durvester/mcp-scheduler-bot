import { PracticeFusionClient } from './PracticeFusionClient.js';

export interface FacilityHours {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
}

export interface Facility {
    facilityGuid: string;
    facilityName: string;
    facilityPhone: string;
    isPrimary: boolean;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    facilityHuid: string;
    practiceGuid: string;
    facilityHours: FacilityHours[];
}

export interface FacilitiesResponse {
    facilities: Facility[];
}

export class FacilitiesClient extends PracticeFusionClient {
    /**
     * Retrieves a list of facilities
     * @returns Promise<FacilitiesResponse>
     */
    async getFacilities(): Promise<FacilitiesResponse> {
        return this.get<FacilitiesResponse>('/ehr/v2/facilities');
    }

    /**
     * Helper method to get a facility by its GUID
     * @param facilityGuid The GUID of the facility to retrieve
     * @returns Promise<Facility | undefined>
     */
    async getFacilityByGuid(facilityGuid: string): Promise<Facility | undefined> {
        const response = await this.getFacilities();
        return response.facilities.find(facility => facility.facilityGuid === facilityGuid);
    }

    /**
     * Helper method to get the primary facility
     * @returns Promise<Facility | undefined>
     */
    async getPrimaryFacility(): Promise<Facility | undefined> {
        const response = await this.getFacilities();
        return response.facilities.find(facility => facility.isPrimary);
    }
} 