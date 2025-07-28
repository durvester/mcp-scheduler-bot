import { z } from "zod";
import { PRACTICE_FUSION_TOOLS } from "../constants/practicefusion-tools.js";
import { Logger } from "../utils/Logger.js";
import { Auth } from "../utils/Auth.js";
// Import specialized handlers
import { PatientToolHandler } from "./PatientToolHandler.js";
import { CalendarToolHandler } from "./CalendarToolHandler.js";
import { UserFacilityToolHandler } from "./UserFacilityToolHandler.js";
import { PayerToolHandler } from "./PayerToolHandler.js";
import { ResourceHandler } from "./ResourceHandler.js";
import { PromptHandler } from "./PromptHandler.js";
// Define request schemas
const listSchema = z.object({
    method: z.literal("tools/list")
});
const callSchema = z.object({
    method: z.literal("tools/call"),
    params: z.object({
        name: z.string(),
        arguments: z.record(z.string(), z.any()).optional(),
        params: z.record(z.string(), z.string()).optional()
    }).optional()
});
export class ToolHandler {
    handlers = new Map();
    resourceHandler;
    promptHandler;
    logger;
    sharedAuth;
    constructor(authConfig, baseUrl) {
        this.logger = Logger.create('ToolHandler');
        // Create single shared Auth instance for all handlers
        this.sharedAuth = new Auth(authConfig);
        this.logger.info('Created shared Auth instance for token persistence');
        // Initialize specialized handlers with shared Auth instance
        const patientHandler = new PatientToolHandler(authConfig, baseUrl, this.sharedAuth);
        const calendarHandler = new CalendarToolHandler(authConfig, baseUrl, this.sharedAuth);
        const userFacilityHandler = new UserFacilityToolHandler(authConfig, baseUrl, this.sharedAuth);
        const payerHandler = new PayerToolHandler(authConfig, baseUrl, this.sharedAuth);
        // Initialize MCP resource and prompt handlers
        this.resourceHandler = new ResourceHandler(authConfig, baseUrl, this.sharedAuth);
        this.promptHandler = new PromptHandler(authConfig, baseUrl, this.sharedAuth);
        // Register tools with their handlers
        this.registerHandler(patientHandler);
        this.registerHandler(calendarHandler);
        this.registerHandler(userFacilityHandler);
        this.registerHandler(payerHandler);
        this.logger.info('ToolHandler initialized with specialized handlers', {
            totalTools: Array.from(this.handlers.keys()).length,
            handlers: [
                'PatientToolHandler',
                'CalendarToolHandler',
                'UserFacilityToolHandler',
                'PayerToolHandler'
            ]
        });
    }
    registerHandler(handler) {
        const toolNames = handler.getToolNames();
        toolNames.forEach(toolName => {
            if (this.handlers.has(toolName)) {
                this.logger.warn(`Tool ${toolName} is already registered, overwriting...`);
            }
            this.handlers.set(toolName, handler);
        });
    }
    register(server) {
        this.logger.debug('Registering MCP request handlers...');
        // Register MCP resource and prompt handlers
        this.resourceHandler.register(server);
        this.promptHandler.register(server);
        this.logger.info('Registered MCP resources and prompts handlers');
        // Register list handler
        server.setRequestHandler(listSchema, async (_request) => {
            this.logger.debug('Handling tools/list request');
            return {
                tools: PRACTICE_FUSION_TOOLS
            };
        });
        // Register call handler
        server.setRequestHandler(callSchema, async (request) => {
            const toolName = request.params?.name;
            const args = request.params?.arguments || {};
            this.logger.debug('Handling tool call', { toolName, hasArgs: Object.keys(args).length > 0 });
            if (!toolName) {
                return {
                    content: [{
                            type: "text",
                            text: "Tool name is required"
                        }]
                };
            }
            const handler = this.handlers.get(toolName);
            if (!handler) {
                this.logger.warn('Unknown tool requested', { toolName, availableTools: Array.from(this.handlers.keys()) });
                return {
                    content: [{
                            type: "text",
                            text: `Unknown tool: ${toolName}`
                        }]
                };
            }
            try {
                const result = await handler.handleTool(toolName, args);
                this.logger.debug('Tool call completed successfully', { toolName });
                return result;
            }
            catch (error) {
                this.logger.error('Tool call failed', { toolName, args }, error);
                return {
                    content: [{
                            type: "text",
                            text: `Error executing tool ${toolName}: ${error.message}`
                        }]
                };
            }
        });
        this.logger.info('MCP request handlers registered successfully');
    }
    // Utility method to get all registered tools
    getRegisteredTools() {
        return Array.from(this.handlers.keys());
    }
    // Utility method to get handler statistics
    getHandlerStats() {
        const stats = {};
        this.handlers.forEach((handler, toolName) => {
            const handlerName = handler.constructor.name;
            stats[handlerName] = (stats[handlerName] || 0) + 1;
        });
        return stats;
    }
}
