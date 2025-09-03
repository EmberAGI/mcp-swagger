import {
  ServerCapabilities,
  Tool,
  Resource,
  ResourceTemplate,
  Prompt,
  ServerNotification,
  LoggingLevel,
} from "@modelcontextprotocol/sdk/types.js";

export interface MCPServer {
  name: string;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  transport: TransportType;
  description?: string;
  sessionId?: string;
}

export interface MCPServerConfig {
  servers: Record<string, MCPServer>;
  defaultServer?: string;
}

export interface ConnectionState {
  status: "disconnected" | "connecting" | "connected" | "error";
  server?: MCPServer;
  capabilities?: ServerCapabilities;
  tools: Tool[];
  resources: Resource[];
  resourceTemplates: ResourceTemplate[];
  prompts: Prompt[];
  notifications: ServerNotification[];
  error?: string;
  errorDetails?: any; // Detailed error information for debugging
}

export interface APIEndpoint {
  id: string;
  name: string;
  method: string;
  description?: string;
  parameters?: Record<string, any>;
  example?: any;
  response?: any;
}

export type TabType =
  | "overview"
  | "tools"
  | "resources"
  | "prompts"
  | "playground"
  | "config";

export type TransportType = "streamable-http" | "stdio";
