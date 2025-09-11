"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  Tool,
  Resource,
  ResourceTemplate,
  Prompt,
  ClientRequest,
  ListToolsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ListPromptsResultSchema,
  ReadResourceResultSchema,
  GetPromptResultSchema,
  CallToolResultSchema,
  CompleteResultSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { MCPServer, ConnectionState } from "@/lib/types/mcp";
import {
  getErrorMessage,
  getDetailedErrorInfo,
  categorizeConnectionError,
} from "@/lib/errorUtils";

interface UseMCPConnectionReturn {
  connectionState: ConnectionState;
  connect: (server: MCPServer) => Promise<void>;
  disconnect: () => Promise<void>;
  listTools: () => Promise<Tool[]>;
  listResources: () => Promise<Resource[]>;
  listResourceTemplates: () => Promise<ResourceTemplate[]>;
  listPrompts: () => Promise<Prompt[]>;
  readResource: (uri: string) => Promise<any>;
  getPrompt: (name: string, args?: Record<string, string>) => Promise<any>;
  callTool: (name: string, args: Record<string, unknown>) => Promise<any>;
  makeRequest: <T extends z.ZodType>(
    request: ClientRequest,
    schema: T
  ) => Promise<z.output<T>>;
  handleCompletion: (
    ref:
      | { type: "ref/resource"; uri: string }
      | { type: "ref/prompt"; name: string },
    argName: string,
    value: string,
    context?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<string[]>;
  completionsSupported: boolean;
}

export function useMCPConnection(): UseMCPConnectionReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "disconnected",
    tools: [],
    resources: [],
    resourceTemplates: [],
    prompts: [],
    notifications: [],
  });

  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [completionsSupported, setCompletionsSupported] = useState(true);
  const isConnectingRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const mcpClientRef = useRef<Client | null>(null);
  useEffect(() => {
    mcpClientRef.current = mcpClient;
  }, [mcpClient]);
  // Ensure unmount flag is clear on mount
  useEffect(() => {
    isUnmountingRef.current = false;
  }, []);
  const ignoreUnmountGuardRef = useRef(false);

  const disconnect = useCallback(async () => {
    console.log("[MCP] Disconnecting...");
    const serverUrl = connectionState.server?.url;
    const sessionKey = serverUrl ? `mcp-session-${serverUrl}` : undefined;
    const sessionId = sessionKey ? localStorage.getItem(sessionKey) : undefined;

    // Close client first
    if (mcpClient) {
      try {
        await mcpClient.close();
        console.log("[MCP] Client closed successfully");
      } catch (error) {
        console.error("[MCP] Error closing client:", error);
      }
      setMcpClient(null);
    }

    // Ask proxy to tear down the session on the server side
    if (sessionId) {
      try {
        await fetch("/api/mcp", {
          method: "DELETE",
          headers: { "mcp-session-id": sessionId },
        });
        console.log(`[MCP] Proxy session ${sessionId} deleted`);
      } catch (error) {
        console.warn("[MCP] Failed to delete proxy session:", error);
      }
    }

    // Clear session from localStorage
    if (sessionKey) {
      localStorage.removeItem(sessionKey);
    }

    // Reset connection state
    setConnectionState({
      status: "disconnected",
      tools: [],
      resources: [],
      resourceTemplates: [],
      prompts: [],
      notifications: [],
    });

    // Reset flags and features
    isConnectingRef.current = false;
    setCompletionsSupported(true);
  }, [mcpClient, connectionState.server?.url]);

  const connect = useCallback(
    async (server: MCPServer) => {
      console.log("[MCP] Connecting to server:", server);

      // Prevent concurrent connections
      if (isConnectingRef.current) {
        console.log("[MCP] Connection already in progress, skipping...");
        return;
      }

      // Don't connect if we're unmounting (unless explicitly ignored for a safe internal retry)
      if (isUnmountingRef.current && !ignoreUnmountGuardRef.current) {
        console.log("[MCP] Component is unmounting, skipping connection...");
        return;
      }

      isConnectingRef.current = true;

      // Disconnect any existing connection and clear prior session
      if (mcpClient || connectionState.server?.url) {
        await disconnect();
      }

      setConnectionState((prev) => ({
        ...prev,
        status: "connecting",
        server,
        error: undefined,
      }));

      try {
        const client = new Client(
          {
            name: "mcp-swagger",
            version: "1.0.0",
          },
          {
            capabilities: {},
          }
        );

        // Use proxy for CORS handling
        const proxyUrl = `/api/mcp?url=${encodeURIComponent(
          server.url || ""
        )}&transportType=${server.transport}`;

        // Always create a fresh session ID for a clean initialize
        let sessionId = crypto.randomUUID();
        localStorage.setItem(`mcp-session-${server.url}`, sessionId);
        console.log(`[MCP] Generated new session ID: ${sessionId}`);

        const transport: any =
          server.transport === "streamable-http" && server.url
            ? new StreamableHTTPClientTransport(
                new URL(proxyUrl, window.location.origin),
                {
                  requestInit: {
                    headers: {
                      "User-Agent": "MCP-Swagger/1.0",
                      "Content-Type": "application/json",
                      Accept: "text/event-stream, application/json",
                      "mcp-session-id": sessionId,
                    },
                  },
                }
              )
            : null;

        if (!transport) {
          throw new Error(
            `Transport type ${server.transport} not yet implemented`
          );
        }

        console.log("[MCP] Connecting via proxy:", proxyUrl);
        console.log("[MCP] Transport type:", server.transport);
        console.log("[MCP] Target URL:", server.url);

        console.log("[MCP] Transport created");

        // Connect to the server - MCP SDK will handle initialization automatically
        console.log("[MCP] Connecting to server...");
        console.log("[MCP] Transport endpoint:", transport.endpoint);

        await client.connect(transport);
        console.log("[MCP] Client connected successfully!");

        // Give the server a moment to complete the handshake
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("[MCP] Handshake period complete");

        const capabilities = client.getServerCapabilities();
        console.log("[MCP] Server capabilities:", capabilities);

        if (!capabilities) {
          console.warn(
            "[MCP] Warning: Server capabilities are undefined. This might indicate a connection issue."
          );
        } else {
          console.log("[MCP] Server supports:", {
            tools: capabilities.tools ? "Yes" : "No",
            resources: capabilities.resources ? "Yes" : "No",
            prompts: capabilities.prompts ? "Yes" : "No",
          });
        }

        setMcpClient(client);
        setConnectionState((prev) => ({
          ...prev,
          status: "connected",
          capabilities,
          error: undefined,
        }));

        // Fetch initial lists if capabilities support them
        try {
          const results = await Promise.allSettled([
            capabilities?.tools
              ? client.request({ method: "tools/list" }, ListToolsResultSchema)
              : Promise.resolve({ tools: [] }),
            capabilities?.resources
              ? client.request(
                  { method: "resources/list" },
                  ListResourcesResultSchema
                )
              : Promise.resolve({ resources: [] }),
            capabilities?.resources
              ? client.request(
                  { method: "resources/templates/list" },
                  ListResourceTemplatesResultSchema
                )
              : Promise.resolve({ resourceTemplates: [] }),
            capabilities?.prompts
              ? client.request(
                  { method: "prompts/list" },
                  ListPromptsResultSchema
                )
              : Promise.resolve({ prompts: [] }),
          ]);

          const [
            toolsResult,
            resourcesResult,
            resourceTemplatesResult,
            promptsResult,
          ] = results;

          setConnectionState((prev) => ({
            ...prev,
            tools:
              toolsResult.status === "fulfilled" ? toolsResult.value.tools : [],
            resources:
              resourcesResult.status === "fulfilled"
                ? resourcesResult.value.resources
                : [],
            resourceTemplates:
              resourceTemplatesResult.status === "fulfilled"
                ? resourceTemplatesResult.value.resourceTemplates
                : [],
            prompts:
              promptsResult.status === "fulfilled"
                ? promptsResult.value.prompts
                : [],
          }));

          console.log("[MCP] Initial lists fetched:", {
            tools:
              toolsResult.status === "fulfilled"
                ? toolsResult.value.tools.length
                : 0,
            resources:
              resourcesResult.status === "fulfilled"
                ? resourcesResult.value.resources.length
                : 0,
            resourceTemplates:
              resourceTemplatesResult.status === "fulfilled"
                ? resourceTemplatesResult.value.resourceTemplates.length
                : 0,
            prompts:
              promptsResult.status === "fulfilled"
                ? promptsResult.value.prompts.length
                : 0,
          });
        } catch (error) {
          console.error("[MCP] Error fetching initial lists:", error);
        }

        // Mark connection as complete
        isConnectingRef.current = false;
      } catch (error) {
        console.error("[MCP] Connection error:", error);

        // Get detailed error information
        const errorDetails = getDetailedErrorInfo(error);
        const basicErrorMessage = getErrorMessage(error);
        console.error("[MCP] Detailed error info:", errorDetails);

        const looksLikeAlreadyInitialized =
          /already\s+initialized/i.test(basicErrorMessage) ||
          (/initialize/i.test(basicErrorMessage) &&
            /already/i.test(basicErrorMessage));

        // If server reports already initialized, reset proxy session + local session and retry once
        if (looksLikeAlreadyInitialized && server.url) {
          try {
            const sessionKey = `mcp-session-${server.url}`;
            const sessionId = localStorage.getItem(sessionKey);
            if (sessionId) {
              try {
                await fetch("/api/mcp", {
                  method: "DELETE",
                  headers: { "mcp-session-id": sessionId },
                });
              } catch (e) {
                console.warn(
                  "[MCP] Failed to delete proxy session during retry:",
                  e
                );
              }
              localStorage.removeItem(sessionKey);
            }

            // Allow re-entry for retry
            isConnectingRef.current = false;

            // Brief delay to ensure proxy cleanup
            await new Promise((r) => setTimeout(r, 50));

            // Retry once (temporarily ignore unmount guard for this call)
            console.log(
              "[MCP] Retrying connection after already-initialized error..."
            );
            ignoreUnmountGuardRef.current = true;
            try {
              await connect(server);
            } finally {
              ignoreUnmountGuardRef.current = false;
            }
            return;
          } catch (retryError) {
            console.error(
              "[MCP] Retry after already-initialized failed:",
              retryError
            );
          }
        }

        // Categorize and enhance the error message
        const categorizedError = categorizeConnectionError(basicErrorMessage);
        const { userFriendlyMessage } = categorizedError;

        const finalErrorMessage =
          basicErrorMessage === "Unknown error occurred"
            ? "Connection failed: Unable to connect to the MCP server. Check the debug panel for more details."
            : userFriendlyMessage;

        console.error("[MCP] Final error message:", finalErrorMessage);

        setConnectionState({
          status: "error",
          tools: [],
          resources: [],
          resourceTemplates: [],
          prompts: [],
          notifications: [],
          error: finalErrorMessage,
          errorDetails: errorDetails,
        });

        isConnectingRef.current = false;
      }
    },
    [disconnect, mcpClient, connectionState.server?.url]
  );

  const makeRequest = useCallback(
    async <T extends z.ZodType>(
      request: ClientRequest,
      schema: T
    ): Promise<z.output<T>> => {
      if (!mcpClient) {
        throw new Error("Not connected to MCP server");
      }

      try {
        console.log("[MCP] Making request:", request.method);
        const response = await mcpClient.request(request, schema);
        console.log("[MCP] Request successful:", request.method);
        return response;
      } catch (error) {
        console.error("[MCP] Request error:", error);
        throw error;
      }
    },
    [mcpClient]
  );

  const listTools = useCallback(async (): Promise<Tool[]> => {
    const response = await makeRequest(
      { method: "tools/list", params: {} },
      ListToolsResultSchema
    );

    const tools = response.tools || [];
    setConnectionState((prev) => ({ ...prev, tools }));
    return tools;
  }, [makeRequest]);

  const listResources = useCallback(async (): Promise<Resource[]> => {
    const response = await makeRequest(
      { method: "resources/list", params: {} },
      ListResourcesResultSchema
    );

    const resources = response.resources || [];
    setConnectionState((prev) => ({ ...prev, resources }));
    return resources;
  }, [makeRequest]);

  const listResourceTemplates = useCallback(async (): Promise<
    ResourceTemplate[]
  > => {
    const response = await makeRequest(
      { method: "resources/templates/list", params: {} },
      ListResourceTemplatesResultSchema
    );

    const resourceTemplates = response.resourceTemplates || [];
    setConnectionState((prev) => ({ ...prev, resourceTemplates }));
    return resourceTemplates;
  }, [makeRequest]);

  const listPrompts = useCallback(async (): Promise<Prompt[]> => {
    const response = await makeRequest(
      { method: "prompts/list", params: {} },
      ListPromptsResultSchema
    );

    const prompts = response.prompts || [];
    setConnectionState((prev) => ({ ...prev, prompts }));
    return prompts;
  }, [makeRequest]);

  const readResource = useCallback(
    async (uri: string) => {
      return await makeRequest(
        { method: "resources/read", params: { uri } },
        ReadResourceResultSchema
      );
    },
    [makeRequest]
  );

  const getPrompt = useCallback(
    async (name: string, args: Record<string, string> = {}) => {
      return await makeRequest(
        { method: "prompts/get", params: { name, arguments: args } },
        GetPromptResultSchema
      );
    },
    [makeRequest]
  );

  const callTool = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      return await makeRequest(
        { method: "tools/call", params: { name, arguments: args } },
        CallToolResultSchema
      );
    },
    [makeRequest]
  );

  const handleCompletion = useCallback(
    async (
      ref:
        | { type: "ref/resource"; uri: string }
        | { type: "ref/prompt"; name: string },
      argName: string,
      value: string,
      context?: Record<string, string>,
      signal?: AbortSignal
    ): Promise<string[]> => {
      if (!mcpClient || !completionsSupported) {
        return [];
      }

      const request: ClientRequest = {
        method: "completion/complete",
        params: {
          ref,
          argument: {
            name: argName,
            value,
          },
        },
      };

      if (context) {
        (request.params as any).context = {
          arguments: context,
        };
      }

      try {
        const response = await makeRequest(request, CompleteResultSchema);
        return response?.completion.values || [];
      } catch (e: unknown) {
        // Disable completions silently if the server doesn't support them
        if (e instanceof McpError && e.code === ErrorCode.MethodNotFound) {
          setCompletionsSupported(false);
          return [];
        }
        throw e;
      }
    },
    [mcpClient, completionsSupported, makeRequest]
  );

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (mcpClientRef.current) {
        console.log("[MCP] Component unmounting, disconnecting...");
        void (async () => {
          try {
            await mcpClientRef.current?.close();
          } catch {}
        })();
      }
    };
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    listTools,
    listResources,
    listResourceTemplates,
    listPrompts,
    readResource,
    getPrompt,
    callTool,
    makeRequest,
    handleCompletion,
    completionsSupported,
  };
}
