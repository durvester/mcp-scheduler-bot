import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ToolHandler } from "./handlers/ToolHandlerNew.js";
import { Logger } from "./utils/Logger.js";
import { StreamableHttpTransport } from "./transport/StreamableHttpTransport.js";
export class AgentCareServer {
    mcpServer;
    toolHandler;
    logger;
    httpTransport = null;
    transportConfig;
    constructor(mcpServer, authConfig, baseUrl, transportConfig) {
        this.logger = Logger.create('AgentCareServer');
        this.transportConfig = transportConfig;
        try {
            this.logger.info("Initializing AgentCareServer...", { transport: transportConfig.type });
            this.mcpServer = mcpServer;
            this.toolHandler = new ToolHandler(authConfig, baseUrl);
            // Initialize HTTP transport if needed
            if (transportConfig.type === 'http') {
                this.httpTransport = new StreamableHttpTransport(mcpServer, transportConfig);
            }
            this.setupHandlers();
            this.setupErrorHandling();
            this.logger.info("AgentCareServer initialized successfully", { transport: transportConfig.type });
        }
        catch (error) {
            this.logger.error("Error during AgentCareServer initialization", {}, error);
            throw error;
        }
    }
    setupHandlers() {
        try {
            this.logger.debug("Setting up request handlers...");
            this.toolHandler.register(this.mcpServer);
            this.logger.debug("Request handlers setup complete");
        }
        catch (error) {
            this.logger.error("Error setting up handlers", {}, error);
            throw error;
        }
    }
    setupErrorHandling() {
        this.mcpServer.onerror = (error) => {
            this.logger.error("MCP Server error", {}, error);
        };
        const shutdown = async () => {
            this.logger.info("Received shutdown signal, shutting down gracefully...");
            try {
                // Shutdown HTTP transport if active
                if (this.httpTransport) {
                    await this.httpTransport.shutdown();
                }
                // Close MCP server
                await this.mcpServer.close();
                this.logger.info("Server shutdown complete");
                process.exit(0);
            }
            catch (error) {
                this.logger.error("Error during shutdown", {}, error);
                process.exit(1);
            }
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    }
    async run() {
        try {
            this.logger.info("Starting MCP server...", { transport: this.transportConfig.type });
            if (this.transportConfig.type === 'stdio') {
                // Use stdio transport
                const transport = new StdioServerTransport();
                await this.mcpServer.connect(transport);
                this.logger.info("Practice Fusion MCP server running on stdio");
            }
            else if (this.transportConfig.type === 'http') {
                // Use HTTP transport
                if (!this.httpTransport) {
                    throw new Error('HTTP transport not initialized');
                }
                // FIXED: The MCP SDK's connect() method automatically starts the transport
                // So we don't need to call start() explicitly - that was causing double binding!
                await this.mcpServer.connect(this.httpTransport);
                this.logger.info("Practice Fusion MCP server running on HTTP", {
                    host: this.transportConfig.host,
                    port: this.transportConfig.port,
                    url: `http://${this.transportConfig.host}:${this.transportConfig.port}/mcp`
                });
            }
            else {
                throw new Error(`Unsupported transport type: ${this.transportConfig.type}`);
            }
        }
        catch (error) {
            this.logger.error("Error starting server", {}, error);
            throw error;
        }
    }
}
