import { PracticeFusionClient } from './PracticeFusionClient.js';
export class UsersClient extends PracticeFusionClient {
    /**
     * Retrieves user information including profile and login details
     * @param includeFields Array of fields to include in the response (e.g., ['profile', 'login'])
     * @returns Promise<UsersResponse>
     */
    async getUsers(includeFields) {
        return this.get('/ehr/v2/users', {
            fields: includeFields.join(',')
        });
    }
    /**
     * Helper method to get the current user's information
     * @returns Promise<User | undefined>
     */
    async getCurrentUser() {
        const response = await this.getUsers(['profile', 'login']);
        return response.Users.find(user => user.IsRequester);
    }
}
