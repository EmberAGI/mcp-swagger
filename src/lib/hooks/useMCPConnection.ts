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
  ElicitRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { z } from "zod";
import { MCPServer, ConnectionState } from "@/lib/types/mcp";
import {
  getErrorMessage,
  getDetailedErrorInfo,
  categorizeConnectionError,
} from "@/lib/errorUtils";

export interface ElicitationRequest {
  id: number;
  message: string;
  requestedSchema: any;
}

export interface ElicitationResponse {
  action: "accept" | "decline" | "cancel";
  content?: any;
}

export type PendingElicitationRequest = {
  id: number;
  request: ElicitationRequest;
  originatingTab?: string;
};

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
      | { type: "ref/prompt"; name: string }
      | { type: "ref/tool"; name: string },
    argName: string,
    value: string,
    context?: Record<string, string>,
    signal?: AbortSignal
  ) => Promise<string[]>;
  completionsSupported: boolean;
  pendingElicitations: PendingElicitationRequest[];
  currentElicitation: PendingElicitationRequest | null;
  setCurrentElicitation: (
    elicitation: PendingElicitationRequest | null
  ) => void;
  resolveElicitation: (id: number, response: ElicitationResponse) => void;
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
  
  // Queue to serialize completion requests - only one at a time
  const completionQueueRef = useRef<{
    pending: boolean;
    queue: Array<() => Promise<void>>;
  }>({ pending: false, queue: [] });
  const [pendingElicitations, setPendingElicitations] = useState<
    PendingElicitationRequest[]
  >([]);
  const [currentElicitation, setCurrentElicitation] =
    useState<PendingElicitationRequest | null>(null);
  const [elicitationCounter, setElicitationCounter] = useState(0);
  const elicitationResolvesRef = useRef<Map<number, (response: any) => void>>(
    new Map()
  );

  // Auto-show elicitation modal when new requests arrive
  useEffect(() => {
    if (pendingElicitations.length > 0 && !currentElicitation) {
      console.log("[MCP] *** AUTO-SHOWING ELICITATION MODAL ***");
      setCurrentElicitation(pendingElicitations[0]);
    }
  }, [pendingElicitations, currentElicitation]);

  const isConnectingRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const mcpClientRef = useRef<Client | null>(null);

  useEffect(() => {
    mcpClientRef.current = mcpClient;
  }, [mcpClient]);

  useEffect(() => {
    isUnmountingRef.current = false;
  }, []);

  const ignoreUnmountGuardRef = useRef(false);

  const resolveElicitation = useCallback(
    (id: number, response: ElicitationResponse) => {
      console.log("[MCP] Resolving elicitation:", id, response);
      const resolver = elicitationResolvesRef.current.get(id);
      if (resolver) {
        resolver(response);
        elicitationResolvesRef.current.delete(id);
      }

      // Remove from pending list
      setPendingElicitations((prev) => prev.filter((p) => p.id !== id));

      // Close current modal if it's this elicitation
      if (currentElicitation?.id === id) {
        setCurrentElicitation(null);
      }
    },
    [currentElicitation]
  );

  const disconnect = useCallback(async () => {
    console.log("[MCP] Disconnecting...");
    isUnmountingRef.current = true;

    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (error) {
        console.warn("[MCP] Error closing client:", error);
      }
    }

    setMcpClient(null);
    setConnectionState({
      status: "disconnected",
      tools: [],
      resources: [],
      resourceTemplates: [],
      prompts: [],
      notifications: [],
    });

    isConnectingRef.current = false;
    setCompletionsSupported(true);
    setPendingElicitations([]);
    setElicitationCounter(0);
    elicitationResolvesRef.current.clear();
  }, [mcpClient, connectionState.server?.url]);

  const connect = useCallback(
    async (server: MCPServer) => {
      console.log("[MCP] Connecting to server:", server);

      if (isConnectingRef.current) {
        console.log("[MCP] Connection already in progress, skipping...");
        return;
      }

      if (isUnmountingRef.current && !ignoreUnmountGuardRef.current) {
        console.log("[MCP] Component is unmounting, skipping connection...");
        return;
      }

      isConnectingRef.current = true;

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
            capabilities: {
              elicitation: {},
            },
          }
        );

        const proxyUrl = `/api/mcp?url=${encodeURIComponent(
          server.url || ""
        )}&transportType=${server.transport}`;

        // Generate session ID using browser crypto API
        let sessionId: string;
        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
          sessionId = window.crypto.randomUUID();
        } else {
          // Fallback UUID generator if crypto is not available
          sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
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
        await client.connect(transport);
        console.log("[MCP] Client connected successfully!");

        // Set up elicitation request handler
        client.setRequestHandler(ElicitRequestSchema, async (request) => {
          console.log("[MCP] Received elicitation request:", request);
          return new Promise((resolve) => {
            const id = elicitationCounter + 1;
            setElicitationCounter(id);

            const elicitationRequest: ElicitationRequest = {
              id,
              message: request.params.message || "Please provide information",
              requestedSchema: request.params.requestedSchema || {},
            };

            const pendingRequest: PendingElicitationRequest = {
              id,
              request: elicitationRequest,
            };

            setPendingElicitations((prev) => [...prev, pendingRequest]);
            elicitationResolvesRef.current.set(id, resolve);
          });
        });

        // Set up message handler for elicitation detection
        const originalOnMessage = transport.onmessage;
        transport.onmessage = (message: any) => {
          // Handle elicitation/create messages immediately
          if (message.method === "elicitation/create") {
            console.log("[MCP] *** ELICITATION MESSAGE RECEIVED ***");

            const id = elicitationCounter + 1;
            setElicitationCounter(id);

            const elicitationRequest: ElicitationRequest = {
              id,
              message: message.params?.message || "Please provide information",
              requestedSchema: message.params?.requestedSchema || {},
            };

            const pendingRequest: PendingElicitationRequest = {
              id,
              request: elicitationRequest,
            };

            setPendingElicitations((prev) => [...prev, pendingRequest]);
            elicitationResolvesRef.current.set(id, (response: any) => {
              console.log("[MCP] Elicitation response received:", response);
            });
          }

          if (originalOnMessage) {
            originalOnMessage(message);
          }
        };

        const capabilities = client.getServerCapabilities();
        setMcpClient(client);
        setConnectionState((prev) => ({
          ...prev,
          status: "connected",
          capabilities,
          error: undefined,
        }));

        // Fetch initial lists
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
        } catch (error) {
          console.warn("[MCP] Error fetching initial lists:", error);
        }

        isConnectingRef.current = false;
      } catch (error: any) {
        console.error("[MCP] Connection failed:", error);
        const basicErrorMessage = getErrorMessage(error);
        const errorDetails = getDetailedErrorInfo(error);

        if (basicErrorMessage.includes("already initialized")) {
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

            isConnectingRef.current = false;
            await new Promise((r) => setTimeout(r, 50));
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

        const categorizedError = categorizeConnectionError(basicErrorMessage);
        const { userFriendlyMessage } = categorizedError;

        const finalErrorMessage =
          basicErrorMessage === "Unknown error occurred"
            ? "Connection failed: Unable to connect to the MCP server. Check the debug panel for more details."
            : userFriendlyMessage;

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
        const response = await mcpClient.request(request, schema);
        return response;
      } catch (error) {
        console.error("[MCP] Request error:", error);
        throw error;
      }
    },
    [mcpClient]
  );

  const callTool = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      console.log("[MCP] Calling tool:", name, "with args:", args);

      try {
        const result = await makeRequest(
          { method: "tools/call", params: { name, arguments: args } },
          CallToolResultSchema
        );
        console.log("[MCP] Tool call completed:", result);
        return result;
      } catch (error) {
        console.error("[MCP] Tool call failed:", error);
        throw error;
      }
    },
    [makeRequest]
  );

  const listTools = useCallback(async () => {
    if (!mcpClient) {
      throw new Error("Not connected to MCP server");
    }
    const result = await makeRequest(
      { method: "tools/list" },
      ListToolsResultSchema
    );
    return result.tools;
  }, [mcpClient, makeRequest]);

  const listResources = useCallback(async () => {
    if (!mcpClient) {
      throw new Error("Not connected to MCP server");
    }
    const result = await makeRequest(
      { method: "resources/list" },
      ListResourcesResultSchema
    );
    return result.resources;
  }, [mcpClient, makeRequest]);

  const listResourceTemplates = useCallback(async () => {
    if (!mcpClient) {
      throw new Error("Not connected to MCP server");
    }
    const result = await makeRequest(
      { method: "resources/templates/list" },
      ListResourceTemplatesResultSchema
    );
    return result.resourceTemplates;
  }, [mcpClient, makeRequest]);

  const listPrompts = useCallback(async () => {
    if (!mcpClient) {
      throw new Error("Not connected to MCP server");
    }
    const result = await makeRequest(
      { method: "prompts/list" },
      ListPromptsResultSchema
    );
    return result.prompts;
  }, [mcpClient, makeRequest]);

  const readResource = useCallback(
    async (uri: string) => {
      if (!mcpClient) {
        throw new Error("Not connected to MCP server");
      }
      const result = await makeRequest(
        { method: "resources/read", params: { uri } },
        ReadResourceResultSchema
      );
      return result;
    },
    [mcpClient, makeRequest]
  );

  const getPrompt = useCallback(
    async (name: string, args: Record<string, string> = {}) => {
      if (!mcpClient) {
        throw new Error("Not connected to MCP server");
      }
      const result = await makeRequest(
        { method: "prompts/get", params: { name, arguments: args } },
        GetPromptResultSchema
      );
      return result;
    },
    [mcpClient, makeRequest]
  );

  const handleCompletion = useCallback(
    async (
      ref:
        | { type: "ref/resource"; uri: string }
        | { type: "ref/prompt"; name: string }
        | { type: "ref/tool"; name: string },
      argName: string,
      value: string,
      context: Record<string, string> = {},
      signal?: AbortSignal
    ): Promise<string[]> => {
      if (!mcpClient) {
        throw new Error("Not connected to MCP server");
      }

      if (!completionsSupported) {
        throw new Error("Completions not supported by this server");
      }

      // Serialize completion requests through a queue to prevent concurrent requests
      // which cause the "already finished loading" error in the MCP SDK
      return new Promise((resolve, reject) => {
        const requestId = `${Date.now()}-${Math.random()}`;
        
        const executeRequest = async () => {
          const startTime = Date.now();
          console.log(`[MCP Completion ${requestId}] Starting request:`, {
            ref,
            argName,
            value,
            queueLength: completionQueueRef.current.queue.length,
            isPending: completionQueueRef.current.pending,
          });
          
          try {
            const result = await makeRequest(
              {
                method: "completion/complete",
                params: {
                  ref,
                  argument: {
                    name: argName,
                    value,
                  },
                  context,
                },
              },
              CompleteResultSchema
            );

            const duration = Date.now() - startTime;
            console.log(`[MCP Completion ${requestId}] Success (${duration}ms):`, {
              argName,
              count: result.completions?.length || 0,
              completions: result.completions?.slice(0, 3), // Show first 3
              fullResult: result,
            });

            // Handle undefined completions
            if (!result.completions) {
              console.warn(`[MCP Completion ${requestId}] Server returned undefined completions`);
              resolve([]);
            } else {
              resolve(result.completions as string[]);
            }
          } catch (error: any) {
            const duration = Date.now() - startTime;
            const errorMessage = error?.message || String(error);
            
            console.error(`[MCP Completion ${requestId}] Error (${duration}ms):`, {
              error: errorMessage,
              stack: error?.stack,
              fullError: error,
            });

            // Handle the specific MCP SDK error about response already being loaded
            if (errorMessage.includes("already finished loading") || 
                errorMessage.includes("Request with the provided ID") ||
                errorMessage.includes("failed to load response data")) {
              console.warn(`[MCP Completion ${requestId}] Response reading error - this shouldn't happen with queue!`);
              resolve([]);
            } else {
              reject(error);
            }
          } finally {
            // Mark request as complete and process next in queue
            console.log(`[MCP Completion ${requestId}] Finished, processing next in queue`);
            completionQueueRef.current.pending = false;
            const nextRequest = completionQueueRef.current.queue.shift();
            if (nextRequest) {
              console.log(`[MCP Completion] Starting next request from queue (${completionQueueRef.current.queue.length} remaining)`);
              completionQueueRef.current.pending = true;
              nextRequest().catch(console.error);
            } else {
              console.log(`[MCP Completion] Queue is empty`);
            }
          }
        };

        // If no request is pending, execute immediately
        if (!completionQueueRef.current.pending) {
          console.log(`[MCP Completion ${requestId}] Executing immediately (queue empty)`);
          completionQueueRef.current.pending = true;
          executeRequest().catch(reject);
        } else {
          console.log(`[MCP Completion ${requestId}] Queuing request (replacing ${completionQueueRef.current.queue.length} queued requests)`);
          // Clear queue and add this request as the only pending one
          // This effectively cancels previous queued requests
          completionQueueRef.current.queue = [executeRequest];
        }
      });
    },
    [mcpClient, makeRequest, completionsSupported]
  );

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
    pendingElicitations,
    currentElicitation,
    setCurrentElicitation,
    resolveElicitation,
  };
}
