import { MCPServerConfig } from "@/lib/types/mcp";

export const defaultServerConfig: MCPServerConfig = {
  servers: {
    emberai: {
      name: "EmberAI MCP Server",
      transport: "streamable-http",
      url: "https://api.emberai.xyz/mcp",
      description:
        "EmberAI's powerful MCP server with DeFi tools and AI capabilities",
    },
    everything: {
      name: "Everything Server",
      transport: "stdio",
      command: "npx",
      args: ["@modelcontextprotocol/server-everything"],
      description:
        "A comprehensive MCP server with multiple capabilities for testing",
    },
    filesystem: {
      name: "Filesystem Server",
      transport: "stdio",
      command: "npx",
      args: ["@modelcontextprotocol/server-filesystem", "/tmp"],
      description: "Provides filesystem access capabilities",
    },
  },
  defaultServer: "emberai",
};

export function loadServerConfig(): MCPServerConfig {
  if (typeof window === "undefined") {
    return defaultServerConfig;
  }

  try {
    const stored = localStorage.getItem("mcp-swagger-config");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultServerConfig, ...parsed };
    }
  } catch (error) {
    console.warn("Failed to load server config:", error);
  }

  return defaultServerConfig;
}

export function saveServerConfig(config: MCPServerConfig) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem("mcp-swagger-config", JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save server config:", error);
  }
}
