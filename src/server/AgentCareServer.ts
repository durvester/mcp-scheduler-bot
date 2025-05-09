import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ToolHandler } from "./handlers/ToolHandler.js";
import { AuthConfig } from "./utils/AuthConfig.js";

export class AgentCareServer {
  private mcpServer: Server;
  private toolHandler: ToolHandler;
  
  constructor(mcpServer: Server, authConfig: AuthConfig, baseUrl: string) {
    try {
      console.error("[AgentCareServer] Initializing...");
      this.mcpServer = mcpServer;
      this.toolHandler = new ToolHandler(authConfig, baseUrl);
      this.setupHandlers();
      this.setupErrorHandling();
      console.error("[AgentCareServer] Initialized successfully");
    } catch (error) {
      console.error("[AgentCareServer] Error during initialization:", error);
      throw error;
    }
  }

  private setupHandlers() {
    try {
      console.error("[AgentCareServer] Setting up handlers...");
      this.toolHandler.register(this.mcpServer);
      console.error("[AgentCareServer] Handlers setup complete");
    } catch (error) {
      console.error("[AgentCareServer] Error setting up handlers:", error);
      throw error;
    }
  }

  private setupErrorHandling() {
    this.mcpServer.onerror = (error) => {
      console.error("[AgentCareServer] MCP Error:", error);
    };

    process.on("SIGINT", async () => {
      console.error("[AgentCareServer] Received SIGINT, shutting down...");
      await this.mcpServer.close();
      process.exit(0);
    });
  }

  async run() {
    try {
      console.error("[AgentCareServer] Starting server...");
      const transport = new StdioServerTransport();
      await this.mcpServer.connect(transport);
      console.error("[AgentCareServer] Practice Fusion MCP server running on stdio");
    } catch (error) {
      console.error("[AgentCareServer] Error starting server:", error);
      throw error;
    }
  }
} 