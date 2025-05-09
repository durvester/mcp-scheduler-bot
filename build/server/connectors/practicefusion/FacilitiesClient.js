import { PracticeFusionClient } from './PracticeFusionClient.js';
export class FacilitiesClient extends PracticeFusionClient {
    /**
     * Retrieves a list of facilities
     * @returns Promise<FacilitiesResponse>
     */
    async getFacilities() {
        return this.get('/ehr/v2/facilities');
    }
    /**
     * Helper method to get a facility by its GUID
     * @param facilityGuid The GUID of the facility to retrieve
     * @returns Promise<Facility | undefined>
     */
    async getFacilityByGuid(facilityGuid) {
        const response = await this.getFacilities();
        return response.facilities.find(facility => facility.facilityGuid === facilityGuid);
    }
    /**
     * Helper method to get the primary facility
     * @returns Promise<Facility | undefined>
     */
    async getPrimaryFacility() {
        const response = await this.getFacilities();
        return response.facilities.find(facility => facility.isPrimary);
    }
}
