import { z } from "zod";
import { Auth } from "../utils/Auth.js";
import { UsersClient } from "../connectors/practicefusion/UsersClient.js";
import { FacilitiesClient } from "../connectors/practicefusion/FacilitiesClient.js";
import { PRACTICE_FUSION_TOOLS } from "../constants/practicefusion-tools.js";
// Define request schemas
const listSchema = z.object({
    method: z.literal("tools/list")
});
const callSchema = z.object({
    method: z.literal("tools/call"),
    params: z.object({
        name: z.string()
    }).optional()
});
export class ToolHandler {
    auth;
    authInitialized = false;
    usersClient;
    facilitiesClient;
    authConfig;
    baseUrl;
    constructor(authConfig, baseUrl) {
        this.authConfig = authConfig;
        this.baseUrl = baseUrl;
    }
    register(server) {
        // Register list handler
        server.setRequestHandler(listSchema, async (_request) => {
            return {
                tools: PRACTICE_FUSION_TOOLS
            };
        });
        // Register call handler
        server.setRequestHandler(callSchema, async (request) => {
            // Initialize auth if not already initialized
            if (!this.authInitialized) {
                this.auth = new Auth(this.authConfig);
                this.authInitialized = true;
            }
            return this.auth.executeWithAuth(async () => {
                // Initialize clients if needed
                if (!this.usersClient) {
                    this.usersClient = new UsersClient({
                        baseUrl: this.baseUrl,
                        auth: this.auth
                    });
                }
                if (!this.facilitiesClient) {
                    this.facilitiesClient = new FacilitiesClient({
                        baseUrl: this.baseUrl,
                        auth: this.auth
                    });
                }
                // Handle the request based on the tool name
                let result;
                switch (request.params?.name) {
                    case "get_users":
                        result = await this.usersClient.getUsers(['profile', 'login']);
                        return {
                            content: [{
                                    type: "text",
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    case "get_facilities":
                        result = await this.facilitiesClient.getFacilities();
                        return {
                            content: [{
                                    type: "text",
                                    text: JSON.stringify(result, null, 2)
                                }]
                        };
                    default:
                        throw new Error(`Unknown tool: ${request.params?.name}`);
                }
            });
        });
    }
}
