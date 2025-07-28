/**
 * Type definitions for MCP tool handling
 */

// Tool arguments can be any JSON-serializable value
export type ToolArguments = Record<string, unknown>;

// Response format for MCP tools
export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

// Base interface for tool handlers
export interface ToolHandler {
  getToolNames(): string[];
  handleTool(toolName: string, args: ToolArguments): Promise<ToolResponse>;
}