import { PracticeFusionClient } from './PracticeFusionClient.js';

export interface ProviderSpecialization {
    Specialization: string;
    IsPrimary: boolean;
}

export interface User {
    Sex?: string;
    AuthenticationPhoneNumber?: string;
    ProviderGuid?: string;
    OfficePhone?: string;
    PrimaryFacility?: string;
    ProviderSpecializations?: ProviderSpecialization[];
    IsLimitedAccess?: boolean;
    FirstName: string;
    LastName: string;
    LoginEmailAddress: string;
    EhrUserGuid: string;
    PracticeGuid: string;
    IsActive: boolean;
    IsAdministrator: boolean;
    EhrEditLevel: number;
    IsRequester: boolean;
}

export interface UsersResponse {
    Users: User[];
}

export class UsersClient extends PracticeFusionClient {
    /**
     * Retrieves user information including profile and login details
     * @param includeFields Array of fields to include in the response (e.g., ['profile', 'login'])
     * @returns Promise<UsersResponse>
     */
    async getUsers(includeFields: string[]): Promise<UsersResponse> {
        return this.get<UsersResponse>('/ehr/v2/users', {
            fields: includeFields.join(',')
        });
    }

    /**
     * Helper method to get the current user's information
     * @returns Promise<User | undefined>
     */
    async getCurrentUser(): Promise<User | undefined> {
        const response = await this.getUsers(['profile', 'login']);
        return response.Users.find(user => user.IsRequester);
    }
} 