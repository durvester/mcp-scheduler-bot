export const PRACTICE_FUSION_TOOLS = [
    {
        name: "get_users",
        description: "Get all users in the Practice Fusion practice",
        inputSchema: {
            type: "object",
            properties: {
                includeFields: {
                    type: "array",
                    items: {
                        type: "string",
                        enum: ["profile", "login", "roles"]
                    },
                    description: "Fields to include in the response"
                }
            },
            required: []
        }
    },
    {
        name: "get_facilities",
        description: "Get all facilities in the Practice Fusion practice",
        inputSchema: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: ["active", "inactive"],
                    description: "Filter facilities by status"
                },
                includeDetails: {
                    type: "boolean",
                    description: "Include detailed facility information"
                }
            },
            required: []
        }
    }
];
